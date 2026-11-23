# Phone navigation: reviewed data and acceptance

The owner requested device-location waypoints and chose Android first with
Capacitor on 23 November 2026. Source and a native Android project are in
`mobile`. A verified debug APK is in `mobile/releases`. Physical-device checks
and real USIU directions remain incomplete. See `mobile/README.md` for commands
and actual results.

## Intended journey

1. Search and select a building or room.
2. Choose **My current location** and explicitly **Use my location**, or preview
   from a confirmed starting entrance. Opening the app does not request GPS.
3. Review a route and explicitly start guidance. A manual origin is a preview;
   live guidance needs a fresh device position.
4. Follow the next waypoint, distance and estimated time. Weak accuracy pauses
   progress; sustained deviation requests a new permitted route. Stop anytime.
5. Arrival is a confirmed building entrance, not a room or inferred floor.
   Leaving the screen ends location use; reopening requires a fresh Start.

## Routing data contract

`prototype/data/usiu-routing.json` is separate from OSM display geometry. It has
`schemaVersion: 1`, `campusId: "usiu-africa"`, a revision string,
`simulation: false`, and these arrays:

| Record | Fields |
| --- | --- |
| Node | Unique `id`, `coordinate: [longitude, latitude]` in degrees; a real entrance or path junction |
| Edge | Unique `id`, `from`/`to` node IDs, `direction` (`both` or `forward`), `verified`, `access`, `closed`, `evidence` |
| Destination | Stable `id`, entrance `nodeId`, `verified`, `evidence`; optional `available: false` disables it |

Each edge represents one straight walking segment; use intermediate nodes for
bends. A usable edge needs `verified: true`, `access: "allowed"` and explicit
`closed: false`. A verified path/entrance needs a nonempty `evidence` reference
to a dated campus review. The validator checks format, not the truth of that
evidence. Optional `label` supplies a real path name; `penaltySeconds` adds a
reviewed crossing delay. `stepFree: true` requires evidence. No step-free option
is advertised while none is verified.

Entrance IDs match `chandaria`, `science`, `beam`, `shss`, `wooden-ef`,
`wooden-gh`, `wooden-kl`, `wooden-ij`, or the retained `way/...` ID for another
OSM building. Confirm building identity before attaching its entrance. Rooms
reuse their building entrance. Gates can be added once their exact location
and normal student access are confirmed.

Do not promote all OSM paths to verified. Review actual walls, fences, closures,
restricted areas and ordinary student access. Connect crossings with common
junction IDs only where people can actually cross; different levels remain
separate. Keep student data and location histories out of public review records.

For the first pilot, confirm one starting entrance, Chandaria's entrance and
the connecting outdoor paths. This enables a limited pilot without claiming
complete campus coverage. Indoor Chandaria navigation still needs the plan
described in `USIU_MAP_REVIEW.md`.

## Initial engineering assumptions

- Walking time uses **1.25 m/s (75 m/min)** plus optional crossing penalties.
- GPS attaches only to the closest permitted path within **8 m**, with no
  mapped building/wall crossing. Origins inside a building outline or outside
  the campus polygon are refused. Building centres never become entrances.
- Fixes older than **15 seconds**, malformed positions or accuracy worse than
  **20 m** cannot advance guidance. Approximate permission, denial, services-off
  and timeouts have distinct messages; manual previews remain available where
  reviewed entrance data exists.
- A waypoint requires distance plus reported accuracy within **12 m**. Arrival
  also requires the preceding waypoints and two fresh fixes at least **2 seconds**
  apart within that radius.
- Deviation requires **3** accurate samples spanning **6 seconds**, with distance
  from the route minus reported accuracy above **22 m**. Reroutes are at least
  **10 seconds** apart. No valid route means guidance pauses.

These are initial thresholds needing physical calibration. GPS alone is not
indoor positioning; tight corners and short path segments need campus testing.
One native watch is owned by the location session. Stop invalidates pending
requests, ignores late callbacks and clears a late watch ID. No location
history is saved or uploaded by the phone app.

## Physical acceptance still required

Install the prepared APK on an Android phone. Record the device,
Android/WebView versions, network revision and test date. Verify:

1. Precise permission, denial, approximate-only permission and Settings retry.
2. Services off, slow/stale fixes, weak GPS and indoor positions.
3. A reviewed origin-to-entrance walk, waypoint order, distance and arrival.
4. GPS jitter versus sustained deviation; reroutes use allowed paths only.
5. Stop, rapid taps, leaving/reopening the app and locking the phone, with no
   unwanted background watch.
6. Bundled maps without network and the device's actual offline GPS behaviour.
7. Destination changes, unreachable entrances and deliberately closed paths.
8. Touch targets, larger system text, TalkBack and basic-map recovery.

Do not mark real-campus guidance accepted from simulation. Phone transfer,
notifications, lessons, saved places and release distribution were not part
of this mobile implementation.
