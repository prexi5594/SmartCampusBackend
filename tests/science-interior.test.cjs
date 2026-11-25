const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../prototype/data/science-lab-h.json')));
test('recorded route is connected in evidence order and includes all observed level changes', () => {
  const ids = data.waypoints.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.at(-1), 'lab-h');
  assert.equal(data.connections.length, ids.length - 1);
  data.connections.forEach((edge, i) => {
    assert.equal(edge.from, ids[i]); assert.equal(edge.to, ids[i + 1]);
    assert.equal(edge.distanceMetres, null);
    assert.notEqual(edge.accessStatus, 'verified');
  });
  assert.equal(data.waypoints.filter(p => p.kind === 'stairs-down').length, 2);
  assert.equal(data.waypoints.filter(p => p.kind === 'stairs-up').length, 1);
  data.waypoints.forEach((p, i) => {
    assert.ok(p.videoSeconds[0] < p.videoSeconds[1]);
    assert.ok(p.videoSeconds[1] <= data.source.durationSeconds);
    if(i) assert.ok(p.videoSeconds[0] >= data.waypoints[i-1].videoSeconds[0]);
  });
});
test('video evidence cannot silently become metric, step-free or live Gate A navigation', () => {
  assert.equal(data.coordinateSystem, 'topological-only');
  assert.equal(data.distanceMetres, null); assert.equal(data.durationSeconds, null);
  assert.equal(data.navigationReady, false); assert.equal(data.livePositioning, false);
  assert.equal(data.stepFree, false); assert.equal(data.gateALeg.connected, false);
  assert.equal(data.entrance.geographicCoordinate, null);
  assert.equal(data.entrance.userConfirmed, true);
  assert.match(data.source.sha256, /^[a-f0-9]{64}$/);
  const routing = JSON.parse(fs.readFileSync(path.join(__dirname, '../prototype/data/usiu-routing.json')));
  assert.equal(routing.destinations.some(d => d.id === data.id), false);
});
