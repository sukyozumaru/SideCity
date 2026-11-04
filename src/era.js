export const ERA_TIMELINE=[
 {id:'origins',name:'Orígenes',icon:'seed',learn:'Fuego, recolección y primeros refugios.',discover:'Observar el valle y organizar a los tres fundadores.'},
 {id:'cultivation',name:'Vida sedentaria',icon:'leaf',learn:'Huertos, riego, alimentos y oficios.',discover:'Una comunidad con refugio y una cosecha puede investigar la fundición.'},
 {id:'bronze',name:'Edad del Bronce',icon:'ingot',learn:'Cobre + estaño, hornos, talleres y herramientas mejores.',discover:'Funde tu primera colada para entrar en esta era.'},
 {id:'iron',name:'Edad del Hierro',icon:'pick',learn:'Siderurgia, herramientas de hierro y nuevas técnicas agrícolas.',future:true},
 {id:'cities',name:'Ciudades y escritura',icon:'book',learn:'Leyes, comercio, registros y organización de ciudades.',future:true},
 {id:'guilds',name:'Oficios y gremios',icon:'house',learn:'Molinos, especialización y redes entre comunidades.',future:true},
 {id:'industry',name:'Era industrial',icon:'wheel',learn:'Máquinas, energía, transporte y producción.',future:true},
 {id:'modern',name:'Era moderna',icon:'globe',learn:'Ciencia, comunicaciones y ciudades conectadas.',future:true},
];
export function eraState(sim) {
  const total = skill => sim.people.reduce((n,p)=>n+p.skills[skill].completed,0);
  const origins = [
    { label: 'Reconocer una parcela nueva', done: total('exploration') >= 1 },
    { label: 'Completar tres recolecciones', done: total('foraging') >= 3 },
    { label: 'Conseguir 20 madera mediante tala', done: total('logging') >= 5 },
    { label: 'Estudiar y descubrir el fuego', done: total('study') >= 3 || sim.firepit },
    { label: 'Preparar el fogón comunitario', done: sim.firepit },
    { label: 'Terminar el primer refugio', done: sim.shelter.complete },
  ];
  const totalHarvests=sim.plots.reduce((n,p)=>n+p.harvests,0),metal=total('metalworking');
  const current=metal>0?2:totalHarvests>0?1:0;
  const cultivation=[
    {label:'Terminar el primer refugio',done:sim.shelter.complete},
    {label:'Recoger una cosecha',done:totalHarvests>0},
    {label:'Mantener el fogón preparado',done:sim.firepit},
    {label:'Completar seis estudios sobre el calor',done:total('study')>=6},
    {label:'Construir un horno de fundición',done:sim.buildings.some(b=>b.kind==='furnace'&&b.complete)},
    {label:'Fundir la primera colada de bronce',done:metal>0},
  ];
  const bronze=[
    {label:'Dominar la aleación de cobre y estaño',done:metal>0},
    {label:'Terminar un taller de bronce',done:sim.buildings.some(b=>b.kind==='workshop'&&b.complete)},
    {label:'Fabricar un hacha de bronce',done:sim.resources.bronzeAxe>0},
    {label:'Fabricar un pico de bronce',done:sim.resources.bronzePick>0},
  ];
  const milestones=[origins,cultivation,bronze][current];
  const completed=milestones.filter(m=>m.done).length,percent=Math.round(completed/milestones.length*100);
  const seconds=Math.floor(sim.time),elapsed=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  const stage=current===0?(completed<2?'Conocer el valle':completed<4?'Organizar la comunidad':completed<6?'Primer campamento':'Campamento establecido'):current===1?'Dominar el calor':percent===100?'Oficios del bronce consolidados':'Herramientas para una nueva era';
  return {name:ERA_TIMELINE[current].name,current,stage,percent,completed,milestones,timeline:ERA_TIMELINE.map((era,i)=>({...era,status:era.future?'En desarrollo':i<current?'Superada':i===current?'Actual':'Por descubrir'})),year:1+Math.floor(seconds/1800),day:1+Math.floor(seconds/120)%15,elapsed};
}
