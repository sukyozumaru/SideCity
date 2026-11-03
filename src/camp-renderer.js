import { project } from './core.js';
export function drawShelter(ctx, shelter, selected = false) {
  if (!shelter.reserved) return;
  const point = (x, y, height = 0) => { const p = project(x, y); return { x: p.x, y: p.y - height }; };
  const polygon = (points, fill, stroke) => { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } };
  const line = (a, b, color, width = 2) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
  const { x, y, width: w, height: h, progress } = shelter;
  const a = point(x, y), b = point(x + w, y), c = point(x + w, y + h), d = point(x, y + h);
  ctx.save(); ctx.lineJoin = 'round';
  polygon([a, b, c, d], '#a69669', selected ? '#edf0c4' : '#7c8c55');
  for (let i = 0; i < 8; i++) line(point(x, y + i / 4), point(x + w, y + i / 4), '#bca77a', 1);
  const postHeight = 16 + Math.min(progress / .25, 1) * 49;
  for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) line(point(px, py), point(px, py, postHeight), '#796344', 6);
  if (progress > .25) {
    const wall = Math.min((progress - .25) / .35, 1) * 62;
    polygon([d, c, point(x + w, y + h, wall), point(x, y + h, wall)], '#ad8c5b');
    polygon([c, b, point(x + w, y, wall), point(x + w, y + h, wall)], '#8e7752');
    for (let i = 1; i < 8; i++) { const py = y + i / 4; line(point(x + w, py), point(x + w, py, wall), '#796b4a', 1); const px = x + i / 4; line(point(px, y + h), point(px, y + h, wall), '#bd9d68', 1); }
    if (progress > .5) {
      polygon([point(x + .55, y + h), point(x + 1.1, y + h), point(x + 1.1, y + h, 42), point(x + .55, y + h, 42)], '#544c36');
      line(point(x + .55, y + h), point(x + .55, y + h, 42), '#d0b17b', 3);
      polygon([point(x + w, y + .45, 29), point(x + w, y + 1.1, 29), point(x + w, y + 1.1, 48), point(x + w, y + .45, 48)], '#53624b');
    }
  }
  const ridgeA = point(x, y + 1, 108), ridgeB = point(x + w, y + 1, 108);
  if (progress > .58) {
    line(point(x, y, 66), ridgeA, '#826849', 4); line(ridgeA, point(x, y + h, 66), '#826849', 4);
    line(point(x + w, y, 66), ridgeB, '#826849', 4); line(ridgeB, point(x + w, y + h, 66), '#826849', 4);
    line(ridgeA, ridgeB, '#796344', 5);
  }
  if (progress > .72) {
    polygon([point(x - .12, y - .12, 66), point(x + w + .12, y - .12, 66), ridgeB, ridgeA], '#9b8958');
    polygon([ridgeA, ridgeB, point(x + w + .12, y + h + .12, 66), point(x - .12, y + h + .12, 66)], '#c0a46b');
    for (let i = 0; i < 18; i++) {
      const px = x - .06 + i * .12;
      line(point(px, y + 1, 107), point(px, y + h + .1, 66), i % 3 ? '#af955e' : '#d0b47b', 1.5);
    }
    line(ridgeA, ridgeB, '#dac18c', 3);
  }
  if (shelter.complete) {
    for (const [mx, my] of [[x + .5, y + h + .5], [x + 1.5, y + h + .5], [x + w + .5, y + 1.5]]) {
      const p = project(mx, my);
      polygon([{x:p.x-16,y:p.y},{x:p.x,y:p.y-7},{x:p.x+16,y:p.y},{x:p.x,y:p.y+7}], '#bba776', '#a18f61');
    }
  } else {
    const p = project(x + 1, y + h + .25); ctx.fillStyle = '#314b36'; ctx.fillRect(p.x - 38, p.y + 6, 76, 5); ctx.fillStyle = '#b3c77e'; ctx.fillRect(p.x - 38, p.y + 6, 76 * progress, 5);
  }
  ctx.restore();
}
