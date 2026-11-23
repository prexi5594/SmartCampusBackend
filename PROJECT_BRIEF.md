# Smart Campus Navigator — confirmed feature brief

Prepared 17 November 2026. The owner is developing campus navigation for new students and wants to understand the code while building it. Preserve the approved visual references. Later implementation approvals and current acceptance status are recorded in `CURRENT_STATE.md`; this original brief does not override those instructions.

## Goal and surfaces

Students find campus facilities on the web, plan a route, transfer it to a phone application and receive live turn-by-turn guidance. They can save personal places, manually enter lessons, receive campus arrival recommendations and get lesson reminders.

The existing HTML prototype is an early reference, not a complete production app or evidence that a mobile application exists. Confirm the latest application source with the owner if they have developed a newer project elsewhere.

## Step 1 — homepage, search and facility catalogue

- Maintain the homepage and Explore Campus views in the supplied designs.
- Keep the logo/app name, Home/Explore/About/Contact navigation, campus-map action and mobile menu.
- Search buildings and facilities by name, category and approved aliases; use partial, case-insensitive matching.
- Show results as the student types, including distinguishing building/category details where needed.
- Support keyboard selection, touch and mouse; give search fields accessible labels.
- Selecting a result opens its map location or begins route selection.
- Show clear no-result, loading and error states where applicable, with a clear-search/reset action.
- Facility cards contain a name, category, icon or supplied image, description and View Location action. Support category filtering and returning to all facilities.
- Catalogue, search and markers share one source of facility information.
- **Updated 23 November 2026:** users must create an account or provide email/password credentials before accessing the web app. Private records are stored centrally in ChromaDB through an authenticated backend. This supersedes the original account-free browsing requirement.
- Use verified information. Keep any sample data clearly labelled; do not invent hours, room numbers, contacts or accessibility details.

### Visual requirements

Use white and pale-blue page areas, navy text, blue primary actions, subtle borders, rounded cards and a readable sans-serif font resembling the screenshots. On desktop the Explore sidebar is left of the map; on phones the map precedes facilities and route details. Homepage cards become a single column on narrow phones. Screenshot browser/phone chrome is not part of the application design.

## Step 2 — map, route optimisation and phone application

### Map and walking routes

- Pan, zoom and reset; select buildings/facilities and view their details.
- Select a start and destination manually. Offer current location only when the student chooses it and grants permission; retain manual selection.
- Show a route, ordered instructions, total distance and estimated walking duration.
- Optimise estimated walking time over verified connected paths and entrances. Explain walking-speed and other assumptions.
- Honour known closures, access restrictions and relevant user route preferences. Step-free claims require verified data.
- Do not route through walls, restricted areas or disconnected spaces. Explain when no valid route can be computed.
- Changing the origin or destination recalculates the route.
- Real navigation needs geographic coordinates. Never use the prototype's 900 × 600 drawing positions as latitude/longitude.

### Web-to-phone transfer

The confirmed meaning of relay is **both** planned route transfer into a phone app **and** live guidance in that app.

1. The student plans and reviews a route on the web.
2. They select Send to phone.
3. A transfer mechanism opens the same route in the phone app.
4. They review the route and explicitly start navigation.

Propose a concrete handoff mechanism. A QR code that opens an app link is a candidate, not a selected provider or completed integration. A mobile webpage alone is not a substitute for the requested application without the owner's agreement.

Preserve the destination, planned origin, waypoint sequence and relevant preferences. Validate the route on opening; explain changes if path availability has changed. If the current location differs, offer recalculation from that location instead of silently replacing the planned origin.

Handle invalid/expired transfers, missing application installation and unavailable destinations. Keep private notes/timetables out of public links and do not disclose the student's current position by default. Decide identity/pairing and link access/expiry as part of architecture planning.

### Live guidance

- Show current position, route, next instruction and waypoint.
- Update remaining distance and estimated arrival time from suitable location updates.
- Advance instructions based on reaching the appropriate waypoint with sufficient positioning confidence.
- Detect meaningful deviation and reroute when appropriate; avoid jitter-driven recalculation.
- Indicate arrival when supported by adequate evidence, and allow stopping navigation.
- Handle weak accuracy, denied permission, loss of connectivity and missing map data honestly.
- Verify supported background behaviour on the target phone platforms. Do not promise unsupported background tracking or offline routing.
- Use verified building entrances where indoor navigation is unavailable. Display room details separately rather than implying precise indoor positioning.

On 23 November 2026 the owner selected a new Android-first Capacitor app. It reuses local MapLibre maps and the native Capacitor location plugin. iOS, web-to-phone transfer and release distribution remain open. See `mobile/README.md` for implementation and limits.

## Step 3A — saved locations and notes

- Save an official facility or drop a custom campus pin.
- Store a custom title, personal note and map position.
- View saved places in a dedicated list, reopen them on the map and request directions.
- Edit the title/note/position and delete with confirmation or undo.
- Distinguish personal pins from official facilities.
- Keep personal information private by default.
- Propose persistence and optional web/phone synchronisation. Explain whether accounts or device pairing are required and the limitations of device-only storage.

The owner's original Step 4 repeats this feature. Implement it once.

## Step 3B — manual lesson timetable

Students enter lessons **manually**. Uploads, OCR, screenshots, timetable extraction and LLM processing are out of scope.

Collect course/lesson name, date or recurring weekday, start/end time, campus facility, optional room number and the recurrence date range. Let students choose locations from the known catalogue. Unmatched locations need explicit resolution, not guessed coordinates.

Provide daily and weekly views. Support viewing, editing, cancelling and deleting a lesson. Distinguish changes to one occurrence from changes to a recurring series. Account for recurrence boundaries and cancelled/rescheduled exceptions.

Validate required fields and time ordering; surface overlapping lessons. Use the confirmed campus time zone consistently. Update arrival recommendations and reminders when lessons change.

## Step 3C — arrival at campus

Recommend when to reach the **campus entrance** before the first lesson. Do not add home-departure calculations, home addresses, off-campus travel or live traffic.

Allow selection of the usual campus entrance and an adjustable early-arrival buffer. Compute the first active lesson for the selected day after applying recurrence and exceptions.

`recommended campus arrival = first lesson start − entrance-to-lesson walking duration − early-arrival buffer`

Example only: a 10:00 lesson, eight-minute campus walk and ten-minute buffer yield a 09:42 arrival at the entrance. These values are illustrative, not selected defaults or real campus measurements.

Show the first lesson, entrance, walking estimate, buffer and recommendation. Flag missing location/path information rather than producing a falsely precise time. No active lessons means no first-lesson arrival recommendation for that day.

For subsequent lessons, show chronological order, walking time between locations, gaps and warnings when there is too little transfer time. Do not move lessons or suggest skipping classes to improve the schedule.

Recalculate when the entrance, lesson details, relevant path data or buffer changes.

## Step 3D — 30-minute lesson reminders

The phone application should notify the student **30 minutes before each confirmed lesson occurrence**.

Include the course/lesson, start time, building and room where known, plus an action opening that lesson's directions. On opening, let the student choose a current or manual origin and start navigation.

- Explain and request notification permission at the appropriate point; allow reminders to be enabled/disabled.
- Permission denial must not prevent timetable use.
- Schedule in the correct time zone, using actual lesson occurrences and exceptions.
- Edit/cancel/delete actions update or remove pending reminders. Avoid duplicate scheduling and alerts on one device; define the behaviour across multiple devices.
- Do not alert for past lessons. Decide the behaviour for lessons added less than 30 minutes before their start and disclose it.
- Use a phone-platform-appropriate scheduling/delivery approach and test relevant background/closed-app cases. A foreground browser timer is not completion of this requirement.
- Describe platform, permission, network and device delivery limitations accurately.

Arrival recommendations and reminders are separate. Keep the lesson reminder 30 minutes before the start even when the recommended arrival is earlier; clearly show the earlier recommendation. Additional departure alerts are not part of the approved scope.

## Data, reliability and access

Use private storage/access controls appropriate to notes, lessons and notification information. Keep official campus data separate from student data. Do not collect continuous location history by default. Keep secret credentials out of frontend code and the repository.

Build clear loading, empty, invalid-input, permission-denied, offline/unavailable and failure states for each relevant flow. Support keyboard access, labelled controls, readable text, focus and touch targets. Information must not depend solely on colour.

Distinguish fixture-based checks, simulated location tests and real-device/campus checks. Do not mark live guidance or actual notification delivery complete from UI appearance alone.

## Planning response required before implementation

Return the proposed user journeys; existing versus required functionality; decisions needed now versus later; campus data needed; architecture options and the recommended minimum; dependencies/costs/platform limits; and phases with acceptance criteria. Give a concrete Phase 1 change plan and validation plan. Use plain language and explain tradeoffs. Do not execute the plan without the owner's later instruction.
