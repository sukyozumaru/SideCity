export const WORLD_WIDTH = 96;
export const WORLD_HEIGHT = 72;
export const SECTOR_SIZE = 12;
export const MINERALS = {
  stone: { name: 'Piedra', color: '#a5a58e', detail: 'Extraíble con un pico de piedra. Material para las primeras herramientas.' },
  coal: { name: 'Carbón', color: '#485449', detail: 'Extraíble con un pico de piedra. Reserva de combustible para la futura fundición.' },
  iron: { name: 'Hierro', color: '#9b7661', detail: 'Veta de hierro. Requerirá minería y fundición.' },
  copper: { name: 'Cobre', color: '#9c8764', detail: 'Mineral extraíble con un pico de piedra. La futura fundición permitirá hacer aleaciones.' },
  tin: { name: 'Estaño', color: '#a4b2a7', detail: 'Mineral extraíble con un pico de piedra. Materia prima para el futuro bronce.' },
  silver: { name: 'Plata', color: '#c4d0c6', detail: 'Metal de intercambio y artesanía para eras posteriores.' },
};
export const initialSectors = () => Array.from({ length: 16 }, (_, i) => `${i % 4},${Math.floor(i / 4)}`);
export const sectorOf = (x, y) => ({ x: Math.floor(x / SECTOR_SIZE), y: Math.floor(y / SECTOR_SIZE) });
export function generateTerrain(seed, hash) {
  const width = WORLD_WIDTH, height = WORLD_HEIGHT, tiles = [], trees = [], minerals = [], scatter = [];
  const original = seed === 48128, phase = original ? .4 : hash(5, 8, seed) * 6;
  const riverAt = x => { const v = (original ? 24 : 26) + Math.sin(x * .14 + phase) * (original ? 5 : 4) + Math.sin(x * .31 + (original ? 0 : phase)) * 1.1; return !original && x > 15 && x < 27 ? Math.max(25, v) : v; };
  const lake = { x: 67 + Math.floor(hash(8, 9, seed) * 8), y: 50 + Math.floor(hash(9, 8, seed) * 6), rx: 7 + hash(3, 8, seed) * 3, ry: 5 + hash(4, 8, seed) * 2 };
  const mineralIndex = new Map();
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const distance = Math.abs(y + .5 - riverAt(x)), lakeDistance = Math.hypot((x + .5 - lake.x) / lake.rx, (y + .5 - lake.y) / lake.ry);
    const stream = y >= riverAt(lake.x) - 1 && y <= lake.y && Math.abs(x + .5 - lake.x - Math.sin(y * .13) * 2);
    const water = distance < 2.7 || lakeDistance < 1 || stream !== false && stream < 1.7;
    const bank = distance < 3.9 || lakeDistance < 1.18 || stream !== false && stream < 2.6;
    const type = water ? 'water' : bank ? 'bank' : 'grass', clearing = Math.hypot(x - 20, y - 16) < 6.8;
    const forest = Math.sin(x * .22 + (original ? 0 : phase)) * Math.cos(y * .19) > -.1;
    let tree = type === 'grass' && !clearing && hash(x, y, seed) > (forest ? .70 : .95);
    const v = hash(x + 200, y, seed);
    if (type === 'grass' && !clearing && (!original || x >= 48 || y >= 48) && hash(x + 345, y + 11, seed) > .989) {
      const kinds = ['stone','coal','iron','copper','tin','silver'], kind = kinds[Math.min(5, Math.floor(hash(x + 430, y, seed) * 6))];
      minerals.push({ x, y, kind, richness: 20 + Math.floor(v * 20) }); mineralIndex.set(`${x},${y}`, minerals.at(-1)); tree = false;
    }
    const tile = { x, y, type, tree, variation: v, biome: clearing ? 'meadow' : forest ? 'woodland' : 'grassland' };
    tiles.push(tile);
    if (tree) trees.push({ x: x + .3 + hash(x, y + 50, seed) * .4, y: y + .3 + hash(x + 60, y, seed) * .4, variant: Math.floor(hash(x + 44, y, seed) * 6) });
    if (type === 'grass' && !tree && !mineralIndex.has(`${x},${y}`) && hash(x + 1200, y, seed) > .965 && !(x >= 19 && x <= 22 && y >= 14 && y <= 17)) scatter.push({ x, y, kind: v > .5 ? 'sticks' : 'pebbles' });
  }
  // A small, fair supply near the founders, independent of distant ore distribution.
  for (const [x,y,kind] of [[18,18,'sticks'],[22,20,'pebbles'],[19,18,'sticks'],[23,17,'pebbles']]) if (tiles[y*width+x].type !== 'water' && !scatter.some(s=>s.x===x&&s.y===y)) scatter.push({x,y,kind});
  trees.sort((a,b)=>a.x+a.y-b.x-b.y);
  return { seed, width, height, tiles, trees, minerals, scatter, lake,
    mineralAt(x,y) { return mineralIndex.get(`${x},${y}`); },
    get(x,y) { return Number.isInteger(x) && Number.isInteger(y) && x>=0 && y>=0 && x<width && y<height ? tiles[y*width+x] : null; } };
}
