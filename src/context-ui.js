import {describeObject,pickObject} from './interactions.js';
const $=id=>document.getElementById(id);
export class ContextUI{
 constructor(sim,renderer,people,onChange){this.sim=sim;this.renderer=renderer;this.people=people;this.onChange=onChange;this.target=null;this.ids=[];
  $('close-context').onclick=()=>this.close(true);$('context-person').onclick=()=>{const ids=this.workerIds();this.close(false);people.choose(ids);};
  $('context-worker').onchange=()=>this.refresh();document.addEventListener('sidecity:panel-open',e=>{if(e.detail!=='context')this.close(false);});
 }
 pick(x,y,people=false){return pickObject(this.renderer.camera,this.sim,x,y,{people});}
 open(target){if(!target||target.type==='locked')return;const ids=[...this.people.selected];document.dispatchEvent(new CustomEvent('sidecity:panel-open',{detail:'context'}));this.target=target;this.ids=ids;
  $('person-panel').hidden=true;$('workspace').classList.remove('has-person');$('context-panel').hidden=false;$('context-worker').replaceChildren();
  if(ids.length>1){const o=document.createElement('option');o.value='group';o.textContent=`Seleccionados (${ids.length})`;$('context-worker').append(o);}
  for(const p of this.sim.people){const o=document.createElement('option');o.value=p.id;o.textContent=`${p.name}${p.stage==='child'?' · infancia':''}`;$('context-worker').append(o);}
  if(ids.length===1)$('context-worker').value=ids[0];this.renderer.selected=this.sim.world.get(target.x,target.y);this.refresh(true);$('close-context').focus();this.onChange();
 }
 close(restore=false){$('context-panel').hidden=true;this.target=null;if(restore&&this.people.selected.length)this.people.choose([...this.people.selected]);}
 workerIds(){return $('context-worker').value==='group'?this.ids:[$('context-worker').value];}
 execute(action,target=this.target,ids=this.workerIds()){
  if(!target)return;let destination=action.target,task=action.task;
  if(task==='cross'){const b=target.item,p=this.sim.person(ids[0]);destination=Math.hypot(p.x-b.start.x,p.y-b.start.y)<Math.hypot(p.x-b.end.x,p.y-b.end.y)?b.end:b.start;task='move';}
  this.close(false);this.people.choose(ids);this.people.order(task,destination);this.onChange();
 }
 quick(target,ids){const action=describeObject(target,this.sim).actions[0];if(action)this.execute(action,target,ids);}
 refresh(rebuild=false){if(!this.target||$('context-panel').hidden)return;const description=describeObject(this.target,this.sim);$('context-name').textContent=description.name;$('context-description').textContent=description.detail;$('context-position').textContent=`Parcela ${this.target.x+1}, ${this.target.y+1}`;
  if(rebuild){$('context-actions').replaceChildren();for(const action of description.actions){const row=document.createElement('div');row.className='object-action';const b=document.createElement('button');b.className='primary';b.textContent=action.label;b.onclick=()=>this.execute(describeObject(this.target,this.sim).actions[0]);const p=document.createElement('p');p.className='panel-hint';row.append(b,p);$('context-actions').append(row);}
   $('context-inspect-human').hidden=this.target.type!=='person';$('context-inspect-human').onclick=()=>{const id=this.target.item.id;this.close(false);this.people.choose([id]);};
  }
  const worker=this.sim.person(this.workerIds()[0]),action=description.actions[0],reason=action.reason||(!['move','cross'].includes(action.task)&&this.sim.blockReason(action.task,action.target))||(this.target.type==='person'&&worker?.id===this.target.item.id?'Elige otra persona para conversar.':'')||(this.target.type==='person'&&this.target.item.job&&this.target.item.job.kind!=='rest'?'La otra persona está ocupada. Detén su tarea para conversar.':'')||(worker?.stage==='child'&&!['move','cross','sleep','rest','eat','drink','social'].includes(action.task)?'Los oficios se abren al crecer.':'');
  const row=$('context-actions').firstElementChild;if(row){row.querySelector('button').textContent=action.label;row.querySelector('button').disabled=!!reason;row.querySelector('p').textContent=reason||action.detail;}
  $('context-current').textContent=this.workerIds().length>1?'La orden se aplica a los seleccionados.':worker?.job?`${worker.name} está ${worker.state.toLowerCase()}. Esta orden sustituye su tarea actual.`:`${worker?.name||''} está libre.`;
 }
}
