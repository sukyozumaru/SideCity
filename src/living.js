import {TOPICS,LINES,conversationLines} from './dialogue-data.js';
import {nextFarmTask} from './farming.js';
const clamp=n=>Math.max(0,Math.min(100,n));
export const moodName=p=>p.needs.water<25?'Sediento':p.needs.energy<25?'Cansado':p.company<25?'Busca compañía':p.mood>=72?'Contento':p.mood>=48?'Tranquilo':'Inquieto';
export const livingMethods={
 canTalkTo(p){return p&&(!p.job||p.job.kind==='rest'||p.job.automatic&&p.job.kind==='wander');},
 remember(p,kind,text,delta=0){p.mood=clamp(p.mood+delta);p.memories.unshift({time:Math.floor(this.time),kind,text});p.memories=p.memories.slice(0,6);this.revision++;},
 setAutonomy(id,value){const p=this.person(id);if(!p||typeof value!=='boolean')return;p.autonomy=value;p.resumeOrder=null;if(!value&&p.job?.automatic)this.stop(id);p.autoAt=this.time+5;this.revision++;},
 finishConversation(person,other,topic='greeting'){
  const [line,reply]=conversationLines(this,person,other,topic),bond=person.job?.automatic?6:12;
  this.addBond(person.id,other.id,bond);this.culture.exchanges++;this.culture.log.unshift({time:Math.floor(this.time),speaker:person.id,other:other.id,topic,line,reply});this.culture.log=this.culture.log.slice(0,16);
  person.company=clamp(person.company+25);other.company=clamp(other.company+20);this.remember(person,'social',`Un rato con ${other.name}.`,4);this.remember(other,'social',`${person.name} se acercó a escuchar.`,4);
  person.speech={line,until:this.time+3.5};other.speech={line:reply,until:this.time+8,starts:this.time+3.5};other.autoAt=Math.max(other.autoAt,this.time+10);other.direction={x:person.x-other.x,y:person.y-other.y};
  return bond;
 },
 speechFor(p){return p.speech&&p.speech.until>this.time&&(!p.speech.starts||p.speech.starts<=this.time)?LINES[p.speech.line]:'';},
 groupReason(name,members,kind){if(this.culture.exchanges<3)return 'Completa tres conversaciones para acordar un círculo.';if(this.circles.length>=4)return 'Este valle admite cuatro círculos.';if(typeof name!=='string'||!name.trim()||name.trim().length>24)return 'Escribe un nombre de hasta 24 letras.';if(!['cultivo','encuentro'].includes(kind)||!Array.isArray(members)||members.length<2||new Set(members).size!==members.length||members.some(id=>!this.person(id)||kind==='cultivo'&&this.person(id).stage==='child'))return 'Elige al menos dos habitantes; el cultivo lo hacen adultos.';return '';},
 formCircle(name,members,kind){const reason=this.groupReason(name,members,kind);if(reason)return{ok:false,reason};this.circles.push({id:`circle-${this.nextCircle++}`,name:name.trim(),members:[...members],kind});this.emit(`Nuevo círculo: ${name.trim()}.`);return{ok:true};},
 dissolveCircle(id){const before=this.circles.length;this.circles=this.circles.filter(g=>g.id!==id);if(this.circles.length!==before){this.revision++;return true;}return false;},
 updateLiving(dt){
  for(const p of this.people){
   p.company=clamp(p.company-dt*.025);const target=43+p.needs.water*.12+p.needs.energy*.13+p.company*.12;p.mood=clamp(p.mood+(target-p.mood)*(1-Math.exp(-dt*.008)));
   if(!p.autonomy)continue;
   if(this.time>=(p.careRetryAt||0)&&p.job&&!p.job.automatic&&p.stage==='adult'&&(!p.resumeOrder)&&!['drink','sleep','rest','eat','social','waterPlot'].includes(p.job.kind)&&(p.needs.water<12||p.needs.energy<10)){
    const order={kind:p.job.kind,target:structuredClone(p.job.source||p.job.target),progress:p.job.progress};const kind=p.needs.water<12?'drink':this.homes().length?'sleep':'rest';p.careRetryAt=this.time+8;const result=this.assign(p.id,kind,undefined,{automatic:true});if(result.ok){p.resumeOrder=order;this.remember(p,'care','Hizo una pausa para cuidarse.',1);}continue;
   }
   if(p.job||this.time<p.autoAt||this.people.some(other=>other.job?.kind==='social'&&other.job.source?.personId===p.id))continue;
   p.autoAt=this.time+10+(p.id.charCodeAt(0)%6);
   if(p.resumeOrder){const order=p.resumeOrder;p.resumeOrder=null;const r=this.assign(p.id,order.kind,order.target);if(r.ok)p.job.progress=order.progress;continue;}
   const care=p.needs.water<45?'drink':p.needs.energy<35?(this.homes().length?'sleep':'rest'):null;
   if(care&&this.assign(p.id,care,undefined,{automatic:true}).ok)continue;
   if(p.stage==='adult'&&this.circles.some(g=>g.kind==='cultivo'&&g.members.includes(p.id))){
    const plots=[...this.plots].sort((a,b)=>Number(b.growth>=1)-Number(a.growth>=1)||a.moisture-b.moisture);
    let assigned=false;for(const plot of plots){const task=nextFarmTask(plot);if(task==='waterPlot'&&plot.moisture>25)continue;if(this.assign(p.id,task,{plotId:plot.id},{automatic:true}).ok){assigned=true;break;}}if(assigned)continue;
   }
   const partners=this.people.filter(q=>q!==p&&this.canTalkTo(q)&&!this.people.some(a=>a.job?.kind==='social'&&a.job.source?.personId===q.id)&&Math.hypot(q.x-p.x,q.y-p.y)<8).sort((a,b)=>Number(this.circles.some(g=>g.members.includes(p.id)&&g.members.includes(b.id)))-Number(this.circles.some(g=>g.members.includes(p.id)&&g.members.includes(a.id))));
   if(partners.length&&(p.company<60||Math.floor(this.time/15+p.id.length)%3===0)){
    const other=partners[0];if(this.assign(p.id,'social',{personId:other.id,topic:p.company<35?'feelings':this.plots.length?'plans':'greeting'},{automatic:true}).ok)continue;
   }
   if(this.assign(p.id,'wander',undefined,{automatic:true}).ok)continue;
  }
 },
};
export {TOPICS,LINES};
