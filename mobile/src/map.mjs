const ns = 'http://www.w3.org/2000/svg';
const empty = () => ({ type: 'FeatureCollection', features: [] });
const line = coordinates => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
const point = coordinates => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates } });
const $ = id => document.getElementById(id);
export class CampusMap {
  constructor(onSelect) {
    this.onSelect = onSelect; this.map = null; this.ready = false; this.version = 0; this.labels = []; this.zoom = 1; this.perspective = false;
    $('map-plus').onclick = () => this.changeZoom(1.4);
    $('map-minus').onclick = () => this.changeZoom(1 / 1.4);
    $('map-reset').onclick = () => this.reset();
    $('map-perspective').onclick = () => {
      this.perspective = !this.perspective;
      $('map-perspective').setAttribute('aria-pressed', String(this.perspective));
      if (this.ready) this.map.easeTo({ pitch: this.perspective ? 45 : 0, duration: 0 });
    };
  }
  async setCampus(campus) {
    const version = ++this.version;
    this.map?.remove(); this.map = null; this.ready = false; this.campus = campus; this.selected = null; this.route = null; this.fix = null;
    this.labels = []; this.zoom = 1; this.perspective = false;
    const coordinates = campus.boundary;
    this.bounds = [[Math.min(...coordinates.map(p => p[0])), Math.min(...coordinates.map(p => p[1]))],
      [Math.max(...coordinates.map(p => p[0])), Math.max(...coordinates.map(p => p[1]))]];
    this.center = [(this.bounds[0][0] + this.bounds[1][0]) / 2, (this.bounds[0][1] + this.bounds[1][1]) / 2];
    this.flat();
    $('flat-map').hidden = false; $('campus-map').hidden = true; $('map-perspective').disabled = true;
    $('map-perspective').setAttribute('aria-pressed', 'false');
    const fallback = () => {
      if (version !== this.version) return;
      this.ready = false; $('flat-map').hidden = false; $('campus-map').hidden = true; $('map-perspective').disabled = true;
      $('map-message').textContent = 'Basic 2D map · use + and − to zoom, drag to move. Destinations are also listed below.';
      this.flat();
    };
    if (new URLSearchParams(location.search).get('renderer') === 'svg') { fallback(); return; }
    try {
      const lib = await import('./vendor/maplibre-gl-6.19.0/maplibre-gl.mjs');
      if (version !== this.version) return;
      $('campus-map').hidden = false;
      const map = this.map = new lib.Map({ container: 'campus-map', attributionControl: false,
        style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#edf2e8' } }] },
        center: this.center, zoom: 16, maxZoom: 22, canvasContextAttributes: { antialias: true } });
      map.on('load', () => {
        if (version !== this.version) return;
        map.addSource('campus', { type: 'geojson', data: campus.geography });
        map.addLayer({ id: 'ground', type: 'fill', source: 'campus', filter: ['==', ['get', 'kind'], 'boundary'], paint: { 'fill-color': '#e4ecdf' } });
        map.addLayer({ id: 'spaces', type: 'fill', source: 'campus', filter: ['in', ['get', 'kind'], ['literal', ['landmark', 'parking']]], paint: { 'fill-color': '#cbdcbf', 'fill-opacity': .65 } });
        map.addLayer({ id: 'paths', type: 'line', source: 'campus', filter: ['==', ['get', 'kind'], 'path'], paint: { 'line-color': '#fcfdf9', 'line-width': 4 } });
        map.addLayer({ id: 'buildings', type: 'fill-extrusion', source: 'campus', filter: ['==', ['get', 'kind'], 'building'], paint: { 'fill-extrusion-color': '#b1c7d7', 'fill-extrusion-height': ['coalesce', ['get', 'displayHeight'], 8], 'fill-extrusion-opacity': .9 } });
        for (const id of ['route', 'position', 'accuracy', 'destination']) map.addSource(id, { type: 'geojson', data: empty() });
        map.addLayer({ id: 'accuracy', type: 'fill', source: 'accuracy', paint: { 'fill-color': '#1687b1', 'fill-opacity': .15 } });
        map.addLayer({ id: 'route-halo', type: 'line', source: 'route', paint: { 'line-color': '#ffffff', 'line-width': 8 } });
        map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#1762d4', 'line-width': 4 } });
        map.addLayer({ id: 'destination', type: 'circle', source: 'destination', paint: { 'circle-radius': 9, 'circle-color': '#1762d4', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });
        map.addLayer({ id: 'position', type: 'circle', source: 'position', paint: { 'circle-radius': 7, 'circle-color': '#1687b1', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });
        for (const place of campus.places.filter(p => !p.room && p.coordinate).slice(0, 12)) {
          const button = document.createElement('button'); button.className = 'map-label'; button.textContent = place.shortName;
          button.setAttribute('aria-label', place.name + (place.verified ? '' : ', candidate location'));
          button.onclick = () => this.onSelect(place);
          const marker = new lib.Marker({ element: button, anchor: 'bottom', offset: [0, -9] }).setLngLat(place.coordinate).addTo(map);
          this.labels.push({ place, button, marker });
        }
        this.ready = true; $('flat-map').hidden = true; $('map-perspective').disabled = false;
        map.fitBounds(this.bounds, { padding: 35, duration: 0 }); this.update();
        $('map-message').textContent = campus.network.simulation ? 'Fictional demonstration map. This is not a USIU walking route.' : 'Building positions and walking access need campus review. 3D heights are illustrative.';
      });
      map.on('error', () => { if (!this.ready) fallback(); });
      map.on('webglcontextlost', fallback);
    } catch { fallback(); }
  }
  reset() { this.zoom = 1; this.center = [(this.bounds[0][0] + this.bounds[1][0]) / 2, (this.bounds[0][1] + this.bounds[1][1]) / 2]; if (this.ready) this.map.fitBounds(this.bounds, { padding: 35, duration: 0 }); else this.flat(); }
  changeZoom(factor) { if (this.ready) this.map.zoomTo(this.map.getZoom() + Math.log2(factor), { duration: 0 }); else { this.zoom = Math.max(1, Math.min(16, this.zoom * factor)); this.flat(); } }
  select(place) {
    this.selected = place; this.update();
    if (place?.coordinate) {
      if (this.ready) this.map.easeTo({ center: place.coordinate, zoom: Math.max(17, this.map.getZoom()), duration: 0 });
      else { this.center = place.coordinate; this.zoom = 3; this.flat(); }
    }
  }
  setRoute(route) { this.route = route; this.update(); }
  setFix(fix) { this.fix = fix; this.update(); }
  update() {
    if (!this.ready) { if (this.campus) this.flat(); return; }
    this.map.getSource('route').setData(this.route?.coordinates.length > 1 ? line(this.route.coordinates) : empty());
    this.map.getSource('position').setData(this.fix ? point(this.fix.coordinate) : empty());
    this.map.getSource('destination').setData(this.selected?.coordinate ? point(this.selected.coordinate) : empty());
    let accuracy = empty();
    if (this.fix) {
      const [lon, lat] = this.fix.coordinate, metres = Math.min(5000, this.fix.accuracy);
      const ring = Array.from({ length: 49 }, (_, i) => [lon + metres * Math.cos(i / 48 * Math.PI * 2) / (111195 * Math.cos(lat * Math.PI / 180)), lat + metres * Math.sin(i / 48 * Math.PI * 2) / 111195]);
      accuracy = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
    }
    this.map.getSource('accuracy').setData(accuracy);
    for (const { place, button } of this.labels) button.classList.toggle('selected', place.id === this.selected?.id || place.id === this.selected?.destinationId);
  }
  flat() {
    if (!this.campus) return;
    const width = 600, height = 650, [lo, hi] = this.bounds;
    const xScale = Math.cos(this.center[1] * Math.PI / 180);
    const scale = Math.min(width / ((hi[0] - lo[0]) * xScale), height / (hi[1] - lo[1])) * .9 * this.zoom;
    const project = p => [width / 2 + (p[0] - this.center[0]) * xScale * scale, height / 2 - (p[1] - this.center[1]) * scale];
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Campus map. Use the destination list for building details.');
    const shape = (tag, attributes) => { const node = document.createElementNS(ns, tag); for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value); svg.append(node); return node; };
    const order = { boundary: 0, landmark: 1, parking: 2, path: 3, building: 4 };
    for (const f of [...this.campus.geography.features].sort((a, b) => order[a.properties.kind] - order[b.properties.kind])) {
      const polygon = f.geometry.type === 'Polygon', coords = polygon ? f.geometry.coordinates[0] : f.geometry.coordinates;
      const fill = f.properties.kind === 'building' ? '#b1c7d7' : f.properties.kind === 'boundary' ? '#e4ecdf' : '#cbdcbf';
      shape(polygon ? 'polygon' : 'polyline', { points: coords.map(p => project(p).join(',')).join(' '), fill: polygon ? fill : 'none', stroke: polygon ? '#a8beae' : '#fff', 'stroke-width': polygon ? .7 : 3 });
    }
    if (this.route) shape('polyline', { points: this.route.coordinates.map(p => project(p).join(',')).join(' '), fill: 'none', stroke: '#1762d4', 'stroke-width': 5, 'stroke-linejoin': 'round' });
    for (const place of this.campus.places.filter(p => !p.room && p.coordinate).slice(0, 12)) {
      const [x, y] = project(place.coordinate);
      const label = shape('text', { x, y: y - 12, 'text-anchor': 'middle', fill: '#173653', 'font-size': 13, 'paint-order': 'stroke', stroke: '#ffffff', 'stroke-width': 4 }); label.textContent = place.shortName;
    }
    if (this.selected?.coordinate) { const [cx, cy] = project(this.selected.coordinate); shape('circle', { cx, cy, r: 9, fill: '#1762d4', stroke: '#fff', 'stroke-width': 3 }); }
    if (this.fix) {
      const [cx, cy] = project(this.fix.coordinate);
      shape('circle', { cx, cy, r: this.fix.accuracy / 111195 * scale, fill: '#1687b1', opacity: .16 });
      shape('circle', { cx, cy, r: 7, fill: '#1687b1', stroke: '#fff', 'stroke-width': 3 });
    }
    let drag;
    svg.onpointerdown = event => { drag = { x: event.clientX, y: event.clientY, center: [...this.center], rect: svg.getBoundingClientRect() }; svg.setPointerCapture(event.pointerId); };
    svg.onpointerup = event => {
      if (!drag) return;
      const units = Math.min(drag.rect.width / width, drag.rect.height / height);
      this.center = [drag.center[0] - (event.clientX - drag.x) / units / scale / xScale, drag.center[1] + (event.clientY - drag.y) / units / scale]; drag = null; this.flat();
    };
    $('flat-map').replaceChildren(svg);
  }
}
