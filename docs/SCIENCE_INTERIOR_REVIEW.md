# Science Centre to Lab H: pilot and video evidence

## Assumption-based pilot — 24 November 2026 follow-up

The owner subsequently authorised treating mapped pathways as accurate, repeating the first-floor layout on the other levels and adding unnamed rooms. The current `science-interior.html` implements Gate A → Science Centre entrance → first-floor Lab H with manual checkpoint confirmation. The evidence-only review below is historical; it remains the basis for the indoor sequence, not a surveyed floor plan.

- `scripts/prepare_science_pilot.py` builds `prototype/data/gate-a-science-pilot.json` from connected nodes in the existing OSM snapshot. It excludes known private/no-access or foot=no paths and samples segments against building outlines. The selected route retains 67 source nodes; ten outdoor checkpoints simplify the instructions, not the route geometry. Eleven building-intersecting candidate segments were excluded.
- The approximate outdoor route is 551 m including the two estimated connectors. The page rounds this to 550 m/about eight minutes at 75 m/minute, excluding indoor time. Gate A is linked to the nearest mapped path; the Science endpoint is the nearest reachable path node to the Science footprint, with an estimated boundary entrance. Its identity must be checked against the recorded glass doorway on arrival.
- Ten outdoor and nine video-derived indoor checkpoints form the 19-step guide. The current marker represents a manually selected instruction. Start, entrance handoff, Previous, Next and Stop work without GPS. Arrival appears only after the user confirms the Lab H doorway. No position or journey history is stored.
- Ground and Floor 2 repeat the schematic corridor by assumption. Floor 1 contains nine unnamed room outlines plus Lab H; the other floors have ten unnamed outlines each. Counts, dimensions and positions are illustrative. Numbers in the room picker identify diagram positions, not classroom codes. Room selection does not change route progress.
- The existing 3D map and basic SVG fallback highlight the outdoor route when Science/Lab H is selected; estimated connectors are dashed. The homepage and selected building provide the directions link. The source video evidence file, verified routing network, authentication and Android APK are unchanged by this follow-up.

Verification: 27 Node tests passed, covering source-edge continuity, assumptions, checkpoint boundaries and explicit final confirmation. Local authenticated HTTP checks matched three pages and 22 assets. Browser checks passed for Gate A start, outdoor Next/Stop, entrance handoff, stair-to-first-floor transition, Floor 2 room selection without progress, final arrival confirmation, homepage Lab H search/link, 3D startup and SVG route/connector rendering. Geometry checks at measured 390 and 1281 CSS-pixel widths found no horizontal overflow; desktop uses two map columns and phone uses one. No captured browser warnings/errors. The browser capture service crops screenshots, so complete visual/physical-device acceptance remains open.

## Original video review

Reviewed 24 November 2026. The owner supplied `USIU School of Science Tour.mp4` (100.97 seconds, 854 × 480). Source SHA-256: `a82b76ae6171ef8c14ba87407fe0c9d4ced92d50e4fd2d43d3d80fc8260c78ff`.

The owner confirmed that the starting doorway is the entrance students should use from Gate A, and confirmed that the Lab H corridor is the first floor. These confirmations do not supply geographic entrance coordinates or the outdoor route.

## What the recording supports

Visual frames show a connected journey to the door signed **LAB H / Biomedical Research Lab**. Extracted frames were inspected at five-second and two-second intervals, with selected full-resolution frames for signs and transitions. Audio was not transcribed. Review frames stay under ignored `private-data/science-video-review`; the raw video and frames are not in the deployment archive.

| Approximate video interval | Checkpoint | Observation |
| --- | --- | --- |
| 0–5 s | Science Centre entrance | Start at the glass doorway shown at the beginning of the recording. The user confirms this is the entrance to use from Gate A. |
| 5–24 s | Main staircase | Go up the staircase ahead, following the turning landing and the second flight to the upper landing. |
| 24–40 s | Upper landing and counter | Follow the landing beside the metal railing to the curved counter. Join the corridor extending past the counter and blue noticeboard. |
| 40–56 s | Corridor with glass partitions | Continue along the corridor, passing the glass partitions and the blue noticeboard. Other room labels are not reliably readable in this recording. |
| 56–65 s | First descending steps | Use the descending steps beside the red patterned screen and handrail, then continue along the corridor. |
| 65–82 s | Middle corridor | Continue along the corridor past the doors on both sides toward the next section of steps. |
| 82–88 s | Second descending steps | Use the second short section of descending steps beside another red patterned screen. |
| 88–95 s | Lab corridor | Continue beyond the steps. Look for the wooden double doors on your left with glass panels. |
| 95–101.0 s | Lab H — Biomedical Research Lab | Identify the door by the LAB H / Biomedical Research Lab sign. Stop at the doorway; entry permission is not established by this video. |

## Representation and limits

`prototype/data/science-lab-h.json` stores the observations and connections. The SVG in `science-interior.html` displays order only: no compass orientation, wall geometry, distances, GPS coordinates or walking ETA are inferred. Video elapsed time is not a route duration. Unreadable room names are not assigned to doors. This is the recorded corridor journey, not a complete Science Centre floor plan. Two descending stair sections remain explicit even though the user calls the corridor first floor. No step-free route is claimed.

The Science building/Lab H selection in the web map links to the review. Checkpoint selection highlights a diagram node; it is not a location confirmation. Authentication protects the page and the login return path includes it. The existing outdoor routing network remains unchanged and unverified. The Android APK has not been rebuilt with this preview or connected to indoor positioning.

## Needed to complete Gate A to Lab H

1. Continuous outdoor reference from Gate A to the same doorway, showing all turns, crossings and landmarks; pair landmarks with map pins or surveyed coordinates.
2. Entrance pin on the campus map, and confirmation that each outdoor segment is normally permitted.
3. Readable room-sign photographs paired with corridor position, plus any unrecorded branches for a fuller floor map.
4. Scale/dimensions if measured indoor distances are required; do not use camera duration as distance.
5. Independent walk-through of the draft instructions. For reliable indoor waypoint progress use user-confirmed checkpoints initially; QR markers require permission and installation. GPS-only room-level automatic progress is not implemented.

## Verification

23 Node tests and 25 Python tests passed. The new tests check timestamp ordering, connected checkpoint sequence, both descents and separation from metric/live routing. Local HTTP checks verified authentication, three pages and 20 exact assets. Browser registration returned to the indoor page; Lab H checkpoint selection worked; measured 390, 418 and 1281 CSS-pixel widths had no horizontal document overflow. No captured browser warning/error logs. Browser viewport override required calibration. Screenshot output was cropped by the browser capture service; no full-page visual proof is claimed. No physical-campus journey or native-phone indoor navigation was tested.
