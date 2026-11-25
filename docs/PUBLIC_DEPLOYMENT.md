# Public web app with persistent ChromaDB

Live since 23 November 2026, updated 24 November: **[Smart Campus Navigator](https://smart-campus-web-production-7dd97290.up.railway.app)**.

Create an account with your name, email and an app password of at least 12 characters. Sign into the same account on another device to retrieve your saved places and notes. Hosting runs independently of this computer. Local-development accounts are separate and were not uploaded.

## Hosted resources

[Railway project dashboard](https://railway.com/project/8b1b36c1-26aa-477f-9561-d51a08487192)

| Resource | Identifier / setting |
| --- | --- |
| Project | Smart Campus Navigator — `8b1b36c1-26aa-477f-9561-d51a08487192` |
| Environment | production — `ee0bb6df-5934-4d57-8cd3-1add886a7212` |
| Service | smart-campus-web — `e59c0387-add2-41a0-90c4-9d415d343aa3` |
| Persistent volume | campus-user-data — `38942b55-cc4b-4827-af31-76d03506ccd3`, 500 MB, `/data` |
| Domain target | Port `8080` |
| Build | `Dockerfile`, Python 3.11 Linux |
| Start | `python -m backend.serve` |
| Processes | One Uvicorn worker and one service replica |
| Limits | 1 GB RAM, 1 vCPU; sleeping enabled |
| Health | `/health`, 300-second startup timeout |
| Restart / shutdown | On failure, 5 retries; 30-second drain, 25-second application shutdown |
| Verified deployment | `9d8acc14-4ba5-43a1-bb64-6c90ea3943c8` |

Settings were applied directly through Railway. The prepared `railway.json` was removed before upload: the CLI and [migration documentation](https://docs.railway.com/infrastructure-as-code#migrating-from-config-as-code) report retirement of that format on 1 December 2026. Service settings persist independently of source uploads. This service has no GitHub source or automatic push deployment.

## Private storage and runtime

```text
/data/campus/accounts.sqlite3   identities, password hashes, hashed sessions
/data/campus/chroma/            records scoped to authenticated user IDs
```

Keep the same volume attached across deployments. Never delete/recreate it to fix a build. Only the authenticated HTTPS web/API is exposed. Startup fails if Railway's persistent mount is missing or the data directory is outside it.

| Variable | Value |
| --- | --- |
| `CAMPUS_ENV` | `production` |
| `CAMPUS_DATA_DIR` | `/data/campus` |
| `CAMPUS_ORIGIN` | `https://smart-campus-web-production-7dd97290.up.railway.app` |
| `PORT` | `8080` |
| `ANONYMIZED_TELEMETRY` | `False` |
| `CAMPUS_SESSION_SECONDS` | Unset: default 604800 (seven days) |

Railway supplies its environment/domain/volume variables. Its readiness hostname can access only `GET /health`. Cookies are Secure, HttpOnly and SameSite Strict. Changing the public domain requires updating `CAMPUS_ORIGIN` and deploying that setting.

The Docker process uses root inside its isolated container because Railway volumes are root-owned; no host permissions were altered. Forwarded headers remain untrusted. Per-address login throttling can group visitors behind Railway's proxy, while the independent per-email limit also applies. No continuous location history is collected.

## Updating the app

Official Railway CLI 5.75.0 is installed in ignored `dist/tools/railway/railway.exe`; its download was checked against the published SHA-256. The owner completed its browser sign-in. Never upload CLI authentication files or tokens.

From the project root, rebuild the allowlisted archive and extract into a **fresh** directory:

```powershell
.\.venv\Scripts\python.exe scripts/package_web_deployment.py
$uploadFolder = Join-Path (Get-Location) ('dist/deploy/upload-' + (Get-Date -Format yyyyMMdd-HHmmss))
Expand-Archive -LiteralPath 'dist/deploy/smart-campus-railway.zip' -DestinationPath $uploadFolder
.\dist\tools\railway\railway.exe up $uploadFolder --path-as-root --project 8b1b36c1-26aa-477f-9561-d51a08487192 --environment ee0bb6df-5934-4d57-8cd3-1add886a7212 --service e59c0387-add2-41a0-90c4-9d415d343aa3 --detach --json
```

Wait for deployment `SUCCESS`, inspect logs and verify `/health` plus sign-in before reporting completion. Keep the existing volume. Volume-backed redeployments have a brief interruption; there are no concurrent replicas.

Current ZIP: 41 runtime files, 563465 bytes, SHA-256 `6d550788c9ea90d364efd157a78ca40a2ca104bc2e79f33215049d7cd19c31f2`. It excludes private databases, credentials, environments, documentation/test tools and Android assets. Regenerate after runtime changes; the checksum will change.

## Verification performed

- All 25 Python tests passed in one run. Linux dependency resolution and the actual cloud Docker build succeeded.
- Public HTTPS health and sign-in returned 200; signed-out app access redirected to login and data access returned 401.
- Two independent HTTP clients signed into one synthetic account and read/edited the same Chroma note. Another account received 404 for that record and an empty list.
- Replaced initial deployment `d043818e-bff4-492d-97a8-5d9c99f71b74` using the same volume. The original session, account credentials and edited note survived.
- Verified Secure/HttpOnly cookies and logout revocation; deleted the synthetic note. Two empty synthetic accounts remain, with random credentials only in ignored `private-data/cloud-smoke.json`.
- Browser loaded the public sign-in page; screenshot: `account-review/public-sign-in.jpg`. Earlier local browser checks covered registration, login, saves/edit/delete and responsive views. Separate physical phones were not tested.

Repeatable remote check: `scripts/verify_public_deployment.py seed --origin <URL>`, redeploy with the same volume, `verify --origin <URL>`, then `cleanup --origin <URL>`. It creates synthetic accounts, modifies only its own record and never prints credentials. Archive/remove the completed ignored state file before starting another check. Arrange the interruption before running redeployment checks during student use.

## Capacity and recovery

At provisioning, the account reported US$5 trial credit, 30 days remaining and no active paid usage subscription. No billing upgrade was enabled. Resources consume that allowance; the app may sleep or stop when allowance is exhausted. Ongoing availability needs an account-appropriate budget. Check actual balance before upgrades; see [current pricing](https://docs.railway.com/pricing/plans).

Persistence across restarts is verified. Automatic backups and a restore drill are **not configured or verified**. Railway offers [volume backup schedules](https://docs.railway.com/volumes/backups), charged for incremental storage; choose ongoing budget and retention before enabling them. For consistent copies, stop writes and back up the whole `/data/campus` directory, including SQLite and Chroma together. Keep backups private. Never restore only one database or wipe a volume containing student data.

Account recovery, password changes, email verification, SSO/MFA and Android account integration remain unfinished features. See `ACCOUNTS_AND_STORAGE.md` for record limits and API use.

## Homepage map update — 23 November 2026

The signed-in homepage now contains the existing USIU 2D/3D viewer and room search. Deployment `8d30bdd3-b8bb-4e63-aa60-6beb37124994` reached SUCCESS using the same volume. All 46 existing Node/Python tests passed. Authenticated public checks verified both pages and 17 assets against local bytes, login/logout and security headers. Browser automation timed out, so integrated visual/interaction acceptance remains open.

Repeat the read-only map/page checks (with login/logout of the existing synthetic deployment account) using:

```powershell
.\.venv\Scripts\python.exe scripts/verify_home_map.py --origin https://smart-campus-web-production-7dd97290.up.railway.app
```

The script reads only ignored synthetic account credentials; never upload that state file. For local checks use `--origin http://127.0.0.1:8765`; this creates an isolated test account in the running local backend.

## Science Centre review — 24 November 2026

Published the authenticated `/science-interior.html` review and Science/Lab H map link. Deployment `32341c33-a67a-4db2-a8f9-168f11c85c17` reached SUCCESS. Public authentication and three pages/20 assets matched local source. 48 automated tests passed. See `SCIENCE_INTERIOR_REVIEW.md` for visual evidence and limitations. No raw footage, frame images, metric route or live indoor navigation was published.

## Gate A to first-floor Lab H pilot — 24 November 2026 follow-up

The owner authorised an assumption-based outdoor route and repeated floor layouts. Deployment `9d8acc14-4ba5-43a1-bb64-6c90ea3943c8` reached SUCCESS with the same volume, healthy startup and no pending deployment work. The homepage links to `/science-interior.html`, which now provides 19 manual checkpoints, outdoor highlighting, Ground/Floor 1/Floor 2 schematics and explicit Lab H arrival confirmation. No GPS tracking or raw video was added.

27 Node tests, JavaScript syntax checks and local authentication/page checks passed. Public verification signed into the existing synthetic account, checked all three pages plus 22 assets against local bytes, and confirmed logout revocation. Browser interaction/responsive-geometry checks are recorded in `SCIENCE_INTERIOR_REVIEW.md`; physical-campus acceptance and complete visual screenshot review remain outstanding.
