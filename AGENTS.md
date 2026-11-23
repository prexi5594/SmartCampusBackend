# Smart Campus Navigator — project instructions

## Start here

Read `CURRENT_STATE.md`, `PROJECT_BRIEF.md`, `TASKS.md`, and `DECISIONS.md` before planning changes. `README.md` explains setup. `design-references/README.md` identifies the supplied designs.

This handoff begins in **planning only**. The owner has authorised preparation of this project package, not implementation of its new features. Until the owner explicitly authorises implementation, inspect files and explain a plan; do not edit application files, install dependencies, scaffold a framework, configure external services or deploy. Do not modify documentation during a strictly read-only planning request either.

A later explicit instruction to implement a phase authorises the ordinary, reversible work needed for that phase. Do not keep asking permission for each file edit or routine check. Record that approval in `CURRENT_STATE.md` when documentation updates are within scope. Complete the approved phase and its relevant checks; do not silently begin other phases.

## Confirmed scope

- Web app with an interactive homepage, search and facility catalogue.
- Routes transfer into a phone application; that application supplies live turn-by-turn guidance. A mobile webpage alone is not an approved substitute.
- Personal saved locations and notes; implement the duplicated original requirement once.
- Students enter lessons manually. No timetable uploads, OCR or AI extraction.
- Recommend when to arrive at the campus entrance. Home departure and off-campus commuting are outside current scope.
- Reminder 30 minutes before each lesson, with directions opened in the phone application.
- Follow the supplied designs. Later approvals selected local MapLibre and Android-first Capacitor. Read `DECISIONS.md` and `CURRENT_STATE.md` for these and other later owner-approved architecture changes; do not infer new provider/service approval from the original handoff.

## Working agreements

1. Inspect relevant existing code first. Preserve working functionality. Make focused changes and avoid unrelated rewrites.
2. Follow the latest owner instructions and approved requirements. Flag material conflicts rather than silently resolving product choices.
3. Keep implementation readable and explain it in manageable chunks. Give exact file locations and runnable commands. Define technical terms when they matter.
4. Keep facility data separate from UI, route logic and personal student data as the architecture develops. Prefer small reusable functions/components and clear names.
5. Retain the approved navy, blue, white and pale-blue design and responsive layouts. Do not add unrelated features or redesign sections without a reason agreed with the owner.
6. Use verified buildings, entrances, walkways, restrictions and distances for real navigation. Clearly separate fixtures/demo data from campus data. Never invent official details or accessible routes.
7. Schematic map coordinates are not geographic coordinates. Never describe the included SVG demo as GPS navigation. Real arrival and rerouting must account for location accuracy.
8. Preserve manual location selection when location access is unavailable. Collect location only for the chosen function; do not add continuous location history by default.
9. Keep notes, timetables, subscriptions and account data private. Do not expose secret credentials in frontend code, commit real student data or include private notes/timetables in public route links.
10. Make touch, keyboard and screen-reader paths usable. Use labels, focus feedback and understandable empty/error/permission-denied states. Do not rely only on colour or hover.
11. Use the agreed stack. Explain new dependencies and costs; seek a product decision before changing architecture or adding a paid service. No packages are required for the supplied prototype.
12. Test the affected user journeys at relevant screen sizes. Report actual commands and results; distinguish logic checks, browser checks and physical-device checks. Never claim tests ran if they did not.
13. Fix causes rather than hiding errors. Do not weaken platform permissions or remove security boundaries to get a demo working.
14. Use reasonable assumptions for minor reversible choices, state them, and continue. Ask only when missing information materially changes the current phase; list later-phase decisions without blocking unrelated approved work.
15. Update `CURRENT_STATE.md`, the relevant checkboxes in `TASKS.md`, and `DECISIONS.md` after an authorised implementation task. Do not mark real-world navigation or notification delivery complete based only on mocks.

## Relevant commands and current limits

- Preview: open `prototype/campus-navigator.html` directly in a browser.
- The authorised Android project lives in `mobile`; see `mobile/README.md` for its dependency/build/preview commands. Building its web assets does not compile an APK. Consult current status for separate backend setup.
- Campus/mobile checks: `node --test tests/usiu-data.test.cjs tests/navigation.test.mjs`. The mobile app has a package manifest, lockfile and project-local Java/SDK tools. Build with `mobile/scripts/build-android.ps1`. A verified debug APK exists; real-campus and physical-device acceptance remain outstanding.
- The original prototype's search/routing logic was checked when it was created; visual and end-to-end browser verification remained blocked. That history is not proof that the future features work.
- `references/original-guide.md` is historical learning material. Its original one-file/manual-demo scope does not override the expanded brief.

## End-of-task report

Explain what changed and why, which files changed, how the owner can run/check it, what was actually verified, and what remains unfinished. State the next useful step without claiming uncompleted work.
