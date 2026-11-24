# Decisions

## Repository integration — 24 November 2026

- Owner explicitly requested connecting the repository frontend/backend and an untouched backup. Preserve the existing same-origin architecture: FastAPI serves `prototype/` and `/api/`, with HttpOnly sessions and account-scoped Chroma data.
- Add `python -m backend` as the combined entry point. Local listening host/port follow `CAMPUS_ORIGIN`; a conflicting `PORT` fails before startup. Production continues to use its independent platform port behind HTTPS.
- Preserve the original GitHub commit on `backup/before-frontend-backend-2026-11-24`, plus a verified local Git bundle and a ZIP including the newer uncommitted source. Work from the GitHub baseline in a separate worktree so unrelated local map/Android changes remain intact. No Railway deployment or Android account integration is included.

## Confirmed by the owner

| Topic | Decision |
| --- | --- |
| Product | Campus navigation for new students; preserve approved desktop/mobile designs |
| Phone relay | Planned route transfers to a phone application, followed by live turn-by-turn guidance |
| Lessons | Manual entry only |
| Time planning | Recommend when to arrive at the campus entrance, not when to leave home |
| Reminders | 30 minutes before each lesson, with directions |
| Personal places | Save map locations and notes; duplicated original Step 4 is one feature |
| Workflow | Prepare/plan first; feature implementation requires a later explicit instruction |
| Learning | Explain code in understandable chunks and keep changes reviewable |
| Latest source | Owner confirmed the included prototype is the latest source; use it as the implementation baseline |
| Phase 1 approval | Owner instructed "implement phase 1", then "Continue"; implement the approved homepage/catalogue plan only |
| Phase 1 stack/data | Keep plain HTML/CSS/JavaScript and the direct-file preview structure; use explicitly labelled fixtures while official campus data is unavailable |
| Account/storage approval, 23 November 2026 | Owner requested ChromaDB for shared user data and credentials before web-app access; the direct-file/account-free setup is superseded for the web app |
| Phone platform and architecture | 23 November 2026: Android first with Capacitor; reuse the JavaScript map and native device location for destination waypoints |

## Open decisions — do not silently invent answers

| Question | Needed before | Why it matters |
| --- | --- | --- |
| Which candidate footprints and entrances match the confirmed USIU-Africa building list? | Real campus data/navigation | Official room membership and OSM outlines do not verify entrances or usable paths |
| How will campus path restrictions and closures be verified/maintained? | Real route operation | Determines usable routes |
| Which physical Android phone will be used for the campus pilot? | Device acceptance | Local tools and verified APK now exist; no phone is connected and GPS journeys remain untested |
| What is the intended budget and acceptable map/provider terms? | External provider adoption | Avoid unapproved cost or vendor assumptions |
| What real map/path data is available, including entrances and accessibility? | Real navigation acceptance | Determines whether route claims can be verified |
| What ongoing hosting budget, backup policy and account recovery should be used? | Sustained student access | Railway is live on trial credit; paid hosting, automatic backups and account recovery are not configured |
| Which route-transfer mechanism and expiry/access rules? | Phone handoff | QR/app links are a proposed approach, not already selected |
| Which campus time zone, semester boundaries and recurrence exceptions? | Timetable/reminders | Required to schedule the right occurrence |
| What should the initial arrival buffer be, and which entrance is the default? | Arrival planner defaults | Ten minutes in the example is not an approved default |
| What happens when a lesson is added less than 30 minutes before it starts? | Notification scheduling | Must define immediate versus skipped reminders |
| Which supported background/offline behaviours can the chosen platforms provide? | Mobile guidance/reminder completion | Requires documentation and physical-device verification |

Only ask questions that materially affect the current phase. A mobile decision can remain open while an independently approved homepage improvement proceeds.

## Account and storage implementation — 23 November 2026

- **Public-hosting follow-up:** owner requested internet access from other devices, connected Railway and completed CLI sign-in. Deployed the Python/Chroma app as one shared HTTPS service with a persistent 500 MB volume. Used existing US$5/30-day trial capacity; no paid subscription was enabled. Public session/isolation checks and persistence across cloud redeployment passed. See `docs/PUBLIC_DEPLOYMENT.md` for the live URL and maintenance details.
- Apply Railway settings directly to the service. The prepared `railway.json` was removed before upload after CLI/documentation confirmed retirement on 1 December 2026. The service retains its build, health, limits, sleep and shutdown settings independently of that file.

- The owner's request explicitly authorises ordinary reversible implementation of credential login and ChromaDB storage, including local dependencies and checks. No paid service or external deployment was added.
- Preserve the plain frontend. Add FastAPI/Uvicorn as a same-origin server and ChromaDB PersistentClient as the shared app-data store. Users connect to one backend; server-generated owner IDs and metadata filters isolate records. This runs as one process; multi-worker hosting requires another storage configuration.
- Keep identity/session data in transactional SQLite, separate from Chroma: Argon2id password hashes, random HttpOnly session cookies, hashed tokens, expiry/revocation, same-origin writes and durable authentication throttling.
- Provide reusable namespaced JSON CRUD and a saved-place/note UI using the labelled demo catalogue. Explicit placeholder vectors avoid model downloads; no semantic search is claimed.
- Registration is specific to this app: email, display name and a 12–128 character password. Campus SSO, email verification, password recovery/change, MFA and phone-app authentication remain unimplemented. No campus password is requested.
- All private storage is outside the served frontend and ignored by version control. There are no default credentials. See `docs/ACCOUNTS_AND_STORAGE.md` for commands, limits, backups and verification.

## Android implementation decisions — 23 November 2026

- Owner requested device-location navigation and selected Android first with Capacitor, then asked to continue. Keep the web prototype and add the native project in `mobile`, with pure routing/location-session modules in `shared`.
- Reuse vendored MapLibre and campus geometry. Pin Capacitor Core/Android/CLI 8.6.2, App 8.1.2, Geolocation 8.2.5 and esbuild 0.28.2 locally. No paid provider or framework migration is added. The phone app does not use the separate web-account backend yet.
- First version uses foreground guidance. Stop and leaving the screen cancel location use; physical-device confirmation remains required. No background-location permission/service is configured.
- Keep USIU entrances/paths unverified until campus evidence exists. A separate labelled fictional simulation uses no live GPS. Do not connect building centres to paths automatically.
- Walking assumptions, initial location thresholds and the reviewed data schema are documented in `docs/PHONE_NAVIGATION.md`; these need campus/device calibration.
- `org.smartcampus.navigator` is the local development package ID. Release identity/signing and phone transfer are not selected. A debug APK has now been compiled locally and its signature/assets verified; physical-device acceptance remains open.
- Owner subsequently approved: **"I accept the SDK licence; continue with the APK build"**. Prepare Java 21, Android SDK 36/build-tools/platform-tools and Gradle inside ignored `mobile/.android-tools`, without global environment changes. Verify official download checksums. This authorises local debug APK compilation, not Play Store release or public deployment.

## USIU map decisions and open validation — November 2026

- **2026-11-23:** Owner requested the current map on the public web app. Publish the existing geographic preview on the homepage now, retaining illustrative-height and unverified-location/access notices. Use native page markup with scoped styles, preserving frame protections and authentication; no new host or paid service. This supersedes waiting for campus validation before preview integration, but does not authorise fabricated routes/interiors.

- **2026-11-21:** Owner selected USIU-Africa and recognisable building shapes with labels, with detailed landmark models later. Owner supplied the five academic building groups and official Find Your Class source, then authorised proceeding and asking for necessary input.
- **2026-11-21:** Retain plain HTML/CSS/JavaScript. Use MapLibre GL JS 6.19.0 and a local OSM-derived geographic snapshot for the review. No paid basemap, API key, application server or deployment is needed.
- **2026-11-21:** Treat OSM/guide name matches as candidates. Use temporary B-numbers for review and stable OSM IDs in the data. All route access and building entrance statuses stay unverified. Most display heights use an explicitly illustrative 8 m.
- **2026-11-21:** Keep the official room facts separate from geography. Do not equate B-Lab with Lab B or G-Lab with Lab G; retain EF/GH/KL/IJ as block labels.
- **2026-11-23:** Owner requested an in-building view. Recommended first version: floor-by-floor 2D plans connected to the external 3D map, then optional 3D interiors. This recommendation does not establish any real floor layout or live indoor positioning.
- **2026-11-23:** Owner chose Chandaria School of Business as the indoor pilot and reported having no layout. Start data collection with a basic floor plan, a photo of a posted floor/evacuation plan, or an entrance-level sketch. A sketch can support a labelled schematic; measured distances require scale information. CAD/GIS files are not a prerequisite.
- **Pending owner input:** Confirm B24/B25/B38/B39 and Wooden Block matches, identify GH and usable entrances/paths, and supply a Chandaria floor plan or reviewed sketch.

## Phase 1 implementation choices

- **2026-11-17:** Retained the original eight facilities, IDs, positions and keyword terms. Categories and aliases are explicitly demonstration information, not verified campus facts. Official aliases must be confirmed before real-data acceptance.
- **2026-11-17:** Used native result buttons and category selects with one shared query/filter state. Clear search retains the category; Reset all filters clears both. Filtering preserves the selected route. Shared data and matching live in two local classic scripts so a framework/server is unnecessary.
- **2026-11-17:** Reserved space below small maps for controls after browser checks found marker overlap. Escape closes suggestions without invoking the browser's native search clearing behaviour.
- **2026-11-19:** Recorded the remaining browser checks after computer-use connections timed out. This does not select or authorise a later-phase stack. Capacitor, Leaflet, synchronisation providers, transfer expiry and reminder policies remain proposals.

## How to record a decision

Add the date, owner's decision, reason/tradeoff and affected phases. Mark recommendations as proposals until accepted. Do not turn a code example or placeholder into a product requirement.
