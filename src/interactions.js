import {MINERALS} from './terrain.js';
export function pickObject(camera,sim,sx,sy,{people=true}={}){
 const grid=camera.screenToGrid(sx,sy),tile=sim.world.get(Math.floor(grid.x),Math.floor(grid.y));
 const candidates=[],hit=(type,item,x,y,w,h,offset=0)=>{const p=camera.gridToScreen(x,y),z=camera.zoom;if(Math.abs(sx-p.x)<=w*z&&sy>=p.y-h*z&&sy<=p.y+offset*z)candidates.push({type,item,x:Math.floor(x),y:Math.floor(y),depth:camera.projectGrid(x,y).y});};
 if(people)for(const p of sim.people){const q=camera.gridToScreen(p.x,p.y,personHeight(p));if(Math.hypot(q.x-sx,q.y-sy)<Math.max(18,18*camera.zoom))candidates.push({type:'person',item:p,x:Math.floor(p.x),y:Math.floor(p.y),depth:1e9});}
 if(people&&candidates.some(c=>c.type==='person'))return candidates.find(c=>c.type==='person');
 const bridge=tile&&sim.buildings.find(b=>b.kind==='bridge'&&b.reserved&&tile.x>=b.x&&tile.x<b.x+b.width&&tile.y>=b.y&&tile.y<b.y+b.height);if(bridge)return{type:'bridge',item:bridge,x:tile.x,y:tile.y};
 for(const b of sim.buildings)if(b.kind==='shelter'&&b.reserved){const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].flatMap(([x,y])=>[camera.gridToScreen(x,y),camera.gridToScreen(x,y,108)]);if(sx>=Math.min(...points.map(p=>p.x))&&sx<=Math.max(...points.map(p=>p.x))&&sy>=Math.min(...points.map(p=>p.y))&&sy<=Math.max(...points.map(p=>p.y)))candidates.push({type:'shelter',item:b,x:b.x,y:b.y,depth:camera.projectGrid(b.x+b.width/2,b.y+b.height/2).y});}
 for(const t of sim.world.trees)if(sim.isUnlocked(t.x,t.y)&&sim.standing(Math.floor(t.x),Math.floor(t.y)))hit('tree',t,t.x,t.y,34,132,5);
 for(const b of sim.shrubs)hit('bush',b,b.x+.5,b.y+.5,22,30,6);
 for(const m of sim.world.minerals)if(sim.isUnlocked(m.x,m.y)&&sim.mineralRemaining(m))hit('mineral',m,m.x+.5,m.y+.5,24,36,5);
 candidates.sort((a,b)=>b.depth-a.depth);if(candidates.length)return candidates[0];
 if(!tile)return null;
 if(!sim.isUnlocked(tile.x,tile.y))return{type:'locked',x:tile.x,y:tile.y};
 const scatter=sim.world.scatter.find(s=>s.x===tile.x&&s.y===tile.y&&!sim.scavenged.has(`${s.x},${s.y}`));if(scatter)return{type:'scatter',item:scatter,x:tile.x,y:tile.y};
 if(tile.x===21&&tile.y===16)return{type:'fire',x:tile.x,y:tile.y};
 return{type:tile.type==='water'?'water':'ground',x:tile.x,y:tile.y};
}
const personHeight=p=>p.stage==='child'?22:28;
export function describeObject(target,sim){
 const t=target,b=t.item;
 if(t.type==='person')return{name:b.name,detail:b.stage==='child'?'Infancia · los oficios se abren al crecer.':`${b.state} · agua ${Math.round(b.needs.water)}% · energía ${Math.round(b.needs.energy)}%`,actions:[{label:'Conversar',task:'social',target:{personId:b.id},detail:'+12 vínculo al completar la conversación.'}]};
 if(t.type==='tree')return{name:'Árbol del valle',detail:`${sim.timber.get(`${t.x},${t.y}`)||0} talas disponibles · 4 madera por trabajo`,actions:[{label:'Talar este árbol',task:'logging',target:{x:t.x,y:t.y},detail:'La experiencia y la madera llegan al terminar cada trabajo.'}]};
 if(t.type==='bush')return{name:'Arbusto de bayas',detail:`${b.remaining} bayas disponibles`,actions:[{label:'Recolectar aquí',task:'foraging',target:{x:b.x,y:b.y},reason:b.remaining?'':'Este arbusto está agotado.',detail:'Una baya por trabajo completado.'}]};
 if(t.type==='mineral')return{name:MINERALS[b.kind].name,detail:`${sim.mineralRemaining(b)} reservas · ${MINERALS[b.kind].detail}`,actions:[{label:'Extraer esta veta',task:'mining',target:{x:b.x,y:b.y},reason:['iron','silver'].includes(b.kind)?'Requiere herramientas de una tecnología posterior.':'',detail:'Hasta dos materiales por trabajo.'}]};
 if(['shelter','bridge'].includes(t.type))return{name:t.type==='bridge'?'Puente de madera':'Refugio de paja',detail:b.complete?(t.type==='bridge'?'Paso abierto entre orillas.':'Terminado · tres plazas de descanso.'):`Obra ${Math.floor(b.progress*100)}% · materiales reservados`,actions:[b.complete?(t.type==='bridge'?{label:'Cruzar al otro extremo',task:'cross',detail:'Camina hasta la orilla opuesta.'}:{label:'Dormir aquí',task:'sleep',target:{buildingId:b.id},detail:'Camina a una plaza disponible y recupera energía.'}):{label:'Trabajar en esta obra',task:b.kind,target:{buildingId:b.id},detail:'Continúa sin pagar materiales otra vez.'}]};
 if(t.type==='scatter')return{name:b.kind==='sticks'?'Ramas del suelo':'Piedras del suelo',detail:'Un grupo recogible de madera o piedra.',actions:[{label:'Recoger este grupo',task:'scavenge',target:{x:b.x,y:b.y},detail:'Se recoge una sola vez.'}]};
 if(t.type==='water')return{name:'Orilla y agua',detail:'Los habitantes beben desde una parcela seca contigua.',actions:[{label:'Beber aquí',task:'drink',target:{x:t.x,y:t.y},detail:'Recupera hidratación, sin XP de oficio.'}]};
 if(t.type==='fire')return{name:sim.firepit?'Fogón encendido':'Lugar del fogón',detail:sim.firepit?'Convierte bayas y combustible en comidas.':'Primero estudia el fuego y prepara el fogón.',actions:[{label:sim.firepit?'Cocinar':'Preparar fogón',task:sim.firepit?'cooking':'building',detail:sim.firepit?'Una baya + una madera por comida.':'5 madera y el descubrimiento del fuego.'}]};
 return{name:'Parcela libre',detail:'Tierra para caminar, observar o descansar.',actions:[{label:'Ir aquí',task:'move',target:{x:t.x,y:t.y},detail:'No concede experiencia por desplazarse.'}]};
}
