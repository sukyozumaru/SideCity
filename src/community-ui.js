import { bondName, CHILD_SECONDS } from './community.js';
import {TOPICS} from './living.js';
const $=id=>document.getElementById(id);
export class CommunityUI{
  constructor(sim,people,onChange){this.sim=sim;this.people=people;this.onChange=onChange;this.stamp='';this.population=0;
    $('community-open').onclick=()=>this.open();$('close-community').onclick=()=>this.close();
    document.addEventListener('sidecity:panel-open',e=>{if(e.detail!=='community')this.close();});
    $('community-person').onchange=()=>{this.stamp='';this.refresh();};this.refresh();
  }
  open(){document.dispatchEvent(new CustomEvent('sidecity:panel-open',{detail:'community'}));const selected=this.people.selected[0];this.people.choose([]);$('community-panel').hidden=false;$('workspace').classList.add('has-community');this.refresh();if(selected)$('community-person').value=selected;this.stamp='';this.refresh();$('close-community').focus();}
  close(){$('community-panel').hidden=true;$('workspace').classList.remove('has-community');$('community-open').setAttribute('aria-expanded','false');}
  refresh(){
    $('population-count').textContent=this.sim.people.length;
    if(this.population!==this.sim.people.length){const before=$('community-person').value;$('community-person').replaceChildren();for(const p of this.sim.people){const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name}${p.stage==='child'?' · infancia':''}`;$('community-person').append(o);}if(this.sim.person(before))$('community-person').value=before;this.population=this.sim.people.length;}
    if($('community-panel').hidden)return;$('community-open').setAttribute('aria-expanded','true');
    const adults=this.sim.people.filter(p=>p.stage==='adult').length;$('community-summary').textContent=`${adults} adultos · ${this.sim.people.length-adults} en la infancia · ${this.sim.capacity()} plazas`;
    const actor=this.sim.person($('community-person').value)||this.sim.people[0],stamp=JSON.stringify([actor.id,this.sim.people.map(p=>[p.id,p.stage]),this.sim.households.map(h=>[h.id,h.children.length,!!h.plan])]);
    if(this.stamp!==stamp){this.stamp=stamp;$('relationship-list').replaceChildren();
      for(const other of this.sim.people)if(other!==actor){const row=document.createElement('article');row.className='relation-row';row.dataset.other=other.id;const title=document.createElement('h3');title.textContent=`${actor.name} y ${other.name}`;const state=document.createElement('p'),progress=document.createElement('progress');progress.max=100;progress.setAttribute('aria-label',`Vínculo con ${other.name}`);
        const topics=document.createElement('select');topics.className='conversation-topic';topics.setAttribute('aria-label',`Tema con ${other.name}`);for(const[id,name]of Object.entries(TOPICS)){const o=document.createElement('option');o.value=id;o.textContent=name;topics.append(o);}
        const talk=document.createElement('button');talk.className='secondary';talk.textContent='Conversar · +12 vínculo';talk.onclick=()=>{const r=this.sim.assign(actor.id,'social',{personId:other.id,topic:topics.value});if(r.ok){this.people.choose([actor.id]);this.people.showTab('tasks');this.people.showCategory('care');this.people.notify(`${actor.name} irá a conversar con ${other.name}.`);}else this.people.notify(r.reason);this.onChange();};
        const form=document.createElement('button');form.className='secondary';form.textContent='Formar hogar';form.onclick=()=>{const r=this.sim.formHousehold(actor.id,other.id);if(!r.ok)this.people.notify(r.reason);this.stamp='';this.refresh();this.onChange();};
        const hint=document.createElement('small');row.append(title,state,progress,topics,talk,form,hint);$('relationship-list').append(row);
      }
      $('household-list').replaceChildren();for(const h of this.sim.households){const row=document.createElement('article');row.className='household-row';row.dataset.household=h.id;const title=document.createElement('h3');title.textContent=h.parents.map(id=>this.sim.person(id).name).join(' y ');const status=document.createElement('p'),bar=document.createElement('progress');bar.max=1;bar.setAttribute('aria-label','Nueva generación');const button=document.createElement('button');button.className='primary';button.textContent='Preparar nueva generación · 4 comidas';button.onclick=()=>{const r=this.sim.planChild(h.id);if(!r.ok)this.people.notify(r.reason);this.refresh();this.onChange();};const cancel=document.createElement('button');cancel.className='secondary';cancel.textContent='Detener y recuperar comidas';cancel.onclick=()=>{this.sim.cancelChild(h.id);this.refresh();this.onChange();};row.append(title,status,bar,button,cancel);$('household-list').append(row);}
    }
    for(const other of this.sim.people)if(other!==actor){const row=$('relationship-list').querySelector(`[data-other="${other.id}"]`),score=this.sim.relationship(actor.id,other.id),reason=this.sim.householdReason(actor.id,other.id);row.querySelector('p').textContent=`${bondName(score)} · ${Math.floor(score)}/100${this.sim.relatives(actor,other)?' · familia':''}`;row.querySelector('progress').value=score;const buttons=row.querySelectorAll('button');buttons[0].disabled=!this.sim.canTalkTo(other);buttons[1].disabled=!!reason;row.querySelector('small').textContent=buttons[0].disabled?`${other.name} está ocupado. Detén su tarea para conversar.`:reason;}
    for(const h of this.sim.households){const row=$('household-list').querySelector(`[data-household="${h.id}"]`),reason=this.sim.familyReason(h);row.querySelector('p').textContent=h.plan?`${Math.floor(h.plan.progress*100)}% · 3 minutos simulados, con agua y energía suficientes.`:h.children.length?`${h.children.map(id=>this.sim.person(id).name).join(', ')} · ${reason||'El hogar puede crecer.'}`:reason||'Hay espacio y alimento para una nueva generación.';row.querySelector('progress').hidden=!h.plan;row.querySelector('progress').value=h.plan?.progress||0;row.querySelector('.primary').hidden=!!h.plan;row.querySelector('.primary').disabled=!!reason;row.querySelector('.secondary').hidden=!h.plan;}
    $('no-households').hidden=this.sim.households.length>0;
    $('childhood-note').textContent=this.sim.people.filter(p=>p.stage==='child').map(p=>`${p.name}: infancia ${Math.min(100,Math.floor((this.sim.time-p.bornAt)/CHILD_SECONDS*100))}%`).join(' · ');
  }
}
