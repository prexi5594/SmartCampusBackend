const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, 'prototype/data', file), 'utf8'));
const directory = read('usiu-directory.json');
const geography = read('usiu-geography.geojson');
const sources = read('usiu-map-sources.json');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'prototype/usiu-directory.js'), 'utf8'), sandbox);
const find = query => sandbox.UsiuDirectory.search(directory, query);

test('official guide has 67 teaching-space records and four distinct block labels', () => {
  assert.deepEqual(directory.buildings.map(b => b.rooms.length), [10, 23, 8, 26, 0]);
  assert.deepEqual(directory.buildings.find(b => b.id === 'wooden').blocks.map(b => b.code), ['EF', 'GH', 'KL', 'IJ']);
  const codes = directory.buildings.flatMap(b => b.rooms);
  assert.equal(new Set(codes).size, 67);
});

test('room search preserves meaningful code order while tolerating case and spacing', () => {
  const examples = [
    [' lt 4 ', 'science', 'LT4'], ['ss12', 'shss', 'SS12'],
    ['LAB 1', 'beam', 'Lab 1'], ['Lab A', 'science', 'Lab A'],
    ['B-Lab', 'chandaria', 'B-Lab'], ['Lab B', 'science', 'Lab B'],
    ['G-Lab', 'beam', 'G-Lab'], ['Lab G', 'science', 'Lab G'],
    ['B1', 'chandaria', 'B1'], ['BS1', 'chandaria', 'BS1'],
  ];
  for (const [query, buildingId, code] of examples) {
    assert.equal(find(query)[0].building.id, buildingId, query);
    assert.equal(find(query)[0].code, code, query);
    assert.equal(find(query)[0].score, 3, query);
  }
  assert.equal(find('  ').length, 5);
});

test('missing codes and unidentified GH are not assigned invented locations', () => {
  for (const query of ['LT6', 'Lab5', '<img onerror=alert(1)>']) assert.equal(find(query).length, 0, query);
  assert.equal(find('GH')[0].code, 'GH');
  assert.equal(find('GH')[0].candidates.length, 0);
});

test('geometry has real geographic ranges, closed polygons and unique review IDs', () => {
  const ids = new Set();
  const reviewIds = new Set();
  const counts = {};
  for (const feature of geography.features) {
    assert.ok(!ids.has(feature.id)); ids.add(feature.id);
    counts[feature.properties.kind] = (counts[feature.properties.kind] || 0) + 1;
    assert.equal(feature.properties.navigationVerified, false);
    const ring = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0] : feature.geometry.coordinates;
    if (feature.geometry.type === 'Polygon') assert.deepEqual(ring[0], ring.at(-1));
    for (const [lon, lat] of ring) {
      assert.ok(Number.isFinite(lon) && Number.isFinite(lat));
      assert.ok(lon > 36.87 && lon < 36.89 && lat > -1.23 && lat < -1.20);
    }
    if (feature.properties.kind === 'building') {
      assert.ok(!reviewIds.has(feature.properties.reviewId));
      reviewIds.add(feature.properties.reviewId);
      assert.ok(feature.properties.heightBasis);
    }
  }
  assert.deepEqual(counts, sources.counts);
  assert.equal(reviewIds.size, 51);
});

test('candidate matches refer to actual buildings without claiming verified entrances', () => {
  for (const building of directory.buildings) {
    for (const id of building.osmCandidates) {
      const feature = geography.features.find(f => f.id === id);
      assert.equal(feature?.properties.kind, 'building', id);
      assert.equal(feature.properties.reviewStatus, 'needs-campus-review');
    }
  }
  assert.equal(sources.mappedBuildingEntrances.length, 0);
  assert.equal(sources.reviewOnly, true);
  assert.equal(sources.license, 'ODbL-1.0');
});
