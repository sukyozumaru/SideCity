import {ACTIONS,SETTINGS_KEY,defaultControls,validateControls,bindAction,keyLabel} from './input-actions.js';
const $=id=>document.getElementById(id);
export class ControlsUI{
 constructor(onChange){
  this.onChange=onChange;this.waiting=null;try{this.settings=validateControls(JSON.parse(localStorage.getItem(SETTINGS_KEY)));}catch{this.settings=defaultControls();}
  $('controls-open').onclick=()=>this.open();$('help-controls').onclick=()=>{$('help-dialog').close();this.open();};$('close-controls').onclick=()=>this.close();
  for(const key of['dragSpeed','zoomSpeed','smoothRotation','quickOrders','invertWheel'])$(key).onchange=()=>{this.settings[key]=$(key).type==='checkbox'?$(key).checked:Number($(key).value);this.save();};
  $('control-preset').onchange=()=>{const bindings=defaultControls().bindings;if($('control-preset').value==='wasd')Object.assign(bindings,{panLeft:'KeyA',panRight:'KeyD',panUp:'KeyW',panDown:'KeyS'});this.settings.bindings=bindings;this.save();};
  $('reset-controls').onclick=()=>{this.settings=defaultControls();this.waiting=null;this.save();};
  let group='';for(const[id,action]of Object.entries(ACTIONS)){if(action.group!==group){group=action.group;const h=document.createElement('h3');h.textContent=group;$('binding-list').append(h);}const row=document.createElement('div');row.className='binding-row';const name=document.createElement('span');name.textContent=action.name;const b=document.createElement('button');b.dataset.binding=id;b.onclick=()=>{this.waiting=id;$('control-feedback').textContent=`Pulsa la nueva tecla para ${action.name.toLowerCase()}. Escape cancela.`;b.textContent='Pulsa una tecla';};row.append(name,b);$('binding-list').append(row);}
  document.addEventListener('keydown',e=>{if(!this.waiting)return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape'){this.waiting=null;this.refresh();return;}const r=bindAction(this.settings,this.waiting,e.code);$('control-feedback').textContent=r.ok?'Control actualizado.':r.reason;if(r.ok){this.waiting=null;this.save();}},true);
  $('controls-dialog').addEventListener('cancel',()=>{this.waiting=null;});this.refresh();
 }
 open(){this.waiting=null;this.refresh();$('camera-controls').classList.remove('expanded');$('camera-more').setAttribute('aria-expanded','false');$('controls-dialog').showModal();}
 close(){this.waiting=null;$('controls-dialog').close();}
 save(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.settings));$('control-feedback').textContent='Preferencias guardadas en este navegador.';}catch{$('control-feedback').textContent='No se pudieron guardar. Los ajustes funcionan durante esta sesión.';}this.refresh();this.onChange();}
 refresh(){for(const key of['dragSpeed','zoomSpeed','smoothRotation','quickOrders','invertWheel']){const e=$(key);if(e.type==='checkbox')e.checked=this.settings[key];else e.value=this.settings[key];}for(const key of['dragSpeed','zoomSpeed'])$(key+'-value').textContent=`${this.settings[key].toFixed(1)}×`;
  for(const[id,code]of Object.entries(this.settings.bindings))$('binding-list').querySelector(`[data-binding="${id}"]`).textContent=keyLabel(code);
  $('control-preset').value=this.settings.bindings.panUp==='KeyW'?'wasd':this.settings.bindings.panUp==='ArrowUp'?'arrows':'custom';
 }
}
