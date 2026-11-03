import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
await mkdir(dist,{recursive:true});
await cp(new URL('index.html',root),new URL('index.html',dist));
await cp(new URL('src/',root),new URL('src/',dist),{recursive:true});
console.log('SideCity static build: '+fileURLToPath(dist));
