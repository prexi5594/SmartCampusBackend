// Pure geographic routing and guidance. Coordinates are [longitude, latitude].
// This module has no device API, storage, UI or dependency on a map renderer.
const R = 6371008.8;
const radians = n => n * Math.PI / 180;
export const defaults = Object.freeze({
  walkingSpeed: 1.25, maxAccuracy: 20, maxAge: 15000, snapDistance: 8,
  waypointRadius: 12, arrivalRadius: 12, offRouteDistance: 22,
  offRouteSamples: 3, offRouteDuration: 6000, arrivalDuration: 2000,
});
export class NavigationError extends Error {
  constructor(code, message) { super(message); this.name = 'NavigationError'; this.code = code; }
}
const fail = (code, message) => { throw new NavigationError(code, message); };
export function validCoordinate(p) {
  return Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
}
export function distance(a, b) {
  const dlat = radians(b[1] - a[1]), dlon = radians(b[0] - a[0]);
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dlon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function bearing(a, b) {
  const dlon = radians(b[0] - a[0]);
  return (Math.atan2(Math.sin(dlon) * Math.cos(radians(b[1])),
    Math.cos(radians(a[1])) * Math.sin(radians(b[1])) - Math.sin(radians(a[1])) * Math.cos(radians(b[1])) * Math.cos(dlon)) * 180 / Math.PI + 360) % 360;
}
export function projectToSegment(p, a, b) {
  const xScale = Math.cos(radians((a[1] + b[1] + p[1]) / 3));
  const dx = (b[0] - a[0]) * xScale, dy = b[1] - a[1];
  const t = dx * dx + dy * dy ? Math.max(0, Math.min(1, (((p[0] - a[0]) * xScale) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))) : 0;
  const coordinate = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return { coordinate, t, distance: distance(p, coordinate) };
}
export function insideRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j], b = ring[i];
    if (projectToSegment(p, a, b).distance < 0.02) return true;
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function crossesRing(a, b, ring) {
  const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return ring.slice(1).some((d, i) => {
    const c = ring[i];
    return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
  });
}
export function validateFix(fix, now = Date.now()) {
  if (!fix || !validCoordinate(fix.coordinate) || !Number.isFinite(fix.accuracy) || fix.accuracy < 0 || !Number.isFinite(fix.timestamp))
    return { code: 'INVALID_LOCATION', message: 'Waiting for a valid device location.' };
  if (now - fix.timestamp > defaults.maxAge || fix.timestamp > now + 3000)
    return { code: 'STALE_LOCATION', message: 'Location is out of date. Waiting for a fresh position.' };
  if (fix.accuracy > defaults.maxAccuracy)
    return { code: 'WEAK_LOCATION', message: 'Location is too approximate for guidance. Move to an open area or choose a starting place.' };
  return null;
}
const evidencePresent = item => typeof item.evidence === 'string' && item.evidence.trim().length > 0;
export function validateNetwork(network) {
  if (!network || network.schemaVersion !== 1 || typeof network.campusId !== 'string' || typeof network.revision !== 'string' || typeof network.simulation !== 'boolean' ||
      !Array.isArray(network.nodes) || !Array.isArray(network.edges) || !Array.isArray(network.destinations)) fail('INVALID_NETWORK', 'Campus walking data is unavailable.');
  const nodes = new Map();
  for (const node of network.nodes) {
    if (!node.id || nodes.has(node.id) || !validCoordinate(node.coordinate)) fail('INVALID_NETWORK', 'Invalid or duplicate path junction.');
    nodes.set(node.id, node);
  }
  const ids = new Set();
  for (const edge of network.edges) {
    if (!edge.id || ids.has(edge.id) || !nodes.has(edge.from) || !nodes.has(edge.to) || edge.from === edge.to ||
        !['both', 'forward'].includes(edge.direction) || (edge.penaltySeconds !== undefined && (!Number.isFinite(edge.penaltySeconds) || edge.penaltySeconds < 0)))
      fail('INVALID_NETWORK', 'Invalid walking connection.');
    if (edge.verified && !evidencePresent(edge)) fail('INVALID_NETWORK', 'A verified path needs campus review evidence.');
    ids.add(edge.id);
  }
  ids.clear();
  for (const destination of network.destinations) {
    if (!destination.id || ids.has(destination.id) || !nodes.has(destination.nodeId)) fail('INVALID_NETWORK', 'Invalid destination entrance.');
    if (destination.verified && !evidencePresent(destination)) fail('INVALID_NETWORK', 'A verified entrance needs campus review evidence.');
    ids.add(destination.id);
  }
  return nodes;
}
export function usableEdges(network, stepFree = false) {
  return network.edges.filter(e => e.verified === true && e.access === 'allowed' && e.closed === false && (!stepFree || e.stepFree === true));
}
function instructions(coordinates, labels) {
  return coordinates.map((coordinate, i) => {
    let instruction = 'Continue along ' + (labels[i] || 'the path');
    if (i === coordinates.length - 1) instruction = 'Arrive at the destination entrance';
    else if (i > 0) {
      const angle = (bearing(coordinates[i - 1], coordinate) - bearing(coordinate, coordinates[i + 1]) + 540) % 360 - 180;
      if (Math.abs(angle) > 145) instruction = 'Turn back onto ' + (labels[i] || 'the path');
      else if (Math.abs(angle) > 30) instruction = 'Turn ' + (angle < 0 ? 'right' : 'left') + ' onto ' + (labels[i] || 'the path');
    }
    return { coordinate, instruction, index: i };
  });
}
export function planRoute(network, origin, destinationId, options = {}) {
  const nodes = validateNetwork(network);
  if (network.simulation && options.allowSimulation !== true) fail('SIMULATION_ONLY', 'This network is for simulation only.');
  const destination = network.destinations.find(d => d.id === destinationId && d.verified === true && d.available !== false);
  if (!destination) fail('ENTRANCE_UNVERIFIED', 'This destination needs a confirmed entrance before walking directions are available.');
  const edges = usableEdges(network, options.stepFree);
  if (!edges.length) fail('PATHS_UNVERIFIED', 'No confirmed walking paths are available yet.');
  const speed = defaults.walkingSpeed;
  const graph = new Map([...nodes.keys()].map(id => [id, []]));
  const add = (from, to, metres, edge) => graph.get(from).push({ to, metres, edge, seconds: metres / speed + (edge.penaltySeconds || 0) });
  for (const edge of edges) {
    const metres = distance(nodes.get(edge.from).coordinate, nodes.get(edge.to).coordinate);
    add(edge.from, edge.to, metres, edge);
    if (edge.direction === 'both') add(edge.to, edge.from, metres, edge);
  }
  let start, originCoordinate, snapped = null;
  if (typeof origin === 'string') {
    const entrance = network.destinations.find(d => d.id === origin && d.verified === true && d.available !== false);
    if (!entrance) fail('ORIGIN_UNVERIFIED', 'Choose a confirmed starting entrance.');
    start = entrance.nodeId; originCoordinate = nodes.get(start).coordinate;
  } else {
    if (!validCoordinate(origin)) fail('INVALID_LOCATION', 'Choose a valid starting location.');
    if (options.boundary && !insideRing(origin, options.boundary)) fail('OUTSIDE_CAMPUS', 'Your location is outside the mapped campus. Choose a campus starting place.');
    if (options.obstacles?.some(ring => insideRing(origin, ring))) fail('INDOOR_LOCATION', 'Your position is inside a building outline. Go to a confirmed entrance or choose a starting place.');
    // Snap only within a narrow, unobstructed walking corridor; never join to a building centre.
    const candidates = edges.map(edge => ({ ...projectToSegment(origin, nodes.get(edge.from).coordinate, nodes.get(edge.to).coordinate), edge }))
      .filter(hit => hit.distance <= defaults.snapDistance && !options.obstacles?.some(ring => crossesRing(origin, hit.coordinate, ring)))
      .sort((a, b) => a.distance - b.distance);
    if (!candidates.length) fail('NO_PATH_NEARBY', 'No confirmed path is close enough to your position. Move to a known path or choose a starting entrance.');
    snapped = candidates[0];
    // Only attach to the closest edge. Considering remote edges can jump over walls or disconnected paths.
    start = '__position__';
    if (nodes.has(start)) fail('INVALID_NETWORK', 'Reserved junction ID.');
    graph.set(start, []); originCoordinate = snapped.coordinate;
    const edge = snapped.edge;
    if (edge.direction === 'both' || snapped.t < 0.00001) add(start, edge.from, distance(snapped.coordinate, nodes.get(edge.from).coordinate), edge);
    add(start, edge.to, distance(snapped.coordinate, nodes.get(edge.to).coordinate), edge);
  }
  const costs = new Map([[start, 0]]), previous = new Map(), remaining = new Set(graph.keys());
  while (remaining.size) {
    let current, best = Infinity;
    for (const id of remaining) if ((costs.get(id) ?? Infinity) < best) { current = id; best = costs.get(id); }
    if (current === undefined || current === destination.nodeId) break;
    remaining.delete(current);
    for (const link of graph.get(current)) {
      const cost = best + link.seconds;
      if (remaining.has(link.to) && cost < (costs.get(link.to) ?? Infinity)) {
        costs.set(link.to, cost); previous.set(link.to, { from: current, ...link });
      }
    }
  }
  if (!costs.has(destination.nodeId)) fail('NO_ROUTE', 'No connected, permitted walking route reaches this entrance.');
  const links = [], nodeIds = [destination.nodeId];
  while (nodeIds[0] !== start) { const link = previous.get(nodeIds[0]); links.unshift(link); nodeIds.unshift(link.from); }
  let coordinates = [originCoordinate, ...nodeIds.slice(1).map(id => nodes.get(id).coordinate)];
  let labels = links.map(link => link.edge.label || 'the campus path');
  if (snapped && distance(origin, originCoordinate) > 0.5) { coordinates.unshift(origin); labels.unshift('the confirmed path'); }
  // Collapse zero-length start segments without removing the entrance endpoint.
  const compact = [], compactLabels = [];
  coordinates.forEach((coordinate, i) => { if (!compact.length || distance(compact.at(-1), coordinate) > 0.1) { compact.push(coordinate); compactLabels.push(labels[i]); } });
  coordinates = compact;
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) cumulative.push(cumulative.at(-1) + distance(coordinates[i - 1], coordinates[i]));
  return { campusId: network.campusId, revision: network.revision, simulation: network.simulation,
    destinationId, destination, coordinates, waypoints: instructions(coordinates, compactLabels), cumulative,
    distance: cumulative.at(-1), seconds: costs.get(destination.nodeId) + (snapped?.distance || 0) / speed,
    walkingSpeed: speed, edgeIds: links.map(link => link.edge.id) };
}
export class Guidance {
  constructor(route) {
    this.route = route; this.next = Math.min(1, route.waypoints.length - 1); this.lastTimestamp = -Infinity;
    this.offRoute = []; this.arrivalSince = null; this.arrived = false; this.lastProgress = 0;
  }
  update(fix, now = Date.now()) {
    const issue = validateFix(fix, now);
    if (issue) { this.offRoute = []; this.arrivalSince = null; return { state: 'waiting', ...issue }; }
    if (fix.timestamp <= this.lastTimestamp) return { state: 'waiting', code: 'OLD_FIX', message: 'Waiting for a newer location.' };
    this.lastTimestamp = fix.timestamp;
    if (this.arrived) return { state: 'arrived', remaining: 0, seconds: 0 };
    const { coordinates, cumulative } = this.route;
    let nearest = { distance: distance(fix.coordinate, coordinates[0]), progress: 0 };
    if (coordinates.length > 1) {
      nearest.distance = Infinity;
      for (let i = 1; i < coordinates.length; i++) {
        const hit = projectToSegment(fix.coordinate, coordinates[i - 1], coordinates[i]);
        if (hit.distance < nearest.distance) nearest = { ...hit, progress: cumulative[i - 1] + hit.t * (cumulative[i] - cumulative[i - 1]) };
      }
    }
    if (nearest.distance - fix.accuracy > defaults.offRouteDistance) {
      this.arrivalSince = null; this.offRoute.push(fix.timestamp);
      if (this.offRoute.length >= defaults.offRouteSamples && fix.timestamp - this.offRoute[0] >= defaults.offRouteDuration)
        return { state: 'reroute', message: 'You have moved away from the route. Finding a confirmed path.' };
      return { state: 'checking', message: 'Checking your position against the route.' };
    }
    this.offRoute = [];
    // Do not skip several corners because the nearest segment is across a courtyard.
    const nextPoint = this.route.waypoints[this.next];
    if (this.next < coordinates.length - 1 && distance(fix.coordinate, nextPoint.coordinate) + fix.accuracy <= defaults.waypointRadius) this.next++;
    const finalDistance = distance(fix.coordinate, coordinates.at(-1));
    if (this.next === coordinates.length - 1 && finalDistance + fix.accuracy <= defaults.arrivalRadius) {
      this.arrivalSince ??= fix.timestamp;
      if (fix.timestamp - this.arrivalSince >= defaults.arrivalDuration) {
        this.arrived = true; return { state: 'arrived', remaining: 0, seconds: 0, message: 'You have reached the destination entrance.' };
      }
    } else this.arrivalSince = null;
    // Progress cannot jump beyond the next unvisited waypoint.
    const progress = Math.min(nearest.progress, cumulative[this.next]);
    this.lastProgress = progress;
    const remaining = Math.max(0, this.route.distance - progress);
    return { state: 'navigating', remaining, seconds: remaining / this.route.walkingSpeed,
      next: this.next, waypoint: this.route.waypoints[this.next], distanceToWaypoint: distance(fix.coordinate, this.route.waypoints[this.next].coordinate) };
  }
}
