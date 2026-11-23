# Phased work and acceptance criteria

Checkboxes reflect authorised work and recorded evidence. A fixture-based prototype is not equivalent to real-campus or phone completion. See `CURRENT_STATE.md` for verification limits.

The phases below organise the owner's steps by dependency; they do not add new product features. Real-data work may require campus information. Generic interfaces may be developed with explicit fixtures after approval, but real navigation acceptance remains incomplete until verified.

## Phase 0 — audit and plan (first Codex session)

- [x] Read the project documents and inspect prototype/designs.
- [x] Identify whether the owner has newer source.
- [x] Separate existing prototype behaviours from missing production capabilities.
- [x] Propose the smallest suitable architecture without installing/scaffolding it.
- [x] List required decisions now versus later, dependencies, costs and tests.
- [x] Return the specific Phase 1 file-change plan in chat; no file changes during a read-only planning request.

Acceptance: owner can understand and approve a concrete next phase. No application change or external setup has occurred.

## Phase 1 — homepage and catalogue (owner Step 1)

- [x] Retain the approved homepage/Explore design and responsive navigation.
- [x] Use one facility dataset across cards, search and markers.
- [x] Add catalogue categories/filters and usable matching results.
- [x] Support case-insensitive partial terms and alias fields (retained demo aliases; official aliases await campus verification).
- [x] Make result selection work with keyboard/mouse and touch-sized native controls (physical touch device not tested).
- [x] Verify View Location/result selection opens the correct destination.
- [ ] Implement and check empty/no-match/loading/error states where relevant.
- [ ] Verify representative desktop and phone layouts and accessibility basics.

Acceptance: a student can search/filter a known facility and see its map location; clearing filters restores all facilities. Unmatched input produces a clear state. The flows work at agreed desktop/phone sizes. The original account-free criterion is superseded by the owner's 23 November credential-login request. Document fixtures and testing limits.

Implementation is present. The two remaining checkboxes stay open for final browser acceptance: failure/empty states passed logic and DOM-stub checks, while 1440 px desktop and 360 px phone interactions passed browser checks. Finish the partial 390 px pass, recheck the final 768 px control-strip change, verify increased text zoom/direct-file loading, and inspect failure/empty states in-browser. Computer-use calls timed out after continuation. No physical-device or screen-reader testing is claimed.

## Phase 2A — geographic map and route engine (part of owner Step 2)

Review preparation authorised 21 November 2026:

- [x] Import a source-attributed OSM campus snapshot separately from the schematic demo.
- [x] Store the official 67 teaching-space records and four block codes separately from geometry.
- [x] Provide a local 2D/3D review page with room lookup and numbered building outlines.
- [x] Check room matching, coordinate ranges, source counts and unresolved locations with the Node test runner.
- [ ] Receive owner confirmation/corrections for building identities and missing GH.
- [ ] Identify and verify building entrances and allowed walking connections.
- [x] Check the review page at representative phone/tablet widths, including room selection and the explicitly selected basic SVG mode (see verification limits in CURRENT_STATE.md).
- [x] Integrate and publish the current labelled 3D preview on the homepage (owner explicitly authorised publication before campus validation on 23 November).
- [ ] Visually verify the integrated homepage on desktop/phone; browser automation timed out.
- [ ] Validate campus locations and entrances before promoting the preview to verified navigation.

Indoor extension requested 23 November 2026:

- [x] Select Chandaria School of Business as the indoor pilot.
- [ ] Obtain a floor plan or owner-reviewed sketch; owner currently has no layout. Start with the entrance level using the collection checklist in docs/USIU_MAP_REVIEW.md.
- [ ] Record real floor names, room positions, doorways, corridors and stairs/lifts.
- [ ] Add the building-to-floor view and room highlighting using reviewed geometry.
- [ ] Validate indoor paths before providing room-level directions.

The review page is not navigation acceptance. No interior map can be derived from the current room list alone.

- [ ] Confirm campus data, entrance locations and allowed walking connections.
- [ ] Separate geographic data from the old SVG's drawing coordinates.
- [ ] Implement start/destination selection, route display, length and time estimates.
- [ ] Respect verified restrictions/closures; expose no-route cases.
- [ ] Support manual origin and permission-aware current location.
- [ ] Offer step-free options only when supported by verified path data.
- [ ] Define the route/waypoint information the phone app will consume.

Acceptance: verified sample journeys follow connected permitted paths; distance/time assumptions are disclosed; unreachable locations have no fabricated route. Test identical start/end, unavailable paths, permission denial and destination changes. Real map accuracy is reviewed against campus evidence.

## Phase 2B — phone app and route transfer (part of owner Step 2)

- [x] Resolve existing/new app and target mobile platforms: new Android-first app, owner confirmed 23 November 2026.
- [x] Approve phone architecture: Capacitor with the existing JavaScript map/data.
- [x] Prepare native project, location/lifecycle plugins, bundled assets and simulation; build assets and sync Android.
- [x] Configure project-local Java/SDK and compile a debug APK after owner acceptance of the SDK licence; verify signing and bundled assets.
- [ ] Install on a physical phone and verify native permissions/lifecycle/GPS; no phone was connected.
- [ ] Approve a web-to-phone handoff mechanism.
- [ ] Open a web-planned route inside the actual phone application.
- [ ] Retain destination/origin/preferences and validate route availability.
- [ ] Offer current-origin recalculation when appropriate.
- [ ] Handle invalid/expired transfers, absent installation and unavailable routes.
- [ ] Keep personal data out of public transfer payloads.

Acceptance: demonstrate a real web-to-phone-app transfer with matching destination/preferences on a supported device. A webpage-only handoff, mock button or QR image without a working app destination is incomplete.

## Phase 2C — live phone guidance (part of owner Step 2)

Foundation authorised and implemented 23 November 2026:

- [x] Implement shared geographic routing/guidance over explicitly permitted connections.
- [x] Add native location permission/watch integration, Stop and foreground/pause handling in source.
- [x] Add a labelled fictional simulation with device GPS disabled.
- [x] Check routing/location logic and UI simulation; 21 tests passed. See `mobile/README.md` for browser evidence and limits.
- [ ] Populate verified USIU paths and entrances; the production routing file remains empty.

The acceptance items below remain open for real-campus/device evidence:

- [ ] Show position, next waypoint/instruction and remaining distance/ETA.
- [ ] Advance with appropriate accuracy and arrival checks.
- [ ] Reroute for meaningful deviation without oscillating on GPS jitter.
- [ ] Implement Stop navigation and clear permission/weak-signal/offline states.
- [ ] Verify/document active and background behaviour on each supported platform.
- [ ] Use building entrances where indoor positioning is unsupported.

Acceptance: a documented physical-device journey exercises starting, waypoint progress, deviation, stopping and arrival. Simulated location tests supplement this evidence; they do not replace real campus checks. No false claim of indoor or unsupported background accuracy.

## Phase 3A — personal locations (owner Step 3; original Step 4 duplicate)

- [x] Resolve local persistence/identity: shared backend, email/password accounts and user-scoped ChromaDB. Hosting and physical cross-device acceptance remain open.
- [ ] Save an official location or custom pin with a name/note.
- [ ] List, reopen, edit/move, route to and delete a saved place.
- [ ] Keep personal and official places distinct.
- [x] Verify privacy and persistence at the local server scope, including two-account isolation and process restart.

Account/storage work authorised 23 November 2026:

- [x] Add registration, mandatory sign-in, sign-out and expiring/revocable sessions.
- [x] Keep hashed credentials/session verification separate from Chroma records.
- [x] Provide reusable authenticated JSON CRUD for future feature namespaces.
- [x] Add private sample-catalogue saved places/notes with edit, reopen, refresh and confirmed deletion.
- [x] Verify protected pages, isolation, CSRF rejection, sessions, request/record limits and persistence with real Chroma tests.
- [x] Check account/saved-place browser journeys on desktop and phone and document startup/configuration.
- [x] Deploy a shared HTTPS backend and verify account data sharing through independent remote client sessions.
- [ ] Demonstrate access from separate physical devices.
- [x] Prepare Docker/Railway source, persistent-volume checks, HTTPS configuration, runtime-only package and deployment tests following the public-access request.
- [x] Connect the hosting account, inspect capacity/cost, complete the cloud build and verify public access plus persistence after cloud redeployment.
- [ ] Select ongoing hosting budget, account recovery and volume backup policy; perform a restore drill.

The broader official-location/custom-pin checkboxes above remain open: demo saves work, but verified campus saves and custom-pin positioning are not implemented.

Acceptance: saves survive the documented lifecycle; edit/delete changes persist; private notes are not exposed to other users or in route links. Cross-device claims require a demonstrated synchronisation flow.

## Phase 3B — manual timetable

- [ ] Enter lesson name, dates/recurrence, start/end, facility and optional room.
- [ ] Provide daily/weekly views and editable recurring date ranges.
- [ ] Distinguish single-occurrence changes from series changes.
- [ ] Validate missing data/time errors and identify overlaps.
- [ ] Resolve unknown lesson locations explicitly.
- [ ] Apply cancellations/exceptions in the confirmed time zone.

Acceptance: create a weekly lesson, edit one occurrence, cancel another, and verify the remaining series. Invalid times and unknown locations do not silently become valid. No upload/OCR/LLM pipeline is added.

## Phase 3C — campus arrival recommendations

- [ ] Select a usual campus entrance and adjustable buffer.
- [ ] Find the first active lesson on each relevant date.
- [ ] Subtract entrance-to-lesson walk and buffer from the start time.
- [ ] Show recommendation inputs and handle missing route data/no lessons.
- [ ] Show subsequent walks, gaps and insufficient-transfer warnings.
- [ ] Recalculate on timetable/entrance/buffer changes.

Acceptance example: 10:00 first lesson, 8-minute walk, 10-minute buffer -> 09:42 at the campus entrance. Cancelling that first lesson selects the next active lesson. Do not request a home address or calculate home departure.

## Phase 3D — phone lesson reminders

- [ ] Decide platform scheduling/delivery, permission and imminent-lesson behaviour.
- [ ] Schedule once per active lesson occurrence at start minus 30 minutes.
- [ ] Update/cancel pending alerts on edits/cancellation/deletion.
- [ ] Respect the campus time zone, recurrence bounds and exceptions.
- [ ] Include correct lesson information and an action opening its directions.
- [ ] Handle permission denial and enable/disable controls.
- [ ] Check background/closed-app behaviour and report delivery limits.

Acceptance: a supported physical phone receives a scheduled test reminder at the expected offset within documented platform limits; tapping it opens the correct lesson destination. Editing/cancelling removes stale alerts. Past lessons and repeated scheduling do not generate duplicates. A foreground-only timer is incomplete.

## Phase 4 — integration review (verification, not a new feature)

- [ ] Exercise find -> plan -> transfer -> navigate.
- [ ] Exercise save -> reload -> edit -> route.
- [ ] Exercise lesson -> recommendation -> reminder -> correct route.
- [ ] Review privacy/access controls, keyboard/touch usability and error paths.
- [ ] Record supported devices, known limitations, run/build/test commands and remaining campus data gaps.

Complete only the implementation phases the owner authorises. Deployment and external release are separate from this initial handoff.
