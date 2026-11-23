# Campus frontend with account access

The owner requested credential login and ChromaDB persistence on 23 November 2026. This frontend now requires the Python backend. Keep the neighbouring scripts and `data` folder in place; no frontend build or model API key is required.

From the project root in PowerShell:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8765 --workers 1 --no-proxy-headers
```

Open `http://127.0.0.1:8765`; create an account or sign in. Use **Save this place** in Explore, then **My saved places** to edit/delete notes or reopen destinations. Stop with Ctrl+C. Direct-file viewing and a static server cannot provide the account API. See [Accounts and storage](../docs/ACCOUNTS_AND_STORAGE.md) for installation, data locations and verification.

## Read the code in three chunks

1. `data/facilities.demo.js` is the single catalogue source: eight facilities, categories, demonstration aliases and the main entrance. Positions are explicitly `schematic` drawing coordinates, not GPS coordinates. Previous search keywords are retained as sample aliases; official campus information still requires verification.
2. `catalogue.js` validates the data and matches case-insensitive partial terms, category names and aliases. Every term must match somewhere in a facility's searchable text. A category narrows those matches. This helper has no DOM, network, route or personal-storage state.
3. `campus-navigator.html` renders the UI and connects events. All three search fields share a query. Cards and the Explore list use the same matches; markers keep all places available. Filtering does not replace the chosen route. The original shortest-path and manual walkthrough remain here.

## Try the Phase 1 behaviour

- Type `LIB`, `food`, `classes`, `computer labs` or `academic` in the hero or either map search. Results appear as you type, with category details.
- Tab through controls/results. ArrowDown from an input moves to its first suggestion; Enter or Space on a result selects it. Escape closes suggestions without clearing the query.
- Select a category. `food` plus `Academic` produces a no-match message. **Clear search** keeps the category; **Reset all filters** clears both and restores eight facilities.
- Choose a result or **View Location** to reveal its marker in Explore, including on an enlarged map. Desktop sidebar selections retain keyboard focus. Phone selections move to the map.
- Check Home/Explore/About/Contact, the phone menu and Escape dismissal, zoom/reset, endpoint selection and the manual walkthrough.
- Empty data shows an empty-catalogue message. Missing/invalid data or helpers show an unavailable message and reload action. Navigation remains usable and dependent controls stay disabled.

## Verification and limits

Existing Node was used for syntax, 12 search/filter cases, eight invalid-data cases, an empty catalogue, all 72 route pairs compared with the original and an independent shortest-distance calculation, and missing/disconnected routes. Additional DOM-stub checks exercised four failure/empty branches and navigation. Static IDs and label targets passed. No test runner was added.

Browser checks exercised live search on all fields, keyboard selection, category/no-match/reset behaviour, cards/markers, enlarged-map selection and phone navigation. Desktop (1440 px) and phone (360 px) layouts were inspected. A 390 px pass was partial. At 768 px, a control overlap was found and fixed by extending the separate control strip to tablet widths. The phone fix was checked in-browser; the final tablet change still needs a recheck.

Browser automation timed out after the session resumed. Complete the 390 px pass, tablet recheck, increased text zoom, direct-file preview and visual failure/empty-state checks when it is available. DOM-stub checks are not browser evidence. No physical phone or screen-reader session was tested.

Facilities and routes remain demonstration data. Directions advance manually and route state is in memory. Account-scoped saved places/notes now persist in ChromaDB. This frontend still does not implement phone transfer, GPS guidance, lessons, arrival planning or reminders.

The companion `../references/original-guide.md` describes the original one-file version. Read `../PROJECT_BRIEF.md` for requirements and `../CURRENT_STATE.md` for approval and actual verification.
