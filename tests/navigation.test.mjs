import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { planRoute, distance, Guidance, validateFix, validateNetwork, insideRing } from '../shared/navigation.mjs';
import { LocationSession, locationError } from '../shared/location-session.mjs';
import { simulationCampus, searchPlaces } from '../mobile/src/data.mjs';
const fixture = () => simulationCampus();
const options = { allowSimulation: true };
const fix = (coordinate, timestamp = 10000, accuracy = 3) => ({ coordinate, timestamp, accuracy });
const routeToLibrary = () => planRoute(fixture().network, 'entrance', 'library', options);
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('distance and campus bounds use geography, including an exact boundary point', () => {
  assert.ok(Math.abs(distance([0, 0], [0, .001]) - 111.195) < .01);
  const ring = fixture().boundary;
  assert.equal(insideRing([0, 0], ring), true);
  assert.equal(insideRing([1, 1], ring), false);
  assert.equal(insideRing(ring[0], ring), true);
});
test('shortest routes use only connected allowed edges, with all origin/destination pairs', () => {
  const { network } = fixture();
  for (const a of network.destinations) for (const b of network.destinations) {
    const route = planRoute(network, a.id, b.id, options);
    assert.equal(route.destinationId, b.id);
    assert.deepEqual(route.coordinates[0], network.nodes.find(n => n.id === a.nodeId).coordinate);
    assert.deepEqual(route.coordinates.at(-1), network.nodes.find(n => n.id === b.nodeId).coordinate);
    assert.ok(route.edgeIds.every(id => network.edges.some(e => e.id === id && e.verified)));
    assert.equal(route.distance === 0, a.id === b.id);
  }
  const route = routeToLibrary();
  assert.ok(Math.abs(route.distance - 289.107) < .1);
  assert.equal(route.seconds, route.distance / 1.25);
});
test('route cost includes reviewable crossing penalties and avoids closed/unverified/restricted connections', () => {
  for (const change of [{ closed: true }, { verified: false }, { access: 'restricted' }, { penaltySeconds: 500 }]) {
    const { network } = fixture();
    Object.assign(network.edges.find(e => e.id === 'demo-1'), change);
    assert.ok(!planRoute(network, 'entrance', 'library', options).edgeIds.includes('demo-1'));
  }
  const { network } = fixture();
  network.edges[0].closed = true;
  assert.throws(() => planRoute(network, 'entrance', 'library', options), { code: 'NO_ROUTE' });
  assert.throws(() => planRoute(fixture().network, 'entrance', 'library', { ...options, stepFree: true }), { code: 'PATHS_UNVERIFIED' });
});
test('same-edge GPS origin uses remaining distance and respects one-way walking direction', () => {
  const { network } = fixture();
  const origin = [0, .0004];
  const route = planRoute(network, origin, 'library', options);
  assert.ok(Math.abs(route.distance - (routeToLibrary().distance - distance([0, 0], origin))) < .1);
  network.edges[0].direction = 'forward';
  assert.throws(() => planRoute(network, origin, 'entrance', options), { code: 'NO_ROUTE' });
});
test('off-network, outside-campus and indoor origins never become straight routes', () => {
  const data = fixture();
  assert.throws(() => planRoute(data.network, [0, .01], 'library', options), { code: 'NO_PATH_NEARBY' });
  assert.throws(() => planRoute(data.network, [0, .01], 'library', { ...options, boundary: data.boundary }), { code: 'OUTSIDE_CAMPUS' });
  const obstacle = [[-.0001, -.0001], [.0001, -.0001], [.0001, .0001], [-.0001, .0001], [-.0001, -.0001]];
  assert.throws(() => planRoute(data.network, [0, 0], 'library', { ...options, obstacles: [obstacle] }), { code: 'INDOOR_LOCATION' });
  const wall = [[.00002, -.0001], [.00004, -.0001], [.00004, .0001], [.00002, .0001], [.00002, -.0001]];
  assert.throws(() => planRoute(data.network, [.00006, 0], 'library', { ...options, obstacles: [wall] }), { code: 'NO_PATH_NEARBY' });
});
test('simulation cannot enter live routing; campus file contains no invented verified paths', () => {
  assert.throws(() => planRoute(fixture().network, 'entrance', 'library'), { code: 'SIMULATION_ONLY' });
  const network = JSON.parse(fs.readFileSync(new URL('../prototype/data/usiu-routing.json', import.meta.url)));
  validateNetwork(network);
  assert.equal(network.simulation, false); assert.equal(network.edges.length, 0); assert.equal(network.destinations.length, 0);
  assert.throws(() => planRoute(network, [36.878, -1.217], 'chandaria'), { code: 'ENTRANCE_UNVERIFIED' });
});
test('network validation refuses invalid IDs, coordinates and unsupported verification claims', () => {
  for (const mutate of [n => n.nodes.push(n.nodes[0]), n => n.nodes[0].coordinate = [NaN, 0], n => n.edges[0].to = 'missing', n => n.edges[0].penaltySeconds = -1,
    n => n.edges[0].evidence = '', n => n.destinations[0].evidence = '', n => n.destinations.push(n.destinations[0])]) {
    const { network } = fixture(); mutate(network); assert.throws(() => validateNetwork(network), { code: 'INVALID_NETWORK' });
  }
});
test('missing, approximate, stale, future and malformed GPS fixes are rejected', () => {
  assert.equal(validateFix(null, 10000).code, 'INVALID_LOCATION');
  assert.equal(validateFix(fix([0, 0], 10000, 90), 10000).code, 'WEAK_LOCATION');
  assert.equal(validateFix(fix([0, 0], 0), 20000).code, 'STALE_LOCATION');
  assert.equal(validateFix(fix([0, 0], 30000), 10000).code, 'STALE_LOCATION');
  assert.equal(validateFix(fix([NaN, 0]), 10000).code, 'INVALID_LOCATION');
  assert.equal(validateFix(fix([0, 0]), 10000), null);
});
test('waypoints advance only on accurate fixes and arrival requires two fresh fixes over time', () => {
  const route = routeToLibrary(), guide = new Guidance(route);
  let time = 10000;
  const update = (coordinate, accuracy = 3) => { time += 3000; return guide.update(fix(coordinate, time, accuracy), time); };
  assert.equal(update(route.coordinates[0]).state, 'navigating');
  assert.equal(update(route.coordinates.at(-1)).state, 'navigating'); // cannot skip the preceding corners
  const before = guide.next;
  assert.equal(update(route.coordinates[before], 100).state, 'waiting'); assert.equal(guide.next, before);
  while (guide.next < route.coordinates.length - 1) update(route.coordinates[guide.next]);
  assert.equal(update(route.coordinates.at(-1)).state, 'navigating');
  assert.equal(guide.update(fix(route.coordinates.at(-1), time), time).code, 'OLD_FIX');
  assert.equal(update(route.coordinates.at(-1)).state, 'arrived');
});
test('same-place route waits for arrival evidence and weak fixes reset arrival confidence', () => {
  const { network } = fixture(); const route = planRoute(network, 'library', 'library', options); const guide = new Guidance(route);
  const p = route.coordinates[0];
  assert.equal(guide.update(fix(p, 10000), 10000).state, 'navigating');
  assert.equal(guide.update(fix(p, 13000, 80), 13000).state, 'waiting');
  assert.equal(guide.update(fix(p, 16000), 16000).state, 'navigating');
  assert.equal(guide.update(fix(p, 19000), 19000).state, 'arrived');
});
test('GPS jitter does not reroute; sustained deviation reroutes over a valid alternate path', () => {
  const route = routeToLibrary(), guide = new Guidance(route);
  for (let i = 0; i < 5; i++) assert.equal(guide.update(fix([.00005, 0], 10000 + i * 3000), 10000 + i * 3000).state, 'navigating');
  const p = [-.0008, .0008];
  assert.equal(guide.update(fix(p, 30000), 30000).state, 'checking');
  assert.equal(guide.update(fix(p, 33000), 33000).state, 'checking');
  assert.equal(guide.update(fix(p, 36000), 36000).state, 'reroute');
  assert.ok(planRoute(fixture().network, p, 'library', options).edgeIds.includes('demo-5'));
});
test('manual destination search retains distinct room-code order', () => {
  const places = ['B-Lab', 'Lab B', 'G-Lab', 'Lab G'].map(name => ({ name, room: name, keywords: [name] }));
  assert.equal(searchPlaces(places, 'b lab')[0].name, 'B-Lab');
  assert.equal(searchPlaces(places, 'lab b')[0].name, 'Lab B');
  assert.equal(searchPlaces([{ name: 'Hardware Lab · Lillian K. Beam Building', room: 'Hardware Lab', keywords: ['Lillian K. Beam Building', 'Hardware Lab'] }], 'GH').length, 0);
});
test('Stop during a permission dialog prevents registration', async () => {
  const permission = deferred(); let watches = 0;
  const session = new LocationSession({ prepare: () => permission.promise, watch: async () => { watches++; return 'x'; }, clear: async () => {} });
  const start = session.start(() => {}, () => assert.fail('Unexpected error'));
  await session.stop(); permission.resolve(); await start; assert.equal(watches, 0);
});
test('Stop while native watch registration is pending clears the late ID and ignores callbacks', async () => {
  const registered = deferred(); let callback, updates = 0; const cleared = [];
  const session = new LocationSession({ prepare: async () => {}, watch: cb => { callback = cb; return registered.promise; }, clear: async id => { cleared.push(id); } });
  const starting = session.start(() => updates++, () => {}); await Promise.resolve(); await Promise.resolve();
  await session.stop(); callback(fix([0, 0])); registered.resolve('late-watch'); await starting;
  assert.equal(updates, 0); assert.deepEqual(cleared, ['late-watch']); assert.equal(session.watchId, null);
});
test('repeated Start keeps one watch, and Stop during old-watch clearing prevents restart', async () => {
  const cleared = [], clearGate = deferred(); let count = 0;
  const session = new LocationSession({ prepare: async () => {}, watch: async () => 'watch-' + ++count,
    clear: async id => { cleared.push(id); await clearGate.promise; } });
  await session.start(() => {}, () => {});
  const starting = session.start(() => {}, () => {}); await session.stop(); clearGate.resolve(); await starting;
  assert.equal(count, 1); assert.deepEqual(cleared, ['watch-1']);
});
test('permission, GPS-off and timeout failures provide actionable messages', () => {
  assert.match(locationError({ code: 1 }), /permission/);
  assert.match(locationError({ code: 'OS-PLUG-GLOC-0007' }), /switched off/);
  assert.match(locationError({ code: 'OS-PLUG-GLOC-0010' }), /time/);
  assert.match(locationError({ code: 'APPROXIMATE' }), /precise/);
});
