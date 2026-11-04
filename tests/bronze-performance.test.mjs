import {test} from 'node:test';import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';import {createWorld} from '../src/core.js';
import {RECIPES} from '../src/items.js';import {eraState} from '../src/era.js';
import {RasterCache,spriteBudget} from '../src/raster-cache.js';import {terrainDensity} from '../src/terrain-layer.js';
const fresh=()=>new Simulation(createWorld(),{autonomy:false});
const run=(s,seconds)=>{for(let i=0;i<seconds*10;i++)s.update(.1);};
function ready(){
 const s=fresh();Object.assign(s.resources,{wood:300,stone:200,copperOre:30,tinOre:10,coal:10});s.firepit=true;
 s.shelter.reserved=s.shelter.complete=true;s.shelter.progress=1;
 const p=s.person('ana');p.skills.study.completed=6;p.skills.study.xp=96;p.completed=6;
 const t=s.world.tiles.find(t=>t.x>16&&t.x<26&&t.y>12&&t.y<23&&s.farmPreview(t.x,t.y).ok);const plot=s.createPlot(t.x,t.y).plot;plot.harvests=1;plot.stage='prepared';return s;
}
function build(s,kind){
 const t=s.world.tiles.filter(t=>t.x>10&&t.x<32&&t.y>5&&t.y<24).find(t=>s.previewBuilding(kind,t.x,t.y).ok);assert.ok(t,'reachable building site for '+kind);
 const b=s.placeBuilding(kind,t.x,t.y).building;assert.ok(s.assignBuilders(b.id)>0);for(let i=0;i<1500&&!b.complete;i++)s.update(.1);assert.ok(b.complete);return b;
}
function craft(s,kind){assert.ok(s.assign('ana',kind).ok);for(let i=0;i<1500&&s.person('ana').job;i++)s.update(.1);assert.equal(s.person('ana').job,null);}
test('bronze chain gates buildings, consumes real alloy and fuel, unlocks a workshop and improves communal tools',()=>{
 const s=ready();assert.ok(fresh().buildingReason('furnace'));assert.ok(s.blockReason('smeltBronze'));assert.ok(s.buildingReason('workshop'));
 const furnace=build(s,'furnace');assert.equal(s.capacity(),3);assert.equal(s.walkable(s.world.get(furnace.x,furnace.y)),false);
 assert.equal(eraState(s).name,'Vida sedentaria');craft(s,'smeltBronze');assert.equal(s.resources.bronze,2);assert.equal(s.resources.copperOre,27);assert.equal(s.resources.tinOre,9);assert.equal(s.resources.coal,9);assert.equal(eraState(s).name,'Edad del Bronce');
 const workshop=build(s,'workshop');assert.equal(s.resources.bronze,0);assert.equal(s.capacity(),3);craft(s,'smeltBronze');craft(s,'smeltBronze');craft(s,'smeltBronze');
 craft(s,'craftBronzeAxe');craft(s,'craftBronzePick');assert.equal(s.resources.bronze,1);assert.equal(s.speed(s.person('ana'),'logging'),1.4);assert.equal(s.speed(s.person('ana'),'mining'),1.35);
 assert.ok(s.blockReason('craftBronzeAxe'));assert.equal(s.person('ana').skills.metalworking.completed,6);assert.equal(eraState(s).percent,100);assert.equal(eraState(s).timeline.find(e=>e.id==='iron').status,'En desarrollo');
 const restored=Simulation.restore(createWorld(),s.snapshot());assert.deepEqual(restored.resources,s.resources);assert.ok(restored.project(workshop.id).complete);assert.equal(eraState(restored).name,'Edad del Bronce');
});
test('cancelling smelting costs nothing; competing workers cannot spend partial inputs or duplicate output',()=>{
 const s=ready();build(s,'furnace');Object.assign(s.resources,{copperOre:3,tinOre:1,coal:1});
 s.assign('ana','smeltBronze');run(s,1);s.stop('ana');assert.equal(s.resources.copperOre,3);assert.equal(s.resources.bronze,0);
 for(const p of s.people)assert.ok(s.assign(p.id,'smeltBronze').ok);run(s,90);assert.equal(s.resources.bronze,2);assert.equal(s.resources.copperOre,0);assert.equal(s.resources.tinOre,0);assert.equal(s.resources.coal,0);assert.equal(s.people.reduce((n,p)=>n+p.skills.metalworking.completed,0),1);
});
test('v6 migration preserves all progress and adds metalworking without unlocking an era',()=>{
 const s=fresh();s.resources.wood=23;const old=s.snapshot();old.version=6;for(const id of ['bronze','bronzeAxe','bronzePick'])delete old.resources[id];for(const p of old.people)delete p.skills.metalworking;
 const restored=Simulation.restore(createWorld(),old);assert.equal(restored.resources.wood,23);assert.equal(restored.resources.bronze,0);assert.equal(restored.person('ana').skills.metalworking.xp,0);assert.equal(eraState(restored).current,0);
 const invalid=restored.snapshot();invalid.resources.bronzePick=2;assert.throws(()=>Simulation.restore(createWorld(),invalid));
});
test('current-view sprite working sets stay cached at maximum zoom and DPR; ground density is rotation independent',()=>{
 for(const dpr of [1,2,3,4]){const density=Math.ceil(1.8*dpr),cache=new RasterCache(spriteBudget(160,190,density,6,6000000));for(let i=0;i<6;i++)cache.set(i,{width:160*density,height:190*density});for(let repeat=0;repeat<4;repeat++)for(let i=0;i<6;i++)assert.ok(cache.get(i));assert.equal(cache.size,6);assert.ok(terrainDensity(1.8,dpr)>=1.8*dpr);}
 assert.ok(RECIPES.smeltBronze.repeatable);
});
