export const SHELTER_COST = 20;
export const SHELTER_WORK = 36;
export const createShelter = () => ({ id:'home-1',kind:'shelter',cost:{wood:SHELTER_COST},work:SHELTER_WORK,x: 19, y: 14, width: 2, height: 2, reserved: false, complete: false, progress: 0, contributions: { ana: 0, ivo: 0, nara: 0 } });
export const insideShelter = (s, x, y) => x >= s.x && x < s.x + s.width && y >= s.y && y < s.y + s.height;
export const shelterPlaces = s => [{ x: s.x, y: s.y + s.height }, { x: s.x + 1, y: s.y + s.height }, { x: s.x + s.width, y: s.y + 1 }];
