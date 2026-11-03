import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/core.js';
import { Simulation } from '../src/simulation.js';
import { eraState } from '../src/era.js';
import { saveSimulation, loadSimulation } from '../src/persistence.js';
test('world area is exactly triple, seeds repeat and environments have actual deposits',()=>{
  const a=createWorld(48128),b=createWorld(48128),c=createWorld(75);
  assert.equal(a.tiles.length,48*48*3);assert.equal(a.width,96);assert.equal(a.height,72);assert.deepEqual(a.minerals,b.minerals);assert.notDeepEqual(a.tiles,c.tiles);
  for(const kind of ['stone','coal','iron','copper','tin','silver'])assert.ok(a.minerals.some(m=>m.kind===kind),kind);
  assert.ok(a.scatter.some(s=>s.kind==='sticks'));assert.ok(a.scatter.some(s=>s.kind==='pebbles'));
});
test('founder spawns and shelter remain usable across multiple procedural seeds',()=>{
  for(const seed of [1,7,75,2026,48128,2147483647]){const s=new Simulation(createWorld(seed));for(const p of s.people)assert.ok(s.walkable(s.world.get(Math.floor(p.x),Math.floor(p.y))),`${seed}/${p.id}`);s.resources.wood=20;for(const p of s.people)assert.equal(s.assign(p.id,'shelter').ok,true,`${seed}/${p.id}`);}
});
test('expansion opens exactly 144 adjacent parcels and deducts its cost once',()=>{
  const s=new Simulation(createWorld());s.resources.wood=100;s.resources.knowledge=20;
  assert.equal(s.unlocked.size,16);assert.equal(s.isUnlocked(48,5),false);assert.equal(s.unlockSector(7,5).ok,false);
  const cost=s.expansionCost();assert.equal(s.unlockSector(4,0).ok,true);assert.equal(s.unlocked.size,17);assert.equal(s.resources.wood,100-cost.wood);assert.equal(s.resources.knowledge,20-cost.knowledge);
  let parcels=0;for(let y=0;y<s.world.height;y++)for(let x=0;x<s.world.width;x++)if(s.isUnlocked(x,y))parcels++;assert.equal(parcels,48*48+144);
  assert.equal(s.unlockSector(4,0).ok,false);assert.equal(s.resources.wood,100-cost.wood);assert.equal(s.unlockSector(8,0).ok,false);
});
test('insufficient expansion resources do not mutate territory',()=>{const s=new Simulation(createWorld());assert.equal(s.unlockSector(4,0).ok,false);assert.equal(s.unlocked.size,16);assert.equal(s.resources.wood,0);});
test('seeds retain independent saves and opened sectors survive reload',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},a=new Simulation(createWorld()),b=new Simulation(createWorld(75));
  a.resources.wood=20;a.resources.knowledge=5;a.unlockSector(4,0);b.resources.wood=33;saveSimulation(a,storage);saveSimulation(b,storage);
  assert.equal(loadSimulation(createWorld(),storage).simulation.unlocked.size,17);assert.equal(loadSimulation(createWorld(75),storage).simulation.resources.wood,33);
});
test('v2 expansion migration preserves original resources, XP and depleted trees',()=>{
  const s=new Simulation(createWorld());s.resources.wood=17;s.people[0].skills.study.xp=25;const data=s.snapshot();data.version=2;delete data.unlocked;delete data.scavenged;delete data.resources.stone;
  data.timber=data.timber.filter(([key])=>key.split(',').every(v=>Number(v)<48));data.timber[0][1]=0;
  const r=Simulation.restore(createWorld(),data);assert.equal(r.resources.wood,17);assert.equal(r.people[0].skills.study.xp,25);assert.equal(r.timber.get(data.timber[0][0]),0);assert.equal(r.unlocked.size,16);assert.ok(r.timber.size>data.timber.length);
});
test('era percentages follow achievements, not elapsed time or spending resources',()=>{
  const s=new Simulation(createWorld());assert.equal(eraState(s).percent,0);s.time=1900;assert.equal(eraState(s).year,2);assert.equal(eraState(s).percent,0);
  for(const [skill,n] of [['exploration',1],['foraging',3],['logging',5],['study',3]])s.people[0].skills[skill].completed=n;
  s.firepit=true;s.shelter.complete=true;assert.equal(eraState(s).percent,100);s.resources.knowledge=0;s.resources.wood=0;assert.equal(eraState(s).percent,100);
});
