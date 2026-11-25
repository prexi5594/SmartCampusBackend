"""API integration tests use a real, isolated Chroma database and synthetic accounts."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from backend.auth import AuthStore, RateLimited, token_hash
from backend.config import Config, WEB_ROOT
from backend.main import COOKIE_NAME, create_app
from backend.storage import UserDataStore

ORIGIN = "http://127.0.0.1:8765"
PASSWORD = "test-only long passphrase 47"
HEADERS = {"Origin": ORIGIN, "X-Campus-Request": "1"}


class AccountIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="campus-accounts-")
        cls.config = Config(Path(cls.temp.name))
        cls.app = create_app(cls.config)
        cls.runtime = TestClient(cls.app, base_url=ORIGIN)
        cls.runtime.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.runtime.__exit__(None, None, None)
        cls.temp.cleanup()

    def new_client(self):
        client = TestClient(self.app, base_url=ORIGIN, headers=HEADERS,
                            client=("test-" + uuid4().hex, 50000))
        self.addCleanup(client.close)
        return client

    def setUp(self):
        self.client = self.new_client()

    def register(self, client=None, email=None):
        client = client or self.client
        email = email or uuid4().hex + "@example.test"
        response = client.post("/api/auth/register", json={
            "email": email, "password": PASSWORD, "display_name": "Test Student",
        })
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()["user"]

    def test_signed_out_pages_and_all_data_operations_are_protected(self):
        for path in ["/", "/campus-navigator.html", "/usiu-map-review.html"]:
            response = self.client.get(path, follow_redirects=False)
            self.assertEqual(response.status_code, 303)
            self.assertTrue(response.headers["location"].startswith("/login.html"))
        self.assertEqual(self.client.get("/login.html").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/session").status_code, 401)
        for method, path, extra in [
            ("GET", "/api/data/notes", {}), ("GET", "/api/data/notes/one", {}),
            ("PUT", "/api/data/notes/one", {"json": {"value": {"note": "private"}}}),
            ("DELETE", "/api/data/notes/one", {"json": {}}),
        ]:
            response = self.client.request(method, path, headers={"Content-Type": "application/json"}, **extra)
            self.assertEqual(response.status_code, 401)

    def test_register_login_cookie_and_password_storage(self):
        user = self.register(email="Student-" + uuid4().hex + "@EXAMPLE.TEST")
        self.assertTrue(user["email"].endswith("@example.test"))
        session = self.client.get("/api/auth/session")
        self.assertEqual(session.json()["user"], user)
        token = self.client.cookies.get(COOKIE_NAME)
        with self.app.state.auth.connection() as db:
            account = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
            stored = db.execute("SELECT token_hash FROM sessions WHERE user_id = ?", (user["id"],)).fetchone()
        self.assertTrue(account["password_hash"].startswith("$argon2id$"))
        self.assertNotIn(PASSWORD, account["password_hash"])
        self.assertEqual(stored["token_hash"], token_hash(token))
        self.assertNotEqual(stored["token_hash"], token)
        self.client.post("/api/auth/logout", json={})
        login = self.client.post("/api/auth/login", json={"email": user["email"].upper(), "password": PASSWORD})
        self.assertEqual(login.status_code, 200)
        cookie = login.headers["set-cookie"].lower()
        self.assertIn("httponly", cookie)
        self.assertIn("samesite=strict", cookie)
        self.assertIn("max-age=604800", cookie)
        self.assertNotEqual(self.client.cookies.get(COOKIE_NAME), token)
        self.assertNotIn("password", login.text)

    def test_invalid_login_does_not_reveal_account_existence(self):
        user = self.register()
        known = self.client.post("/api/auth/login", json={"email": user["email"], "password": "incorrect"})
        unknown = self.client.post("/api/auth/login", json={"email": "missing@example.test", "password": "incorrect"})
        self.assertEqual(known.status_code, 401)
        self.assertEqual(known.json(), unknown.json())

    def test_duplicate_registration_and_validation(self):
        user = self.register()
        duplicate = self.client.post("/api/auth/register", json={
            "email": user["email"].upper(), "password": PASSWORD, "display_name": "Another",
        })
        self.assertEqual(duplicate.status_code, 409)
        invalid = self.client.post("/api/auth/register", json={
            "email": "not-an-email", "password": "short-secret", "display_name": "   ",
        })
        self.assertEqual(invalid.status_code, 422)
        self.assertNotIn("short-secret", invalid.text)
        self.assertNotIn('"input"', invalid.text)
        weak = self.client.post("/api/auth/register", json={
            "email": "valid@example.test", "password": "too short", "display_name": "Student",
        })
        self.assertEqual(weak.status_code, 422)

    def test_crud_and_namespace_separation(self):
        self.register()
        value = {"title": "Study", "note": "A private note", "locationId": "library"}
        saved = self.client.put("/api/data/saved-places/library", json={"value": value})
        self.assertEqual(saved.status_code, 200, saved.text)
        self.assertEqual(saved.json()["value"], value)
        self.assertEqual(self.client.get("/api/data/saved-places").json()["records"][0]["key"], "library")
        self.assertEqual(self.client.get("/api/data/preferences/library").status_code, 404)
        value["note"] = "Updated note"
        self.client.put("/api/data/saved-places/library", json={"value": value})
        self.assertEqual(self.client.get("/api/data/saved-places/library").json()["value"]["note"], "Updated note")
        self.assertEqual(self.client.request("DELETE", "/api/data/saved-places/library", json={}).status_code, 204)
        self.assertEqual(self.client.get("/api/data/saved-places/library").status_code, 404)
        self.assertEqual(self.client.get("/api/data/saved-places").json()["records"], [])

    def test_accounts_cannot_read_update_or_delete_each_others_records(self):
        alice = self.register()
        bob_client = self.new_client()
        bob = self.register(bob_client)
        alice_value = {"note": "Alice private note", "owner_id": bob["id"]}
        self.client.put("/api/data/notes/same-key", json={"value": alice_value})
        self.assertEqual(bob_client.get("/api/data/notes").json()["records"], [])
        self.assertEqual(bob_client.get("/api/data/notes/same-key").status_code, 404)
        self.assertEqual(bob_client.request("DELETE", "/api/data/notes/same-key", json={}).status_code, 404)
        bob_client.put("/api/data/notes/same-key", json={"value": {"note": "Bob note"}})
        self.assertEqual(self.client.get("/api/data/notes/same-key").json()["value"], alice_value)
        bob_client.request("DELETE", "/api/data/notes/same-key", json={})
        self.assertEqual(self.client.get("/api/data/notes/same-key").status_code, 200)
        spoof = bob_client.put("/api/data/notes/spoof", json={"value": {}, "owner_id": alice["id"]})
        self.assertEqual(spoof.status_code, 422)
        forged_key = bob_client.get("/api/data/notes/" + alice["id"] + ":notes:same-key")
        self.assertEqual(forged_key.status_code, 422)

    def test_stale_tab_cannot_write_after_account_switch(self):
        alice = self.register()
        self.register()
        response = self.client.put("/api/data/notes/draft", json={"value": {}}, headers={"X-Campus-User": alice["id"]})
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "session_changed")
        self.assertEqual(self.client.get("/api/data/notes").json()["records"], [])

    def test_logout_expiry_and_session_rotation(self):
        user = self.register()
        old = self.client.cookies.get(COOKIE_NAME)
        self.client.post("/api/auth/login", json={"email": user["email"], "password": PASSWORD})
        self.assertIsNone(self.app.state.auth.user_for_session(old))
        token = self.client.cookies.get(COOKIE_NAME)
        self.assertEqual(self.client.post("/api/auth/logout", json={}).status_code, 204)
        self.assertIsNone(self.app.state.auth.user_for_session(token))
        self.assertEqual(self.client.get("/api/auth/session").status_code, 401)
        self.client.post("/api/auth/login", json={"email": user["email"], "password": PASSWORD})
        with self.app.state.auth.connection() as db:
            db.execute("UPDATE sessions SET expires_at = 0 WHERE user_id = ?", (user["id"],))
        self.assertEqual(self.client.get("/api/data/notes").status_code, 401)

    def test_cross_origin_missing_origin_and_missing_header_are_rejected(self):
        self.register()
        for headers in [
            {"Origin": "https://attacker.example"}, {"Origin": "null"},
            {"Origin": ""}, {"X-Campus-Request": ""},
        ]:
            response = self.client.put("/api/data/notes/one", json={"value": {}}, headers=headers)
            self.assertEqual(response.status_code, 403)
        response = self.client.post("/api/auth/login", json={"email": "a@example.test", "password": PASSWORD},
                                    headers={"Origin": "https://attacker.example"})
        self.assertEqual(response.status_code, 403)

    def test_rate_limiting_survives_store_reopen(self):
        body = {"email": uuid4().hex + "@example.test", "password": "incorrect"}
        for _ in range(10):
            self.assertEqual(self.client.post("/api/auth/login", json=body).status_code, 401)
        limited = self.client.post("/api/auth/login", json=body)
        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited.headers["retry-after"], "900")
        other = self.new_client()
        self.assertEqual(other.post("/api/auth/login", json=body).status_code, 429)
        reopened = AuthStore(self.config.data_dir / "accounts.sqlite3", self.config.session_seconds)
        with self.assertRaises(RateLimited):
            reopened.check_rate_limit("another-test-address", body["email"])

    def test_data_validation_size_and_namespace_limits(self):
        self.register()
        for path, body in [
            ("/api/data/BadNamespace/key", {"value": {}}),
            ("/api/data/notes/bad:key", {"value": {}}),
            ("/api/data/notes/key", {"value": []}),
            ("/api/data/notes/key", {"value": {"note": "x" * 33000}}),
        ]:
            self.assertEqual(self.client.put(path, json=body).status_code, 422)
        too_big = self.client.put("/api/data/notes/key", json={"value": {"note": "x" * 66000}})
        self.assertEqual(too_big.status_code, 413)
        nan = self.client.put("/api/data/notes/key", content='{"value":{"number":NaN}}', headers={"Content-Type": "application/json"})
        self.assertEqual(nan.status_code, 422)
        self.assertEqual(self.client.get("/api/data/notes?limit=10000").status_code, 422)

    def test_account_quota_preserves_existing_records(self):
        self.register()
        with patch("backend.storage.MAX_RECORDS_PER_USER", 1):
            self.assertEqual(self.client.put("/api/data/notes/one", json={"value": {}}).status_code, 200)
            self.assertEqual(self.client.put("/api/data/preferences/two", json={"value": {}}).status_code, 409)
            self.assertEqual(self.client.put("/api/data/notes/one", json={"value": {"updated": True}}).status_code, 200)

    def test_pagination_has_no_missing_records(self):
        self.register()
        for key in ["one", "two", "three"]:
            self.client.put("/api/data/notes/" + key, json={"value": {"title": key}})
        first = self.client.get("/api/data/notes?limit=2").json()
        second = self.client.get("/api/data/notes?limit=2&offset=" + str(first["next_offset"])).json()
        self.assertEqual({r["key"] for r in first["records"] + second["records"]}, {"one", "two", "three"})
        self.assertIsNone(second["next_offset"])

    def test_storage_failure_does_not_expose_database_details(self):
        self.register()
        with patch.object(self.app.state.data.collection, "get", side_effect=RuntimeError("private secret")):
            response = self.client.get("/api/data/notes")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private secret", response.text)

    def test_only_frontend_is_served_and_responses_are_not_cached(self):
        self.register()
        for path in ["/backend/main.py", "/private-data/accounts.sqlite3", "/.env", "/CURRENT_STATE.md"]:
            self.assertEqual(self.client.get(path).status_code, 404)
        page = self.client.get("/campus-tools.html")
        self.assertEqual(page.status_code, 200)
        self.assertIn('id="saved-place-form"', page.text)
        self.assertEqual(page.headers["cache-control"], "no-store")
        self.assertEqual(page.headers["x-frame-options"], "DENY")
        self.assertEqual(self.client.get("/health", headers={"Host": "attacker.example"}).status_code, 400)

    def test_https_sets_secure_cookie(self):
        with tempfile.TemporaryDirectory(prefix="campus-https-") as directory:
            app = create_app(Config(Path(directory), origin="https://campus.example.test"))
            with TestClient(app, base_url="https://campus.example.test") as client:
                response = client.post("/api/auth/register", json={
                    "email": "https@example.test", "password": PASSWORD, "display_name": "Student",
                }, headers={"Origin": "https://campus.example.test", "X-Campus-Request": "1"})
                self.assertEqual(response.status_code, 201)
                self.assertIn("secure", response.headers["set-cookie"].lower())
                self.assertIn("strict-transport-security", response.headers)

    def test_configuration_rejects_insecure_public_origin_and_public_data_directory(self):
        for origin in ["http://campus.example.test", "https://campus.example.test/path", "https://user:password@example.test"]:
            with self.assertRaises(ValueError):
                Config(Path(self.temp.name), origin=origin)
        with self.assertRaises(ValueError):
            Config(WEB_ROOT / "private")


class ProcessPersistenceTests(unittest.TestCase):
    def test_accounts_sessions_and_records_survive_a_real_process_restart(self):
        with tempfile.TemporaryDirectory(prefix="campus-restart-") as directory:
            write = """
import json, sys
from pathlib import Path
from backend.auth import AuthStore
from backend.storage import UserDataStore
root = Path(sys.argv[1])
auth = AuthStore(root / 'accounts.sqlite3', 3600)
user = auth.register('restart@example.test', 'restart test password', 'Restart Student')
token = auth.create_session(user['id'])
data = UserDataStore(root / 'chroma')
data.put(user['id'], 'notes', 'one', {'note': 'persisted across processes'})
data.client.close()
print(json.dumps({'user': user['id'], 'token': token}))
"""
            result = subprocess.run([sys.executable, "-c", write, directory], capture_output=True, text=True, check=True)
            state = json.loads(result.stdout)
            auth = AuthStore(Path(directory) / "accounts.sqlite3", 3600)
            self.assertEqual(auth.login("restart@example.test", "restart test password")["id"], state["user"])
            self.assertEqual(auth.user_for_session(state["token"])["id"], state["user"])
            data = UserDataStore(Path(directory) / "chroma")
            try:
                self.assertEqual(data.get(state["user"], "notes", "one")["value"]["note"], "persisted across processes")
            finally:
                data.client.close()


if __name__ == "__main__":
    unittest.main()
