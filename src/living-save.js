import {LINES,TOPICS} from './living.js';
export function migrateLiving(data){
 const d=structuredClone(data);d.version=6;d.resources.seeds=6;d.resources.vegetables=0;d.plots=[];d.nextPlot=1;d.culture={exchanges:0,log:[]};d.circles=[];d.nextCircle=1;
 for(const p of d.people){p.skills.farming={xp:0,completed:0,seconds:0};Object.assign(p,{autonomy:true,mood:65,company:65,autoAt:d.time+15,memories:[],resumeOrder:null});if(p.order){p.order.automatic=false;if(p.order.kind==='social')p.order.target.topic='greeting';}}
 return d;
}
export function restoreLiving(sim,data,valid,number,knownTask){
 valid(Array.isArray(data.plots)&&data.plots.length<=24&&new Set(data.plots.map(p=>p.id)).size===data.plots.length&&new Set(data.plots.map(p=>`${p.x},${p.y}`)).size===data.plots.length&&number(data.nextPlot,1e7,true)&&data.nextPlot>=1);
 sim.plots=[];sim.nextPlot=data.nextPlot;
 for(const p of data.plots){
  valid(/^plot-\d+$/.test(p.id)&&Number(p.id.slice(5))<data.nextPlot&&number(p.x,sim.world.width-1,true)&&number(p.y,sim.world.height-1,true)&&['wild','prepared','growing'].includes(p.stage)&&number(p.growth,1)&&number(p.moisture,100)&&number(p.harvests,1e7,true)&&(p.stage==='growing'||p.growth===0&&p.moisture===0));
  valid(sim.walkable(sim.world.get(p.x,p.y))&&!sim.occupiedByBuilding(p.x,p.y)&&!(p.x===21&&p.y===16)&&!(p.x===22&&p.y===16)&&!sim.hasBridge(p.x,p.y)&&!sim.world.scatter.some(s=>s.x===p.x&&s.y===p.y&&!sim.scavenged.has(`${s.x},${s.y}`)));sim.plots.push(structuredClone(p));
 }
 valid(data.culture&&number(data.culture.exchanges,1e7,true)&&Array.isArray(data.culture.log)&&data.culture.log.length<=16);
 for(const l of data.culture.log)valid(number(l.time,data.time,true)&&sim.person(l.speaker)&&sim.person(l.other)&&l.speaker!==l.other&&Object.hasOwn(TOPICS,l.topic)&&Object.hasOwn(LINES,l.line)&&Object.hasOwn(LINES,l.reply));sim.culture=structuredClone(data.culture);
 valid(number(data.nextCircle,1e7,true)&&data.nextCircle>=1&&Array.isArray(data.circles)&&data.circles.length<=4&&new Set(data.circles.map(g=>g.id)).size===data.circles.length);sim.nextCircle=data.nextCircle;sim.circles=[];
 for(const g of data.circles){valid(/^circle-\d+$/.test(g.id)&&Number(g.id.slice(7))<data.nextCircle&&!sim.groupReason(g.name,g.members,g.kind));sim.circles.push(structuredClone(g));}
 for(const saved of data.people){
  valid(typeof saved.autonomy==='boolean'&&number(saved.mood,100)&&number(saved.company,100)&&number(saved.autoAt,data.time+1e6)&&Array.isArray(saved.memories)&&saved.memories.length<=6);
  for(const m of saved.memories)valid(number(m.time,data.time,true)&&typeof m.kind==='string'&&m.kind.length<24&&typeof m.text==='string'&&m.text.length<=100);
  valid(saved.resumeOrder===null||saved.resumeOrder&&knownTask(saved.resumeOrder.kind)&&number(saved.resumeOrder.progress,1)&&saved.resumeOrder.target&&Number.isInteger(saved.resumeOrder.target.x)&&Number.isInteger(saved.resumeOrder.target.y));
  Object.assign(sim.person(saved.id),{autonomy:saved.autonomy,mood:saved.mood,company:saved.company,autoAt:saved.autoAt,memories:structuredClone(saved.memories),resumeOrder:structuredClone(saved.resumeOrder)});
  if(saved.order)valid(typeof saved.order.automatic==='boolean');
 }
}
