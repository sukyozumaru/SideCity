import { BUILD_TYPES } from './construction.js';
import { costText } from './items.js';
const $=id=>document.getElementById(id);
export class BuildUI{
  constructor(sim,renderer,people,onChange){
    this.sim=sim;this.renderer=renderer;this.people=people;this.onChange=onChange;this.kind=null;this.axis='y';this.anchor=null;this.stamp='';
    $('camp-status').onclick=()=>this.open();$('close-build').onclick=()=>this.close();
    document.addEventListener('sidecity:panel-open',e=>{if(e.detail!=='build')this.close();});
    for(const kind of Object.keys(BUILD_TYPES))$('place-'+kind).onclick=()=>this.start(kind);
    $('rotate-build').onclick=()=>{const axes=['y','x','-y','-x'];this.axis=axes[(axes.indexOf(this.axis)+1)%4];this.preview();};
    $('cancel-placement').onclick=()=>this.cancel();
    $('confirm-placement').onclick=()=>{
      if(!this.anchor)return;const r=sim.placeBuilding(this.kind,this.anchor.x,this.anchor.y,this.axis);
      if(!r.ok){this.people.notify(r.reason);this.preview();return;}
      const n=sim.assignBuilders(r.building.id);this.cancel();this.open();this.people.notify(`${BUILD_TYPES[r.building.kind].name}: ${n} constructores libres asignados. Puedes sumar otros desde Tareas.`);this.refresh();onChange();
    };
    document.addEventListener('keydown',e=>{if(this.kind&&e.key==='Escape'){e.preventDefault();this.cancel();}if(this.kind&&e.key.toLowerCase()==='r'&&!['INPUT','SELECT'].includes(e.target.tagName)){$('rotate-build').click();}});
    this.refresh();
  }
  open(){if(this.kind)this.cancel();document.dispatchEvent(new CustomEvent('sidecity:panel-open',{detail:'build'}));this.people.choose([]);$('build-panel').hidden=false;$('workspace').classList.add('has-build');$('camp-status').setAttribute('aria-expanded','true');this.refresh();$('close-build').focus();}
  close(){$('build-panel').hidden=true;$('workspace').classList.remove('has-build');$('camp-status').setAttribute('aria-expanded','false');if(this.kind)this.cancel();}
  start(kind){this.close();this.people.choose([]);this.kind=kind;this.anchor=null;this.axis='y';$('placement-bar').hidden=false;document.body.classList.add('placing');$('placement-title').textContent=BUILD_TYPES[kind].name;$('rotate-build').hidden=kind!=='bridge';this.preview();$('world').focus();}
  cancel(){this.kind=null;this.anchor=null;this.renderer.placement=null;$('placement-bar').hidden=true;document.body.classList.remove('placing');this.onChange();}
  select(tile){if(!this.kind)return false;if(tile){this.anchor={x:tile.x,y:tile.y};this.preview();}return true;}
  preview(){
    const d=this.anchor?this.sim.previewBuilding(this.kind,this.anchor.x,this.anchor.y,this.axis):null;this.renderer.placement=d;
    $('placement-message').textContent=d?(d.reason||`${costText(d.cost)} · ${d.kind==='bridge'?`${d.span} parcelas de agua`:'3 plazas'} · asigna adultos libres`):this.kind==='bridge'?'Toca una orilla seca junto al agua. Gira para elegir la dirección.':'Toca cuatro parcelas libres. Confirma el sitio antes de gastar.';
    $('confirm-placement').disabled=!d?.ok;$('rotate-build').textContent=`Girar · ${{y:'↙',x:'↘','-y':'↗','-x':'↖'}[this.axis]}`;this.onChange();
  }
  refresh(){
    if(this.kind)this.preview();if($('build-panel').hidden)return;
    $('build-summary').textContent=`${this.sim.homes().length} refugios · ${this.sim.capacity()} plazas · ${this.sim.buildings.filter(b=>b.kind==='bridge'&&b.complete).length} puentes`;
    const projects=this.sim.buildings.filter(b=>b.reserved),stamp=projects.map(b=>`${b.id}/${b.complete}`).join();
    if(stamp!==this.stamp){this.stamp=stamp;$('project-list').replaceChildren();
      for(const b of projects){
        const row=document.createElement('article');row.className='project-row';row.dataset.project=b.id;
        const title=document.createElement('h3');title.textContent=`${BUILD_TYPES[b.kind].name} · ${b.x+1}, ${b.y+1}`;
        const state=document.createElement('p'),bar=document.createElement('progress');bar.max=1;bar.setAttribute('aria-label',`Obra ${b.id}`);
        const assign=document.createElement('button');assign.className='secondary';assign.textContent='Asignar adultos libres';assign.onclick=()=>{const n=this.sim.assignBuilders(b.id);this.people.notify(n?`${n} habitantes se suman a la obra.`:'No hay adultos libres con acceso a la obra.');this.onChange();};
        const cancel=document.createElement('button');cancel.className='secondary';cancel.textContent='Cancelar y recuperar materiales';cancel.onclick=()=>{this.sim.cancelBuilding(b.id);this.refresh();this.onChange();};
        row.append(title,state,bar,assign,cancel);$('project-list').append(row);
      }
    }
    for(const b of projects){const row=$('project-list').querySelector(`[data-project="${b.id}"]`);const workers=this.sim.people.filter(p=>['shelter','bridge'].includes(p.job?.kind)&&this.sim.jobProject(p.job)===b).length;row.querySelector('p').textContent=b.complete?(b.kind==='bridge'?'Paso abierto entre orillas.':'Terminado · tres plazas de descanso.'):`${Math.floor(b.progress*100)}% · ${workers} constructores · materiales reservados`;row.querySelector('progress').value=b.progress;for(const button of row.querySelectorAll('button'))button.hidden=b.complete;}
    $('no-projects').hidden=projects.length>0;
  }
}
