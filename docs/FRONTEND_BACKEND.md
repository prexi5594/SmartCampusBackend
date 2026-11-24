# Frontend and backend integration

The web frontend and backend are in this repository and run together. The original
import already connected login and saved places through `prototype/api.js`.
The 24 November 2026 integration work fixes the standalone launcher's local port
mismatch and adds a repeatable test using the real JavaScript client and backend.

## Run a checkout

Install Python 3.11, then run from the repository root on Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock.txt
.\.venv\Scripts\python.exe -m backend
```

Open **http://127.0.0.1:8765**. Create an account, open **My saved places**, save a
place, and reload to retrieve it from the backend. On macOS/Linux use
`.venv/bin/python` instead of `.\.venv\Scripts\python.exe`.

For another local port, set the complete origin before starting:

```powershell
$env:CAMPUS_ORIGIN = 'http://127.0.0.1:9876'
.\.venv\Scripts\python.exe -m backend
```

Open exactly that URL; `localhost` and `127.0.0.1` are different browser origins.
If `PORT` is also set, it must agree with the local origin. A mismatch fails at
startup with an explanation, rather than letting sign-in fail later. The `.env.example`
file documents settings; the application reads process environment variables.

The web frontend does not need npm, Vite, a separate static server, or a hardcoded
Railway API URL. Opening HTML directly or hosting it on GitHub Pages alone cannot
run this Python backend. The separate Android project is not part of this web
account integration.

## Request flow

| Frontend | Backend | Result |
| --- | --- | --- |
| `login.js` through `api.js` | `POST /api/auth/register`, `POST /api/auth/login` | Account and HttpOnly session cookie |
| `auth-guard.js` | `GET /api/auth/session` | Authenticated page and current user |
| `personal-data.js` through `api.js` | `GET/PUT/DELETE /api/data/saved-places/...` | Account-scoped Chroma records |
| Sign out | `POST /api/auth/logout` | Session revoked and cookie removed |

FastAPI serves only `prototype/`, not backend source or databases. Relative API
URLs keep the frontend on the backend's origin. The browser sends its session
cookie; write requests also carry `X-Campus-Request`, and the backend checks the
Origin and the expected account. Existing private storage and CSRF protections
remain in place.

Railway's Docker image already copies both `backend/` and `prototype/`. Production
continues to listen on the platform `PORT` with one worker behind HTTPS, using its
configured origin and attached data volume. This repository update does not
reconfigure or redeploy the Railway service.

## Verify the connection

Install Node.js 22+ for the JavaScript integration check (not needed to run the web app):

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p 'test_*.py' -v
node --test --test-isolation=none tests/usiu-data.test.cjs tests/navigation.test.mjs
```

`test_frontend_backend.py` starts the real app on an unused loopback port with a
temporary database, executes the served `api.js` in Node, and shuts down the server.
The Node harness supplies browser cookie/Origin transport behavior, not mocked API
responses. It checks protected pages and referenced scripts/styles, registration,
login, shared account data across sessions, saved-place CRUD, account isolation,
and logout. Existing backend tests also cover persistence across process restart.
These automated checks do not replace physical-device acceptance.

## Untouched backup and restore

The remote branch **`backup/before-frontend-backend-2026-11-24`** preserves original
commit **`d9b7a5cc55e0df60d4e1ed7e4682f35e1da4c5d5`**. Integration commits are not
added to that branch. Restore source into a separate folder without overwriting work:

```powershell
git clone --branch backup/before-frontend-backend-2026-11-24 https://github.com/prexi5594/SmartCampusBackend.git SmartCampus-restored
```

Two local backups are also kept in the workspace's sibling `backups/` folder:

- `SmartCampusBackend-before-integration-2026-11-24.bundle`: complete Git history
  for the backup branch; `git bundle verify` passed. Clone it with `git clone --branch
  backup/before-frontend-backend-2026-11-24 <bundle-path> SmartCampus-restored`.
- `SmartCampus-local-before-integration-2026-11-24.zip`: the source working tree,
  including the newer uncommitted map/Android work. SHA-256:
  `6fb9b6f4d82983dd955101a6e19ea9469b6446b8c5cc1edd282e8acfddea2da2`.

These are code backups. Ignored private databases, credentials, dependencies,
toolchains and generated builds are excluded. Live student data remains on its
existing volume; backing it up requires the separate private storage procedure in
[Accounts and storage](ACCOUNTS_AND_STORAGE.md).
