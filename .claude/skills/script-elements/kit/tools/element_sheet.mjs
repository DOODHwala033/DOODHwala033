// tools/element_sheet.mjs — preview every generated element in 3 looks (colour, silhouette + rim, line) as one PNG.
//   node tools/element_sheet.mjs --project projects/<slug>   ->  projects/<slug>/build/elements_sheet.png
import fs from 'fs'; import path from 'path'; import { chromium } from 'playwright';
const i = process.argv.indexOf('--project'); const P = process.argv[i + 1];
const src = fs.readFileSync(path.join(P, 'scenes', '_elements.gen.js'), 'utf8');
const lib = JSON.parse(src.match(/ELEMENTS = (.*);\n/)[1]);
const names = Object.keys(lib), cell = 220, cols = 3, W = cell * cols + 260, H = Math.max(1, names.length) * cell;
const html = `<canvas id=c width=${W} height=${H}></canvas><script>
const L=${JSON.stringify(lib)}, N=${JSON.stringify(names)}, g=document.getElementById('c').getContext('2d');
g.fillStyle='#16121e'; g.fillRect(0,0,${W},${H}); g.font='600 22px sans-serif'; g.textBaseline='middle';
function draw(el,x,y,s,mode){ g.save(); const sc=s/Math.max(el.w,el.h); g.translate(x,y); g.scale(sc,sc); g.translate(-el.w/2,-el.h/2);
 const pass=(m,col)=>{ for(const o of el.ops){ g.save(); if(o.m) g.transform(...o.m); if(o.a!=null) g.globalAlpha*=o.a; const p=new Path2D(o.d);
  const c=(v)=>m==='color'?(v==='currentColor'?'#f2e6c8':v):col;
  if(o.f){ g.fillStyle=c(o.f); g.fill(p,o.r?'evenodd':'nonzero'); } if(o.s){ g.strokeStyle=c(o.s); g.lineWidth=o.w; g.lineCap=g.lineJoin='round'; g.stroke(p);} g.restore(); } };
 if(mode==='sil'){ g.save(); g.translate(0,-el.h*0.03); pass('mono','#ffc68a'); g.restore(); pass('mono','#0e0b12'); }
 else if(mode==='line'){ pass('mono','#7fc4ff'); } else pass('color'); g.restore(); }
N.forEach((n,r)=>{ const y=r*${cell}+${cell}/2; g.fillStyle='#f2e6c8'; g.fillText(n,16,y-14); g.fillStyle='#8a80a0'; g.font='15px sans-serif'; g.fillText(L[n].pack+':'+L[n].icon,16,y+16); g.font='600 22px sans-serif';
 ['color','sil','line'].forEach((m,k)=>{ const x=260+k*${cell}+${cell}/2; g.fillStyle=m==='sil'?'#4a3646':'#221c2c'; g.fillRect(x-${cell}/2+8,y-${cell}/2+8,${cell}-16,${cell}-16); draw(L[n],x,y,${cell}*0.62,m); }); });
</script>`;
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
await pg.setContent(html); fs.mkdirSync(path.join(P, 'build'), { recursive: true });
await (await pg.$('#c')).screenshot({ path: path.join(P, 'build', 'elements_sheet.png') }); await b.close();
console.log(`${names.length} element(s) -> ${path.join(P, 'build', 'elements_sheet.png')}`);
