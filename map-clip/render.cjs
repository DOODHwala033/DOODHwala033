// Serves the scene, renders frames deterministically with headless Chromium, writes PNGs.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = __dirname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(8765, r));
  const [, , mode = 'all', fps = '30'] = process.argv;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('page:', m.text()));
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('http://localhost:8765/scene.html');
  await page.waitForFunction('window.ready === true', null, { timeout: 240000 });
  const out = path.join(root, 'frames'); fs.mkdirSync(out, { recursive: true });
  const times = mode === 'test' ? [0.3, 2.5, 4.9] : Array.from({ length: 5 * +fps }, (_, i) => i / +fps);
  let i = 0; const t0 = Date.now();
  for (const t of times) {
    await page.evaluate(t => window.renderAt(t), t);
    const name = mode === 'test' ? `test_${t}.png` : `f_${String(i).padStart(4, '0')}.png`;
    await page.screenshot({ path: path.join(out, name), type: 'png' });
    i++; if (i % 15 === 0) console.log(`${i}/${times.length} ${(Date.now() - t0) / 1000}s`);
  }
  await browser.close(); server.close();
})();
