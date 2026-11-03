import { MINERALS, SECTOR_SIZE, sectorOf } from './terrain.js';
import { eraState } from './era.js';
const $=id=>document.getElementById(id);
export class WorldUI {
  constructor(sim,renderer,people,onStore,onChange){
    this.sim=sim;this.renderer=renderer;this.people=people;this.onChange=onChange;this.sector=null;
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
    if(mineral){$('parcel-name').textContent=MINERALS[mineral.kind].name;$('parcel-description').textContent=MINERALS[mineral.kind].detail;$('parcel-state').textContent=`Depósito · ${mineral.richness} reservas`;}
    return false;
  }
  refresh(){
    const state=eraState(this.sim);
    $('era-name').textContent=state.name;$('era-stage').textContent=state.stage;$('era-percent').textContent=`${state.percent}%`;$('era-progress').value=state.percent;$('era-time').textContent=`Año ${state.year} · ${state.elapsed}`;
    $('era-status').setAttribute('aria-label',`${state.name}. ${state.stage}. ${state.percent} por ciento. Año ${state.year}. Tiempo ${state.elapsed}.`);
    $('era-detail-time').textContent=`Año ${state.year}, día ${state.day} · ${state.elapsed} de tiempo simulado. Cada año representa 30 minutos del mundo.`;
    const stamp=state.milestones.map(m=>Number(m.done)).join('');
    if(stamp!==this.stamp){$('era-milestones').replaceChildren();for(const m of state.milestones){const li=document.createElement('li');li.textContent=`${m.done?'✓':'○'} ${m.label}`;$('era-milestones').append(li);}this.stamp=stamp;}
    $('world-summary').textContent=`${this.sim.world.width} × ${this.sim.world.height} · 6.912 parcelas · ${this.sim.unlocked.size}/48 sectores abiertos. Semilla ${this.sim.world.seed}. Piedritas recogidas: ${this.sim.resources.stone}.`;
    if(this.sector){const cost=this.sim.expansionCost(),reason=this.sim.expansionReason(this.sector.x,this.sector.y);$('parcel-description').textContent=reason||'Amplía tu comunidad hacia este sector vecino. Los ríos siguen siendo obstáculos naturales.';$('unlock-sector').hidden=false;$('unlock-sector').disabled=!!reason;$('unlock-sector').textContent=`Abrir 144 parcelas · ${cost.wood} madera + ${cost.knowledge} saber`;}
  }
}
