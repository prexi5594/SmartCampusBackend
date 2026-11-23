"""Hosted configuration and two-device account persistence with real Chroma."""

import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.config import Config
from backend.main import create_app
from backend.serve import server_options


class HostedConfigurationTests(unittest.TestCase):
    def test_local_defaults_remain_available(self):
        with patch.dict(os.environ, {}, clear=True):
            config = Config.from_env()
        self.assertEqual(config.origin, "http://127.0.0.1:8765")
        self.assertFalse(config.production)

    def test_production_requires_explicit_https_and_storage(self):
        invalid = [
            {"CAMPUS_ENV": "production"},
            {"CAMPUS_ENV": "production", "CAMPUS_ORIGIN": "https://campus.example.test"},
            {"CAMPUS_ENV": "production", "CAMPUS_ORIGIN": "http://127.0.0.1:8765", "CAMPUS_DATA_DIR": "/data"},
            {"CAMPUS_ENV": "production", "CAMPUS_ORIGIN": "https://localhost", "CAMPUS_DATA_DIR": "/data"},
            {"CAMPUS_ENV": "typo"},
        ]
        for environment in invalid:
            with self.subTest(environment=environment), patch.dict(os.environ, environment, clear=True):
                with self.assertRaises(ValueError):
                    Config.from_env()

    def test_railway_domain_and_volume_are_used(self):
        with tempfile.TemporaryDirectory() as volume:
            environment = {"RAILWAY_ENVIRONMENT_ID": "test", "RAILWAY_PUBLIC_DOMAIN": "campus.up.railway.app",
                           "RAILWAY_VOLUME_MOUNT_PATH": volume, "CAMPUS_DATA_DIR": str(Path(volume) / "campus")}
            with patch.dict(os.environ, environment, clear=True):
                config = Config.from_env()
            self.assertTrue(config.production)
            self.assertTrue(config.secure_cookies)
            self.assertEqual(config.origin, "https://campus.up.railway.app")
            self.assertEqual(config.healthcheck_host, "healthcheck.railway.app")
            self.assertEqual(config.data_dir, (Path(volume) / "campus").resolve())
            with patch.dict(os.environ, {**environment, "CAMPUS_ORIGIN": "https://campus.example.test"}, clear=True):
                self.assertEqual(Config.from_env().origin, "https://campus.example.test")

    def test_railway_fails_without_persistent_mount_or_writes_outside_it(self):
        with tempfile.TemporaryDirectory() as volume, tempfile.TemporaryDirectory() as outside:
            base = {"RAILWAY_ENVIRONMENT_ID": "test", "RAILWAY_PUBLIC_DOMAIN": "campus.up.railway.app",
                    "CAMPUS_DATA_DIR": str(Path(volume) / "campus")}
            variants = [base, {**base, "RAILWAY_VOLUME_MOUNT_PATH": str(Path(volume) / "missing")},
                        {**base, "RAILWAY_VOLUME_MOUNT_PATH": volume, "CAMPUS_DATA_DIR": outside}]
            for environment in variants:
                with self.subTest(environment=environment), patch.dict(os.environ, environment, clear=True):
                    with self.assertRaises(ValueError):
                        Config.from_env()

    def test_container_listens_on_platform_port_with_one_worker(self):
        with patch.dict(os.environ, {"PORT": "18080", "WEB_CONCURRENCY": "8"}, clear=True):
            options = server_options()
        self.assertEqual(options["host"], "0.0.0.0")
        self.assertEqual(options["port"], 18080)
        self.assertEqual(options["workers"], 1)
        self.assertFalse(options["proxy_headers"])
        with patch.dict(os.environ, {"PORT": "70000"}, clear=True):
            with self.assertRaises(ValueError):
                server_options()

    def test_healthcheck_host_cannot_serve_the_app_or_api(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Config(Path(directory), origin="https://campus.example.test", production=True,
                            healthcheck_host="healthcheck.railway.app")
            with TestClient(create_app(config), base_url=config.origin) as client:
                headers = {"Host": "healthcheck.railway.app"}
                self.assertEqual(client.get("/health", headers=headers).status_code, 200)
                for path in ["/", "/login.html", "/api/auth/session", "/api/data/notes"]:
                    self.assertEqual(client.get(path, headers=headers).status_code, 404)
                self.assertEqual(client.post("/health", headers=headers).status_code, 404)
                self.assertEqual(client.get("/health", headers={"Host": "attacker.example"}).status_code, 400)

    def test_two_device_clients_share_only_their_account_across_server_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Config(Path(directory), origin="https://campus.example.test", production=True)
            headers = {"Origin": config.origin, "X-Campus-Request": "1"}
            credentials = {"email": "two-devices@example.test", "password": "test device passphrase 92"}
            app = create_app(config)
            with TestClient(app, base_url=config.origin, headers=headers) as laptop:
                response = laptop.post("/api/auth/register", json={**credentials, "display_name": "Test Student"})
                self.assertEqual(response.status_code, 201)
                user = response.json()["user"]
                self.assertIn("Secure", response.headers["set-cookie"])
                saved = laptop.put("/api/data/saved-places/library", json={"value": {"note": "Saved on laptop"}})
                self.assertEqual(saved.status_code, 200)
                # Separate cookie jar, same running server. Entering another lifespan
                # would start a second Chroma client instead of simulating a device.
                phone = TestClient(app, base_url=config.origin, headers=headers)
                try:
                    login = phone.post("/api/auth/login", json=credentials)
                    self.assertEqual(login.status_code, 200)
                    self.assertEqual(login.json()["user"]["id"], user["id"])
                    self.assertEqual(phone.get("/api/data/saved-places/library").json()["value"]["note"], "Saved on laptop")
                    phone.put("/api/data/saved-places/library", json={"value": {"note": "Updated on phone"}})
                    self.assertEqual(laptop.get("/api/data/saved-places/library").json()["value"]["note"], "Updated on phone")
                finally:
                    phone.close()
            with TestClient(create_app(config), base_url=config.origin, headers=headers) as restarted:
                self.assertEqual(restarted.post("/api/auth/login", json=credentials).status_code, 200)
                self.assertEqual(restarted.get("/api/data/saved-places/library").json()["value"]["note"], "Updated on phone")
                restarted.post("/api/auth/register", json={"email": "another@example.test", "password": credentials["password"], "display_name": "Another Student"})
                self.assertEqual(restarted.get("/api/data/saved-places/library").status_code, 404)
                self.assertEqual(restarted.get("/api/data/saved-places").json()["records"], [])


if __name__ == "__main__":
    unittest.main()
