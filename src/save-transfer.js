import { createWorld } from './core.js';
import { Simulation } from './simulation.js';
export function readSaveFile(text){
  if(typeof text!=='string'||text.length>2_000_000)throw new Error('Usa una partida JSON de SideCity de menos de 2 MB.');
  const data=JSON.parse(text);
  if(!Number.isInteger(data.seed)||data.seed<1||data.seed>2147483647)throw new Error('La semilla de la partida no es válida.');
  return Simulation.restore(createWorld(data.seed),data);
}
export function writeSaveFile(simulation){
  const json=JSON.stringify(simulation.snapshot());readSaveFile(json);return json;
}
