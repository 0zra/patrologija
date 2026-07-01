import fs from 'fs';
const url = new URL('../src/data/patrologija.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(url, 'utf8'));

// ---- 1. pope pontificate spans (well-known historical dates) ----
const POPE_REIGN = {
  'papa-pio-prvi': [140, 154], 'papa-aniceto': [157, 168], 'papa-soter': [166, 174],
  zefirin: [199, 217], kalist: [217, 222], poncijan: [230, 235], kornelije: [251, 253],
  damaz: [366, 384], 'leon-veliki': [440, 461], 'papa-feliks-iii': [483, 492],
  'papa-hormizda': [514, 523], 'papa-ivan-ii': [533, 535], 'papa-vigilije': [537, 555],
  'grgur-veliki': [590, 604], 'papa-honorije': [625, 638], 'papa-ivan-iv': [640, 642],
  'papa-martin-i': [649, 653], 'papa-grgur-ii': [715, 731], 'papa-grgur-iii': [731, 741],
  'papa-hadrijan-i': [772, 795], 'papa-leon-iii': [795, 816],
};
let np = 0;
for (const p of d.people) {
  const r = POPE_REIGN[p.id];
  if (Array.isArray(r)) { p.reignStart = r[0]; p.reignEnd = r[1]; np++; }
}

// ---- 2. merge the duplicate Constantinople II (553) ----
const keepId = 'ii-carigradski-koncil-553';
const dropId = 'drugi-carigradski-koncil-553';
const keep = d.events.find((e) => e.id === keepId);
const drop = d.events.find((e) => e.id === dropId);
if (keep && drop) {
  keep.participants = Array.from(new Set([...(keep.participants || []), ...(drop.participants || [])]));
  keep.heresiesCondemned = Array.from(new Set([...(keep.heresiesCondemned || []), ...(drop.heresiesCondemned || [])]));
  if ((drop.description || '').length > (keep.description || '').length) keep.description = drop.description;
  if (!keep.outcome && drop.outcome) keep.outcome = drop.outcome;
  d.events = d.events.filter((e) => e.id !== dropId);
  // remap any heresy.condemnedAt references
  for (const h of d.heresies) h.condemnedAt = (h.condemnedAt || []).map((id) => (id === dropId ? keepId : id));
}

// ---- 3. flag the 7 ecumenical councils ----
const ECUMENICAL = {
  'nicejski-koncil-325': 1, 'prvi-carigradski-koncil-381': 2, 'efeski-koncil-431': 3,
  'kalcedonski-koncil-451': 4, 'ii-carigradski-koncil-553': 5,
  'treci-carigradski-koncil-680': 6, 'drugi-nicejski-koncil-787': 7,
};
let ne = 0;
for (const e of d.events) {
  if (ECUMENICAL[e.id]) { e.ecumenical = true; e.ecumenicalNo = ECUMENICAL[e.id]; ne++; }
}

fs.writeFileSync(url, JSON.stringify(d));
fs.writeFileSync(new URL('../src/data/patrologija.pretty.json', import.meta.url), JSON.stringify(d, null, 2));
console.log('pope reigns:', np, '| ecumenical flagged:', ne, '| events now:', d.events.length);
