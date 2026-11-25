(function () {
  'use strict';
  const root = document.getElementById('campus-map') || document.querySelector('main');
  const $ = id => root.querySelector('#' + id);
  const ns = 'http://www.w3.org/2000/svg';
  const teachingBounds = [[36.87675, -1.21982], [36.8807, -1.21335]];
  let data, directory, sources, pilot, buildings = [], map = null, selected = '', mode = '2d', area = 'teaching', activeResult = null;
  let mapReady = false, routeVisible = false;
  function showPilotRoute(show) {
    routeVisible = show;
    if (map && mapReady) ['pilot-path', 'pilot-connectors'].forEach(id => map.setLayoutProperty(id, 'visibility', show ? 'visible' : 'none'));
    drawFlat();
  }
  function focusPilotRoute() {
    const points = [...pilot.coordinates, pilot.gateCoordinate, pilot.entranceCoordinate];
    map.fitBounds([
      [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1]))],
      [Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))]
    ], { padding: 55, duration: 0, bearing: 0 });
  }
  const markers = [];
  const featuresById = new Map();
  const matchingGroups = id => directory.buildings.filter(group => group.osmCandidates.includes(id));
  const featureLabel = feature => feature.properties.reviewId + ' · ' + (feature.properties.name || 'Unnamed building');
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function setStatus(text) { $('map-status').textContent = text; }
  function bounds() { return area === 'campus' ? [[sources.bounds[0], sources.bounds[1]], [sources.bounds[2], sources.bounds[3]]] : teachingBounds; }
  function setPressed(prefix, value, choices) { choices.forEach(choice => $(prefix + choice).setAttribute('aria-pressed', String(choice === value))); }
  function drawFlat() {
    const box = bounds();
    const midLat = (box[0][1] + box[1][1]) / 2;
    const scaleX = Math.cos(midLat * Math.PI / 180);
    const w = (box[1][0] - box[0][0]) * scaleX * 100000;
    const h = (box[1][1] - box[0][1]) * 100000;
    const project = p => [(p[0] - box[0][0]) * scaleX * 100000, (box[1][1] - p[1]) * 100000];
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('aria-hidden', 'true');
    const order = { boundary: 0, landmark: 1, parking: 2, path: 3, building: 4 };
    for (const feature of [...data.features].sort((a, b) => order[a.properties.kind] - order[b.properties.kind])) {
      const p = feature.properties;
      const polygon = feature.geometry.type === 'Polygon';
      const coordinates = polygon ? feature.geometry.coordinates[0] : feature.geometry.coordinates;
      const shape = document.createElementNS(ns, polygon ? 'polygon' : 'polyline');
      shape.setAttribute('points', coordinates.map(point => project(point).join(',')).join(' '));
      const water = p.osmTags.leisure === 'swimming_pool';
      const fill = p.kind === 'boundary' ? '#e7efdf' : p.kind === 'building' ? (feature.id === selected ? '#1761cf' : '#b7cbd9') : p.kind === 'landmark' ? (water ? '#9bcbdc' : '#c9ddba') : '#e4e8e5';
      shape.setAttribute('fill', polygon ? fill : 'none');
      shape.setAttribute('stroke', p.kind === 'path' ? (p.pathType === 'footway' ? '#acb3a6' : '#fff') : '#7f98a4');
      shape.setAttribute('stroke-width', p.kind === 'path' ? (p.pathType === 'footway' ? '1.8' : '4.5') : '.6');
      if (p.kind === 'building') {
        shape.style.cursor = 'pointer';
        shape.addEventListener('click', () => selectFeature(feature.id));
      }
      svg.appendChild(shape);
    }
    if (pilot && routeVisible) {
      for (const [coordinates, dashed] of [[pilot.coordinates, false], ...pilot.connectors.map(c => [c.coordinates, true])]) {
        const path = document.createElementNS(ns, 'polyline');
        path.setAttribute('points', coordinates.map(point => project(point).join(',')).join(' '));
        path.setAttribute('fill', 'none'); path.setAttribute('stroke', dashed ? '#9d5c00' : '#1761cf'); path.setAttribute('stroke-width', '4');
        if (dashed) path.setAttribute('stroke-dasharray', '5 3');
        svg.append(path);
      }
    }
    buildings.forEach(feature => {
      const [x, y] = project(feature.properties.centre);
      if (x < 0 || x > w || y < 0 || y > h) return;
      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', x); label.setAttribute('y', y);
      label.setAttribute('font-size', area === 'campus' ? '9' : '7');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', feature.id === selected ? '#fff' : '#18344f');
      label.setAttribute('paint-order', 'stroke');
      label.setAttribute('stroke', feature.id === selected ? '#1761cf' : '#eef2e9');
      label.setAttribute('stroke-width', '1.7');
      label.style.pointerEvents = 'none';
      label.textContent = feature.properties.reviewId;
      svg.appendChild(label);
    });
    $('map-flat').replaceChildren(svg);
  }
  function describeFeature(feature, result) {
    const p = feature.properties;
    const groups = matchingGroups(feature.id);
    const group = result?.building || groups[0];
    $('detail-name').textContent = result?.code ? result.code + ' · ' + result.building.shortName : group ? group.name : p.name || 'Unnamed building';
    $('detail-note').textContent = group ? 'Candidate match from the mapped building name. Please confirm its position on campus.' : 'OpenStreetMap outline and label. Please confirm its identity and current use.';
    const facts = [
      ['Review ID', p.reviewId], ['Mapped label', p.name || 'No name supplied'],
      ['Height', p.heightBasis], ['Entrance', 'Not yet verified']
    ];
    $('detail-facts').replaceChildren(...facts.flatMap(pair => [element('dt', pair[0]), element('dd', pair[1])]));
    $('detail-room').textContent = result?.code ? 'Selected code: ' + result.code + '. Room position and floor are not provided by the guide.' : group?.rooms.length ? group.rooms.length + ' teaching spaces listed in the official guide.' : '';
    if (group?.id === 'science') {
      if (result?.code === 'Lab H') $('detail-room').textContent = 'Lab H: Biomedical Research Lab. First floor confirmed by the user; recorded indoor journey available for review. ';
      $('detail-room').append(document.createTextNode(' Gate A path shown in blue is an assumption-based pilot; the entrance connection is estimated. '));
      const indoorLink = element('a', 'Directions from Gate A to Lab H', 'source-link');
      indoorLink.href = 'science-interior.html';
      $('detail-room').append(document.createElement('br'), indoorLink);
    }
    $('detail-source').href = 'https://www.openstreetmap.org/' + p.osmId;
    $('detail-source').textContent = 'View source on OpenStreetMap';
    $('detail-source').hidden = false;
  }
  function selectFeature(id, result = null, focusCamera = true) {
    const feature = featuresById.get(id);
    if (!feature || feature.properties.kind !== 'building') return;
    selected = id; activeResult = result;
    $('building-picker').value = id;
    describeFeature(feature, result);
    showPilotRoute(id === 'way/1075687895');
    drawFlat();
    if (map && mapReady) {
      map.setFilter('selected-building', ['==', ['get', 'osmId'], id]);
      if (focusCamera && routeVisible) focusPilotRoute();
      else if (focusCamera) map.easeTo({ center: feature.properties.centre, zoom: Math.max(map.getZoom(), 17.7), duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 });
    }
    markers.forEach(item => item.button.classList.toggle('selected', item.id === id));
    setStatus('Selected ' + feature.properties.reviewId + ': ' + $('detail-name').textContent + '. Entrance confirmation pending.');
    root.querySelectorAll('.result').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.id === id)));
  }
  function selectResult(result) {
    if (!result.candidates.length) {
      selected = ''; activeResult = result;
      showPilotRoute(false);
      $('building-picker').value = '';
      $('detail-name').textContent = result.label;
      $('detail-note').textContent = 'The official guide lists this block, but its outline has not been identified. Use a B-number to tell us where it is.';
      $('detail-facts').replaceChildren(); $('detail-room').textContent = '';
      $('detail-source').hidden = true;
      drawFlat();
      if (map && mapReady) map.setFilter('selected-building', ['==', ['get', 'osmId'], '']);
      markers.forEach(item => item.button.classList.remove('selected'));
      root.querySelectorAll('.result').forEach(button => button.setAttribute('aria-pressed', 'false'));
      setStatus(result.label + ': location still unknown.');
      return;
    }
    selectFeature(result.candidates[0], result);
  }
  function renderResults() {
    const query = $('campus-query').value;
    const results = UsiuDirectory.search(directory, query);
    const queryKey = UsiuDirectory.normalise(query);
    if (queryKey) {
      buildings.filter(feature => !matchingGroups(feature.id).length && UsiuDirectory.normalise(featureLabel(feature)).includes(queryKey)).forEach(feature => {
        results.push({ label: featureLabel(feature), feature, candidates: [feature.id], code: '' });
      });
    }
    const buttons = results.slice(0, 12).map(result => {
      const button = element('button', undefined, 'result');
      button.type = 'button'; button.dataset.id = result.candidates[0] || '';
      button.setAttribute('aria-pressed', String(Boolean(selected) && result.candidates.includes(selected)));
      button.append(element('strong', result.label), element('small', result.candidates.length ? 'Show candidate location' : 'Location not yet identified'));
      button.addEventListener('click', () => result.feature ? selectFeature(result.feature.id) : selectResult(result));
      return button;
    });
    $('search-results').replaceChildren(...buttons);
    if (!buttons.length) $('search-results').append(element('p', 'No matching room or building. Try a building name or a code from the guide.', 'help'));
    if (results.length > 12) $('search-results').append(element('p', 'Showing the first 12 matches. Add more of the name or room code.', 'help'));
  }
  function changeArea(value) {
    area = value;
    setPressed('area-', value, ['teaching', 'campus']);
    drawFlat();
    if (map && mapReady) map.fitBounds(bounds(), { padding: 35, pitch: mode === '3d' ? 45 : 0, bearing: 0, duration: 0 });
  }
  function changeMode(value) {
    mode = value;
    setPressed('view-', value, ['2d', '3d']);
    if (map && mapReady) {
      map.setPaintProperty('buildings', 'fill-extrusion-height', value === '3d' ? ['get', 'displayHeight'] : 0);
      map.setPaintProperty('selected-building', 'fill-extrusion-height', value === '3d' ? ['+', ['get', 'displayHeight'], .3] : .3);
      map.easeTo({ pitch: value === '3d' ? 45 : 0, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350 });
    }
  }
  async function initialiseMap() {
    try {
      const lib = await import('./vendor/maplibre-gl-6.19.0/maplibre-gl.mjs');
      $('map-live').hidden = false;
      map = new lib.Map({
        container: 'map-live', style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eef2e9' } }] },
        center: [36.8788, -1.2168], zoom: 16, pitch: 45,
        minZoom: 14.5, maxZoom: 21, maxBounds: [[36.874, -1.222], [36.885, -1.205]],
        attributionControl: false, canvasContextAttributes: { antialias: true },
        cooperativeGestures: true
      });
      map.addControl(new lib.NavigationControl(), 'top-right');
      map.addControl(new lib.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
      map.on('load', () => {
        map.addSource('campus', { type: 'geojson', data });
        map.addLayer({ id: 'campus-ground', type: 'fill', source: 'campus', filter: ['==', ['get', 'kind'], 'boundary'], paint: { 'fill-color': '#e5eddf' } });
        map.addLayer({ id: 'spaces', type: 'fill', source: 'campus', filter: ['in', ['get', 'kind'], ['literal', ['landmark', 'parking']]], paint: { 'fill-color': ['case', ['==', ['get', 'kind'], 'parking'], '#e0e5df', '#c7dab9'], 'fill-opacity': .7 } });
        map.addLayer({ id: 'water', type: 'fill', source: 'campus', filter: ['==', ['get', 'name'], 'Swimming pool'], paint: { 'fill-color': '#95c8df' } });
        map.addLayer({ id: 'roads', type: 'line', source: 'campus', filter: ['all', ['==', ['get', 'kind'], 'path'], ['!=', ['get', 'pathType'], 'footway']], paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 19, 15] } });
        map.addLayer({ id: 'paths', type: 'line', source: 'campus', filter: ['all', ['==', ['get', 'kind'], 'path'], ['==', ['get', 'pathType'], 'footway']], paint: { 'line-color': '#9fa99b', 'line-width': ['interpolate', ['linear'], ['zoom'], 15, .6, 19, 4] } });
        map.addLayer({ id: 'buildings', type: 'fill-extrusion', source: 'campus', filter: ['==', ['get', 'kind'], 'building'], paint: { 'fill-extrusion-color': '#b3c8d8', 'fill-extrusion-height': ['get', 'displayHeight'], 'fill-extrusion-opacity': 1 } });
        map.addLayer({ id: 'selected-building', type: 'fill-extrusion', source: 'campus', filter: ['==', ['get', 'osmId'], selected], paint: { 'fill-extrusion-color': '#1761cf', 'fill-extrusion-height': ['+', ['get', 'displayHeight'], .3] } });
        map.addSource('science-pilot', { type: 'geojson', data: {type:'FeatureCollection',features:[{type:'Feature',properties:{connection:false},geometry:{type:'LineString',coordinates:pilot.coordinates}},...pilot.connectors.map(c=>({type:'Feature',properties:{connection:true},geometry:{type:'LineString',coordinates:c.coordinates}}))]} });
        map.addLayer({id:'pilot-path',type:'line',source:'science-pilot',filter:['==',['get','connection'],false],layout:{visibility:routeVisible?'visible':'none'},paint:{'line-color':'#1761cf','line-width':5}}, 'buildings');
        map.addLayer({id:'pilot-connectors',type:'line',source:'science-pilot',filter:['==',['get','connection'],true],layout:{visibility:routeVisible?'visible':'none'},paint:{'line-color':'#9d5c00','line-width':4,'line-dasharray':[2,2]}}, 'buildings');
        map.on('click', 'buildings', event => { if (event.features?.length) selectFeature(event.features[0].properties.osmId, null, false); });
        map.on('mouseenter', 'buildings', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'buildings', () => { map.getCanvas().style.cursor = ''; });
        for (const group of directory.buildings) {
          for (const id of group.osmCandidates) {
            const feature = featuresById.get(id);
            if (!feature) continue;
            const block = group.blocks?.find(item => item.osmCandidates.includes(id));
            const label = feature.properties.reviewId + ' · ' + (block ? block.code : group.shortName);
            const button = element('button', label, 'map-label');
            button.type = 'button';
            button.setAttribute('aria-label', label + '; candidate location to confirm');
            button.addEventListener('click', event => { event.stopPropagation(); selectFeature(id, { building: group, code: block?.code || '' }); });
            const marker = new lib.Marker({ element: button, anchor: 'bottom', offset: [0, -7] }).setLngLat(feature.properties.centre).addTo(map);
            markers.push({ id, marker, button });
          }
        }
        directory.gates.forEach(gate => {
          const button = element('button', gate.name.split(' (')[0], 'map-label gate-label');
          button.type = 'button'; button.setAttribute('aria-label', gate.name + '; position and daily access to confirm');
          button.addEventListener('click', () => {
            showPilotRoute(gate.id === 'gate-a');
            if (gate.id === 'gate-a') focusPilotRoute();
            $('detail-name').textContent = gate.name;
            $('detail-note').textContent = directory.gateContext;
            $('detail-facts').replaceChildren(element('dt', 'Coordinates'), element('dd', gate.coordinates[1] + ', ' + gate.coordinates[0]));
            $('detail-room').textContent = gate.id === 'gate-a'
              ? 'Follow the blue pilot route to Science Centre, then continue to first-floor Lab H. Outdoor paths are assumed accurate; the entrance connection is estimated.'
              : 'Published coordinates may identify an approach point rather than the exact gate. No route is attached.';
            if (gate.id === 'gate-a') { const link = element('a', 'Directions to first floor, Lab H', 'source-link'); link.href = 'science-interior.html'; $('detail-room').append(document.createElement('br'), link); }
            $('detail-source').textContent = 'View university gate guidance'; $('detail-source').href = directory.gateSource; $('detail-source').hidden = false;
          });
          new lib.Marker({ element: button }).setLngLat(gate.coordinates).addTo(map);
        });
        mapReady = true;
        $('map-flat').hidden = true; $('flat-north').hidden = true;
        $('view-3d').disabled = false;
        changeMode('3d'); changeArea(area);
        setStatus('3D preview ready. ' + buildings.length + ' sourced building outlines; entrances still need review.');
      });
      map.on('error', event => {
        console.error('Campus map renderer:', event.error);
        if (!mapReady) showFallback();
      });
      map.on('webglcontextlost', showFallback);
    } catch (error) {
      console.error('3D map unavailable:', error);
      showFallback();
    }
  }
  function showFallback() {
    mapReady = false;
    $('map-live').hidden = true; $('map-flat').hidden = false; $('flat-north').hidden = false;
    $('view-3d').disabled = true; mode = '2d';
    setPressed('view-', '2d', ['2d', '3d']);
    setStatus('3D is unavailable in this browser. The 2D layout and building search remain available.');
  }
  async function start() {
    try {
      [data, directory, sources, pilot] = await Promise.all(['data/usiu-geography.geojson', 'data/usiu-directory.json', 'data/usiu-map-sources.json', 'data/gate-a-science-pilot.json'].map(async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Could not load ' + url);
        return response.json();
      }));
      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || directory.schemaVersion !== 1 || !Array.isArray(directory.buildings)) throw new Error('Unsupported campus data.');
      data.features.forEach(feature => featuresById.set(feature.id, feature));
      buildings = data.features.filter(feature => feature.properties.kind === 'building');
      for (const feature of buildings) {
        const option = element('option', featureLabel(feature)); option.value = feature.id;
        $('building-picker').append(option);
      }
      $('building-picker').addEventListener('change', event => selectFeature(event.target.value));
      $('campus-query').addEventListener('input', renderResults);
      $('clear-search').addEventListener('click', () => { $('campus-query').value = ''; renderResults(); $('campus-query').focus(); });
      ['2d', '3d'].forEach(value => $('view-' + value).addEventListener('click', () => changeMode(value)));
      ['teaching', 'campus'].forEach(value => $('area-' + value).addEventListener('click', () => changeArea(value)));
      $('map-reset').addEventListener('click', () => changeArea(area));
      $('inspect-wooden').addEventListener('click', () => {
        $('campus-query').value = 'Wooden'; renderResults(); changeArea('teaching');
        selectFeature('way/1417712686');
        if (map && mapReady) map.fitBounds([[36.87925, -1.21865], [36.8804, -1.2175]], { padding: 55, duration: 0, pitch: mode === '3d' ? 45 : 0 });
      });
      drawFlat(); renderResults();
      $('map-loading').hidden = true;
      setStatus(buildings.length + ' sourced building outlines loaded. Preparing 3Dâ€¦');
      if (new URLSearchParams(location.search).get('renderer') === 'svg') {
        setStatus('Basic 2D outline view. Select a building by its review number or search for a room.');
      } else {
        await initialiseMap();
      }
    } catch (error) {
      console.error(error);
      $('map-loading').textContent = 'Campus data could not be loaded. Check your connection and reload the page.';
      $('map-loading').setAttribute('role', 'alert');
      setStatus('Search and map are unavailable until the campus files can be loaded.');
      root.querySelectorAll('button, input, select').forEach(control => { control.disabled = true; });
    }
  }
  window.addEventListener('hashchange', () => { if (map) requestAnimationFrame(() => map.resize()); });
  if (window.CampusSession) window.CampusSession.then(user => { if (user) start(); });
  else start();
}());
