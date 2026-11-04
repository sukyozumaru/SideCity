import {TASKS} from './simulation.js';
export const AUDIO_KEY='sidecity-audio-v1';
export const defaultAudio=()=>({version:1,muted:false,master:.75,effects:.8,ambience:.55});
export function validateAudio(data){const s=defaultAudio();if(data?.version!==1)return s;for(const key of['master','effects','ambience'])if(Number.isFinite(data[key])&&data[key]>=0&&data[key]<=1)s[key]=data[key];if(typeof data.muted==='boolean')s.muted=data.muted;return s;}
export const volumeGain=value=>value<=0?0:10**((-24+24*value)/20);
export function soundFor(person,sim){
 const job=person.job;if(!job)return null;
 if(job.path.length)return{kind:sim.hasBridge(Math.floor(person.x),Math.floor(person.y))?'woodStep':sim.world.get(Math.floor(person.x),Math.floor(person.y))?.type==='bank'?'sand':'grass',interval:.3,moving:true};
 if(person.state!==TASKS[job.kind]?.action)return null;
 const kinds={logging:['chop',.55],mining:[sim.world.mineralAt(job.source?.x,job.source?.y)?.kind==='stone'?'stone':'mineral',.7],foraging:['berries',1.1],scavenge:[sim.world.scatter.find(s=>s.x===job.source?.x&&s.y===job.source?.y)?.kind==='sticks'?'sticks':'pebbles',1.2],building:['build',.7],shelter:['build',.7],bridge:['build',.7],craftAxe:['stone',.85],craftPick:['stone',.85],cooking:['cook',1.1],drink:['drink',1.2],eat:['eat',.85],study:['study',1.4],sleep:['sleep',3.5],rest:['rest',6],social:['social',2.5]};
 const value=kinds[job.kind];return value?{kind:value[0],interval:value[1],moving:false}:null;
}
export function spatialSound(camera,x,y){
 const p=camera.gridToScreen(x,y),outside=p.x< -100||p.x>camera.width+100||p.y< -100||p.y>camera.height+100;
 const distance=Math.hypot((p.x-camera.width/2)/(camera.width*.75),(p.y-camera.height/2)/(camera.height*.75));
 return {pan:Math.max(-.85,Math.min(.85,(p.x-camera.width/2)/(camera.width/2))),gain:outside?0:Math.max(0,1-distance*.6)*Math.min(1,camera.zoom/.65)};
}
export class AudioDirector{
 constructor(){this.people=new Map();}
 reset(){this.people.clear();}
 update(sim,camera,now,active=true){
  if(!active){this.reset();return[];}const events=[];
  for(const p of sim.people){
   const sound=soundFor(p,sim),token=sound?.kind+'|'+(p.job?.kind||'');let prev=this.people.get(p.id);
   if(!prev||prev.token!==token){prev={token,x:p.x,y:p.y,distance:0,next:now+.12+(p.id.length%3)*.07};this.people.set(p.id,prev);}
   const distance=Math.hypot(p.x-prev.x,p.y-prev.y);prev.x=p.x;prev.y=p.y;
   if(!sound)continue;prev.distance+=distance<2?distance:0;
   if(now>=prev.next&&(!sound.moving||prev.distance>=.42)){
    const spatial=spatialSound(camera,p.x,p.y);if(spatial.gain>.01)events.push({...sound,...spatial,personId:p.id});
    prev.next=now+sound.interval;prev.distance=0;
   }
  }
  for(const id of this.people.keys())if(!sim.person(id))this.people.delete(id);
  return events;
 }
}
