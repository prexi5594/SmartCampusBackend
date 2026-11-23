export async function loadCampus() {
  const [geography, directory, network] = await Promise.all(['usiu-geography.geojson', 'usiu-directory.json', 'usiu-routing.json'].map(async name => {
    const response = await fetch('data/' + name);
    if (!response.ok) throw new Error('Campus files could not be loaded.');
    return response.json();
  }));
  const features = new Map(geography.features.map(f => [f.id, f]));
  const places = [];
  for (const building of directory.buildings) {
    if (building.blocks) {
      for (const block of building.blocks) places.push({ id: 'wooden-' + block.code.toLowerCase(), name: 'Wooden Block ' + block.code,
        shortName: block.code, coordinate: features.get(block.osmCandidates[0])?.properties.centre,
        featureId: block.osmCandidates[0], keywords: [block.code, 'Wooden Blocks'], room: '' });
    } else {
      const base = { id: building.id, name: building.name, shortName: building.shortName,
        coordinate: features.get(building.osmCandidates[0])?.properties.centre, featureId: building.osmCandidates[0],
        keywords: [building.name, ...building.aliases] };
      places.push({ ...base, room: '' });
      for (const room of building.rooms) places.push({ ...base, id: building.id + ':' + room, destinationId: building.id, name: room + ' · ' + building.name, room, keywords: [room, ...base.keywords] });
    }
  }
  const known = new Set(places.map(p => p.featureId));
  for (const feature of geography.features.filter(f => f.properties.kind === 'building' && f.properties.name && !known.has(f.id))) {
    places.push({ id: feature.id, name: feature.properties.name, shortName: feature.properties.name, featureId: feature.id,
      coordinate: feature.properties.centre, keywords: [feature.properties.name, feature.properties.reviewId], room: '' });
  }
  // Only reviewed entrance records can replace a display-only building centre.
  for (const place of places) {
    const entrance = network.destinations.find(d => d.id === (place.destinationId || place.id) && d.verified && d.available !== false);
    if (entrance) { place.coordinate = network.nodes.find(n => n.id === entrance.nodeId)?.coordinate; place.verified = true; }
  }
  return { geography, network, places, boundary: geography.features.find(f => f.properties.kind === 'boundary')?.geometry.coordinates[0],
    obstacles: geography.features.filter(f => f.properties.kind === 'building').map(f => f.geometry.coordinates[0]) };
}
export function searchPlaces(places, text) {
  const normalise = value => value.toLowerCase().replace(/[\s-]+/g, '');
  const query = normalise(text.trim());
  return places.filter(p => !query ? !p.room : [p.name, ...p.keywords].some(value => normalise(value).includes(query)))
    .sort((a, b) => Number(normalise(b.room || '') === query && !!query) - Number(normalise(a.room || '') === query && !!query));
}
// Deliberately fictional coordinates, buildings and paths. Never passed to live GPS.
export function simulationCampus() {
  const nodes = [
    { id: 'entrance', coordinate: [0, 0] }, { id: 'junction', coordinate: [0, .0008] },
    { id: 'east', coordinate: [.001, .0008] }, { id: 'library', coordinate: [.001, .0016] },
    { id: 'cafe', coordinate: [0, .0016] }, { id: 'garden', coordinate: [-.0008, .0008] },
  ];
  const pairs = [['entrance', 'junction', 'Entrance Walk'], ['junction', 'east', 'Garden Walk'], ['east', 'library', 'Library Walk'],
    ['junction', 'cafe', 'Café Walk'], ['cafe', 'library', 'North Walk'], ['junction', 'garden', 'West Walk']];
  const edges = pairs.map(([from, to, label], i) => ({ id: 'demo-' + i, from, to, label, verified: true, evidence: 'Fictional simulation fixture',
    access: 'allowed', closed: false, direction: 'both', stepFree: false }));
  const names = { entrance: 'Demo entrance', library: 'Demo library', cafe: 'Demo café', garden: 'Demo garden' };
  const destinations = Object.entries(names).map(([id, name]) => ({ id, nodeId: id, name, verified: true, evidence: 'Fictional simulation fixture' }));
  const places = destinations.map(d => ({ id: d.id, name: d.name, shortName: d.name, coordinate: nodes.find(n => n.id === d.nodeId).coordinate, verified: true, keywords: [d.name], room: '' }));
  const boundary = [[-.0013, -.0005], [.0017, -.0005], [.0017, .0022], [-.0013, .0022], [-.0013, -.0005]];
  const feature = (id, kind, geometry, name = '') => ({ type: 'Feature', id, properties: { kind, name, displayHeight: 8, osmId: id, centre: geometry.coordinates[0] }, geometry });
  const features = [feature('demo-boundary', 'boundary', { type: 'Polygon', coordinates: [boundary] }),
    ...edges.map(e => feature(e.id, 'path', { type: 'LineString', coordinates: [nodes.find(n => n.id === e.from).coordinate, nodes.find(n => n.id === e.to).coordinate] }))];
  for (const p of places.filter(p => p.id !== 'entrance' && p.id !== 'garden')) {
    const [x, y] = p.coordinate;
    features.push(feature('demo-building-' + p.id, 'building', { type: 'Polygon', coordinates: [[[x - .0002, y + .00003], [x + .0002, y + .00003], [x + .0002, y + .0003], [x - .0002, y + .0003], [x - .0002, y + .00003]]] }, p.name));
  }
  return { network: { schemaVersion: 1, campusId: 'fictional-demo', revision: '1', simulation: true, nodes, edges, destinations },
    places, geography: { type: 'FeatureCollection', features }, boundary, obstacles: [] };
}
