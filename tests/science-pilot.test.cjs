const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {create} = require('../prototype/pilot-guide.js');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname,'../prototype/data',name)));
const pilot = read('gate-a-science-pilot.json');
const indoor = read('science-lab-h.json');
test('outdoor route follows connected source ways instead of cutting across campus',()=>{
  const ways = new Map(read('usiu-geography.geojson').features.map(f=>[f.id,f]));
  assert.ok(pilot.coordinates.length>2);
  assert.equal(pilot.sourceWays.length,pilot.nodeIds.length-1);
  pilot.sourceWays.forEach((id,i)=>{
    const way=ways.get(id),ids=way.properties.nodeIds;
    const a=ids.indexOf(pilot.nodeIds[i]),b=ids.indexOf(pilot.nodeIds[i+1]);
    assert.ok(a>=0&&b>=0); assert.equal(Math.abs(a-b),1);
    assert.deepEqual(pilot.coordinates[i],way.geometry.coordinates[a]);
    assert.deepEqual(pilot.coordinates[i+1],way.geometry.coordinates[b]);
    assert.ok(!['private','no'].includes(way.properties.osmTags.access));
  });
  assert.ok(pilot.distanceMetres>400&&pilot.distanceMetres<800);
  assert.equal(pilot.checkpoints[0].routeIndex,0);
  assert.equal(pilot.checkpoints.at(-1).routeIndex,pilot.coordinates.length-1);
});
test('assumed connectors and floor repetitions remain distinct from video evidence',()=>{
  assert.equal(pilot.verified,false);assert.equal(pilot.livePositioning,false);
  assert.equal(pilot.connectors.length,2);
  assert.ok(pilot.connectors.every(c=>/assumed|estimated/.test(c.status)));
  assert.equal(pilot.floors.find(f=>f.id==='ground').basis,'assumed-repeat');
  assert.equal(pilot.floors.find(f=>f.id==='2').basis,'assumed-repeat');
  assert.equal(indoor.destinationCode,'Lab H');assert.equal(indoor.floorLabel,'First floor');
});
test('manual guide requires every confirmation including the final doorway',()=>{
  const total=pilot.checkpoints.length+indoor.waypoints.length;
  const guide=create(total,pilot.checkpoints.length);
  assert.deepEqual(guide.next(),{index:0,active:false,completed:false});
  guide.start();
  for(let i=1;i<total;i++){assert.equal(guide.next().index,i);assert.equal(guide.state().completed,false);}
  assert.deepEqual(guide.next(),{index:total-1,active:false,completed:true});
  assert.equal(guide.next().index,total-1);
  assert.deepEqual(guide.start(),{index:0,active:true,completed:false});
});
test('entrance start, previous and stop do not fabricate an automatic position',()=>{
  const guide=create(19,10);
  assert.equal(guide.start(true).index,10);assert.equal(guide.back().index,9);
  guide.stop();assert.equal(guide.next().index,9);assert.equal(guide.state().completed,false);
  guide.start();assert.equal(guide.back().index,0);
  assert.throws(()=>create(10,10));
});
