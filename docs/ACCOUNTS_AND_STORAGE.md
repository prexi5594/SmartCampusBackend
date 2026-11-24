# Accounts and shared ChromaDB storage

Implemented locally on 23 November 2026 after the owner requested ChromaDB and credential-based access. The existing plain HTML/CSS/JavaScript frontend now runs through a Python backend. Opening its HTML file directly or using `python -m http.server` does not provide accounts or private storage.

## Start the app

From the project root (`C:\Users\user\Documents\SMART CAMPUS\campus-navigator-codex`), use the environment installed for this task:

```powershell
.\.venv\Scripts\python.exe -m backend
```

Open **http://127.0.0.1:8765** and choose **Create account**. Enter your name, email and a new app password of 12–128 characters. Registration signs you in. There is no default account or password. Stop the server with Ctrl+C.

The launcher serves the frontend and API on the port from `CAMPUS_ORIGIN` locally.
Use that exact URL in the browser. Production still uses the platform's `PORT`
behind HTTPS. See [integration and backup instructions](FRONTEND_BACKEND.md).

For a fresh checkout, install Python 3.11 and run these first:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock.txt
```

`requirements.txt` pins the five direct dependencies; `requirements.lock.txt` records the complete environment verified on Python 3.11 / Windows. FastAPI serves the frontend/API; Uvicorn runs it; ChromaDB stores app records; argon2-cffi hashes passwords; HTTPX supports integration testing and is also used by Chroma. These are local, open-source dependencies. No paid service, external account or model API is required. This app does not download or call an embedding model.

## Use the feature

1. Create an account or sign in. The main app and USIU map review both require a valid session.
2. Open a destination in Explore and choose **Save this place**. Enter a title and optional personal note, then **Save place**.
3. **My saved places** opens your list. Edit a title/note/location, reopen a map destination, refresh, or delete a save after confirming in the dialog.
4. Sign out and sign back in. Your saves remain available. A second account has a separate list, including when both accounts use the same record keys.

The saved-place UI uses the existing, labelled demonstration catalogue and schematic positions. Custom pins, verified official campus saves, timetable screens, mobile-app accounts and reminders remain separate work.

## Storage and security

| Data | Default location | Purpose |
| --- | --- | --- |
| Account IDs, normalized email, display name, Argon2id password hashes | `private-data/accounts.sqlite3` | Transactional registration/password verification |
| Hashed session tokens, expiry, authentication attempt counters | Same SQLite database | Sessions and login throttling |
| Private application JSON records | `private-data/chroma/`, collection `campus_user_data_v1` | Shared persistence with server-enforced ownership |
| Public facility/map data | `prototype/data/` | Separate catalogue and geography sources |

Every personal-data endpoint derives its owner from the session. Chroma record IDs include the server-generated user ID, namespace and key; reads/deletes also filter by owner and namespace. A client cannot select another owner. An `owner_id` inside a JSON value is ordinary data and never grants access. Browser requests also identify their expected account so a stale tab cannot write a draft into a newly signed-in account.

Chroma stores JSON documents with explicit placeholder vectors and no embedding function. This provides exact record persistence, not semantic search. Future semantic search should use a separate collection with a real embedding model. Credentials and session verification stay outside vector search.

Sessions last seven days by default, survive restarts and are invalidated on sign-out. Cookies are HttpOnly and SameSite=Strict, and Secure under HTTPS. Raw tokens are not stored in SQLite or browser localStorage. Writes require the configured Origin, a custom header and JSON content; no cross-origin access is enabled. Authentication is limited to 10 attempts per email and 60 per source address per 15 minutes, with persistent counters. Responses use `Cache-Control: no-store`.

Limits: 32 KiB per JSON record, 1,000 records per account across namespaces, 64 KiB per request body, and paginated list responses. A write replaces the record at its key; the last completed write wins. There is no offline queue or automatic merge of simultaneous edits. Failed saves retain the form draft; refresh/reload fetches current server data.

Only `prototype/` is served as static content. Backend code, `.env`, documentation and private databases are not web-accessible. `.gitignore` already excludes `private-data/` and `.venv/`. The application does not encrypt database files; restrict their filesystem permissions and protect backups.

## Reuse storage in another feature

`prototype/api.js` is the shared browser client. After `window.CampusSession` resolves:

```javascript
const user = await window.CampusSession;
if (user) {
  await CampusApi.put('preferences', 'navigation', { walkingPace: 'normal' });
  const record = await CampusApi.get('preferences', 'navigation');
  const records = await CampusApi.list('preferences');
  await CampusApi.remove('preferences', 'navigation');
}
```

The walking preference is an example; the current navigation engine does not consume it. Namespaces allow future profiles, preferences, lessons and other JSON records to share the service. Each feature must validate its domain rules before saving.

| Endpoint | Behavior |
| --- | --- |
| `POST /api/auth/register` | `{display_name, email, password}`; creates account/session |
| `POST /api/auth/login` | `{email, password}`; verifies credentials and rotates the browser session |
| `GET /api/auth/session` | Returns `{user: {id, email, display_name}}`, or 401 |
| `POST /api/auth/logout` | Revokes session, clears cookie, returns 204 |
| `GET /api/data/{namespace}?limit=100&offset=0` | Current user's `{records, next_offset}` |
| `GET /api/data/{namespace}/{key}` | `{key, value, updated_at}`, or 404 |
| `PUT /api/data/{namespace}/{key}` | `{value: {...}}`; creates/replaces the current user's record |
| `DELETE /api/data/{namespace}/{key}` | Deletes the current user's record; 204 or 404 |

Writes need `Origin: <CAMPUS_ORIGIN>`, `X-Campus-Request: 1` and `Content-Type: application/json`. The browser client handles same-origin requests; external scripts must retain the session cookie. Never put passwords/tokens in a URL. Namespaces match `[a-z][a-z0-9_-]{0,31}`; keys match `[A-Za-z0-9][A-Za-z0-9_.-]{0,79}`. Neither path accepts an owner ID.

## Shared deployment and backup

The public app is deployed to [Railway](https://smart-campus-web-production-7dd97290.up.railway.app), with production validation and a persistent volume. See [Public deployment](PUBLIC_DEPLOYMENT.md) for resource details, cloud checks and maintenance commands.

Other devices share an account's data when they sign into the **same hosted backend and persistent data directory**. Use the public URL on every device. `127.0.0.1` refers to the device running the browser; local-development accounts are separate from hosted accounts.

The backend reads process environment variables, not `.env` automatically. `.env.example` documents them. Example configuration for a chosen HTTPS server:

```powershell
$env:CAMPUS_ORIGIN = 'https://campus.example.edu'
$env:CAMPUS_DATA_DIR = 'C:/campus-private-data'
$env:CAMPUS_SESSION_SECONDS = '604800'
```

Use your actual hostname and private directory. This example hostname is not deployed. Non-local HTTP origins are rejected. Run one Uvicorn worker behind an HTTPS reverse proxy on the configured origin, with Uvicorn and Chroma inaccessible directly from the public network. The provided command does not trust forwarded headers. Configure trusted proxy addresses deliberately if forwarding is introduced; otherwise authentication throttling groups visitors by proxy address.

Embedded Chroma requires **one process / one worker per data directory**. Multiple people can use that server concurrently, but do not start replicas against the same files. Multi-worker hosting would require a separately hosted private Chroma server and shared transactional authentication storage; that migration is not implemented.

Stop the server before backing up the entire data directory, including **both** SQLite (and associated files) and `chroma/`. Restore them together to preserve ownership. Keep backups private and out of version control. Browser verification used a separate disposable data directory, not the normal account database.

Email verification, password reset/change, campus SSO, MFA and account deletion are not implemented. Ongoing hosting budget, account recovery and automatic backups remain operational decisions. The trial deployment has no verified restore process yet.

## Verification

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_accounts.py -v
node --test --test-isolation=none tests/usiu-data.test.cjs tests/navigation.test.mjs
.\.venv\Scripts\python.exe -m pip check
```

- 18 integration tests passed using real temporary Chroma databases: credentials, duplicate/invalid input, password/token hashing, session rotation/logout/expiry, protected pages, CRUD, namespace/two-account isolation, forged ownership, stale-tab rejection, request/record limits, quotas, pagination, CSRF, rate limits, HTTPS cookies, private-path protection and storage failures. One test writes accounts, sessions and records in a separate process, closes it, and verifies persistence from another process.
- All 21 existing navigation/map-data tests passed. The default Node test runner hit sandbox child-process restrictions; `--test-isolation=none` ran those same tests in one process successfully.
- Browser checks: registration, invalid credentials, login, signed-out redirects, save/edit, plain-text rendering of markup in notes, reload, sign-out/sign-in persistence, saved-place navigation, delete cancellation/confirmation and empty state after reload. The authenticated basic USIU review map still loaded.
- Measured CSS viewport widths: 1338 px desktop, 390 px phone, 768 px sign-in tablet geometry, without horizontal overflow on new account views. Browser scaling required calibration. These are browser checks, not physical-device or screen-reader tests. No captured warning/error logs during the inspected saved-place and basic-map flows.
- Screenshots in `docs/account-review/` show sign-in and saved places on desktop/phone with synthetic content only. Final source checks are recorded in `CURRENT_STATE.md`.

## Reference documentation

- [Chroma: documents and explicit embeddings](https://docs.trychroma.com/docs/collections/add-data)
- [argon2-cffi: password hashing and verification](https://argon2-cffi.readthedocs.io/en/stable/howto.html)
- [FastAPI: TestClient](https://fastapi.tiangolo.com/tutorial/testing/)
