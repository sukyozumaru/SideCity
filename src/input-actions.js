export const ACTIONS={
 panLeft:{name:'Mover cámara a la izquierda',group:'Cámara',key:'ArrowLeft',held:true},panRight:{name:'Mover cámara a la derecha',group:'Cámara',key:'ArrowRight',held:true},panUp:{name:'Mover cámara arriba',group:'Cámara',key:'ArrowUp',held:true},panDown:{name:'Mover cámara abajo',group:'Cámara',key:'ArrowDown',held:true},
 rotateLeft:{name:'Girar cámara a la izquierda',group:'Cámara',key:'KeyQ'},rotateRight:{name:'Girar cámara a la derecha',group:'Cámara',key:'KeyE'},resetView:{name:'Reiniciar vista',group:'Cámara',key:'Home'},fitView:{name:'Ver todo el mundo',group:'Cámara',key:'KeyZ'},zoomIn:{name:'Acercar',group:'Cámara',key:'Equal'},zoomOut:{name:'Alejar',group:'Cámara',key:'Minus'},grid:{name:'Cuadrícula',group:'Cámara',key:'KeyG'},
 farm:{name:'Cultivar',group:'Menús',key:'KeyV'},build:{name:'Construir',group:'Menús',key:'KeyB'},stock:{name:'Almacén',group:'Menús',key:'KeyI'},community:{name:'Comunidad',group:'Menús',key:'KeyC'},controls:{name:'Controles',group:'Menús',key:'KeyO'},pause:{name:'Pausar / continuar',group:'Menús',key:'Space'},stop:{name:'Detener seleccionados',group:'Órdenes',key:'KeyX'},interact:{name:'Acción del objeto / centro',group:'Órdenes',key:'KeyF'},rotateBuilding:{name:'Girar obra en colocación',group:'Órdenes',key:'KeyR'},
 logging:{name:'Talar',group:'Órdenes',key:'Digit1'},foraging:{name:'Recolectar',group:'Órdenes',key:'Digit2'},study:{name:'Estudiar',group:'Órdenes',key:'Digit3'},exploration:{name:'Explorar',group:'Órdenes',key:'Digit4'},drink:{name:'Beber agua',group:'Órdenes',key:'Digit5'},rest:{name:'Descansar',group:'Órdenes',key:'Digit6'},
};
export const SETTINGS_KEY='sidecity-controls-v1';
export const defaultControls=()=>({version:1,bindings:Object.fromEntries(Object.entries(ACTIONS).map(([id,a])=>[id,a.key])),dragSpeed:1,zoomSpeed:1,smoothRotation:true,quickOrders:false,invertWheel:false});
export function validateControls(data){
 const base=defaultControls();if(!data||data.version!==1)return base;
 if(data.bindings&&!Object.hasOwn(data.bindings,'farm')){const used=new Set(Object.values(data.bindings)),key=['KeyV','KeyU','KeyY','KeyH','End'].find(k=>!used.has(k));if(key)data={...data,bindings:{...data.bindings,farm:key}};}
 if(data.bindings&&Object.keys(data.bindings).length===Object.keys(ACTIONS).length&&Object.keys(ACTIONS).every(id=>typeof data.bindings[id]==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Home|End|Space|Equal|Minus|Bracket(Left|Right))$/.test(data.bindings[id]))&&new Set(Object.values(data.bindings)).size===Object.keys(ACTIONS).length)base.bindings={...data.bindings};
 for(const key of['dragSpeed','zoomSpeed'])if(Number.isFinite(data[key])&&data[key]>=.5&&data[key]<=2)base[key]=data[key];for(const key of['smoothRotation','quickOrders','invertWheel'])if(typeof data[key]==='boolean')base[key]=data[key];return base;
}
export function bindAction(settings,id,code){
 if(!Object.hasOwn(ACTIONS,id))return{ok:false,reason:'Acción desconocida.'};
 if(!/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Home|End|Space|Equal|Minus|Bracket(Left|Right))$/.test(code))return{ok:false,reason:'Usa una letra, número, flecha, Inicio, Fin, espacio, + o −. Escape y Tab se conservan para navegar.'};
 const other=Object.keys(ACTIONS).find(a=>a!==id&&settings.bindings[a]===code);if(other)return{ok:false,reason:`Ya está asignada a: ${ACTIONS[other].name}.`};settings.bindings[id]=code;return{ok:true};
}
export const keyLabel=code=>({ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Space:'Espacio',Home:'Inicio',End:'Fin',Equal:'+',Minus:'−',BracketLeft:'[',BracketRight:']'}[code]||code.replace('Key','').replace('Digit',''));
export class InputActions{
 constructor(settings,run){this.settings=settings;this.run=run;this.keys=new Set();}
 press(code,repeat=false){const id=Object.keys(ACTIONS).find(id=>this.settings.bindings[id]===code);if(!id)return false;if(ACTIONS[id].held)this.keys.add(id);else if(!repeat)this.run(id);return true;}
 release(code){const id=Object.keys(ACTIONS).find(id=>this.settings.bindings[id]===code);this.keys.delete(id);}
 clear(){this.keys.clear();}
 pan(dt){const dx=Number(this.keys.has('panLeft'))-Number(this.keys.has('panRight')),dy=Number(this.keys.has('panUp'))-Number(this.keys.has('panDown')),len=Math.hypot(dx,dy)||1;return{x:dx/len*420*dt*this.settings.dragSpeed,y:dy/len*420*dt*this.settings.dragSpeed};}
}
