import fs from 'fs';
import path from 'path';

const dir = path.resolve('./data');
const parts = ['part1','part2','part3','part4','part5','part6'].map(p =>
  JSON.parse(fs.readFileSync(path.join(dir, p + '.json'), 'utf8')));

// ---- helpers ----
const longer = (a, b) => ((b || '').length > (a || '').length ? b : a);
const uniqArr = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
function mergeByTitle(a = [], b = [], key) {
  const map = new Map();
  for (const it of [...a, ...b]) {
    if (!it) continue;
    const k = (it[key] || JSON.stringify(it)).toString().toLowerCase().trim();
    if (!map.has(k)) map.set(k, it);
    else {
      const ex = map.get(k);
      for (const f of Object.keys(it)) {
        if (!ex[f] || (typeof it[f] === 'string' && it[f].length > (ex[f] || '').length)) ex[f] = it[f];
      }
    }
  }
  return Array.from(map.values());
}

// ---- merge people ----
const people = new Map();
for (const part of parts) for (const p of part.people || []) {
  if (!p || !p.id) continue;
  if (!people.has(p.id)) { people.set(p.id, JSON.parse(JSON.stringify(p))); continue; }
  const e = people.get(p.id);
  // scalars: prefer non-null / longer
  e.name = e.name || p.name;
  e.fullName = longer(e.fullName, p.fullName);
  e.category = e.category || p.category;
  e.tradition = e.tradition || p.tradition;
  e.side = e.side || p.side;
  e.school = e.school || p.school;
  if (e.birthYear == null) e.birthYear = p.birthYear;
  if (e.deathYear == null) e.deathYear = p.deathYear;
  e.dateNote = e.dateNote || p.dateNote;
  e.floruit = e.floruit || p.floruit;
  e.feast = e.feast || p.feast;
  e.keyFact = longer(e.keyFact, p.keyFact);
  e.bio = longer(e.bio, p.bio);
  // arrays
  e.aka = uniqArr([...(e.aka||[]), ...(p.aka||[]), p.name].filter(n => n && n !== e.name));
  e.locations = uniqArr([...(e.locations||[]), ...(p.locations||[])]);
  e.language = uniqArr([...(e.language||[]), ...(p.language||[])]);
  e.titles = uniqArr([...(e.titles||[]), ...(p.titles||[])]);
  e.ordinations = mergeByTitle(e.ordinations, p.ordinations, 'type');
  e.teachings = mergeByTitle(e.teachings, p.teachings, 'term');
  e.works = mergeByTitle(e.works, p.works, 'title');
}

// ---- merge events / heresies / schools by id ----
function mergeEntities(field, opts = {}) {
  const map = new Map();
  for (const part of parts) for (const it of part[field] || []) {
    if (!it || !it.id) continue;
    if (!map.has(it.id)) { map.set(it.id, JSON.parse(JSON.stringify(it))); continue; }
    const e = map.get(it.id);
    for (const f of Object.keys(it)) {
      if (Array.isArray(it[f])) e[f] = uniqArr([...(e[f]||[]), ...it[f]]);
      else if (!e[f] || (typeof it[f] === 'string' && it[f].length > (e[f]||'').length)) e[f] = it[f];
    }
  }
  return Array.from(map.values());
}
const events = mergeEntities('events');
const heresies = mergeEntities('heresies');
const schools = mergeEntities('schools');

// ---- merge relations (dedupe by from|to|type) ----
const relMap = new Map();
for (const part of parts) for (const r of part.relations || []) {
  if (!r || !r.from || !r.to || !r.type) continue;
  const k = `${r.from}|${r.to}|${r.type}`;
  if (!relMap.has(k)) relMap.set(k, r);
  else { const e = relMap.get(k); e.note = longer(e.note, r.note); }
}
const relations = Array.from(relMap.values());

const peopleArr = Array.from(people.values()).sort((a,b) =>
  (a.deathYear ?? a.birthYear ?? 9999) - (b.deathYear ?? b.birthYear ?? 9999));
const ids = new Set(peopleArr.map(p => p.id));

// ---- referential integrity report ----
const missing = {};
const note = (cat, id, ctx) => { (missing[id] = missing[id] || {ctx:new Set()}).ctx.add(`${cat}:${ctx}`); };
for (const r of relations) { if (!ids.has(r.from)) note('rel','',r.from===undefined?'?':r.from)||note('rel.from',r.from,`${r.from}->${r.to}`); }
const orphans = new Set();
for (const r of relations) { if (!ids.has(r.from)) orphans.add(r.from); if (!ids.has(r.to)) orphans.add(r.to); }
for (const e of events) for (const pid of e.participants||[]) if (!ids.has(pid)) orphans.add(pid);
for (const h of heresies) { for (const pid of h.founders||[]) if (!ids.has(pid)) orphans.add(pid); for (const pid of h.opponents||[]) if (!ids.has(pid)) orphans.add(pid); }
for (const s of schools) for (const pid of s.members||[]) if (!ids.has(pid)) orphans.add(pid);

const out = { people: peopleArr, events, heresies, schools, relations };
fs.writeFileSync(path.join(dir, 'merged.json'), JSON.stringify(out, null, 2));

console.log('=== MERGED ===');
console.log('people:', peopleArr.length, '| events:', events.length, '| heresies:', heresies.length, '| schools:', schools.length, '| relations:', relations.length);
console.log('\n=== ORPHAN ID REFERENCES (referenced but no person record):', orphans.size, '===');
console.log([...orphans].sort().join(', '));
console.log('\n=== people with NO dates (birth & death null):');
console.log(peopleArr.filter(p => p.birthYear==null && p.deathYear==null).map(p=>p.id).join(', '));
