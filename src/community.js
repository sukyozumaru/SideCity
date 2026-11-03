export const BIRTH_SECONDS=180, CHILD_SECONDS=600, POPULATION_LIMIT=12;
export const pairKey=(a,b)=>[a,b].sort().join('|');
const names=['Lía','Teo','Mila','Leo','Sol','Uma','Noa','Elio','Vera'];
export const bondName=score=>score>=80?'Vínculo cercano':score>=60?'Amistad':score>=24?'Se conocen':'Primeros lazos';
export const communityMethods={
  relationship(a,b){return this.relationships.get(pairKey(a,b))||0;},
  addBond(a,b,n){const k=pairKey(a,b);this.relationships.set(k,Math.min(100,this.relationship(a,b)+n));this.revision++;},
  relatives(a,b){
    const ancestors=p=>{const ids=new Set();const visit=q=>{for(const id of q?.parents||[])if(!ids.has(id)){ids.add(id);visit(this.person(id));}};visit(p);return ids;};
    const x=ancestors(a),y=ancestors(b);return x.has(b.id)||y.has(a.id)||[...x].some(id=>y.has(id));
  },
  householdReason(aId,bId){
    const a=this.person(aId),b=this.person(bId);
    if(!a||!b||a===b||a.stage==='child'||b.stage==='child')return 'Un hogar se forma entre dos adultos.';
    if(this.relatives(a,b))return 'Los familiares cercanos no pueden formar pareja.';
    if(this.households.some(h=>h.parents.includes(aId)||h.parents.includes(bId)))return 'Uno de ellos ya forma parte de un hogar.';
    if(this.relationship(aId,bId)<60)return 'Necesitan 60 de vínculo. Conversar y colaborar refuerza la amistad.';
    return '';
  },
  formHousehold(a,b){const reason=this.householdReason(a,b);if(reason)return{ok:false,reason};this.households.push({id:pairKey(a,b),parents:[a,b],plan:null,children:[]});this.emit(`${this.person(a).name} y ${this.person(b).name} han formado un hogar.`);return{ok:true};},
  familyReason(h){
    if(!h||!this.households.includes(h))return 'Hogar desconocido.';
    if(h.plan)return 'Este hogar ya prepara una nueva generación.';
    if(this.people.length+this.households.filter(h=>h.plan).length>=POPULATION_LIMIT)return 'Este campamento admite hasta 12 habitantes.';
    if(this.capacity()<=this.people.length+this.households.filter(h=>h.plan).length)return 'Construye otro refugio: hace falta una plaza libre por nueva generación.';
    if(this.resources.meals<4)return 'Reserva 4 comidas para cuidar a la nueva generación.';
    return '';
  },
  planChild(id){const h=this.households.find(h=>h.id===id),reason=this.familyReason(h);if(reason)return{ok:false,reason};this.resources.meals-=4;h.plan={progress:0};this.emit('Nueva generación preparada: 4 comidas reservadas.');return{ok:true};},
  cancelChild(id){const h=this.households.find(h=>h.id===id);if(!h?.plan)return false;h.plan=null;this.resources.meals+=4;this.emit('Plan familiar detenido. Se recuperaron las 4 comidas.');return true;},
  updateCommunity(dt){
    for(const p of this.people)if(p.stage==='child'&&this.time-p.bornAt>=CHILD_SECONDS){p.stage='adult';this.emit(`${p.name} ha crecido y ya puede aprender un oficio.`);}
    for(let i=0;i<this.people.length;i++)for(let j=i+1;j<this.people.length;j++){
      const a=this.people[i],b=this.people[j];
      if(a.job&&b.job&&['shelter','bridge'].includes(a.job.kind)&&a.job.kind===b.job.kind&&this.jobProject(a.job)===this.jobProject(b.job)&&!a.job.path.length&&!b.job.path.length)this.addBond(a.id,b.id,dt*.16);
    }
    for(const h of this.households)if(h.plan){
      const parents=h.parents.map(id=>this.person(id));
      if(!parents.every(p=>p.needs.water>=25&&p.needs.energy>=25)||this.capacity()<=this.people.length)continue;
      h.plan.progress=Math.min(1,h.plan.progress+dt/BIRTH_SECONDS);
      if(h.plan.progress>=1-1e-9){
        const home=this.homes().find(b=>this.route(parents[0],{x:b.x,y:b.y+b.height})),spot=home?{x:home.x+.5,y:home.y+home.height+.5}:parents[0];
        if(!this.walkable(this.world.get(Math.floor(spot.x),Math.floor(spot.y))))continue;
        const index=this.people.length-3,id=`child-${this.nextPerson++}`,p=this.createPerson({id,name:names[index%names.length],color:parents[index%2].color,hair:parents[(index+1)%2].hair,x:spot.x,y:spot.y,stage:'child',parents:[...h.parents],bornAt:this.time});
        this.people.push(p);h.children.push(id);h.plan=null;for(const parent of parents)this.addBond(parent.id,id,70);this.emit(`${p.name} ha nacido. El hogar tiene una nueva generación.`);
      }
    }
  },
};
