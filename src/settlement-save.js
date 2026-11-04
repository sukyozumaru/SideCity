import { createShelter, insideShelter } from './camp.js';
import { buildingTiles, BUILD_TYPES } from './construction.js';
import { pairKey, POPULATION_LIMIT } from './community.js';
const founderData=[{id:'ana',name:'Ana',color:'#b87950',hair:'#4c3b2e'},{id:'ivo',name:'Ivo',color:'#628b9a',hair:'#70513b'},{id:'nara',name:'Nara',color:'#a28a50',hair:'#342f29'}];
export function migrateSettlement(data){
  const d=structuredClone(data);d.version=5;d.buildings=[{...createShelter(),...d.shelter,id:'home-1',kind:'shelter',cost:{wood:20},work:36}];d.shelter=d.buildings[0];d.nextBuilding=2;d.nextPerson=1;d.relationships=[];d.households=[];
  for(const p of d.people||[]){Object.assign(p,{...founderData.find(f=>f.id===p.id),stage:'adult',parents:[],bornAt:0});if(p.order&&['shelter','sleep'].includes(p.order.kind))p.order.target.buildingId='home-1';}
  return d;
}
export function restoreSettlement(sim,data,valid,number){
  valid(Array.isArray(data.people)&&data.people.length>=3&&data.people.length<=POPULATION_LIMIT&&new Set(data.people.map(p=>p.id)).size===data.people.length&&founderData.every(f=>data.people.some(p=>p.id===f.id)));
  const earlier=new Set();
  sim.people=data.people.map(p=>{
    valid(typeof p.id==='string'&&/^(ana|ivo|nara|child-\d+)$/.test(p.id)&&typeof p.name==='string'&&p.name.length>0&&p.name.length<=24&&/^#[0-9a-f]{6}$/i.test(p.color)&&/^#[0-9a-f]{6}$/i.test(p.hair));
    valid(['adult','child'].includes(p.stage)&&number(p.bornAt,data.time)&&Array.isArray(p.parents)&&[0,2].includes(p.parents.length)&&new Set(p.parents).size===p.parents.length&&p.parents.every(id=>earlier.has(id)));
    valid(p.id.startsWith('child-')?p.parents.length===2:p.parents.length===0&&p.stage==='adult');earlier.add(p.id);
    return sim.createPerson({id:p.id,name:p.name,color:p.color,hair:p.hair,x:p.x,y:p.y,stage:p.stage,parents:[...p.parents],bornAt:p.bornAt});
  });
  valid(number(data.nextBuilding,1e6,true)&&data.nextBuilding>=2&&number(data.nextPerson,1e6,true)&&data.nextPerson>=1&&sim.people.every(p=>!p.id.startsWith('child-')||Number(p.id.slice(6))<data.nextPerson));
  sim.nextBuilding=data.nextBuilding;sim.nextPerson=data.nextPerson;
  valid(Array.isArray(data.buildings)&&data.buildings.length>=1&&data.buildings.length<=33&&new Set(data.buildings.map(b=>b.id)).size===data.buildings.length);
  sim.buildings=structuredClone(data.buildings);sim.shelter=sim.buildings[0];valid(sim.shelter.id==='home-1'&&sim.shelter.kind==='shelter');
  for(const b of sim.buildings){
    valid(Object.hasOwn(BUILD_TYPES,b.kind)&&typeof b.id==='string'&&(b.id==='home-1'||/^site-\d+$/.test(b.id)&&Number(b.id.slice(5))<sim.nextBuilding)&&number(b.x,sim.world.width-1,true)&&number(b.y,sim.world.height-1,true));
    valid(typeof b.reserved==='boolean'&&typeof b.complete==='boolean'&&number(b.progress,1)&&(!b.complete||b.reserved&&b.progress===1)&&b.contributions&&Object.keys(b.contributions).every(id=>sim.person(id))&&Object.values(b.contributions).every(n=>number(n,b.work))&&Object.values(b.contributions).reduce((a,b)=>a+b,0)<=b.work+.001);
    valid(b.reserved||b.progress===0&&Object.values(b.contributions).every(n=>n===0));
    if(b.kind!=='bridge'){const type=BUILD_TYPES[b.kind];valid(b.width===2&&b.height===2&&b.work===type.work&&b.cost&&Object.keys(b.cost).length===Object.keys(type.cost).length&&Object.entries(type.cost).every(([id,n])=>b.cost[id]===n));}
    else{
      valid(b.reserved&&['x','y','-x','-y'].includes(b.axis)&&number(b.span,12,true)&&b.span>=1&&b.width===(b.axis.endsWith('x')?b.span+2:1)&&b.height===(b.axis.endsWith('y')?b.span+2:1)&&b.work===12+b.span*5&&b.cost?.wood===12+b.span*3&&b.cost?.stone===2&&Object.keys(b.cost).length===2);
      const reverse=b.axis.startsWith('-');valid(b.start?.x===b.x+(reverse?b.width-1:0)&&b.start?.y===b.y+(reverse?b.height-1:0)&&b.end?.x===b.x+(reverse?0:b.width-1)&&b.end?.y===b.y+(reverse?0:b.height-1));
    }
    for(const t of buildingTiles(b)){
      const tile=sim.world.get(t.x,t.y);valid(tile);
      if(b.reserved){const mineral=sim.world.mineralAt(t.x,t.y);valid(sim.isUnlocked(t.x,t.y)&&!sim.standing(t.x,t.y)&&(!mineral||!sim.mineralRemaining(mineral))&&!sim.shrubs.some(s=>s.x===t.x&&s.y===t.y));
        const endpoint=b.kind==='bridge'&&(t.x===b.start.x&&t.y===b.start.y||t.x===b.end.x&&t.y===b.end.y);valid(b.kind!=='bridge'||endpoint?tile.type!=='water':tile.type==='water');
        valid(!sim.buildings.some(other=>other!==b&&other.reserved&&insideShelter(other,t.x,t.y)));
      }
    }
  }
  valid(Array.isArray(data.relationships)&&data.relationships.length<=66&&new Set(data.relationships.map(r=>r?.[0])).size===data.relationships.length);
  sim.relationships=new Map();for(const entry of data.relationships){valid(Array.isArray(entry)&&entry.length===2&&typeof entry[0]==='string'&&number(entry[1],100));const [a,b]=entry[0].split('|');valid(a!==b&&sim.person(a)&&sim.person(b)&&pairKey(a,b)===entry[0]);sim.relationships.set(entry[0],entry[1]);}
  valid(Array.isArray(data.households)&&data.households.length<=6);const paired=new Set(),children=new Set();sim.households=[];
  for(const h of data.households){
    valid(Array.isArray(h.parents)&&h.parents.length===2&&h.parents[0]!==h.parents[1]&&h.id===pairKey(...h.parents)&&h.parents.every(id=>sim.person(id)?.stage==='adult'&&!paired.has(id))&&!sim.relatives(...h.parents.map(id=>sim.person(id))));
    h.parents.forEach(id=>paired.add(id));valid(h.plan===null||h.plan&&number(h.plan.progress,1));
    valid(Array.isArray(h.children)&&h.children.every(id=>sim.person(id)&&!children.has(id)&&pairKey(...sim.person(id).parents)===h.id));h.children.forEach(id=>children.add(id));sim.households.push(structuredClone(h));
  }
  valid(sim.people.filter(p=>p.parents.length).every(p=>children.has(p.id)));
}
