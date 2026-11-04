import {itemIcon} from './item-icons.js';
import { MINERALS, SECTOR_SIZE, sectorOf } from './terrain.js';
import { eraState } from './era.js';
import { readSaveFile, writeSaveFile } from './save-transfer.js';
const $=id=>document.getElementById(id);
export class WorldUI {
  constructor(sim,renderer,people,onStore,onChange,onReplace){
    this.sim=sim;this.renderer=renderer;this.people=people;this.onChange=onChange;this.sector=null;
    $('export-save').onclick=()=>{
      try{const json=writeSaveFile(sim),url=URL.createObjectURL(new Blob([json],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`SideCity-${sim.world.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('import-summary').textContent='Partida descargada. Puedes abrir este archivo en otro navegador.';}catch{$('import-summary').textContent='No se pudo preparar el archivo. La partida actual permanece abierta.';}
    };
    let imported=null,importRequest=0;
    $('import-save').onchange=async()=>{
      const request=++importRequest;imported=null;$('confirm-import').hidden=true;const file=$('import-save').files[0];if(!file)return;
      try{if(file.size>2_000_000)throw new Error();const candidate=readSaveFile(await file.text());if(request!==importRequest)return;imported=candidate;$('import-summary').textContent=`Semilla ${imported.world.seed} · ${Math.floor(imported.time/60)} min · ${imported.unlocked.size} sectores. Continuar reemplaza la partida de esa semilla en este navegador y conserva su última copia válida.`;$('confirm-import').hidden=false;}
      catch{if(request===importRequest)$('import-summary').textContent='Archivo no válido. Elige una partida JSON de SideCity de menos de 2 MB.';}
    };
    $('confirm-import').onclick=()=>{
      if(!imported)return;
      try{if(imported.world.seed!==sim.world.seed&&!onStore())throw new Error();onReplace(imported);const url=new URL(location.href);url.searchParams.set('seed',String(imported.world.seed));location.assign(url.href);}
      catch{$('import-summary').textContent='No se pudo guardar el archivo. La comunidad actual sigue abierta.';}
    };
    $('world-open').onclick=()=>{$('world-seed').value=sim.world.seed;$('world-dialog').showModal();};
    $('help-world').onclick=()=>{$('help-dialog').close();$('world-seed').value=sim.world.seed;$('world-dialog').showModal();};
    $('close-world').onclick=()=>$('world-dialog').close();
    $('random-seed').onclick=()=>{$('world-seed').value=1+crypto.getRandomValues(new Uint32Array(1))[0]%2147483646;};
    $('world-form').onsubmit=e=>{
      e.preventDefault();const seed=Number($('world-seed').value);
      if(!Number.isInteger(seed)||seed<1||seed>2147483647){$('world-message').textContent='Usa un número entero entre 1 y 2147483647.';return;}
      if(seed===sim.world.seed){$('world-dialog').close();return;}
      if(!onStore()){$('world-message').textContent='No se pudo guardar la comunidad actual. Conservamos este mundo abierto.';return;}
      const url=new URL(location.href);url.searchParams.set('seed',String(seed));location.assign(url.href);
    };
    $('era-status').onclick=()=>{this.refresh();$('era-dialog').showModal();};
    $('close-era').onclick=()=>$('era-dialog').close();
    $('unlock-sector').onclick=()=>{if(!this.sector)return;const result=sim.unlockSector(this.sector.x,this.sector.y);if(result.ok){$('parcel').hidden=true;this.sector=null;renderer.selected=null;this.people.notify('Abierto un sector de 144 parcelas.');}else this.people.notify(result.reason);this.refresh();onChange();};
    this.refresh();
  }
  inspect(tile){
    this.sector=null;$('unlock-sector').hidden=true;
    if(!tile)return;
    if(!this.sim.isUnlocked(tile.x,tile.y)){
      this.people.choose([]);this.sector=sectorOf(tile.x,tile.y);this.renderer.selected=tile;
      $('parcel').hidden=false;$('parcel-name').textContent='Nuevo territorio';$('parcel-coordinates').textContent=`Sector ${this.sector.x+1} / ${this.sector.y+1}`;$('parcel-state').textContent='144 parcelas';this.refresh();return true;
    }
    const mineral=this.sim.world.mineralAt(tile.x,tile.y);
    if(mineral){const remaining=this.sim.mineralRemaining(mineral);$('parcel-name').textContent=MINERALS[mineral.kind].name;$('parcel-description').textContent=['iron','silver'].includes(mineral.kind)?'Requiere herramientas de una tecnología posterior.':'Selecciona un colono y toca esta veta para extraerla con el pico de piedra.';$('parcel-state').textContent=remaining?`Depósito · ${remaining} reservas`:'Depósito agotado';}
    return false;
  }
  refresh(){
    const state=eraState(this.sim);
    $('era-name').textContent=state.name;$('era-stage').textContent=state.stage;$('era-percent').textContent=`${state.percent}%`;$('era-progress').value=state.percent;$('era-time').textContent=`Año ${state.year} · ${state.elapsed}`;
    $('era-status').setAttribute('aria-label',`${state.name}. ${state.stage}. ${state.percent} por ciento. Año ${state.year}. Tiempo ${state.elapsed}.`);
    $('era-detail-time').textContent=`Año ${state.year}, día ${state.day} · ${state.elapsed} de tiempo simulado. Cada año representa 30 minutos del mundo.`;
    $('era-current-summary').textContent=`${state.name} · ${state.stage} · ${state.percent}%`;
    const stamp=state.current+':'+state.milestones.map(m=>Number(m.done)).join('');
    if(stamp!==this.stamp){$('era-milestones').replaceChildren();for(const m of state.milestones){const li=document.createElement('li');li.textContent=`${m.done?'✓':'○'} ${m.label}`;$('era-milestones').append(li);}this.stamp=stamp;
      const eraIcon=itemIcon(['knowledge','seeds','bronze'][state.current]);$('era-status').querySelector('svg').replaceChildren(...eraIcon.childNodes);
      $('era-goals-label').textContent=`Objetivos de ${state.name} · ${state.completed}/${state.milestones.length}`;
      $('era-timeline').replaceChildren();for(const era of state.timeline){
        const li=document.createElement('li');li.className=era.future?'future':era.status==='Actual'?'current':'';if(era.status==='Actual')li.setAttribute('aria-current','step');
        const title=document.createElement('h4'),status=document.createElement('span'),text=document.createElement('p');title.textContent=era.name;title.prepend(itemIcon({seed:'knowledge',leaf:'seeds',ingot:'bronze',pick:'pick',book:'knowledge',house:'wood',wheel:'coal',globe:'knowledge'}[era.icon]));status.textContent=era.status;text.textContent=era.learn;
        li.append(title,status,text);if(era.discover){const hint=document.createElement('p');hint.className='era-discovery';hint.textContent=era.discover;li.append(hint);}$('era-timeline').append(li);
      }
    }
    $('world-summary').textContent=`${this.sim.world.width} × ${this.sim.world.height} · 6.912 parcelas · ${this.sim.unlocked.size}/48 sectores abiertos. Semilla ${this.sim.world.seed}. Piedra almacenada: ${this.sim.resources.stone}.`;
    if(this.sector){const cost=this.sim.expansionCost(),reason=this.sim.expansionReason(this.sector.x,this.sector.y);$('parcel-description').textContent=reason||'Amplía tu comunidad hacia este sector vecino. Los ríos siguen siendo obstáculos naturales.';$('unlock-sector').hidden=false;$('unlock-sector').disabled=!!reason;$('unlock-sector').textContent=`Abrir 144 parcelas · ${cost.wood} madera + ${cost.knowledge} saber`;}
  }
}
