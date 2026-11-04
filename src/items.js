// One catalogue drives stock, recipes and costs. Counts live in Simulation.resources.
export const ITEM_GROUPS = { materials: 'Materiales', food: 'Alimentos', tools: 'Herramientas', knowledge: 'Saber' };
export const ITEMS = {
  bronze:{name:'Bronce',group:'materials',icon:'bronze',source:'Fundir 3 minerales de cobre + 1 de estaño + 1 carbón en un horno terminado.',use:'Cada colada produce 2 lingotes; permite construir el taller y mejorar herramientas.'},
  bronzeAxe:{name:'Hacha de bronce',group:'tools',icon:'bronzeAxe',source:'Taller: 2 bronce + 2 madera.',use:'Herramienta compartida: +40% al talar. Sustituye la bonificación de piedra.'},
  bronzePick:{name:'Pico de bronce',group:'tools',icon:'bronzePick',source:'Taller: 3 bronce + 2 madera.',use:'Herramienta compartida: +35% al extraer piedra, carbón, cobre y estaño.'},
  wood: { name: 'Madera', group: 'materials', icon: 'wood', source: 'Talar árboles o recoger ramas.', use: 'Refugio, fogón, herramientas y nuevos sectores.' },
  stone: { name: 'Piedra', group: 'materials', icon: 'stone', source: 'Recoger piedritas o extraer roca con un pico.', use: 'Primeras herramientas de piedra.' },
  coal: { name: 'Carbón', group: 'materials', icon: 'coal', source: 'Extraer una veta con un pico.', use: 'Combustible: 1 por colada de bronce.' },
  copperOre: { name: 'Mineral de cobre', group: 'materials', icon: 'ore', source: 'Extraer una veta con un pico.', use: '3 cobre + 1 estaño + 1 carbón → 2 bronce en el horno.' },
  tinOre: { name: 'Mineral de estaño', group: 'materials', icon: 'ore', source: 'Extraer una veta con un pico.', use: 'Se combina con cobre y carbón en el horno.' },
  rawFood: { name: 'Bayas', group: 'food', icon: 'berries', source: 'Recolectar en los arbustos.', use: 'Comer (+10 energía) o cocinar con 1 madera.' },
  seeds: { name:'Semillas',group:'food',icon:'seeds',source:'Seis semillas iniciales; separar 2 de 2 bayas o recuperar 2 al cosechar.',use:'Sembrar una parcela consume 1 al terminar.' },
  vegetables: { name:'Raíces',group:'food',icon:'roots',source:'Cosechar un huerto maduro: 4 raíces.',use:'Comer (+15 energía) o cocinar con 1 madera.' },
  meals: { name: 'Comidas', group: 'food', icon: 'meal', source: 'Cocinar 1 baya o raíz y 1 madera en el fogón.', use: 'Comer (+25 energía). Se usan antes que las raíces y bayas.' },
  stoneAxe: { name: 'Hacha de piedra', group: 'tools', icon: 'axe', source: 'Fabricar con 2 madera y 1 piedra.', use: 'Herramienta común: +15% de eficiencia al talar.' },
  stonePick: { name: 'Pico de piedra', group: 'tools', icon: 'pick', source: 'Fabricar con 3 madera y 2 piedra.', use: 'Herramienta común: permite extraer piedra, carbón, cobre y estaño.' },
  knowledge: { name: 'Saber', group: 'knowledge', icon: 'knowledge', source: 'Estudiar: 1 saber por trabajo.', use: 'Investigar el fuego y abrir sectores. Gastarlo conserva los descubrimientos.' },
};
export const RECIPES = {
  smeltBronze:{output:'bronze',amount:2,repeatable:true,cost:{copperOre:3,tinOre:1,coal:1},station:'furnace',seconds:14},
  craftBronzeAxe:{output:'bronzeAxe',cost:{bronze:2,wood:2},station:'workshop',seconds:11},
  craftBronzePick:{output:'bronzePick',cost:{bronze:3,wood:2},station:'workshop',seconds:13},
  craftAxe: { output: 'stoneAxe', cost: { wood: 2, stone: 1 }, seconds: 7 },
  craftPick: { output: 'stonePick', cost: { wood: 3, stone: 2 }, seconds: 9 },
};
export const MINERAL_ITEMS = { stone: 'stone', coal: 'coal', copper: 'copperOre', tin: 'tinOre' };
export const costText = cost => Object.entries(cost).map(([id,n]) => `${n} ${ITEMS[id].name.toLowerCase()}`).join(' + ');
export const recipeReason = (resources, id) => {
  const recipe = RECIPES[id];
  if (!recipe) return 'Receta desconocida.';
  if (!recipe.repeatable && resources[recipe.output] > 0) return 'La comunidad ya tiene esta herramienta.';
  return Object.entries(recipe.cost).every(([item,n]) => resources[item] >= n) ? '' : `Necesitas ${costText(recipe.cost)}.`;
};
export const stockGroups = resources => Object.entries(ITEM_GROUPS).map(([id,name]) => ({ id, name, items: Object.entries(ITEMS).filter(([,item]) => item.group === id).map(([id,item]) => ({ id, ...item, count: resources[id] || 0 })) }));
