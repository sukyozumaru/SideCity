import { createShelter, insideShelter, shelterPlaces } from './camp.js';
export const BUILD_TYPES = {
  furnace:{name:'Horno de fundición',detail:'Fuego y seis estudios. Convierte cobre, estaño y carbón en bronce.',cost:{wood:12,stone:16},work:42},
  workshop:{name:'Taller de bronce',detail:'Tras la primera colada. Fabrica herramientas de bronce; +15% al fabricar.',cost:{wood:24,stone:10,bronze:2},work:48},
  shelter:{name:'Refugio',detail:'Tres plazas, madera y techo de paja.',cost:{wood:20},work:36},
  bridge:{name:'Puente',detail:'Conecta dos orillas. Su coste depende de la longitud.'},
};
export const buildingTiles = b => Array.from({length:b.width*b.height},(_,i)=>({x:b.x+i%b.width,y:b.y+Math.floor(i/b.width)}));
export const workPlaces = b => b.kind==='bridge' ? [b.start,...[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>({x:b.start.x+x,y:b.start.y+y})),b.end] : shelterPlaces(b);
const same=(a,b)=>a.x===b.x&&a.y===b.y;
export const constructionMethods = {
  buildingReason(kind){
    if(kind==='furnace'&&(!this.shelter.complete||!this.plots.some(p=>p.harvests>0)))return 'Termina el primer refugio y recoge tu primera cosecha antes de fundir metales.';
    if(kind==='furnace'&&(!this.firepit||this.people.reduce((n,p)=>n+p.skills.study.completed,0)<6))return 'Prepara el fogón y completa seis estudios para dominar el calor.';
    if(kind==='workshop'&&!this.people.some(p=>p.skills.metalworking.completed>0))return 'Completa tu primera colada de bronce en el horno.';
    return '';
  },
  project(id){return this.buildings.find(b=>b.id===id);},
  activeProject(kind='shelter'){return this.buildings.find(b=>b.kind===kind&&b.reserved&&!b.complete)|| (kind==='shelter'&&!this.shelter.reserved?this.shelter:null);},
  jobProject(job){return this.project(job?.source?.buildingId)||this.activeProject(job?.kind)||this.shelter;},
  hasBridge(x,y){return this.buildings.some(b=>b.kind==='bridge'&&b.complete&&insideShelter(b,x,y));},
  homes(){return this.buildings.filter(b=>b.kind==='shelter'&&b.complete);},
  capacity(){return this.homes().length*3;},
  occupiedByBuilding(x,y){return this.buildings.some(b=>b.reserved&&(b.kind!=='bridge'?x>=b.x-1&&x<b.x+b.width+1&&y>=b.y-1&&y<b.y+b.height+1:insideShelter(b,x,y)));},
  previewBuilding(kind,x,y,axis='y'){
    const fail=reason=>({ok:false,reason,kind,x,y,width:2,height:2});
    if(!BUILD_TYPES[kind]||!Number.isInteger(x)||!Number.isInteger(y))return fail('Elige una parcela del mapa.');
    if(this.buildingReason(kind))return fail(this.buildingReason(kind));
    if(this.buildings.filter(b=>b.reserved).length>=32)return fail('Este campamento admite hasta 32 construcciones.');
    let b={id:'preview',kind,x,y,width:2,height:2,cost:{...BUILD_TYPES[kind].cost},work:BUILD_TYPES[kind].work};
    if(kind==='bridge'){
      if(!['x','y','-x','-y'].includes(axis))return fail('Elige la dirección del puente.');
      const sign=axis.startsWith('-')?-1:1,dx=axis.endsWith('x')?sign:0,dy=axis.endsWith('y')?sign:0,start=this.world.get(x,y);
      if(!start||start.type==='water'||!this.walkable(start))return fail('Empieza en una orilla seca y despejada; gira si hace falta.');
      let length=0;while(length<13&&this.world.get(x+dx*(length+1),y+dy*(length+1))?.type==='water')length++;
      if(!length||length>12)return fail('Busca agua junto a la orilla. El puente puede cubrir hasta 12 parcelas de agua.');
      const end={x:x+dx*(length+1),y:y+dy*(length+1)};
      if(!this.walkable(this.world.get(end.x,end.y)))return fail('La otra orilla debe estar abierta y despejada.');
      b={...b,x:Math.min(x,end.x),y:Math.min(y,end.y),axis,start:{x,y},end,width:dx?length+2:1,height:dy?length+2:1,span:length,cost:{wood:12+length*3,stone:2},work:12+length*5};
    }
    for(const t of buildingTiles(b)){
      const tile=this.world.get(t.x,t.y);
      if(!tile||!this.isUnlocked(t.x,t.y))return {...b,ok:false,reason:'Abre primero todo el terreno de la obra.'};
      if(this.plotAt(t.x,t.y)||this.occupiedByBuilding(t.x,t.y)||this.firepit&&t.x===21&&t.y===16||t.x===22&&t.y===16)return {...b,ok:false,reason:'Otra obra, huerto, acceso o puesto de trabajo ocupa ese lugar.'};
      if(kind!=='bridge'&&(!this.walkable(tile)||this.people.some(p=>Math.floor(p.x)===t.x&&Math.floor(p.y)===t.y)))return {...b,ok:false,reason:'Necesitas cuatro parcelas secas, despejadas y sin habitantes encima.'};
      if(kind!=='bridge'&&this.world.scatter.some(s=>same(s,t)&&!this.scavenged.has(`${s.x},${s.y}`)))return {...b,ok:false,reason:'Recoge primero las ramas o piedras de ese suelo.'};
    }
    const stations=workPlaces(b).filter(t=>this.walkable(this.world.get(t.x,t.y))&&!buildingTiles(b).some(q=>same(q,t)));
    if(kind!=='bridge'&&stations.length<3)return {...b,ok:false,reason:'Deja libres al menos tres accesos alrededor de la obra.'};
    if(!this.people.some(p=>p.stage!=='child'&&stations.some(t=>this.route(p,t))))return {...b,ok:false,reason:'Ningún adulto puede llegar al lugar de trabajo.'};
    const missing=Object.entries(b.cost).some(([id,n])=>this.resources[id]<n);
    return {...b,ok:!missing,reason:missing?`Necesitas ${Object.entries(b.cost).map(([id,n])=>`${n} ${{wood:'madera',stone:'piedra',bronze:'bronce'}[id]}`).join(' + ')}.`:''};
  },
  placeBuilding(kind,x,y,axis){
    const draft=this.previewBuilding(kind,x,y,axis);if(!draft.ok)return draft;
    for(const[id,n]of Object.entries(draft.cost))this.resources[id]-=n;
    let b;
    if(kind==='shelter'&&!this.shelter.reserved){b=this.shelter;Object.assign(b,draft,{id:'home-1'});}
    else{b={...draft,id:`site-${this.nextBuilding++}`};this.buildings.push(b);}
    delete b.ok;delete b.reason;Object.assign(b,{reserved:true,complete:false,progress:0,contributions:Object.fromEntries(this.people.map(p=>[p.id,0]))});
    this.emit(`${BUILD_TYPES[kind].name}: materiales reservados. La obra espera constructores.`);return {ok:true,building:b};
  },
  assignBuilders(id){const b=this.project(id);if(!b||b.complete)return 0;let count=0;for(const p of this.people)if(p.stage!=='child'&&(!p.job||p.job.automatic&&['wander','rest'].includes(p.job.kind))&&this.assign(p.id,b.kind,{buildingId:id}).ok)count++;return count;},
  cancelBuilding(id){
    const b=this.project(id);if(!b?.reserved||b.complete)return false;
    for(const p of this.people)if(['shelter','bridge','furnace','workshop'].includes(p.job?.kind)&&this.jobProject(p.job)===b)this.stop(p.id);
    for(const[k,n]of Object.entries(b.cost))this.resources[k]+=n;
    if(b===this.shelter){const position={x:b.x,y:b.y};Object.assign(b,createShelter(),position);}else this.buildings=this.buildings.filter(p=>p!==b);
    this.emit('Obra cancelada. Materiales devueltos una sola vez.');return true;
  },
};
