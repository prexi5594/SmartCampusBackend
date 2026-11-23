# USIU-Africa map review

The owner authorised geography preparation and a local preview on 21 November
2026, then requested an in-building view on 23 November.

## Run the preview

From the campus-navigator-codex project root, run:

    .\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8765 --workers 1 --no-proxy-headers

Open http://127.0.0.1:8765/usiu-map-review.html and sign in. Use Ctrl+C to stop the server.
The owner's 23 November account requirement applies to this web page too.
See [account setup](ACCOUNTS_AND_STORAGE.md) for installation. Direct-file/static-server
preview cannot provide the account API or protected access.
For the basic SVG map, open the same address with ?renderer=svg appended.

## Files and responsibilities

- prototype/usiu-map-review.html, .css and .js: standalone campus review UI.
- prototype/usiu-directory.js: room-code matching independent of map geometry.
- prototype/data/usiu-directory.json: official room facts, candidate OSM matches,
  and separately sourced commencement gate points.
- prototype/data/usiu-geography.geojson: OSM-derived geometry and B-numbers.
- prototype/data/usiu-map-sources.json: source URL, licence, metadata and limitations.
- scripts/prepare_usiu_geography.py: offline conversion from an OSM extract.
- tests/usiu-data.test.cjs: source-data invariants and room-search checks.
- prototype/vendor/maplibre-gl-6.19.0/: pinned local renderer, styles and licence.

Run the data checks with:

    node --test tests/usiu-data.test.cjs

## Review questions

The name matches are provisional:

| Review ID | Candidate |
| --- | --- |
| B24 | Chandaria School of Business |
| B25 | Lillian K. Beam Building |
| B38 | Science Centre |
| B39 | School of Humanities & Social Sciences |
| B50 | Wooden Block EF |
| B48 | Wooden Block IJ |
| B29 | Wooden Block KL |

GH has no candidate and no invented position. Use the building selector or click
an outline to identify its B-number. B-numbers belong to this snapshot, so retain
the OSM ID when reconciling a later dataset.

51 building outlines and 154 path/road ways are present in the extract. These
counts do not certify complete campus coverage. No mapped building entrance was
found. The path geometry has two connected components (714 and 3 source nodes);
this is a geometric diagnostic, not proof that those paths are open or accessible.

Official gate coordinates come from event-specific commencement guidance; they
need confirmation for ordinary student access. The mapped Gate A hut and the
university's published Gate A point are different positions and are not silently
snapped together.

## Indoor pilot inputs

The owner selected **Chandaria School of Business** on 23 November 2026 and
currently has no layout. Start with one floor: the entrance level. CAD
(computer-aided design drawings) and GIS (geographic map data) are optional
source formats, not requirements for this first indoor view.

A room list establishes building membership, not floor or indoor position.
For one pilot building, obtain:

1. Floor labels and a plan/photo/sketch for each floor.
2. Building entrances, room doors and connected corridors.
3. Stair/lift connections between floors.
4. Room codes, public facilities and known access restrictions.
5. A known dimension or scale if measured distances are required.

A rough sketch can support a clearly labelled schematic after owner review.
Do not infer distances or floor assignments from room numbers. Preserve unknown
values explicitly until supplied. A 2D floor view is the recommended first
interior presentation; optional 3D walls can reuse the reviewed geometry later.
Live indoor positioning is separate from displaying a floor plan.

### How to collect the first layout

1. Ask the building administration or Facilities team for a simple floor plan.
   A PDF, scan or clear photograph is sufficient. Suggested request:

   > I am building a student campus navigation prototype. Could you share a
   > basic floor plan of the Chandaria School of Business entrance level,
   > showing room labels, corridors, entrances and stairs/lifts? A PDF or
   > photo is fine. Please also confirm which parts may be displayed in the
   > student-facing map.

2. If a floor directory or evacuation plan is posted, photograph the complete
   plan straight on, with its floor name and room labels readable. Include
   the main entrance or another identifiable reference. A directory listing
   rooms without their positions still needs a corridor sketch.

3. If there is no plan, walk the public entrance level and draw its rough
   outline. Mark where you enter, corridor turns and junctions, and each room
   door on the correct side in the order encountered. Copy room codes from
   the signs. Mark stairs/lifts, their destinations if known, toilets and
   other entrances. Write "unknown" wherever a detail is uncertain.

Use a separate sketch for each floor and the actual floor name shown on site.
Rough proportions are enough to begin; no measuring tools or drawing software
are required. Do not treat unmeasured proportions as real walking distances.
Attach the first photo/PDF/sketch in the project conversation. It can then be
traced into a labelled schematic for review, followed by room highlighting
and validated doorway-to-corridor connections.

## Sources

- [USIU Find Your Class](https://www.usiu.ac.ke/documents/find-your-class/)
- [Official guide PDF](https://www.usiu.ac.ke/wp-content/uploads/2026/04/Find-Your-Class-v2.pdf)
- [OSM campus boundary](https://www.openstreetmap.org/way/321620567)
- [University gate guidance](https://www.usiu.ac.ke/2026-48th-commencement/)
- [OSM licence and attribution](https://www.openstreetmap.org/copyright)

See CURRENT_STATE.md for actual verification, remaining checks and owner input.
