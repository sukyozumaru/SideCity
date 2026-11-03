import{test}from'node:test';import assert from'node:assert/strict';import{Simulation}from'../src/simulation.js';import{createWorld}from'../src/core.js';import{CHILD_SECONDS,BIRTH_SECONDS}from'../src/community.js';
const fresh=()=>{const s=new Simulation(createWorld());s.resources.wood=250;s.resources.stone=30;s.resources.meals=15;return s;};
const advance=(s,n)=>{for(let i=0;i<n*10;i++)s.update(.1);};
const homeSpot=s=>s.world.tiles.filter(t=>t.x>=14&&t.x<=28&&t.y>=9&&t.y<=21).sort((a,b)=>Math.hypot(a.x-20,a.y-15)-Math.hypot(b.x-20,b.y-15)).find(t=>s.previewBuilding('shelter',t.x,t.y).ok);
const buildHome=s=>{const t=homeSpot(s);assert.ok(t);const r=s.placeBuilding('shelter',t.x,t.y);assert.ok(r.ok);s.assignBuilders(r.building.id);advance(s,80);assert.equal(r.building.complete,true);return r.building;};
test('free placement rejects water, people, locked sectors and blocked entrances without charging',()=>{
 const s=fresh(),before=s.resources.wood;for(const [x,y]of [[20,17],[48,4],[20,27],[17,17]])assert.equal(s.placeBuilding('shelter',x,y).ok,false);assert.equal(s.resources.wood,before);assert.equal(s.buildings.length,1);
});
test('multiple freely placed homes charge once, keep separate work and survive reload',()=>{
 const s=fresh(),a=buildHome(s),b=buildHome(s);assert.notEqual(a.id,b.id);assert.equal(s.capacity(),6);assert.equal(s.resources.wood,210);const r=Simulation.restore(s.world,s.snapshot());assert.equal(r.homes().length,2);assert.equal(r.capacity(),6);assert.deepEqual(r.homes().map(b=>[b.x,b.y]),s.homes().map(b=>[b.x,b.y]));
});
test('unfinished bridge cannot be crossed; completion joins routes and persists a crossing colonist',()=>{
 const s=fresh(),t=s.world.tiles.find(t=>s.previewBuilding('bridge',t.x,t.y,'y').ok);assert.ok(t);const r=s.placeBuilding('bridge',t.x,t.y,'y');assert.equal(r.ok,true);const b=r.building;
 assert.equal(s.hasBridge(b.x,b.y+1),false);assert.equal(s.route(s.person('ana'),b.end),null);s.assignBuilders(b.id);advance(s,100);assert.equal(b.complete,true);
 const path=s.route(s.person('ana'),b.end);assert.ok(path);assert.ok(path.some(t=>s.world.get(Math.floor(t.x),Math.floor(t.y)).type==='water'));
 s.assign('ana','move',b.end);let onWater=false;for(let i=0;i<1000;i++){s.update(.1);const p=s.person('ana');if(s.world.get(Math.floor(p.x),Math.floor(p.y)).type==='water'){onWater=true;const restored=Simulation.restore(s.world,s.snapshot());assert.ok(restored.person('ana'));break;}}assert.ok(onWater);
});
test('cancelling either project refunds only its reserved resources exactly once',()=>{
 const s=fresh(),t=homeSpot(s),before={...s.resources},r=s.placeBuilding('shelter',t.x,t.y);s.assignBuilders(r.building.id);advance(s,1);assert.equal(s.cancelBuilding(r.building.id),true);assert.equal(s.cancelBuilding(r.building.id),false);assert.deepEqual(s.resources,before);assert.equal(s.people.reduce((n,p)=>n+p.completed,0),0);
 const tile=s.world.tiles.find(t=>s.previewBuilding('bridge',t.x,t.y,'y').ok),bridge=s.placeBuilding('bridge',tile.x,tile.y,'y').building;assert.equal(s.cancelBuilding(bridge.id),true);assert.equal(s.cancelBuilding(bridge.id),false);assert.deepEqual(s.resources,before);
});
test('talk strengthens one relationship without professional XP and needs a present free partner',()=>{
 const s=fresh();assert.equal(s.formHousehold('ana','ivo').ok,false);
 for(let i=0;i<5;i++){assert.equal(s.assign('ana','social',{personId:'ivo'}).ok,true);advance(s,14);}
 assert.equal(s.relationship('ana','ivo'),60);assert.equal(s.people[0].completed,0);assert.equal(s.people[0].history[0].kind,'social');assert.equal(s.formHousehold('ana','ivo').ok,true);assert.equal(s.formHousehold('ana','nara').ok,false);
});
test('families require beds and food; birth, childhood and growing into work survive save/load',()=>{
 let s=fresh();s.addBond('ana','ivo',60);s.formHousehold('ana','ivo');const h=s.households[0];assert.equal(s.planChild(h.id).ok,false);buildHome(s);assert.equal(s.planChild(h.id).ok,false);buildHome(s);
 const before=s.resources.meals;assert.equal(s.planChild(h.id).ok,true);assert.equal(s.planChild(h.id).ok,false);assert.equal(s.resources.meals,before-4);advance(s,60);s=Simulation.restore(s.world,s.snapshot());advance(s,BIRTH_SECONDS);
 assert.equal(s.people.length,4);const child=s.people[3];assert.equal(child.stage,'child');assert.deepEqual(child.parents,['ana','ivo']);assert.equal(s.assign(child.id,'logging').ok,false);assert.equal(s.people.length,4);assert.equal(s.households[0].plan,null);
 s=Simulation.restore(s.world,s.snapshot());advance(s,CHILD_SECONDS);assert.equal(s.person(child.id).stage,'adult');assert.equal(s.relatives(s.person('ana'),s.person(child.id)),true);assert.equal(s.formHousehold('ana',child.id).ok,false);assert.equal(s.assign(child.id,'study').ok,true);
});
test('family cancellation refunds its food once and low needs pause progress',()=>{
 const s=fresh();buildHome(s);buildHome(s);s.addBond('ana','ivo',60);s.formHousehold('ana','ivo');const h=s.households[0];s.planChild(h.id);s.person('ana').needs.water=0;s.assign('ana','study');advance(s,10);assert.equal(h.plan.progress,0);const before=s.resources.meals;assert.equal(s.cancelChild(h.id),true);assert.equal(s.cancelChild(h.id),false);assert.equal(s.resources.meals,before+4);
});
test('v4 migration preserves a completed founder home and old jobs; invalid overlaps and family references are rejected',()=>{
 const s=fresh();buildHome(s);let d=s.snapshot();d.version=4;for(const k of ['buildings','nextBuilding','relationships','households','nextPerson'])delete d[k];for(const p of d.people)for(const k of ['name','color','hair','stage','parents','bornAt'])delete p[k];const r=Simulation.restore(s.world,d);assert.equal(r.homes().length,1);assert.equal(r.people.length,3);
 d=s.snapshot();d.buildings.push({...structuredClone(d.buildings[0]),id:'site-2'});d.nextBuilding=3;assert.throws(()=>Simulation.restore(s.world,d));d=s.snapshot();d.households=[{id:'ana|ivo',parents:['ana','missing'],children:[],plan:null}];assert.throws(()=>Simulation.restore(s.world,d));
});

test('bridge direction can be reversed from the opposite bank and saves its geometry',()=>{
 const s=fresh(),t=s.world.tiles.find(t=>s.previewBuilding('bridge',t.x,t.y,'y').ok),d=s.previewBuilding('bridge',t.x,t.y,'y');
 // Walkability does not require a route, but reverse placement needs a worker on that bank.
 const p=s.person('ana');p.x=d.end.x+.5;p.y=d.end.y+.5;const reverse=s.placeBuilding('bridge',d.end.x,d.end.y,'-y');assert.equal(reverse.ok,true);assert.deepEqual(reverse.building.end,d.start);assert.deepEqual(reverse.building.start,d.end);assert.ok(Simulation.restore(s.world,s.snapshot()));
});
