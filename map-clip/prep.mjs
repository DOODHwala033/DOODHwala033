// Projects Natural Earth countries (world-atlas 50m) into map coordinates for the 3D scene.
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoConicConformal, geoPath, geoContains } from 'd3-geo';

const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const all = feature(topo, topo.objects.countries).features;

const W = 1000, H = 700;
const proj = geoConicConformal().parallels([42, 60]).rotate([-22, 0])
  .fitExtent([[0, 0], [W, H]], { type: 'MultiPoint', coordinates: [[-11, 36], [46, 36], [-8, 64], [44, 64], [18, 70]] })
  .clipExtent([[-60, -60], [W + 60, H + 60]]);

const groups = {
  france: ['France', 'Belgium', 'Netherlands', 'Luxembourg', 'Germany', 'Italy', 'Switzerland', 'Poland'],
  russia: ['Russia', 'Belarus', 'Ukraine', 'Lithuania', 'Latvia', 'Estonia', 'Finland', 'Moldova', 'Georgia'],
  austria: ['Austria', 'Czechia', 'Slovakia', 'Hungary', 'Croatia', 'Slovenia'],
  britain: ['United Kingdom', 'Ireland'],
  ottoman: ['Turkey', 'Greece', 'Bulgaria', 'Serbia', 'Bosnia and Herz.', 'Albania', 'Macedonia', 'Montenegro', 'Kosovo', 'Romania'],
};
const groupOf = n => Object.keys(groups).find(k => groups[k].includes(n)) || 'neutral';

function rings(geo) {
  const out = []; let cur = null;
  const ctx = {
    moveTo(x, y) { cur = [[x, y]]; out.push(cur); },
    lineTo(x, y) { cur.push([x, y]); },
    closePath() {}, arc() {}, rect() {},
  };
  geoPath(proj, ctx)(geo);
  return out.filter(r => r.length > 3).map(r => r.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]));
}

const countries = [];
for (const f of all) {
  const rs = rings(f);
  if (!rs.length) continue;
  // drop countries completely outside the extent
  const inside = rs.some(r => r.some(([x, y]) => x > -40 && x < W + 40 && y > -40 && y < H + 40));
  if (!inside) continue;
  countries.push({ name: f.properties.name, group: groupOf(f.properties.name), rings: rs });
}

const P = ll => proj(ll).map(v => +v.toFixed(2));
const cities = {
  Paris: [2.35, 48.85], Berlin: [13.4, 52.52], Warsaw: [21.01, 52.23], Vilnius: [25.28, 54.69],
  Smolensk: [32.05, 54.78], Moscow: [37.62, 55.75], London: [-0.12, 51.5], Vienna: [16.37, 48.21],
  Constantinople: [28.97, 41.01], Madrid: [-3.7, 40.42], Rome: [12.5, 41.9], 'St Petersburg': [30.3, 59.94], Kyiv: [30.52, 50.45],
};
const cityXY = Object.fromEntries(Object.entries(cities).map(([k, v]) => [k, P(v)]));

// Grande Armée route 1812: Niemen crossing at Kovno -> Vilnius -> Vitebsk -> Smolensk -> Borodino -> Moscow
const route = [[21.0, 52.6], [23.2, 54.2], [23.9, 54.9], [25.28, 54.69], [27.6, 55.0], [30.2, 55.19], [32.05, 54.78], [34.3, 55.2], [35.8, 55.52], [37.62, 55.75]].map(P);

// seeded random
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const ranges = [
  { box: [6, 45.8, 14, 47.4], n: 70 }, { box: [-1.5, 42.4, 2.8, 43.0], n: 22 },
  { box: [18.5, 47.8, 24.5, 49.6], n: 30 }, { box: [23.5, 45.3, 26.5, 47.6], n: 26 },
  { box: [40, 42.2, 46, 43.6], n: 30 }, { box: [7, 60, 15, 64], n: 40 }, { box: [19.5, 42, 23, 44], n: 22 },
];
const mountains = [];
for (const r of ranges) for (let i = 0; i < r.n; i++) {
  const ll = [r.box[0] + rnd() * (r.box[2] - r.box[0]), r.box[1] + rnd() * (r.box[3] - r.box[1])];
  mountains.push([...P(ll), +(0.4 + rnd() * 0.8).toFixed(2)]);
}

const forestLand = all.filter(f => ['Russia', 'Belarus', 'Lithuania', 'Latvia', 'Estonia', 'Poland'].includes(f.properties.name));
const routeDist = (x, y) => {
  let best = 1e9;
  for (let i = 0; i < route.length - 1; i++) {
    const [ax, ay] = route[i], [bx, by] = route[i + 1];
    const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
};
const trees = [];
let tries = 0;
while (trees.length < 1400 && tries < 60000) {
  tries++;
  const ll = [19 + rnd() * 22, 51.5 + rnd() * 8];
  if (!forestLand.some(f => geoContains(f, ll))) continue;
  const [x, y] = P(ll);
  if (routeDist(x, y) < 9) continue;
  trees.push([x, y, +(0.7 + rnd() * 0.6).toFixed(2)]);
}

fs.writeFileSync('map.json', JSON.stringify({ W, H, countries, cities: cityXY, route, mountains, trees }));
console.log('countries', countries.length, 'trees', trees.length, 'route', route.map(p => p.join(',')).join(' | '));
