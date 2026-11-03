import { Simulation } from './simulation.js';
export const SAVE_KEY = 'sidecity-civilization-v1';
export function loadSimulation(world, storage) {
  let exists = false;
  for (const key of [SAVE_KEY, `${SAVE_KEY}-backup`]) {
    try { const raw = storage.getItem(key); if (!raw) continue; exists = true; return { simulation: Simulation.restore(world, JSON.parse(raw)), recovered: key.endsWith('backup'), blocked: false }; } catch { exists = true; }
  }
  return { simulation: new Simulation(world), recovered: false, blocked: exists };
}
export function saveSimulation(simulation, storage) {
  const json = JSON.stringify(simulation.snapshot());
  // Validate the new snapshot before touching the current or backup slots.
  Simulation.restore(simulation.world, JSON.parse(json));
  const previous = storage.getItem(SAVE_KEY);
  if (previous) {
    try { Simulation.restore(simulation.world, JSON.parse(previous)); storage.setItem(`${SAVE_KEY}-backup`, previous); } catch { /* Preserve the last valid backup. */ }
  }
  storage.setItem(SAVE_KEY, json);
}
