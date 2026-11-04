import {test} from 'node:test';import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';import {createWorld} from '../src/core.js';
import {FARM_GROWTH_SECONDS} from '../src/farming.js';import {languageStage} from '../src/dialogue-data.js';
import {saveSimulation} from '../src/persistence.js';
import {soundFor} from '../src/audio-director.js';
import {defaultControls,validateControls} from '../src/input-actions.js';
const fresh=()=>new Simulation(createWorld(),{autonomy:false});
const advance=(s,seconds)=>{for(let i=0;i<Math.round(seconds*10);i++)s.update(.1);};
const location=s=>s.world.tiles.filter(t=>t.x>12&&t.x<29&&t.y>9&&t.y<23).sort((a,b)=>Math.hypot(a.x-20,a.y-17)-Math.hypot(b.x-20,b.y-17)).find(t=>s.farmPreview(t.x,t.y).ok);
const plot=s=>{const t=location(s);assert.ok(t);const r=s.createPlot(t.x,t.y);assert.ok(r.ok);return r.plot;};
const finish=(s,kind,p,who='ana')=>{const r=s.assign(who,kind,p?{plotId:p.id}:undefined);assert.ok(r.ok,r.reason);for(let i=0;i<800&&s.person(who).job;i++)s.update(.1);assert.equal(s.person(who).job,null);};

test('a field completes prepare, sow, fetch water, growth and harvest with exact food, seed and XP accounting',()=>{
 const s=fresh(),p=plot(s);assert.equal(s.assign('ana','sow',{plotId:p.id}).ok,false);finish(s,'preparePlot',p);assert.equal(p.stage,'prepared');finish(s,'sow',p);assert.equal(s.resources.seeds,5);assert.equal(p.stage,'growing');advance(s,30);assert.equal(p.growth,0);
 finish(s,'waterPlot',p);assert.equal(p.moisture,100);advance(s,FARM_GROWTH_SECONDS+1);assert.equal(p.growth,1);finish(s,'harvest',p);assert.equal(s.resources.vegetables,4);assert.equal(s.resources.seeds,7);assert.equal(p.harvests,1);assert.equal(s.person('ana').skills.farming.completed,4);assert.equal(s.person('ana').skills.farming.xp,48);assert.equal(s.assign('ana','harvest',{plotId:p.id}).ok,false);
});
test('cancelled sowing costs no seed or XP; a plot only accepts one farmer and blocked sites do not mutate the world',()=>{
 const s=fresh(),p=plot(s),before=s.plots.length;for(const[x,y]of[[p.x,p.y],[20,17],[95,70]])assert.equal(s.createPlot(x,y).ok,false);assert.equal(s.plots.length,before);finish(s,'preparePlot',p);s.assign('ana','sow',{plotId:p.id});assert.equal(s.assign('ivo','sow',{plotId:p.id}).ok,false);advance(s,1);s.stop('ana',{manual:true});assert.equal(s.resources.seeds,6);assert.equal(s.person('ana').skills.farming.completed,1);assert.equal(s.previewBuilding('shelter',p.x,p.y).ok,false);
});
test('watering persists while carrying water back and never awards two jobs for fetching and pouring',()=>{
 let s=fresh(),p=plot(s);finish(s,'preparePlot',p);finish(s,'sow',p);s.assign('ana','waterPlot',{plotId:p.id});let carried=false;
 for(let i=0;i<600;i++){s.update(.1);if(s.person('ana').job?.source?.fetch===false){carried=true;break;}}assert.ok(carried);assert.equal(p.moisture,0);s=Simulation.restore(createWorld(),s.snapshot());assert.equal(s.person('ana').job.source.fetch,false);advance(s,40);assert.ok(s.plot(p.id).moisture>75);assert.equal(s.person('ana').skills.farming.completed,3);
});
test('dry plants pause, seed recovery is repeatable, and roots can be cooked or eaten without phantom food',()=>{
 const s=fresh(),p=plot(s);finish(s,'preparePlot',p);finish(s,'sow',p);p.moisture=.35;advance(s,20);assert.ok(Math.abs(p.growth-1/FARM_GROWTH_SECONDS)<1e-8);const g=p.growth;advance(s,10);assert.equal(p.growth,g);
 s.resources.rawFood=2;finish(s,'extractSeeds');assert.equal(s.resources.rawFood,0);assert.equal(s.resources.seeds,7);assert.equal(s.assign('ana','extractSeeds').ok,false);
 s.resources.vegetables=2;s.firepit=true;s.resources.wood=1;s.assign('ana','cooking');advance(s,20);s.stop('ana');assert.equal(s.resources.vegetables,1);assert.equal(s.resources.meals,1);s.resources.meals=0;finish(s,'eat');assert.equal(s.resources.vegetables,0);
});
test('v5 migration keeps old progress and adds farming/life; malformed plots, groups and social logs are rejected',()=>{
 const s=fresh();s.resources.wood=17;s.assign('ana','study');advance(s,9);const old=s.snapshot();old.version=5;delete old.resources.seeds;delete old.resources.vegetables;for(const p of old.people)delete p.skills.farming;
 const restored=Simulation.restore(createWorld(),old);assert.equal(restored.resources.wood,17);assert.equal(restored.person('ana').skills.study.xp,s.person('ana').skills.study.xp);assert.equal(restored.resources.seeds,6);assert.equal(restored.person('ana').autonomy,true);
 const p=plot(s),data=s.snapshot();data.plots.push({...data.plots[0],id:'plot-2'});data.nextPlot=3;assert.throws(()=>Simulation.restore(createWorld(),data));const bad=s.snapshot();bad.plots[0].growth=1.01;assert.throws(()=>Simulation.restore(createWorld(),bad));const social=s.snapshot();social.culture.log=[{time:0,speaker:'ana',other:'ivo',topic:'plans',line:'unknown',reply:'calm'}];assert.throws(()=>Simulation.restore(createWorld(),social));assert.ok(p);
});
test('autonomous people wander on reachable land, meet and keep manual orders until urgent care is needed',()=>{
 const s=new Simulation(createWorld()),a=s.person('ana'),start=s.people.map(p=>({x:p.x,y:p.y}));advance(s,30);assert.ok(s.people.some((p,i)=>Math.hypot(p.x-start[i].x,p.y-start[i].y)>.1));for(const p of s.people)assert.ok(s.walkable(s.world.get(Math.floor(p.x),Math.floor(p.y))));
 s.assign('ana','study');advance(s,45);assert.equal(a.job.kind,'study');assert.equal(a.job.automatic,false);a.needs.water=5;advance(s,.1);assert.equal(a.job.kind,'drink');assert.equal(a.resumeOrder.kind,'study');advance(s,40);assert.equal(a.job.kind,'study');assert.ok(a.needs.water>50);
});
test('turning off free initiative and manually stopping cannot be undone by an idle decision',()=>{
 const s=new Simulation(createWorld()),p=s.person('ana');s.setAutonomy('ana',false);const x=p.x,y=p.y;advance(s,45);assert.equal(p.job,null);assert.equal(p.x,x);assert.equal(p.y,y);s.setAutonomy('ana',true);s.assign('ana','wander',undefined,{automatic:true});s.stop('ana',{manual:true});advance(s,30);assert.equal(p.job,null);
});
test('conversation topics branch from feelings, develop language, affect both people and persist circles',()=>{
 const s=fresh();for(let i=0;i<3;i++)finishConversation(s,'greeting');assert.equal(s.culture.exchanges,3);assert.equal(languageStage(3),'Primeras palabras');s.person('ivo').needs.water=30;finishConversation(s,'feelings');assert.equal(s.culture.log[0].line,'thirsty');assert.ok(s.person('ana').mood>65);assert.ok(s.person('ivo').company>65);assert.equal(s.formCircle('Brotes del río',['ana','ivo'],'cultivo').ok,true);const r=Simulation.restore(createWorld(),s.snapshot());assert.equal(r.circles[0].name,'Brotes del río');assert.equal(r.culture.exchanges,4);assert.equal(r.culture.log[0].topic,'feelings');
});
function finishConversation(s,topic){const r=s.assign('ana','social',{personId:'ivo',topic});assert.ok(r.ok,r.reason);for(let i=0;i<600&&s.person('ana').job;i++)s.update(.1);assert.equal(s.person('ana').job,null);}
test('a cultivation circle cares for a field in free time while manual work still takes priority',()=>{
 const s=fresh(),p=plot(s);for(let i=0;i<3;i++)finishConversation(s,'plans');s.formCircle('Huerto',['ana','ivo'],'cultivo');s.setAutonomy('ana',true);s.setAutonomy('ivo',true);advance(s,300);assert.ok(p.harvests>=1);assert.ok(s.resources.vegetables>=4);s.assign('ana','study');advance(s,30);assert.equal(s.person('ana').job.kind,'study');
});
test('farm audio follows digging, seeds, water collection, pouring and harvest phases',()=>{
 const s=fresh(),p=plot(s),a=s.person('ana');for(const[kind,sound]of Object.entries({preparePlot:'dig',sow:'seeds',waterPlot:'pour',harvest:'harvest',extractSeeds:'seeds'})){a.job={kind,path:[],source:{plotId:p.id,fetch:false}};a.state=({preparePlot:'Preparar tierra',sow:'Sembrar',waterPlot:'Regar',harvest:'Cosechar',extractSeeds:'Separar semillas'})[kind];assert.equal(soundFor(a,s).kind,sound);}a.job={kind:'waterPlot',path:[],source:{fetch:true}};a.state='Regar';assert.equal(soundFor(a,s).kind,'drink');
});
test('a saved urgent-care interruption resumes the manual order and partial progress after reload',()=>{
 const s=new Simulation(createWorld());s.assign('ana','study');advance(s,3);s.person('ana').needs.water=5;s.update(.1);assert.equal(s.person('ana').resumeOrder.kind,'study');const r=Simulation.restore(createWorld(),s.snapshot());assert.equal(r.person('ana').job.kind,'drink');assert.ok(r.person('ana').resumeOrder.progress>0);advance(r,40);assert.equal(r.person('ana').job.kind,'study');assert.equal(r.person('ana').job.automatic,false);
});
test('adding Cultivar preserves existing custom controls and chooses a free key when V is already used',()=>{
 const controls=defaultControls();delete controls.bindings.farm;controls.bindings.rotateRight='KeyV';const migrated=validateControls(controls);assert.equal(migrated.bindings.rotateRight,'KeyV');assert.notEqual(migrated.bindings.farm,'KeyV');assert.equal(new Set(Object.values(migrated.bindings)).size,Object.keys(migrated.bindings).length);
});
