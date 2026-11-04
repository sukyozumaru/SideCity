import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeFoley,SOUND_KINDS} from '../src/foley.js';
import {defaultAudio,validateAudio,volumeGain,AudioDirector,soundFor,spatialSound} from '../src/audio-director.js';
import {RasterCache,rasterDensity,matrixStretch} from '../src/raster-cache.js';
import {Camera,createWorld} from '../src/core.js';import {groundMatrix} from '../src/projection.js';import {Simulation,TASKS} from '../src/simulation.js';

test('raster density never enlarges sprites at any supported zoom or display density; cache is bounded by pixels',()=>{
 for(const dpr of[.8,1,1.25,2,3,4])for(const zoom of[.025,.46,.72,.9,1.125,1.8])assert.ok(rasterDensity(zoom,dpr)>=zoom*dpr);
 const cache=new RasterCache(100);cache.set('a',{width:5,height:10});cache.set('b',{width:5,height:10});cache.get('a');cache.set('c',{width:5,height:10});assert.equal(cache.has('b'),false);assert.equal(cache.has('a'),true);assert.equal(cache.pixels,100);cache.set('large',{width:20,height:20});assert.equal(cache.has('large'),false);cache.clear();assert.equal(cache.pixels,0);
 for(let view=0;view<8;view+=.125){const m=groundMatrix(view),stretch=matrixStretch(m);for(let angle=0;angle<Math.PI*2;angle+=.12){const x=Math.cos(angle),y=Math.sin(angle);assert.ok(Math.hypot(m.a*x+m.c*y,m.b*x+m.d*y)<=stretch+1e-8);}}
});
test('every foley buffer is finite, bounded, audible and deterministic, with smooth edges and distinct takes',()=>{
 for(const kind of SOUND_KINDS){const a=makeFoley(kind,0),b=makeFoley(kind,1);let peak=0,energy=0;for(const value of a.data){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));energy+=value*value;}assert.ok(peak>.1&&peak<=.721);assert.ok(energy/a.data.length>.00001);assert.ok(a.data[0]===0);assert.ok(Math.abs(a.data.at(-1))<.01);assert.notDeepEqual(a.data.slice(0,1000),b.data.slice(0,1000));assert.deepEqual(a.data.slice(0,1000),makeFoley(kind,0).data.slice(0,1000));}
});
test('audio preferences reject corrupt data and volume is perceptual with true silence at zero',()=>{
 assert.deepEqual(validateAudio(null),defaultAudio());assert.equal(validateAudio({version:1,master:NaN,effects:3,ambience:-1}).master,.75);assert.equal(validateAudio({...defaultAudio(),muted:true}).muted,true);assert.equal(volumeGain(0),0);assert.equal(volumeGain(1),1);assert.ok(volumeGain(.2)<volumeGain(.8));
});
test('each working task selects its material; walking and blocked jobs never trigger work sounds',()=>{
 const s=new Simulation(createWorld()),p=s.person('ana');
 for(const[kind,sound]of Object.entries({logging:'chop',foraging:'berries',study:'study',building:'build',shelter:'build',bridge:'build',cooking:'cook',drink:'drink',sleep:'sleep',rest:'rest',eat:'eat',social:'social',craftAxe:'stone',craftPick:'stone'})){p.job={kind,path:[],source:{x:0,y:0}};p.state=TASKS[kind].action;assert.equal(soundFor(p,s).kind,sound);p.state='Faltan materiales';assert.equal(soundFor(p,s),null);p.job.path=[{x:1,y:1}];assert.ok(['grass','sand','woodStep'].includes(soundFor(p,s).kind));}
 for(const kind of['stone','copper']){const m=s.world.minerals.find(m=>m.kind===kind);assert.ok(m);p.job={kind:'mining',path:[],source:m};p.state=TASKS.mining.action;assert.equal(soundFor(p,s).kind,kind==='stone'?'stone':'mineral');}
 for(const kind of['sticks','pebbles']){const m=s.world.scatter.find(m=>m.kind===kind);assert.ok(m);p.job={kind:'scavenge',path:[],source:m};p.state=TASKS.scavenge.action;assert.equal(soundFor(p,s).kind,kind==='sticks'?'sticks':'pebbles');}
});
test('audio director requires real travel for steps, has no frame-rate retriggers and drops paused backlog',()=>{
 const s=new Simulation(createWorld()),p=s.person('ana'),c=new Camera(1200,800);c.home();const a=new AudioDirector();p.job={kind:'move',path:[{x:23,y:17}],source:null};p.state='Caminando';
 assert.equal(a.update(s,c,0).length,0);assert.equal(a.update(s,c,1).length,0);p.x+=.5;assert.equal(a.update(s,c,1.1).length,1);assert.equal(a.update(s,c,1.11).length,0);
 p.job={kind:'logging',path:[],source:{x:0,y:0}};p.state=TASKS.logging.action;a.update(s,c,2);assert.equal(a.update(s,c,3).length,1);assert.equal(a.update(s,c,3.01).length,0);assert.equal(a.update(s,c,20,false).length,0);assert.equal(a.update(s,c,30).length,0);p.job=null;assert.equal(a.update(s,c,31).length,0);
});
test('sound follows the rotated camera and distant sources are silent; audio never changes saved progress',()=>{
 const s=new Simulation(createWorld()),saved=JSON.stringify(s.snapshot()),c=new Camera(390,844);c.home();
 for(let view=0;view<8;view++){c.setView(view,{animate:false});const q=spatialSound(c,21,18);assert.ok(q.gain>0&&Math.abs(q.pan)<1);assert.equal(spatialSound(c,90,65).gain,0);new AudioDirector().update(s,c,0);}
 assert.equal(JSON.stringify(s.snapshot()),saved);
});

