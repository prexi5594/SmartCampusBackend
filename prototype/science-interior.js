(function () {
  'use strict';
  const $ = id => document.getElementById(id), ns = 'http://www.w3.org/2000/svg';
  let pilot, indoor, geography, stages, guide, floor = '1';
  const indoorPoints = [[230,700],[230,650],[230,590],[230,500],[230,410],[230,320],[230,235],[230,160],[110,115]];
  function svg(tag, attrs, text) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key,value]) => node.setAttribute(key,value));
    if (text) node.textContent = text;
    return node;
  }
  function text(x,y,value,size=16) { return svg('text',{x,y,fill:'#122e4c','font-size':size},value); }
  function drawOutdoor() {
    const canvas = $('outdoor-map'); canvas.replaceChildren();
    const coords = [...pilot.coordinates,pilot.gateCoordinate,pilot.entranceCoordinate];
    const minX = Math.min(...coords.map(p=>p[0]))-.00065, maxX = Math.max(...coords.map(p=>p[0]))+.0008;
    const minY = Math.min(...coords.map(p=>p[1]))-.0002, maxY = Math.max(...coords.map(p=>p[1]))+.0004;
    const scale = Math.min(540/(maxX-minX),610/(maxY-minY));
    const project = p => [30+(p[0]-minX)*scale,30+(maxY-p[1])*scale];
    const points = cs => cs.map(p=>project(p).join(',')).join(' ');
    for (const f of geography.features) {
      const kind=f.properties.kind, polygon=f.geometry.type==='Polygon';
      if (!['building','path','landmark'].includes(kind)) continue;
      canvas.append(svg(polygon?'polygon':'polyline',{points:points(polygon?f.geometry.coordinates[0]:f.geometry.coordinates),fill:polygon?(kind==='building'?'#c4d5e2':'#d7e5c8'):'none',stroke:kind==='path'?'#b1b9ac':'#95adbd','stroke-width':kind==='path'?3:1}));
    }
    canvas.append(svg('polyline',{points:points(pilot.coordinates),fill:'none',stroke:'#1761cf','stroke-width':6,'stroke-linejoin':'round'}));
    pilot.connectors.forEach(c=>canvas.append(svg('polyline',{points:points(c.coordinates),fill:'none',stroke:'#9d5c00','stroke-width':5,'stroke-dasharray':'6 4'})));
    const state=guide.state();
    pilot.checkpoints.forEach((point,i)=>{
      const [x,y]=project(point.coordinate);
      canvas.append(svg('circle',{cx:x,cy:y,r:state.active&&state.index===i?11:7,fill:state.active&&state.index===i?'#a65b00':'#1761cf',stroke:'white','stroke-width':2}));
      canvas.append(text(x+12,y+5,String(i+1),14));
    });
    const [gx,gy]=project(pilot.gateCoordinate),[sx,sy]=project(pilot.entranceCoordinate);
    canvas.append(text(gx-10,gy+28,'Gate A'),text(sx+15,sy-18,'Science Centre'),text(540,25,'N ↑'));
  }
  function drawFloor() {
    const canvas=$('journey'); canvas.replaceChildren();
    document.querySelectorAll('[data-floor]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.floor===floor)));
    $('floor-note').textContent=floor==='1'?'First floor: filmed route, schematic room outlines. Lab H is the confirmed destination.':(floor==='ground'?'Ground floor':'Floor 2')+': assumed repeated layout. Lab H is on floor 1.';
    canvas.append(svg('rect',{x:190,y:80,width:80,height:550,rx:6,fill:'#e4edf5',stroke:'#a9bdce'}));
    const rooms=[[40,180],[290,180],[40,280],[290,280],[40,460],[290,460],[40,540],[290,540],[290,80],[40,80]];
    $('room-list').replaceChildren();
    rooms.forEach(([x,y],i)=>{
      const lab=floor==='1'&&i===9;
      const shape=svg('rect',{x,y,width:130,height:70,rx:5,fill:lab?'#dcecff':'#fff',stroke:lab?'#1761cf':'#a9bdce','stroke-width':2,tabindex:0,role:'button','aria-label':lab?'Lab H, first floor':'Unnamed room placeholder '+(i+1)+' on '+(floor==='ground'?'ground floor':'floor '+floor),class:'room-shape'});
      const select=()=>{$('room-selection').textContent=lab?'Lab H — Biomedical Research Lab. First floor, confirmed in the video.':'Unnamed room at diagram position '+(i+1)+'. Label, use and exact position are assumed; no directions are assigned to this room.';};
      shape.addEventListener('click',select);shape.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();select();}});
      canvas.append(shape,text(x+10,y+30,lab?'Lab H':'Unnamed room',14),text(x+10,y+51,lab?'Biomedical lab':'Assumed outline',12));
      // Door gaps connect each illustrative room only to the schematic corridor.
      const doorX=x<190?170:290;
      canvas.append(svg('path',{d:`M ${doorX} ${y+25} V ${y+45}`,stroke:lab?'#dcecff':'white','stroke-width':4}));
      canvas.append(svg('path',{d:`M ${x<190?170:270} ${y+35} H ${x<190?190:290}`,stroke:'#8ea8bd','stroke-width':3}));
      const button=document.createElement('button');button.type='button';button.textContent=lab?'Lab H':'Unnamed room · '+(i+1);button.addEventListener('click',select);$('room-list').append(button);
    });
    for (const y of [400,225]) {
      for(let n=0;n<4;n++)canvas.append(svg('path',{d:`M 190 ${y+n*5} H 270`,stroke:'#56748c','stroke-width':2}));
      canvas.append(text(285,y+12,'Steps down',12));
    }
    canvas.append(svg('rect',{x:180,y:630,width:100,height:55,rx:5,fill:'#c9d9e6'}),text(189,661,'Main stairs',14),text(185,724,'Entrance',14));
    const routePoints=floor==='1'?[...indoorPoints.slice(0,-1),[230,115],indoorPoints[indoorPoints.length-1]]:floor==='ground'?[indoorPoints[0],indoorPoints[1]]:[];
    if(routePoints.length)canvas.append(svg('polyline',{points:routePoints.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#1761cf','stroke-width':5,'stroke-linejoin':'round'}));
    const state=guide.state(), index=state.index-pilot.checkpoints.length;
    if(state.active&&index>=0&&(floor==='1'||(floor==='ground'&&index<=1))){const [x,y]=indoorPoints[index];canvas.append(svg('circle',{cx:x,cy:y,r:10,fill:'#a65b00',stroke:'white','stroke-width':2}));}
  }
  function render() {
    const state=guide.state(), point=stages[state.index];
    $('start-route').hidden=state.active; $('start-indoor').hidden=state.active;
    $('previous').hidden=$('next').hidden=$('stop').hidden=!state.active;
    $('previous').disabled=state.index===0;
    $('next').textContent=state.index===stages.length-1?'Confirm I am at Lab H':'Done — next step';
    $('stage').textContent=state.completed?'Destination confirmed by you':state.active?(state.index<pilot.checkpoints.length?'Outdoor route':'Indoor route')+' · Step '+(state.index+1)+' of '+stages.length:'Route ready';
    $('guide-title').textContent=state.completed?'Lab H · First floor':state.active?point.label:'Gate A to first floor, Lab H';
    $('instruction').textContent=state.completed?'You confirmed arrival at the Lab H doorway. Your position was not measured.':state.active?point.instruction+(point.metresToNext?' Approximately '+point.metresToNext+' m to the next checkpoint.':''):'Start at Gate A, or continue from the Science Centre entrance.';
    $('selection').textContent=state.active?'Advance only after completing this step. Position is not tracked.':state.completed?'Guidance finished.':'Manual checkpoints · assumed outdoor paths and entrance';
    document.querySelectorAll('#steps li').forEach((li,i)=>li.classList.toggle('route-step-current',state.active&&i===state.index));
    $('room-selection').textContent='Choose a room on this floor.';
    drawOutdoor();drawFloor();
  }
  async function start() {
    try {
      [pilot,indoor,geography]=await Promise.all(['data/gate-a-science-pilot.json','data/science-lab-h.json','data/usiu-geography.geojson'].map(async url=>{const response=await fetch(url);if(!response.ok)throw new Error('Route unavailable');return response.json();}));
      stages=[...pilot.checkpoints,...indoor.waypoints];guide=PilotGuide.create(stages.length,pilot.checkpoints.length);
      $('distance').textContent='Approximately '+Math.round(pilot.distanceMetres/10)*10+' m outdoors · about '+Math.ceil(pilot.walkMinutes)+' min, plus the indoor stairs and corridor.';
      stages.forEach((point,i)=>{const li=document.createElement('li'),label=document.createElement('strong'),description=document.createElement('p');label.textContent=point.label;description.textContent=point.instruction+(i<pilot.checkpoints.length?(point.metresToNext?' Approximately '+point.metresToNext+' m to the next checkpoint.':''):' Video reference: '+Math.floor(point.videoSeconds[0])+'–'+Math.ceil(point.videoSeconds[1])+' seconds.');li.append(label,description);$('steps').append(li);});
      $('start-route').addEventListener('click',()=>{guide.start();floor='1';render();});
      $('start-indoor').addEventListener('click',()=>{guide.start(true);floor='ground';render();});
      $('next').addEventListener('click',()=>{const state=guide.next();if(state.index>=pilot.checkpoints.length)floor=state.index<=pilot.checkpoints.length+1?'ground':'1';render();});
      $('previous').addEventListener('click',()=>{const state=guide.back();if(state.index>=pilot.checkpoints.length)floor=state.index<=pilot.checkpoints.length+1?'ground':'1';render();});
      $('stop').addEventListener('click',()=>{guide.stop();render();});
      document.querySelectorAll('[data-floor]').forEach(button=>button.addEventListener('click',()=>{floor=button.dataset.floor;$('room-selection').textContent='Choose a room on this floor.';drawFloor();}));
      $('route-content').hidden=false;$('load-state').textContent='Route ready: Gate A to first floor, Lab H.';render();
    } catch(error) {$('load-state').textContent='The route could not be loaded. Check your connection and reload.';$('load-state').setAttribute('role','alert');}
  }
  window.CampusSession.then(user=>{if(user)start();});
}());
