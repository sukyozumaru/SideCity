export const FARM_TASKS={
 preparePlot:{action:'Preparar tierra',skill:'farming',category:'farm',seconds:6,detail:'Afloja la tierra de una parcela marcada para cultivar.'},
 sow:{action:'Sembrar',skill:'farming',category:'farm',seconds:4,detail:'Planta 1 semilla. La semilla se usa al terminar.'},
 waterPlot:{action:'Regar',skill:'farming',category:'farm',seconds:4,detail:'Busca agua en una orilla y vuelve a regar el huerto.'},
 harvest:{action:'Cosechar',skill:'farming',category:'farm',seconds:5,detail:'Recoge 4 raíces y recupera 2 semillas.'},
 extractSeeds:{action:'Separar semillas',skill:'farming',category:'farm',seconds:5,detail:'Separa 2 semillas a partir de 2 bayas.'},
};
export const FARM_GROWTH_SECONDS=150, WATER_USE=.35;
export const plotStage=p=>p.stage==='wild'?'Sin preparar':p.stage==='prepared'?'Lista para sembrar':p.growth>=1?'Lista para cosechar':p.moisture<=0?'Necesita agua':p.growth<.3?'Brotando':p.growth<.7?'Creciendo':'Madurando';
export const nextFarmTask=p=>p.stage==='wild'?'preparePlot':p.stage==='prepared'?'sow':p.growth>=1?'harvest':'waterPlot';
const neighbours=(x,y)=>[[x+1,y],[x,y+1],[x-1,y],[x,y-1]].map(([x,y])=>({x,y}));
export const farmingMethods={
 plot(id){return this.plots.find(p=>p.id===id);},plotAt(x,y){return this.plots.find(p=>p.x===x&&p.y===y);},
 farmPreview(x,y){
  const fail=reason=>({ok:false,reason,x,y}),tile=this.world.get(x,y);
  if(!Number.isInteger(x)||!Number.isInteger(y)||!tile||!this.isUnlocked(x,y))return fail('Elige tierra del territorio abierto.');
  if(this.plots.length>=24)return fail('Este campamento admite hasta 24 parcelas de cultivo.');
  if(!this.walkable(tile)||this.occupiedByBuilding(x,y)||x===21&&y===16||x===22&&y===16||this.hasBridge(x,y))return fail('Busca suelo seco, libre y fuera de los accesos.');
  if(this.people.some(p=>Math.floor(p.x)===x&&Math.floor(p.y)===y||p.job?.target.x===x&&p.job?.target.y===y))return fail('Hay un habitante o un trabajo en ese lugar.');
  if(this.world.scatter.some(s=>s.x===x&&s.y===y&&!this.scavenged.has(`${x},${y}`)))return fail('Recoge primero las ramas o piedras del suelo.');
  const stations=neighbours(x,y).filter(t=>this.walkable(this.world.get(t.x,t.y)));
  if(this.plots.some(p=>neighbours(p.x,p.y).filter(t=>(t.x!==x||t.y!==y)&&this.walkable(this.world.get(t.x,t.y))).length===0))return fail('Deja un acceso libre a los otros huertos.');
  if(stations.length<2||!this.people.some(p=>p.stage==='adult'&&stations.some(t=>this.route(p,t))))return fail('Deja al menos dos lados libres y acceso para un adulto.');
  return{ok:true,reason:'Una parcela · sin coste de marcado · necesita preparar la tierra.',x,y};
 },
 createPlot(x,y){const preview=this.farmPreview(x,y);if(!preview.ok)return preview;const plot={id:`plot-${this.nextPlot++}`,x,y,stage:'wild',growth:0,moisture:0,harvests:0};this.plots.push(plot);this.emit('Parcela de cultivo marcada. Ya se puede preparar la tierra.');return{ok:true,plot};},
 farmReason(kind,destination){
  if(kind==='extractSeeds')return this.resources.rawFood>=2?'':'Necesitas 2 bayas para separar semillas.';
  const eligible=p=>kind==='preparePlot'?p.stage==='wild':kind==='sow'?p.stage==='prepared':kind==='harvest'?p.stage==='growing'&&p.growth>=1:p.stage==='growing'&&p.growth<1&&p.moisture<85;
  const p=destination?.plotId?this.plot(destination.plotId):this.plots.find(eligible);
  if(!p)return this.plots.length?'No hay una parcela en esa etapa.':'Marca primero un huerto desde Cultivar.';
  if(!eligible(p))return kind==='waterPlot'&&p.moisture>=85?'La tierra ya tiene agua suficiente.':'La parcela está en otra etapa.';
  if(kind==='sow'&&this.resources.seeds<1)return 'No quedan semillas. Puedes separar 2 con 2 bayas.';
  return '';
 },
 farmCandidates(person,kind,preferred){
  if(kind==='extractSeeds')return[{x:Math.floor(person.x),y:Math.floor(person.y)}];
  const plots=this.plots.filter(p=>(!preferred?.plotId||p.id===preferred.plotId)&&!this.farmReason(kind,{plotId:p.id})&&!this.people.some(q=>q!==person&&q.job?.source?.plotId===p.id));
  const candidates=[];
  for(const plot of plots){
   if(kind==='waterPlot'&&preferred?.fetch!==false){const water=this.nearest(person,'drink');if(water)candidates.push({x:water.x,y:water.y,source:{x:plot.x,y:plot.y,plotId:plot.id,fetch:true,waterX:water.source.x,waterY:water.source.y}});}
   else for(const station of neighbours(plot.x,plot.y))if(this.walkable(this.world.get(station.x,station.y)))candidates.push({...station,source:{x:plot.x,y:plot.y,plotId:plot.id,...(kind==='waterPlot'?{fetch:false}:{})}});
  }
  return candidates;
 },
 completeFarm(person){
  const job=person.job,kind=job.kind,p=this.plot(job.source?.plotId),reason=this.farmReason(kind,job.source);if(reason)return{ok:false,reason};
  if(kind==='waterPlot'&&job.source.fetch){
   const next=this.nearest(person,'waterPlot',{...job.source,fetch:false});if(!next)return{ok:false,reason:'No se puede volver a la parcela.'};job.target={x:next.x,y:next.y};job.source=next.source;job.path=next.path;person.state='Caminando';this.revision++;return{ok:true,continue:true};
  }
  let outcome='';
  if(kind==='preparePlot'){p.stage='prepared';outcome='Tierra preparada';}
  if(kind==='sow'){this.resources.seeds--;p.stage='growing';p.growth=0;p.moisture=0;outcome='Semillas plantadas';}
  if(kind==='waterPlot'){p.moisture=100;outcome='Tierra regada';}
  if(kind==='harvest'){this.resources.vegetables+=4;this.resources.seeds+=2;p.stage='prepared';p.growth=0;p.moisture=0;p.harvests++;person.mood=Math.min(100,person.mood+8);outcome='+4 raíces · +2 semillas';this.remember(person,'harvest','La primera cosecha da ganas de seguir.',5);}
  if(kind==='extractSeeds'){this.resources.rawFood-=2;this.resources.seeds+=2;outcome='+2 semillas';}
  this.award(person,'farming',outcome,kind);this.feedback.push({kind,x:person.x,y:person.y,time:this.time,outcome});return{ok:true};
 },
 updateFarms(dt){for(const p of this.plots)if(p.stage==='growing'){const wet=Math.min(dt,p.moisture/WATER_USE);p.moisture=Math.max(0,p.moisture-dt*WATER_USE);if(p.growth<1){const before=p.growth;p.growth=Math.min(1,p.growth+wet/FARM_GROWTH_SECONDS);if(before<1&&p.growth>=1)this.emit('Un huerto está listo para cosechar.');}}},
};
