"""Verify a hosted app using disposable accounts, before and after redeployment.

Run seed, redeploy with the SAME volume, then run verify and cleanup.
Credentials remain in ignored private-data; never print or upload that file.
"""

import argparse
import json
from pathlib import Path
import secrets
from urllib.parse import urlsplit

import httpx

STATE = Path(__file__).resolve().parents[1] / "private-data/cloud-smoke.json"


def check(response, status):
    if response.status_code != status:
        raise RuntimeError(f"{response.request.method} {response.request.url.path}: expected {status}, got {response.status_code}")
    return response


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=["seed", "verify", "cleanup"])
    parser.add_argument("--origin", required=True)
    args = parser.parse_args()
    origin = args.origin.rstrip("/")
    url = urlsplit(origin)
    if url.scheme != "https" or not url.netloc or url.path or url.query or url.fragment or url.username:
        parser.error("Use the exact public HTTPS origin.")
    headers = {"Origin": origin, "X-Campus-Request": "1"}
    state = json.loads(STATE.read_text()) if STATE.exists() else None
    if state and state["origin"] != origin:
        parser.error("The saved check belongs to a different origin.")
    with httpx.Client(base_url=origin, headers=headers, timeout=60) as laptop:
        check(laptop.get("/health"), 200)
        check(laptop.get("/api/data/saved-places"), 401)
        check(laptop.get("/campus-navigator.html"), 303)
        check(laptop.get("/login.html"), 200)
        if args.phase == "seed":
            if state:
                parser.error("A saved check already exists; use verify or cleanup.")
            suffix = secrets.token_hex(8)
            state = {"origin": origin, "key": "deployment-" + suffix,
                     "account": {"email": f"deployment-{suffix}@example.test", "password": secrets.token_urlsafe(32)},
                     "other": {"email": f"isolation-{suffix}@example.test", "password": secrets.token_urlsafe(32)}}
            STATE.parent.mkdir(parents=True, exist_ok=True)
            STATE.write_text(json.dumps(state), encoding="utf-8")
            registered = check(laptop.post("/api/auth/register", json={**state["account"], "display_name": "Deployment Check"}), 201)
            cookie = registered.headers["set-cookie"]
            assert all(flag in cookie for flag in ("Secure", "HttpOnly", "SameSite=strict"))
            state["session"] = laptop.cookies.get("campus_session")
            state["user_id"] = registered.json()["user"]["id"]
            STATE.write_text(json.dumps(state), encoding="utf-8")
            path = "/api/data/saved-places/" + state["key"]
            value = {"catalogue": "demo", "locationId": "library", "title": "Cloud persistence check", "note": "Saved by client one"}
            check(laptop.put(path, json={"value": value}), 200)
            with httpx.Client(base_url=origin, headers=headers, timeout=60) as phone:
                check(phone.post("/api/auth/login", json=state["account"]), 200)
                assert check(phone.get(path), 200).json()["value"] == value
                value["note"] = "Updated by independent client two"
                check(phone.put(path, json={"value": value}), 200)
                assert check(laptop.get(path), 200).json()["value"] == value
                check(phone.post("/api/auth/logout", json={}), 204)
                check(phone.post("/api/auth/register", json={**state["other"], "display_name": "Isolation Check"}), 201)
                check(phone.get(path), 404)
                assert check(phone.get("/api/data/saved-places"), 200).json()["records"] == []
                check(phone.post("/api/auth/logout", json={}), 204)
            state["expected"] = value
            STATE.write_text(json.dumps(state), encoding="utf-8")
            print("PASS: public HTTPS, login protection, secure cookies, two independent clients sharing saves, other-account isolation.")
        else:
            if not state or "expected" not in state:
                parser.error("Run seed successfully first.")
            path = "/api/data/saved-places/" + state["key"]
            if args.phase == "verify":
                laptop.cookies.set("campus_session", state["session"], domain=url.hostname, path="/")
                assert check(laptop.get("/api/auth/session"), 200).json()["user"]["id"] == state["user_id"]
                assert check(laptop.get(path), 200).json()["value"] == state["expected"]
                check(laptop.post("/api/auth/logout", json={}), 204)
                check(laptop.post("/api/auth/login", json=state["account"]), 200)
                assert check(laptop.get(path), 200).json()["value"] == state["expected"]
                check(laptop.post("/api/auth/logout", json={}), 204)
                check(laptop.get("/api/auth/session"), 401)
                print("PASS: original session, account credentials and Chroma note survived deployment replacement; logout revokes access.")
            else:
                check(laptop.post("/api/auth/login", json=state["account"]), 200)
                check(laptop.request("DELETE", path, json={}), 204)
                check(laptop.get(path), 404)
                check(laptop.post("/api/auth/logout", json={}), 204)
                print("PASS: removed the synthetic check record and signed out. Two empty synthetic accounts remain.")


if __name__ == "__main__":
    main()
