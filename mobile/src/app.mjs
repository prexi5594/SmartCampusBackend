import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import { planRoute, Guidance, validateFix, validateNetwork, insideRing } from '../../shared/navigation.mjs';
import { LocationSession, locationError } from '../../shared/location-session.mjs';
import { loadCampus, simulationCampus, searchPlaces } from './data.mjs';
import { CampusMap } from './map.mjs';
const $ = id => document.getElementById(id);
let campus, realCampus, selected = null, route = null, guidance = null, fix = null, watching = false, active = false;
let demoTime = Date.now(), retryAfter = 0, lastUpdateAt = 0;
const simulated = () => campus?.network.simulation === true;
const status = text => { $('route-status').textContent = text; };
const map = new CampusMap(selectPlace);
const metres = n => n >= 1000 ? (n / 1000).toFixed(1) + ' km' : Math.round(n) + ' m';
const minutes = seconds => seconds <= 0 ? '0 min' : Math.max(1, Math.ceil(seconds / 60)) + ' min';
const positionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, interval: 3000, minimumUpdateInterval: 2000 };
const session = new LocationSession({
  async prepare() {
    if (Capacitor.isNativePlatform()) {
      let permissions = await Geolocation.checkPermissions();
      if (permissions.location === 'prompt' || permissions.location === 'prompt-with-rationale') permissions = await Geolocation.requestPermissions({ permissions: ['location'] });
      if (permissions.location !== 'granted') throw { code: permissions.coarseLocation === 'granted' ? 'APPROXIMATE' : 'OS-PLUG-GLOC-0003' };
    }
  },
  watch: callback => Geolocation.watchPosition(positionOptions, callback),
  clear: id => Geolocation.clearWatch({ id }),
});
function controls() {
  $('locate').disabled = !campus || simulated() || $('origin').value !== 'gps' || watching;
  $('stop-location').hidden = !watching || active;
  $('start').disabled = !route || active;
  $('start').hidden = active;
  $('stop').hidden = !active;
  $('origin').disabled = !campus || active;
  $('simulation-controls').hidden = !simulated() || !active;
  $('demo-next').disabled = !active;
}
function clearRoute() {
  route = null; guidance = null; active = false; map.setRoute(null);
  $('route-stats').hidden = true; $('guidance').hidden = true; $('steps-panel').hidden = true;
  $('steps').replaceChildren(); controls();
}
function renderResults() {
  const matches = searchPlaces(campus.places, $('destination-query').value);
  $('results-count').textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'place' : 'places'}${matches.length > 10 ? ' · showing first 10' : ''}` : 'No places found. Try a building name or room code.';
  $('destinations').replaceChildren(...matches.slice(0, 10).map(place => {
    const button = document.createElement('button'); button.className = 'destination'; button.setAttribute('aria-pressed', String(selected?.id === place.id));
    const pin = document.createElement('span'); pin.className = 'pin'; pin.textContent = '⌖'; pin.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span'), title = document.createElement('strong'), note = document.createElement('small');
    title.textContent = place.name; note.textContent = simulated() ? 'Simulation destination' : !place.coordinate ? 'Location not yet identified' : place.verified ? 'Confirmed entrance' : 'Candidate location · entrance to confirm';
    const arrow = document.createElement('span'); arrow.className = 'chevron'; arrow.textContent = '›'; arrow.setAttribute('aria-hidden', 'true');
    text.append(title, note); button.append(pin, text, arrow); button.onclick = () => selectPlace(place); return button;
  }));
}
function renderRoute() {
  map.setRoute(route); $('route-stats').hidden = false; $('steps-panel').hidden = false;
  $('eta').textContent = minutes(route.seconds); $('distance').textContent = metres(route.distance);
  $('steps').replaceChildren(...route.waypoints.slice(1).map(waypoint => { const li = document.createElement('li'); li.textContent = waypoint.instruction; li.dataset.index = waypoint.index; return li; }));
  status((simulated() ? 'Simulation route ready. ' : 'Walking route ready. ') + 'Estimate uses a walking speed of 75 metres per minute.'); controls();
}
function calculate() {
  clearRoute();
  if (!selected) { status('Choose a destination to plan your walk.'); return; }
  if (!selected.verified) { status(selected.coordinate ? 'The building is shown on the map. Its entrance and walking connections still need confirmation.' : 'This place has no confirmed map location yet. Choose another destination.'); return; }
  const originId = $('origin').value;
  if (originId === 'gps') {
    const issue = validateFix(fix);
    if (issue) { status(issue.message + (fix ? '' : ' Tap Use my location to begin.')); return; }
  }
  try {
    route = planRoute(campus.network, originId === 'gps' ? fix.coordinate : originId, selected.destinationId || selected.id,
      { allowSimulation: simulated(), boundary: campus.boundary, obstacles: campus.obstacles });
    renderRoute();
  } catch (error) { status(error.message); }
}
function selectPlace(place) {
  $('selected-pilot').hidden = simulated() || !/science|lab h/i.test(place.name);
  const wasActive = active;
  selected = place; clearRoute(); map.select(place);
  $('route-title').textContent = place.name;
  $('destination-detail').textContent = place.room ? 'Room ' + place.room + ' is in this building. Outdoor guidance ends at its confirmed entrance; the floor is not mapped.' : simulated() ? 'A fictional place for testing the navigation controls.' : 'Outdoor directions will use the confirmed building entrance.';
  // Preserve focus when selection replaces the result list.
  const hadResultFocus = $('destinations').contains(document.activeElement);
  renderResults();
  if (hadResultFocus) $('destinations').querySelector('[aria-pressed="true"]')?.focus();
  calculate(); if (wasActive) status('Destination changed. Review the new route and start again.');
}
async function stopLocation(message = 'Location is off.') {
  watching = false; fix = null; lastUpdateAt = 0; map.setFix(null); controls();
  try { await session.stop(); } catch { message = 'Could not confirm location stopped. Close the app to stop the native location service.'; }
  $('location-status').textContent = message; $('accuracy').textContent = '';
}
async function receivePosition(position) {
  if (simulated() || !watching) return;
  const sample = { coordinate: [position.coords.longitude, position.coords.latitude], accuracy: position.coords.accuracy, timestamp: position.timestamp };
  consumeFix(sample, Date.now());
}
function consumeFix(sample, now) {
  if (fix && sample.timestamp <= fix.timestamp) return;
  const issue = validateFix(sample, now);
  if (issue && issue.code !== 'WEAK_LOCATION') {
    $('location-status').textContent = issue.message; status(issue.message); $('guidance').hidden = true;
    if (active) { guidance.offRoute = []; guidance.arrivalSince = null; }
    else { route = null; map.setRoute(null); $('route-stats').hidden = true; $('steps-panel').hidden = true; controls(); }
    return;
  }
  fix = sample; lastUpdateAt = Date.now(); map.setFix(fix);
  $('accuracy').textContent = `Estimated accuracy: ±${Math.round(fix.accuracy)} m${simulated() ? ' · simulated' : ''}`;
  $('location-status').textContent = issue ? issue.message : simulated() ? 'Simulated position · your phone GPS is off.' : 'Location active · only on this device.';
  if (!simulated() && !insideRing(fix.coordinate, campus.boundary)) {
    if (active) { active = false; guidance = null; }
    clearRoute(); status('You are outside the mapped campus. Choose a campus starting place to preview a route.'); return;
  }
  if (!active) { if (selected && $('origin').value === 'gps') calculate(); return; }
  const update = guidance.update(sample, now);
  if (update.state === 'waiting' || update.state === 'checking') { status(update.message); $('guidance').hidden = true; return; }
  if (update.state === 'reroute') {
    $('guidance').hidden = true; status(update.message);
    if (now < retryAfter) return;
    retryAfter = now + 10000;
    try {
      route = planRoute(campus.network, fix.coordinate, selected.destinationId || selected.id,
        { allowSimulation: simulated(), boundary: campus.boundary, obstacles: campus.obstacles });
      guidance = new Guidance(route); renderRoute(); status('Route updated from your current position.');
    } catch (error) { map.setRoute(null); $('route-stats').hidden = true; $('steps-panel').hidden = true; status(error.message + ' Guidance is paused until a confirmed path can be found.'); }
    controls(); return;
  }
  // If the user returns to the original path after a failed reroute, restore its display.
  map.setRoute(route); $('route-stats').hidden = false; $('steps-panel').hidden = false;
  $('eta').textContent = minutes(update.seconds); $('distance').textContent = metres(update.remaining);
  if (update.state === 'arrived') {
    active = false; guidance = null; $('guidance').hidden = true; $('steps-panel').hidden = true;
    route = null; controls(); status(simulated() ? 'Simulation complete. You have reached the demo destination.' : 'You have reached the destination entrance.');
    void stopLocation('Trip finished. Location is off.'); return;
  }
  $('guidance').hidden = false; $('next-distance').textContent = `In ${metres(update.distanceToWaypoint)}`;
  $('next-instruction').textContent = update.waypoint.instruction;
  $('steps').querySelectorAll('li').forEach(li => { if (Number(li.dataset.index) === update.next) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
  status(simulated() ? 'Following a simulated route. Use the movement controls to continue.' : 'Follow the confirmed campus path. Keep the app open for guidance.');
}
async function locate() {
  if (simulated()) return;
  watching = true; $('location-status').textContent = 'Requesting your location…'; controls();
  await session.start(receivePosition, error => {
    clearRoute(); const message = locationError(error); status(message); void stopLocation(message);
  });
}
async function stopNavigation(message = 'Navigation stopped. Choose a destination or start again.') {
  clearRoute(); await stopLocation(); status(message);
}
function startNavigation() {
  if (!route) return;
  if (!simulated() && $('origin').value !== 'gps') { status('This is a route preview from a selected entrance. Choose My current location and enable location to begin live guidance.'); return; }
  if (!simulated()) {
    if (!watching || validateFix(fix)) { clearRoute(); status('A fresh precise location is needed. Tap Use my location.'); return; }
    // Recalculate at Start so a route preview cannot start with an old origin.
    calculate(); if (!route) return;
  }
  active = true; guidance = new Guidance(route); retryAfter = 0; controls();
  if (simulated()) {
    demoTime = Date.now(); fix = null;
    consumeFix({ coordinate: route.coordinates[0], accuracy: 3, timestamp: demoTime }, demoTime);
  } else { const current = fix; fix = null; consumeFix(current, Date.now()); }
}
async function switchCampus(data) {
  await stopNavigation(); campus = data; validateNetwork(campus.network); selected = null;
  $('pilot-panel').hidden = simulated(); $('selected-pilot').hidden = true;
  $('simulation-banner').hidden = !simulated(); $('attribution').hidden = simulated(); $('try-demo').hidden = simulated();
  $('campus-name').textContent = simulated() ? 'SIMULATION' : 'USIU-AFRICA';
  $('map-title').textContent = simulated() ? 'Fictional campus' : 'Campus overview';
  $('map-mode-label').textContent = simulated() ? 'Simulation' : 'Map preview';
  $('destination-query').placeholder = simulated() ? 'Try demo library or café' : 'Try Library, Chandaria or LT4';
  $('destination-query').value = ''; $('route-title').textContent = 'Choose a destination'; $('destination-detail').textContent = 'Search for a building or classroom to get started.';
  const originOptions = [];
  if (!simulated()) { const option = document.createElement('option'); option.value = 'gps'; option.textContent = 'My current location'; originOptions.push(option); }
  for (const place of campus.places.filter(p => !p.room)) {
    const option = document.createElement('option'); option.value = place.id; option.textContent = place.name + (place.verified ? '' : ' — entrance unconfirmed'); option.disabled = !place.verified; originOptions.push(option);
  }
  $('origin').replaceChildren(...originOptions); if (simulated()) $('origin').value = 'entrance';
  $('destination-query').disabled = false; $('try-demo').disabled = false;
  renderResults(); controls(); void map.setCampus(campus);
  if (simulated()) selectPlace(campus.places.find(p => p.id === 'library'));
  else status('USIU entrances and paths need confirmation before live walking directions are available.');
}
$('destination-query').oninput = renderResults;
for (const link of document.querySelectorAll('.pilot-link')) link.addEventListener('click', async event => {
  event.preventDefault();
  await stopNavigation();
  window.location.assign(link.href);
});
$('destination-query').onkeydown = event => { if (event.key === 'ArrowDown') { event.preventDefault(); $('destinations').querySelector('button')?.focus(); } };
$('origin').onchange = async () => { await stopLocation(); calculate(); };
$('locate').onclick = locate;
$('stop-location').onclick = async () => { await stopLocation(); calculate(); };
$('start').onclick = startNavigation;
$('stop').onclick = () => stopNavigation();
$('try-demo').onclick = () => switchCampus(simulationCampus());
$('exit-demo').onclick = () => switchCampus(realCampus);
$('demo-next').onclick = () => {
  if (!active) return;
  const coordinate = route.waypoints[guidance.next].coordinate;
  demoTime += 3000; consumeFix({ coordinate, accuracy: 3, timestamp: demoTime }, demoTime);
};
$('demo-weak').onclick = () => { if (active) { demoTime += 3000; consumeFix({ coordinate: fix.coordinate, accuracy: 90, timestamp: demoTime }, demoTime); } };
$('demo-drift').onclick = () => {
  if (!active) return;
  // The west path is a valid alternate origin, separate from the default library route.
  for (let i = 0; i < 3; i++) { demoTime += 3000; consumeFix({ coordinate: [-.0008, .0008], accuracy: 3, timestamp: demoTime }, demoTime); }
};
function pause() { if (watching || active) void stopNavigation('Navigation paused because the app left the screen. Review your route and explicitly start again.'); }
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', pause);
if (Capacitor.isNativePlatform()) void App.addListener('appStateChange', ({ isActive }) => { if (!isActive) pause(); });
const online = () => { $('offline').hidden = navigator.onLine; };
window.addEventListener('online', online); window.addEventListener('offline', online); online();
setInterval(() => {
  if (watching && lastUpdateAt && Date.now() - lastUpdateAt > 15000) {
    $('location-status').textContent = 'Location updates have stopped. Waiting for a fresh position.';
    $('guidance').hidden = true;
    if (active) { guidance.offRoute = []; guidance.arrivalSince = null; status('Guidance paused while waiting for a fresh location.'); }
    else { route = null; map.setRoute(null); $('route-stats').hidden = true; controls(); }
  }
}, 3000);
loadCampus().then(async data => { realCampus = data; await switchCampus(data); }).catch(() => {
  $('fatal').hidden = false; $('fatal').textContent = 'Campus data could not be loaded. Close and reopen the app to try again.';
  $('map-message').textContent = 'Map unavailable.';
});
