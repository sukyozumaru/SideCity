import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/core.js';
import { Simulation } from '../src/simulation.js';
import { insideShelter } from '../src/camp.js';
const fresh = () => new Simulation(createWorld(),{autonomy:false});
const advance = (s, seconds) => { for(let i=0;i<Math.round(seconds*10);i++) s.update(.1); };
test('three builders reserve one cost and each contributes from a distinct work station', () => {
  const s=fresh(); s.resources.wood=20;
  for(const p of s.people) assert.equal(s.assign(p.id,'shelter').ok,true);
  assert.equal(s.resources.wood,0); assert.equal(new Set(s.people.map(p=>JSON.stringify(p.job.target))).size,3);
  advance(s,25); assert.equal(s.shelter.complete,true); assert.equal(s.shelter.progress,1);
  for(const p of s.people) { assert.ok(s.shelter.contributions[p.id]>1); assert.equal(p.skills.building.completed,1); assert.equal(p.job,null); assert.equal(insideShelter(s.shelter,p.x,p.y),false); }
  assert.equal(s.resources.wood,0);
});
test('pausing construction preserves work; cancel returns its reservation exactly once', () => {
  const s=fresh(); s.resources.wood=20; s.assign('ana','shelter'); advance(s,12); s.stop('ana'); const progress=s.shelter.progress;
  assert.ok(progress>0&&progress<1); advance(s,5); assert.equal(s.shelter.progress,progress);
  assert.equal(s.assign('ivo','shelter').ok,true); assert.equal(s.resources.wood,0);
  assert.equal(s.cancelShelter(),true); assert.equal(s.resources.wood,20); assert.equal(s.cancelShelter(),false); assert.equal(s.resources.wood,20);
  assert.equal(s.people.reduce((n,p)=>n+p.skills.building.completed,0),0);
});
test('mid-construction saves resume without charging again and preserve contributions', () => {
  const s=fresh(); s.resources.wood=20; s.assign('ana','shelter'); advance(s,12);
  const before=s.snapshot(), resumed=Simulation.restore(createWorld(),before);
  assert.equal(resumed.resources.wood,0); assert.equal(resumed.shelter.progress,s.shelter.progress); assert.deepEqual(resumed.shelter.contributions,s.shelter.contributions);
  resumed.assign('ivo','shelter'); resumed.assign('nara','shelter'); advance(resumed,30); assert.equal(resumed.shelter.complete,true); assert.equal(resumed.resources.wood,0);
});
test('drinking uses a dry bank and restores water without profession XP', () => {
  const s=fresh(), p=s.person('ana'); p.needs.water=15; assert.equal(s.assign(p.id,'drink').ok,true);
  assert.notEqual(s.world.get(p.job.target.x,p.job.target.y).type,'water'); assert.equal(s.world.get(p.job.source.x,p.job.source.y).type,'water');
  advance(s,25); assert.ok(p.needs.water>70); assert.equal(p.completed,0); assert.equal(p.history[0].kind,'drink'); assert.equal(p.history[0].xp,0);
});
test('rest works outside and sleeping requires a finished shelter with separate places', () => {
  const s=fresh(), p=s.person('ana'); p.needs.energy=20; assert.equal(s.assign(p.id,'sleep').ok,false);
  s.assign(p.id,'rest'); advance(s,10); assert.ok(p.needs.energy>45);
  s.resources.wood=20; for(const worker of s.people) s.assign(worker.id,'shelter'); advance(s,25);
  for(const worker of s.people) { worker.needs.energy=10; assert.equal(s.assign(worker.id,'sleep').ok,true); }
  assert.equal(new Set(s.people.map(p=>JSON.stringify(p.job.target))).size,3); advance(s,20);
  assert.ok(s.people.every(p=>p.needs.energy>65)); assert.ok(s.people.every(p=>p.skills.building.completed===1));
});
test('v1 migration preserves XP and moves old foragers out of shrub interiors', () => {
  const s=fresh(); s.assign('ana','study'); advance(s,10); const data=s.snapshot(); data.version=1; delete data.shelter;
  for(const p of data.people) delete p.needs;
  const ivo=data.people.find(p=>p.id==='ivo'); ivo.x=17.5; ivo.y=17.5;
  const restored=Simulation.restore(createWorld(),data); assert.equal(restored.person('ana').skills.study.xp,s.person('ana').skills.study.xp);
  assert.equal(restored.people.length,3); assert.equal(restored.shelter.reserved,false); assert.equal(restored.walkable(restored.world.get(Math.floor(restored.person('ivo').x),Math.floor(restored.person('ivo').y))),true);
});
test('targeted resource orders respect the clicked object and shrubs stay obstacles', () => {
  const s=fresh(); assert.equal(s.assign('ana','foraging',{x:17,y:17}).ok,true); assert.deepEqual(s.person('ana').job.source,{x:17,y:17});
  assert.notDeepEqual(s.person('ana').job.target,{x:17,y:17}); assert.equal(s.assign('ana','move',{x:17,y:17}).ok,false);
  assert.equal(s.assign('ana','logging',{x:20,y:40}).ok,false);
});

test('a solo builder can finish and save despite floating point accumulation', () => {
  const s=fresh(); s.resources.wood=20; s.assign('ana','shelter'); advance(s,120);
  assert.equal(s.shelter.complete,true);
  const restored=Simulation.restore(s.world,JSON.parse(JSON.stringify(s.snapshot())));
  assert.equal(restored.shelter.complete,true);
  assert.equal(restored.person('ana').skills.building.completed,1);
});
