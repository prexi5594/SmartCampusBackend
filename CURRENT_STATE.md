# Current state

## Homepage 3D map — published 23 November 2026

- Owner explicitly requested implementing the current 3D map in the publicly accessible web app. This authorises publishing the labelled preview before campus validation; verified navigation remains a separate incomplete task.
- Integrated the existing geographic viewer directly into the homepage, with room search, building selection, 2D/3D controls, basic SVG fallback and a full-map link. Reused the existing renderer/data. Added scoped homepage styles and scoped map failure handling so account/demo controls remain usable if map data fails. Map startup waits for the authenticated session and resizes after returning from Explore.
- Changed prototype/campus-navigator.html, prototype/usiu-map-review.js; added prototype/usiu-map-home.css and scripts/verify_home_map.py. Accounts, backend settings and persistent volume were preserved. No interior geometry or verified directions were added.
- Verification: 21 Node map/navigation tests and 25 Python tests passed; homepage inline JavaScript and map JavaScript syntax passed. Local and public HTTP checks confirmed protected pages, existing synthetic-account login/logout, unique IDs, unchanged security headers, and byte-identical contents of both pages plus 17 required assets including MapLibre workers/data. Browser automation timed out; the newly integrated layout and WebGL interaction have not been visually rechecked. Earlier standalone browser checks do not substitute for this missing check.
- Railway deployment 8d30bdd3-b8bb-4e63-aa60-6beb37124994 reached SUCCESS with healthy startup and the original volume. Live URL: https://smart-campus-web-production-7dd97290.up.railway.app. Deployment package: 35 runtime files, 551364 bytes, SHA-256 0328b88bb2859dce7f5c453605cdb2be4d1d21a66f1f0b7f124368b2c0792198.
- Next: browser/phone visual acceptance of the integrated homepage, campus location/entrance validation, and Chandaria interior evidence.

## Public hosting — deployed 23 November 2026

- Owner requested public access from other devices with data stored in ChromaDB, connected Railway, continued the task and completed the separate CLI sign-in. No paid subscription or spending budget was selected.
- Live URL: **https://smart-campus-web-production-7dd97290.up.railway.app**. Created private Railway project `Smart Campus Navigator`, service `smart-campus-web`, HTTPS domain and 500 MB persistent `campus-user-data` volume at `/data`. Identities and Chroma share `/data/campus`; Chroma has no public endpoint.
- Capacity checked before provisioning: US$5 trial credit, 30 days remaining and no active paid usage subscription. No billing upgrade was enabled. One replica/worker, maximum 1 GB memory and 1 vCPU, sleeping enabled.
- Added Docker deployment source, upload/build exclusions, packaging and remote verification scripts, production HTTPS/volume validation, seven deployment tests and deployment documentation. Removed the prepared `railway.json` before upload because Railway retires that format on 1 December 2026; settings are applied directly to the service. Runtime ZIP contains 34 files and excludes private data, credentials, environments and Android tooling.
- **25 Python tests passed together**. Linux dependency resolution and the actual Linux Docker cloud build passed. Public browser sign-in evidence: `docs/account-review/public-sign-in.jpg`.
- Actual remote checks passed: public HTTPS, protected pages/API, Secure/HttpOnly cookies, two independent sessions sharing/editing one Chroma record, and unrelated-account isolation. Replaced the cloud deployment using the same volume; the original session, account credentials and edited note survived. Logout revoked access and the synthetic note was deleted. Two empty synthetic test accounts remain. These are remote API/session and browser checks, not separate physical-device evidence.
- Verified replacement deployment: `8f51eaa1-e598-4cc9-aeab-8acecccb1e71`. The source upload used the checksum-verified official Railway CLI 5.75.0 in ignored `dist/tools/railway`; the plugin configures the service. See `docs/PUBLIC_DEPLOYMENT.md` for resource IDs, settings and update commands.
- Remaining operations: hosting budget after trial allowance, account recovery and backup policy. Automatic backups/restore drills are not configured or verified. Physical-device acceptance remains open; the Android app is not connected to web accounts. Older statuses below are historical.

## Accounts and ChromaDB — authorised 23 November 2026

- Owner instructed: "add a chroma db that can be used to universally story user data form user who log into the web app. Hence the web app will also require users to provide credentials before logging in".
- This is explicit implementation approval for a local backend, ChromaDB persistence, user registration/sign-in/sign-out and account-scoped personal data. It supersedes the original planning-only state and the earlier account-free browsing requirement for this work. AGENTS.md states that a later explicit implementation instruction authorises ordinary reversible work, including necessary dependencies and checks, without repeated permission requests.
- Implemented a same-origin FastAPI/Uvicorn backend with persistent ChromaDB JSON records and separate SQLite identity/session storage using Argon2id password hashes. User IDs come only from verified sessions. Includes request limits, quotas, pagination, CSRF checks, durable login throttling, session expiry/revocation and stale-tab protection. Dependencies are installed in the project-local `.venv`, with direct pins and a complete environment lock.
- Added sign-in/create-account screens and mandatory access checks for both web pages, account/sign-out controls, reusable `CampusApi` storage helpers, and saved-place/note create/edit/reopen/refresh/delete controls. Deletion has an accessible confirmation dialog. Existing demo catalogue/navigation is preserved; no real geography or custom pins are invented.
- Backend verification: **18 integration tests passed**, using real isolated Chroma databases, including two-account access separation and accounts/sessions/data surviving a separate process restart. `pip check` passed. The existing **21 navigation/map-data tests passed** using `--test-isolation=none` after the standard Node runner hit sandbox child-process restrictions.
- Final source checks passed: six frontend scripts plus the homepage inline script parse; all three HTML pages have unique IDs, valid label targets and existing script/style assets. The final 18-test backend rerun also passed after adding verification that authentication throttling survives reopening its store.
- Verification teardown: stopped the owned preview process and removed its separate `private-data/browser-check` directory after verifying it contained only the synthetic test account. No normal user account database was created or removed. Dependencies and source remain ready to run; screenshots are retained.
- Browser verification: synthetic-account registration, invalid and valid login, signed-out redirect, save/edit/plain-text note rendering, reload and sign-out/sign-in persistence, map reopen, delete cancellation/confirmation and persisted empty state. The authenticated basic USIU map review loaded. Measured widths: 1338 px desktop, 390 px phone, 768 px sign-in tablet geometry, without horizontal overflow on new account views. These are browser checks, not physical-device or screen-reader evidence. Screenshots: `docs/account-review/`.
- Run `.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8765 --workers 1 --no-proxy-headers` from the project root, then open `http://127.0.0.1:8765`. Direct-file/static-server preview no longer supplies web-account functionality. Read `docs/ACCOUNTS_AND_STORAGE.md` for installation, API reuse, configuration and backups.
- Scope remaining: email verification, password recovery/change, SSO, MFA and phone-app account integration are not implemented. Shared HTTPS hosting is now live as recorded above. The store runs as one server process; older statuses below remain historical.

## Android phone app — 23 November 2026

- Owner requested a phone application using device location to create waypoints to a selected school destination, selected **"Android first with Capacitor (recommended)"**, and instructed **"continue"**. Android location/waypoint work and ordinary local dependencies are authorised. iOS, release publishing, reminders and web-to-phone transfer are outside this task.
- Added `mobile/`: JavaScript/CSS screens, pinned Capacitor Android project, native App/Geolocation plugins, asset build, local preview and setup instructions. The phone app reuses existing campus geometry; prototype/homepage source was not changed by this task. Web-account work is separate and is not integrated into the phone app.
- Added shared geographic route/guidance logic and a cancellable native location session. Features include manual/GPS origin, permitted connected paths, accuracy/freshness checks, ordered waypoints, distance/time, arrival confidence, sustained-deviation rerouting and explicit Stop. Location is foreground only, in memory, with no journey history or upload.
- USIU still has **no verified routing network**. `prototype/data/usiu-routing.json` is empty; real directions stay unavailable. Candidate buildings remain browseable. A separate fictional simulation has live GPS disabled. No campus entrance, route or room floor was invented.
- Verification: **21 tests passed** via `node --test tests/usiu-data.test.cjs tests/navigation.test.mjs`. `node scripts/build.mjs`, native `cap add android` and final `cap sync android` succeeded. Approved escalated commands were needed for package downloads and compiler/test subprocesses after sandbox failures.
- Browser checks passed for simulation start, weak accuracy, sustained deviation/rerouting, waypoint progress, two-fix arrival, Stop and manual-origin changes; keyboard B-Lab selection; distinct Lab B; unmapped GH; no results; WebGL and explicit SVG map modes including zoom/reset. A cross-term search false match found during these checks was fixed. Measured 360/392/768/1280 px CSS widths had no horizontal overflow. Requested viewport sizes required calibration against measured CSS dimensions. These are browser checks, not physical-device evidence.
- The initial APK attempt stopped because Java/SDK were absent. The owner then explicitly approved **"I accept the SDK licence; continue with the APK build"**. Installed verified official Java 21, Android SDK 36, build-tools 35/36, platform-tools and Gradle in ignored `mobile/.android-tools`, with no global environment changes. Recovered a stalled legacy SDK download using the current Android CLI with metrics disabled.
- **APK build succeeded: 154 Gradle tasks.** Deliverable: `mobile/releases/SmartCampus-0.1.0-debug.apk`, 5,478,631 bytes, package `org.smartcampus.navigator`, version 0.1.0, min SDK 24/target SDK 36. APK v2 signature verification and ZIP integrity passed. Seven key bundled assets match the web build and both native plugins are registered. SHA-256: `ab7b39fc3a5540ce6bc24518735f97c91e1eb44f5a98dd08807dcbd540534edd`.
- `adb devices` found no connected phone, so no installation occurred. Native permission prompts, lifecycle, offline GPS and real campus guidance remain untested. Debug signing is not Play Store release signing.
- Run the existing preview from `mobile` with `node scripts/preview.mjs`, then open `http://127.0.0.1:8770/`. See `mobile/README.md` for setup and `docs/PHONE_NAVIGATION.md` for the routing contract/physical checklist. Screenshot: `docs/mobile-waypoint-preview.jpg`.
- Rebuild with `mobile/scripts/build-android.ps1`; verify signing with its `-VerifyOnly` switch. Next mobile work: install the prepared APK on a phone and confirm one starting entrance, Chandaria's entrance and connecting paths. Separate account work and older homepage acceptance gaps retain their own status below.

## USIU-Africa geographic map work — 21 November 2026

- Owner identified USIU-Africa, selected recognisable 3D building shapes with labels, supplied the academic room list and official Find Your Class page, then instructed: "proceed and ask for my input where neccessary".
- Authorised next work: source campus geography, prepare a numbered 2D/3D layout for owner review, and build the initial local map preview. Actual entrance/path validation remains required before dependable walking directions or homepage replacement with real navigation.
- MapLibre GL JS, local campus data and the existing plain HTML/CSS/JavaScript stack are the implementation approach from the accepted plan. No paid map provider or hosted deployment is needed for this review.
- A separate local review page is implemented at prototype/usiu-map-review.html. It renders 51 OpenStreetMap building outlines, 154 mapped path/road ways, parking and outdoor spaces. MapLibre GL JS 6.19.0 is vendored locally with its licence. The initial homepage has not yet been replaced: name/entrance confirmations are pending.
- The official room list is stored separately from geographic geometry. Searches preserve distinct B-Lab/Lab B and G-Lab/Lab G codes. EF, IJ and KL have candidate footprint matches; GH remains unlocated.
- Four academic footprint candidates await owner review: B24 Chandaria, B25 Lillian Beam, B38 Science Centre, B39 SHSS. No building entrances are tagged in the downloaded OSM extract. Path connectivity alone is not a walking permission check.
- 21 November browser evidence: actual 3D rendering, initial narrow layout, LT4 search/selection, desktop view and reset/area controls were inspected. The screenshot is docs/map-review/campus-3d-review.jpg. Initial browser connection took unusually long.
- 23 November: node --test tests/usiu-data.test.cjs passed all five tests, including room codes, source counts, geographic coordinates and unresolved destinations. The earlier run was blocked by sandbox process spawning; the approved run outside the sandbox passed. Browser checks confirmed B-Lab selection in 3D and basic SVG modes, the unlocated GH state, and no horizontal overflow at measured 361 px and 768 px viewport widths. The browser viewport control needed calibration against measured CSS width; this is not physical-device evidence. Basic SVG rendering was inspected at 768 px, with no captured warning/error logs. Evidence: docs/map-review/chandaria-basic-map-review.jpg. Unavailable-WebGL recovery was not simulated; the explicitly selected basic mode was tested.
- 23 November: owner selected Chandaria School of Business as the indoor pilot and has no layout. The official room guide supplies no floor assignments, internal positions or corridor layouts. Public-source search did not locate a usable teaching-building floor plan. Instructions for obtaining a floor plan, photographing a posted plan or sketching one entrance-level floor are in docs/USIU_MAP_REVIEW.md. Indoor geometry and directions remain unimplemented pending that evidence; never infer a room's floor from its code or invent corridors.

## Phase 1 status — continued 19 November 2026

- Owner confirmed the included prototype is the latest source. It is the implementation baseline.
- After the read-only audit and plan, the owner instructed **"implement phase 1"**, then **"Continue"**. The approved scope is homepage/catalogue work and its checks/documentation only.
- Phase 1 implementation is present; final browser acceptance remains partial as detailed below and in `TASKS.md`.
- No framework migration, package installation, database, authentication, map provider, phone app, notification service, remote repository or deployment was added.

## Code included

`prototype/campus-navigator.html` contains the UI/styles, inline SVG and preserved schematic routing/walkthrough. Two local classic scripts now supply the shared fixtures (`prototype/data/facilities.demo.js`) and catalogue validation/matching (`prototype/catalogue.js`). Keep them together for direct browser preview; no application API key, build or package installation is needed.

All three search fields now show matching results as the student types and share query/category state with the cards and Explore list. Search covers partial names, category names and aliases without case sensitivity. Clear search keeps the category; Reset all filters restores all eight facilities. Selecting a result reveals its marker, including on an enlarged map. Filtering preserves the selected route. Native controls, category details, live result announcements, empty/error messages and reset/reload actions are included.

The supplied appearance, desktop sidebar, map-first phone Explore view and single-column phone cards are retained. Small maps reserve a separate strip for zoom controls so they do not cover markers. The phone entrance label is offset to avoid parking-label overlap. Escape closes suggestions without triggering the browser's native search clearing behaviour.

These are prototype behaviours, not verified production navigation. Facilities, categories, aliases, positions, paths and distances remain labelled fixtures. The previous keyword terms were retained as demonstration aliases. Routes still use the synthetic distance scale and the existing 75 m/min estimate; state is in memory. Support information is a placeholder. Real GPS, phone transfer/live guidance, private saved-location persistence, manual lessons, arrival planning and notifications remain unimplemented. Later-phase technology recommendations have not been selected or configured.

## Phase 1 verification

### Logic and source checks

- Used the existing Node runtime through PowerShell (`@'…'@ | node -`); installed nothing and added no test runner.
- Parsed all three JavaScript scripts successfully with `node:vm`.
- Passed 12 search/filter assertions: case, whitespace, aliases, shortened display name, category matching, combined filters, no matches, unfiltered results and literal markup input.
- Rejected eight invalid/missing dataset cases; accepted a valid empty catalogue.
- Compared all **72** supported start/destination pairs against the untouched pre-edit snapshot and an independent all-pairs shortest-distance calculation. Paths/distances matched; same-place, missing-location and disconnected cases passed.
- On continuation, executed the current inline script with a minimal DOM stub for missing data, missing helper, invalid data and empty data. Each showed the expected message, cleared busy states, hid unusable routing and retained Home/Explore navigation. These are simulated DOM checks, not browser screenshots.
- Static HTML IDs were unique and label targets existed. Syntax was rechecked after the final code changes.

### Browser checks before the interruption

Used the in-app browser with a temporary Python HTTP preview at `http://127.0.0.1:8765/campus-navigator.html`; the page returned HTTP 200.

- Hero live search (`LIB`), ArrowDown/Enter selection, correct Library marker/focus and unchanged 420 m / 6 min demo route.
- Explore search, category intersection/no matches, route preservation, Reset all filters and synchronised input/category values.
- `computer labs` matching, destination selection after zoom with its marker visible, and map reset.
- At 360 px, map-first order and no horizontal page overflow. Found/fixed control overlap, then confirmed no marker/control overlaps and selected Sports Facilities.
- Escape retained `classes` while closing suggestions.
- Phone menu opening, Escape closure and Home selection; homepage map search (`FOOD`) and Cafeteria card selection focusing the matching marker.
- Inspected desktop at 1440 px and phone at 360 px. A 390 px pass was partial. A 768 px geometry check found remaining control overlap; code now extends the separate strip to widths up to 1000 px.

### Remaining verification

On continuation, the local preview again returned 200, but two computer-use calls timed out and reset their session. Browser automation was unavailable for the final tablet CSS recheck, complete 390 px pass, increased text zoom, direct-file loading and visual failure/empty-state checks. These checks are outstanding; the failure branches passed only the DOM-stub checks above.

No physical touch device, screen-reader session, real-campus journey, phone handoff or notification delivery was tested. Viewport checks are not physical-device evidence. Two Phase 1 acceptance checkboxes remain open in `TASKS.md`; the implementation is ready for review.

## Earlier verification history

When the prototype was created, its JavaScript syntax, search handling and 72 start/destination route combinations were checked, including an independent shortest-distance comparison and same-location/disconnected cases. Browser startup/local-file preview was blocked in that environment. Visual layout, end-to-end interaction, phone guidance and notification delivery were not verified.

This handoff pass recovered the current saved source, copied it unchanged, reviewed its structure and checked the handoff archive. It did not re-run application feature tests or implement any new feature. Do not treat the historical checks as evidence for future changes.

## Important boundaries

- `references/original-guide.md` describes the earlier learning prototype. Use `PROJECT_BRIEF.md` for current requirements.
- The design screenshots are visual references; their drawing does not verify real campus geography.
- The owner confirmed this prototype is the latest source. If they later supply newer code, compare it before replacing either implementation.

## Next action

Use `docs/USIU_MAP_REVIEW.md` for the geographic preview command and campus-review inputs. Receive building-name corrections and verified entrances/paths before real routing and homepage integration. For the indoor pilot, obtain an entrance-level Chandaria plan or reviewed sketch. The older Phase 1 browser gaps remain recorded above; do not treat checks on the new review page as checks on the original homepage. Do not begin later phases or configure services without the owner's instruction.

## Progress log

| Date | Action | Verification | Next step |
| --- | --- | --- | --- |
| 2026-11-17 | Prepared Codex handoff documents and unchanged prototype/design copies | Package integrity and source-copy checks | Owner opens project and requests planning |
| 2026-11-17 | Read-only audit; owner confirmed latest source and approved Phase 1 | Documents, source and three design references inspected | Implement approved Phase 1 only |
| 2026-11-17 | Implemented shared catalogue, live search, categories and accessible selection; corrected phone behaviour | Logic/route regression and desktop/phone browser checks described above | Finish final acceptance checks and records |
| 2026-11-19 | Continued after interruption; checked saved code/failure branches and updated records | Current syntax, DOM-stub failure/navigation and static label checks passed; browser connection timed out | Remaining Phase 1 browser checks, then owner-directed next phase |

After an authorised task, record the approved scope, actual changes, tests and unresolved limitations here.
