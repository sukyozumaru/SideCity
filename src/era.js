export function eraState(sim) {
  const total = skill => sim.people.reduce((n,p)=>n+p.skills[skill].completed,0);
  const milestones = [
    { label: 'Reconocer una parcela nueva', done: total('exploration') >= 1 },
    { label: 'Completar tres recolecciones', done: total('foraging') >= 3 },
    { label: 'Conseguir 20 madera mediante tala', done: total('logging') >= 5 },
    { label: 'Estudiar y descubrir el fuego', done: total('study') >= 3 || sim.firepit },
    { label: 'Preparar el fogón comunitario', done: sim.firepit },
    { label: 'Terminar el primer refugio', done: sim.shelter.complete },
  ];
  const completed=milestones.filter(m=>m.done).length,percent=Math.round(completed/milestones.length*100);
  const seconds=Math.floor(sim.time),elapsed=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  return {name:'Orígenes',stage:completed<2?'Conocer el valle':completed<4?'Organizar la comunidad':completed<6?'Primer campamento':'Campamento establecido',percent,completed,milestones,year:1+Math.floor(seconds/1800),day:1+Math.floor(seconds/120)%15,elapsed};
}
