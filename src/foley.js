// Original procedural foley: filtered noise, short material resonances and air/liquid envelopes.
// No remote samples, speech recordings or musical notification tones.
export const SOUND_KINDS=['grass','sand','woodStep','chop','stone','mineral','berries','pebbles','sticks','cook','build','study','drink','eat','rest','sleep','social','river','fire'];
export const LOOP_KINDS=new Set(['river','fire']);
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function makeFoley(kind,variant=0,sampleRate=24000){
  if(!SOUND_KINDS.includes(kind))throw new Error('Unknown sound');
  const loop=LOOP_KINDS.has(kind),duration=loop?8:kind==='sleep'?2.8:kind==='cook'?1.1:kind==='drink'?.72:kind==='social'?.6:.44;
  const data=new Float32Array(Math.ceil(duration*sampleRate)),rng=random(731+variant*1949+SOUND_KINDS.indexOf(kind)*3571),tune=.96+rng()*.08;
  let low=0,slow=0,air=0;const pops=Array.from({length:loop?35:7},()=>({time:rng()*duration,level:.2+rng()*.8,f:600+rng()*3400}));
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,n=rng()*2-1;low+=(n-low)*.16;slow+=(n-slow)*.018;air+=(n-air)*.48;
    const high=n-air,hit=Math.exp(-t*30),dry=Math.exp(-t*15),pulse=(f,d)=>Math.sin(2*Math.PI*f*t*tune)*Math.exp(-t*d);
    let v=0;
    switch(kind){
      case'grass':v=low*dry*.8+high*dry*(.5+.5*Math.sin(t*160))+pulse(105,38)*.25;break;
      case'sand':v=low*dry+high*Math.exp(-t*10)*.45;break;
      case'woodStep':v=low*hit*.5+pulse(145,28)*.36+pulse(340,42)*.13;break;
      case'chop':v=low*hit*.7+high*Math.exp(-t*20)*.5+pulse(195,30)*.45+pulse(510,45)*.15;break;
      case'build':v=high*hit*.35+pulse(260,35)*.5+pulse(620,42)*.17+low*dry*.35;break;
      case'stone':v=high*Math.exp(-t*80)*.7+pulse(1680,35)*.24+pulse(2930,45)*.15+low*hit*.5;break;
      case'mineral':v=high*Math.exp(-t*65)*.5+pulse(2310,23)*.21+pulse(3560,32)*.13+pulse(940,40)*.12;break;
      case'berries':v=(low*.8+high*.3)*Math.sin(Math.PI*Math.min(1,t/.3))**2*Math.exp(-t*9);break;
      case'sticks':v=high*Math.exp(-t*90)*.8+pulse(360,35)*.28+low*dry*.3;break;
      case'pebbles':for(const p of pops){const u=t-p.time*.55;if(u>=0)v+=(Math.sin(2*Math.PI*p.f*u)*.16+high*.4)*Math.exp(-u*95)*p.level;}break;
      case'cook':v=low*.18*(.4+.6*Math.sin(t*37)**2)*Math.sin(Math.PI*t/duration);for(const p of pops){const u=t-p.time;if(u>=0)v+=Math.sin(2*Math.PI*(410*u-360*u*u))*Math.exp(-u*55)*.16*p.level;}break;
      case'study':v=(low*.6+high*.35)*Math.sin(t*34)**2*Math.exp(-t*6);break;
      case'drink':v=(slow*.7+low*.2)*Math.sin(Math.PI*t/duration);for(const p of pops){const u=t-p.time;if(u>=0)v+=Math.sin(2*Math.PI*(250*u-220*u*u))*Math.exp(-u*40)*.14;}break;
      case'eat':v=(low*.65+high*.2)*Math.exp(-t*11)*(Math.sin(t*24)**2)+pulse(130,45)*.08;break;
      case'rest':v=low*Math.sin(Math.PI*t/duration)*Math.exp(-t*5);break;
      case'sleep':{const breath=Math.sin(Math.PI*t/duration)**2;v=(slow*.8+low*.16)*breath*(.65+.35*Math.sin(t*2.1));break;}
      case'social':v=slow*.6*Math.sin(Math.PI*t/duration)**2*(.45+.55*Math.sin(t*18)**2);break;
      case'river':v=slow*.8+low*.15*(.7+.3*Math.sin(t*1.3));for(const p of pops){const u=t-p.time;if(u>=0&&u<.13)v+=Math.sin(2*Math.PI*(p.f*.18*u-650*u*u))*Math.exp(-u*60)*.016*p.level;}break;
      case'fire':v=slow*.3+low*.11;for(const p of pops){const u=t-p.time;if(u>=0&&u<.09)v+=(high*.3+Math.sin(u*p.f)*.08)*Math.exp(-u*100)*p.level;}break;
    }
    // Smooth edges prevent clicks when voices finish or a seamless ambience wraps.
    data[i]=v*Math.min(1,t/.003,(duration-t)/.025);
  }
  let peak=0;for(const value of data)peak=Math.max(peak,Math.abs(value));const gain=(loop?.58:.72)/(peak||1);for(let i=0;i<data.length;i++)data[i]*=gain;
  return {data,sampleRate,duration,loop};
}
