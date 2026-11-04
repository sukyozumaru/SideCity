// Sprites are sampled at or above their final physical pixel size, never enlarged.
export const rasterDensity=(zoom,dpr)=>Math.max(1,Math.ceil(zoom*dpr));
export function matrixStretch({a,b,c,d}){
  const sum=a*a+b*b+c*c+d*d,det=a*d-b*c;
  return Math.sqrt((sum+Math.sqrt(Math.max(0,sum*sum-4*det*det)))/2);
}
export class RasterCache extends Map{
  constructor(maxPixels){super();this.maxPixels=maxPixels;this.pixels=0;}
  get(key){const value=super.get(key);if(value){super.delete(key);super.set(key,value);}return value;}
  set(key,value){this.delete(key);const cost=value.width*value.height;if(cost>this.maxPixels)return this;super.set(key,value);this.pixels+=cost;while(this.pixels>this.maxPixels)this.delete(this.keys().next().value);return this;}
  delete(key){const value=super.get(key);if(value)this.pixels-=value.width*value.height;return super.delete(key);}
  clear(){super.clear();this.pixels=0;}
}
