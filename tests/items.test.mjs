import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {createWorld} from '../src/core.js';
import {ITEMS,stockGroups} from '../src/items.js';
import {readSaveFile,writeSaveFile} from '../src/save-transfer.js';
const fresh=()=>new Simulation(createWorld());
const advance=(s,n)=>{for(let i=0;i<n*10;i++)s.update(.1);};

test('stock separates every resource into exactly one named category',()=>{
 const s=fresh(),groups=stockGroups(s.resources),ids=groups.flatMap(g=>g.items.map(i=>i.id));
 assert.deepEqual(new Set(ids),new Set(Object.keys(s.resources)));assert.equal(ids.length,new Set(ids).size);
 assert.equal(ITEMS.rawFood.group,'food');assert.equal(ITEMS.stonePick.group,'tools');assert.equal(ITEMS.knowledge.group,'knowledge');
});
test('crafting refuses missing inputs, consumes once on completion and gives one communal tool',()=>{
 const s=fresh();assert.equal(s.assign('ana','craftAxe').ok,false);
 s.resources.wood=4;s.resources.stone=2;for(const p of s.people)assert.equal(s.assign(p.id,'craftAxe').ok,true);
 assert.equal(s.resources.wood,4);advance(s,35);
 assert.equal(s.resources.stoneAxe,1);assert.equal(s.resources.wood,2);assert.equal(s.resources.stone,1);
 assert.equal(s.people.reduce((n,p)=>n+p.skills.building.completed,0),1);assert.ok(s.speed(s.people[0],'logging')>=1.15);
 assert.equal(s.assign('ana','craftAxe').ok,false);
});
test('cancelled tool work and concurrent spending cannot consume partial inputs or give XP',()=>{
 const s=fresh();s.resources.wood=3;s.resources.stone=2;s.assign('ana','craftPick');advance(s,2);s.stop('ana');assert.equal(s.resources.stonePick,0);assert.equal(s.resources.stone,2);
 s.assign('ana','craftPick');s.resources.wood=0;advance(s,25);assert.equal(s.resources.stonePick,0);assert.equal(s.resources.stone,2);assert.equal(s.person('ana').skills.building.completed,0);
});
test('mining requires a tool and respects finite deposits with competing workers',()=>{
 const s=fresh(),node=s.world.minerals.find(n=>n.kind==='stone');assert.equal(s.assign('ana','mining',node).ok,false);
 s.resources.stonePick=1;s.unlocked=new Set(Array.from({length:48},(_,i)=>`${i%8},${Math.floor(i/8)}`));
 const places=[[node.x-1,node.y],[node.x+1,node.y],[node.x,node.y-1],[node.x,node.y+1]].filter(([x,y])=>s.walkable(s.world.get(x,y)));
 assert.ok(places.length);s.mined.set(`${node.x},${node.y}`,node.richness-3);
 for(const p of s.people){p.x=places[0][0]+.5;p.y=places[0][1]+.5;assert.equal(s.assign(p.id,'mining',node).ok,true);}
 advance(s,9);assert.equal(s.mineralRemaining(node),0);assert.equal(s.resources.stone,3);assert.ok(s.walkable(s.world.get(node.x,node.y)));
 const restored=Simulation.restore(s.world,s.snapshot());assert.equal(restored.mineralRemaining(node),0);assert.equal(restored.resources.stone,3);
});
test('a tool unlocks raw copper but cannot extract iron with an early pick',()=>{
 const s=fresh();s.resources.stonePick=1;s.unlocked=new Set(Array.from({length:48},(_,i)=>`${i%8},${Math.floor(i/8)}`));
 for(const kind of ['copper','iron']){const node=s.world.minerals.find(n=>n.kind===kind);const t=s.world.tiles.find(t=>Math.abs(t.x-node.x)+Math.abs(t.y-node.y)===1&&s.walkable(t));assert.ok(t);s.person('ana').x=t.x+.5;s.person('ana').y=t.y+.5;const r=s.assign('ana','mining',node);assert.equal(r.ok,kind==='copper');if(r.ok){advance(s,12);s.stop('ana');}}
 assert.equal(s.resources.copperOre,2);assert.equal(s.resources.coal,0);
});
test('eating consumes cooked food before berries and grants no professional XP',()=>{
 const s=fresh();s.resources.meals=1;s.resources.rawFood=1;const p=s.person('ana');p.needs.energy=30;
 s.assign('ana','eat');advance(s,6);assert.equal(s.resources.meals,0);assert.equal(s.resources.rawFood,1);assert.ok(p.needs.energy>54);assert.equal(p.completed,0);assert.equal(p.history[0].kind,'eat');
 s.assign('ana','eat');advance(s,6);assert.equal(s.resources.rawFood,0);assert.equal(s.assign('ana','eat').ok,false);
});
test('v3 migration keeps stock and professions and adds empty tools and mining',()=>{
 const s=fresh();s.resources.wood=29;s.resources.rawFood=7;const data=s.snapshot();data.version=3;delete data.mined;for(const id of ['coal','copperOre','tinOre','stoneAxe','stonePick'])delete data.resources[id];for(const p of data.people)delete p.skills.mining;
 const r=Simulation.restore(s.world,data);assert.equal(r.resources.wood,29);assert.equal(r.resources.rawFood,7);assert.equal(r.resources.stonePick,0);assert.equal(r.people[0].skills.mining.xp,0);
});
test('portable saves round trip work and reject overdrawn deposits, duplicates and malformed files',()=>{
 const s=fresh();s.resources.wood=9;s.resources.stone=3;s.assign('ana','craftPick');advance(s,3);
 const r=readSaveFile(writeSaveFile(s));assert.equal(r.person('ana').job.kind,'craftPick');assert.equal(r.resources.stone,3);
 advance(r,20);assert.equal(r.resources.stonePick,1);assert.equal(r.resources.stone,1);
 const invalid=s.snapshot(),node=s.world.minerals.find(n=>n.kind==='stone');invalid.mined=[[`${node.x},${node.y}`,node.richness+1]];assert.throws(()=>readSaveFile(JSON.stringify(invalid)));
 invalid.mined=[[`${node.x},${node.y}`,1],[`${node.x},${node.y}`,1]];assert.throws(()=>readSaveFile(JSON.stringify(invalid)));
 assert.throws(()=>readSaveFile('{'));assert.throws(()=>readSaveFile(' '.repeat(2_000_001)));
});
