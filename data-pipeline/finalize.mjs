import fs from 'fs';
const d = JSON.parse(fs.readFileSync('./data/clean.json','utf8'));

// normalize duplicate relation type
for (const r of d.relations) if (r.type === 'utjecaj-na') r.type = 'utjecao-na';

// period from deathYear (or birthYear)
const periodOf = (p) => {
  const y = p.deathYear ?? p.birthYear;
  if (y == null) return null;
  if (y <= 325) return 1;
  if (y <= 461) return 2;
  return 3;
};

// prominence weight 1..5
const relCount = {};
for (const r of d.relations){ relCount[r.from]=(relCount[r.from]||0)+1; relCount[r.to]=(relCount[r.to]||0)+1; }
for (const p of d.people){
  let s = 0;
  s += Math.min((p.bio||'').length/120, 6);
  s += (p.works||[]).length * 0.8;
  s += (p.teachings||[]).length * 0.9;
  s += (relCount[p.id]||0) * 0.5;
  if (p.titles && p.titles.length) s += 1;
  if (['otac','naucitelj'].includes(p.category)) s += 2;
  if (p.category==='apostolski-otac') s += 1.5;
  if (p.deathYear!=null) s += 1;
  p.relCount = relCount[p.id]||0;
  p.period = periodOf(p);
  p.weight = s>=11?5 : s>=7.5?4 : s>=4.5?3 : s>=2?2 : 1;
}

// quick stats
const w={}; d.people.forEach(p=>w[p.weight]=(w[p.weight]||0)+1);
console.log('weights:', w);
console.log('top figures (weight 5):', d.people.filter(p=>p.weight===5).map(p=>p.id).join(', '));
const placeable = d.people.filter(p=>p.deathYear!=null);
console.log('placeable on timeline (have deathYear):', placeable.length);

fs.writeFileSync('./data/patrologija.json', JSON.stringify(d));
fs.writeFileSync('./data/patrologija.pretty.json', JSON.stringify(d,null,2));
console.log('written data/patrologija.json');
