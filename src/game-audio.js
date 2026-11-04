import {makeFoley} from './foley.js';
import {AUDIO_KEY,defaultAudio,validateAudio,volumeGain,AudioDirector,spatialSound} from './audio-director.js';
const LEVELS={dig:.28,seeds:.22,pour:.3,harvest:.26,grass:.21,sand:.20,woodStep:.24,chop:.38,stone:.3,mineral:.25,berries:.28,pebbles:.3,sticks:.3,cook:.29,build:.3,study:.18,drink:.25,eat:.22,rest:.16,sleep:.22,social:.10};
export class GameAudio{
 constructor(storage){this.storage=storage;try{this.settings=validateAudio(JSON.parse(storage.getItem(AUDIO_KEY)));}catch{this.settings=defaultAudio();}this.director=new AudioDirector();this.buffers=new Map();this.voices=new Set();this.variants=new Map();this.loops=new Map();this.context=null;this.error=false;this.active=false;this.lastEnvironment=-1;}
 get ready(){return this.context?.state==='running';}
 async unlock(){
  try{
   if(!this.context||this.context.state==='closed'){
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio){this.error=true;this.onChange?.();return false;}
    this.context=new Audio({latencyHint:'interactive'});const c=this.context;
    this.master=c.createGain();this.effects=c.createGain();this.ambience=c.createGain();this.limiter=c.createDynamicsCompressor();
    this.limiter.threshold.value=-12;this.limiter.knee.value=6;this.limiter.ratio.value=8;this.limiter.attack.value=.003;this.limiter.release.value=.2;
    this.effects.connect(this.master);this.ambience.connect(this.master);this.master.connect(this.limiter);this.limiter.connect(c.destination);this.applyVolumes();
    c.onstatechange=()=>this.onChange?.();
   }
   await this.context.resume();this.error=false;this.onChange?.();return this.ready;
  }catch{this.error=true;this.onChange?.();return false;}
 }
 set(key,value){if(!Object.hasOwn(this.settings,key)||key==='version')return;const next=validateAudio({...this.settings,[key]:value});this.settings=next;try{this.storage.setItem(AUDIO_KEY,JSON.stringify(next));}catch{/* Optional preferences cannot block the game. */}this.applyVolumes();if(next.muted)this.stopVoices();this.onChange?.();}
 applyVolumes(){if(!this.context)return;for(const[bus,key]of[[this.master,'master'],[this.effects,'effects'],[this.ambience,'ambience']])bus.gain.setTargetAtTime(key==='master'&&this.settings.muted?0:volumeGain(this.settings[key]),this.context.currentTime,.025);}
 buffer(kind,variant=0){const key=kind+':'+variant;if(this.buffers.has(key))return this.buffers.get(key);const clip=makeFoley(kind,variant),b=this.context.createBuffer(1,clip.data.length,clip.sampleRate);b.getChannelData(0).set(clip.data);this.buffers.set(key,b);return b;}
 play(kind,{gain=1,pan=0,delay=0}={}){
  if(!this.ready||this.settings.muted||this.settings.master===0||this.settings.effects===0||gain<=0||this.voices.size>=8)return false;
  const c=this.context,variant=((this.variants.get(kind)??-1)+1)%4;this.variants.set(kind,variant);
  const source=c.createBufferSource(),level=c.createGain(),panner=c.createStereoPanner();source.buffer=this.buffer(kind,variant);source.playbackRate.value=.98+Math.random()*.04;level.gain.value=(LEVELS[kind]||.2)*gain;panner.pan.value=pan;
  source.connect(level);level.connect(panner);panner.connect(this.effects);source.envelope=level;this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();level.disconnect();panner.disconnect();};source.start(c.currentTime+delay);return true;
 }
 loop(kind,gain,pan){
  let loop=this.loops.get(kind);if(!loop&&gain>.001){const c=this.context,source=c.createBufferSource(),level=c.createGain(),panner=c.createStereoPanner();source.buffer=this.buffer(kind);source.loop=true;level.gain.value=0;source.connect(level);level.connect(panner);panner.connect(this.ambience);source.start();loop={source,level,panner};this.loops.set(kind,loop);}
  if(loop){loop.level.gain.setTargetAtTime(gain,this.context.currentTime,.35);loop.panner.pan.setTargetAtTime(pan,this.context.currentTime,.35);}
 }
 update(sim,camera,{active=true}={}){
  if(!this.ready)return;const now=this.context.currentTime;
  if(!active||this.settings.muted){if(this.active){this.stopVoices();this.director.reset();}this.active=false;for(const loop of this.loops.values())loop.level.gain.setTargetAtTime(0,now,.06);return;}
  this.active=true;for(const sound of this.director.update(sim,camera,now))this.play(sound.kind,sound);
  if(now-this.lastEnvironment<.2)return;this.lastEnvironment=now;
  if(this.waterWorld!==sim.world){this.waterWorld=sim.world;this.water=sim.world.tiles.filter(t=>t.type==='water').filter((_,i)=>i%4===0);}
  const focus=camera.screenToGrid(camera.width/2,camera.height/2);let closest=null,distance=Infinity;
  for(const tile of this.water){const d=Math.hypot(tile.x+.5-focus.x,tile.y+.5-focus.y);if(d<distance){closest=tile;distance=d;}}
  const river=closest?spatialSound(camera,closest.x+.5,closest.y+.5):{gain:0,pan:0},fire=spatialSound(camera,21.5,16.5);
  this.loop('river',river.gain*.22*Math.max(0,1-distance/20),river.pan);this.loop('fire',sim.firepit?fire.gain*.2:0,fire.pan);
 }
 stopVoices(){for(const source of this.voices){try{source.envelope.gain.setTargetAtTime(0,this.context.currentTime,.008);source.stop(this.context.currentTime+.04);}catch{/* Already finished. */}}this.voices.clear();}
 async hide(){this.stopVoices();this.director.reset();this.active=false;for(const loop of this.loops.values()){loop.level.gain.cancelScheduledValues(this.context.currentTime);loop.level.gain.setValueAtTime(0,this.context.currentTime);}if(this.context?.state==='running')try{await this.context.suspend();}catch{/* An interruption is recoverable on the next gesture. */}}
 async resume(){if(this.context?.state==='suspended'&&!this.settings.muted)try{await this.context.resume();}catch{/* Retry from a real user gesture. */}}
 async preview(){if(this.settings.muted)return;if(await this.unlock()){this.play('grass');this.play('chop',{delay:.45});this.play('stone',{delay:1});this.play('drink',{delay:1.5});}}
 dispose(){this.stopVoices();for(const l of this.loops.values()){l.source.stop();l.source.disconnect();l.level.disconnect();l.panner.disconnect();}this.loops.clear();this.buffers.clear();this.context?.close().catch(()=>{});this.context=null;}
}
