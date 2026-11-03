import { ITEMS, ITEM_GROUPS, RECIPES, stockGroups, costText } from './items.js';
import { TASKS } from './simulation.js';
import { itemIcon } from './item-icons.js';
const $=id=>document.getElementById(id);
export class InventoryUI {
  constructor(sim,people,onChange){
    this.sim=sim;this.people=people;this.onChange=onChange;this.filter='all';this.mode='stock';this.selected='wood';this.last='';
    $('stock-open').onclick=()=>this.open();
    for(const button of document.querySelectorAll('[data-stock-group]'))button.onclick=()=>this.open(button.dataset.stockGroup);
    $('close-stock').onclick=()=>this.close();
    document.addEventListener('sidecity:person-open',()=>this.close());
    document.addEventListener('sidecity:panel-open',e=>{if(e.detail!=='stock')this.close();});
    for(const [id,name]of [['all','Todo'],...Object.entries(ITEM_GROUPS)]){
      const b=document.createElement('button');b.textContent=name;b.dataset.filter=id;b.setAttribute('aria-pressed',String(id==='all'));b.onclick=()=>{this.filter=id;this.last='';this.refresh();};$('stock-filters').append(b);
    }
    for(const group of stockGroups(sim.resources)){
      const section=document.createElement('section');section.dataset.group=group.id;
      const title=document.createElement('h3');title.textContent=group.name;section.append(title);
      for(const item of group.items){
        const b=document.createElement('button');b.className='stock-row';b.dataset.item=item.id;
        const name=document.createElement('span'),n=document.createElement('b');name.textContent=item.name;n.dataset.count=item.id;b.append(itemIcon(item.icon),name,n);
        b.onclick=()=>{this.selected=item.id;this.last='';this.refresh();};section.append(b);
      }$('stock-list').append(section);
    }
    for(const [id,r]of Object.entries(RECIPES)){
      const article=document.createElement('article');article.className='recipe';article.dataset.recipe=id;
      const heading=document.createElement('h3');heading.append(itemIcon(ITEMS[r.output].icon),document.createTextNode(ITEMS[r.output].name));
      const effect=document.createElement('p');effect.textContent=ITEMS[r.output].use;
      const cost=document.createElement('p');cost.className='recipe-cost';cost.textContent=costText(r.cost);
      const progress=document.createElement('progress');progress.max=1;progress.value=0;progress.setAttribute('aria-label',`Fabricación de ${ITEMS[r.output].name}`);
      const reason=document.createElement('p');reason.className='recipe-reason';
      const button=document.createElement('button');button.className='primary';button.textContent='Asignar fabricación';button.onclick=()=>{
        const worker=$('craft-worker').value,result=sim.assign(worker,id);
        if(result.ok){people.choose([worker]);people.showTab('tasks');people.showCategory('craft');people.notify(`${sim.person(worker).name} fabricará ${ITEMS[r.output].name.toLowerCase()}.`);}
        else people.notify(result.reason);this.last='';this.refresh();onChange();
      };
      article.append(heading,effect,cost,progress,reason,button);$('recipe-list').append(article);
    }
    for(const p of sim.people){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;$('craft-worker').append(o);}
    $('craft-worker').onchange=()=>{this.last='';this.refresh();};
    for(const mode of ['stock','craft'])$('stock-tab-'+mode).onclick=()=>this.showMode(mode);
    const tabs=['stock','craft'];tabs.forEach((mode,i)=>$('stock-tab-'+mode).addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();this.showMode(tabs[1-i]);$('stock-tab-'+tabs[1-i]).focus();}));
    $('stock-detail-close').onclick=()=>{this.selected=null;this.last='';this.refresh();};
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('stock-panel').hidden){this.close();$('stock-open').focus();}});
    this.refresh();
  }
  open(filter='all'){
    document.dispatchEvent(new CustomEvent('sidecity:panel-open',{detail:'stock'}));
    const worker=this.people.selected[0];if(worker)$('craft-worker').value=worker;
    this.people.choose([]);this.filter=filter;this.selected=null;this.showMode('stock');
    $('stock-panel').hidden=false;$('stock-open').setAttribute('aria-expanded','true');$('workspace').classList.add('has-stock');this.last='';this.refresh();$('close-stock').focus();this.onChange();
  }
  close(){ $('stock-panel').hidden=true;$('workspace').classList.remove('has-stock');$('stock-open').setAttribute('aria-expanded','false'); }
  showMode(mode){this.mode=mode;for(const id of ['stock','craft']){$('stock-tab-'+id).setAttribute('aria-selected',String(id===mode));$('stock-tab-'+id).tabIndex=id===mode?0:-1;$('stock-view-'+id).hidden=id!==mode;}this.refresh();}
  refresh(){
    if($('stock-panel').hidden)return;
    const adults=this.sim.people.filter(p=>p.stage==='adult'),workers=adults.map(p=>p.id).join();if(this.workers!==workers){const current=$('craft-worker').value;$('craft-worker').replaceChildren();for(const p of adults){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;$('craft-worker').append(o);}if(adults.some(p=>p.id===current))$('craft-worker').value=current;this.workers=workers;}
    const worker=this.sim.person($('craft-worker').value),stamp=JSON.stringify([this.sim.resources,this.filter,this.selected,worker?.job?.kind]);
    // Stock changes rebuild text only when counts change; work bars remain live.
    if(stamp!==this.last){
      for(const section of $('stock-list').children)section.hidden=this.filter!=='all'&&section.dataset.group!==this.filter;
      for(const b of $('stock-filters').children)b.setAttribute('aria-pressed',String(b.dataset.filter===this.filter));
      for(const [id,item]of Object.entries(ITEMS)){
        const row=$('stock-list').querySelector(`[data-item="${id}"]`),n=this.sim.resources[id];row.querySelector('b').textContent=n;row.setAttribute('aria-pressed',String(this.selected===id));row.setAttribute('aria-label',`${item.name}: ${n}`);row.classList.toggle('stock-empty',n===0);
      }
      $('stock-summary').textContent='Reserva compartida por Ana, Ivo y Nara.';
      $('stock-detail').hidden=!this.selected;
      if(this.selected){const item=ITEMS[this.selected];$('stock-detail-name').textContent=item.name;$('stock-detail-source').textContent=item.source;$('stock-detail-use').textContent=item.use;}
      $('craft-current').textContent=worker?.job?`Tarea actual: ${TASKS[worker.job.kind]?.action||'Desplazamiento'}. Fabricar sustituye esta orden.`:'Está libre para fabricar. Se consumen materiales al terminar.';
      this.last=stamp;
    }
    for(const [id,r]of Object.entries(RECIPES)){
      const article=$('recipe-list').querySelector(`[data-recipe="${id}"]`),reason=this.sim.blockReason(id),active=this.sim.people.find(p=>p.job?.kind===id),owned=this.sim.resources[r.output]>0;
      article.querySelector('.recipe-cost').textContent=Object.entries(r.cost).map(([item,n])=>`${ITEMS[item].name} ${this.sim.resources[item]}/${n}`).join(' · ');
      article.querySelector('progress').hidden=!active;article.querySelector('progress').value=active?.job?.progress||0;
      article.querySelector('.recipe-reason').textContent=owned?'Disponible para los tres.':active?`${active.name}: ${active.state.toLowerCase()}.`:reason||`${r.seconds} s de trabajo base · Construcción +25 XP`;
      const button=article.querySelector('button');button.disabled=!!reason||!!active;button.textContent=owned?'Ya fabricada':active?'Fabricación en curso':`Asignar a ${worker?.name||'Ana'}`;
    }
  }
}
