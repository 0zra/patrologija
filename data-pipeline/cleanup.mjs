import fs from 'fs';
const d = JSON.parse(fs.readFileSync('./data/merged.json','utf8'));
const p6 = JSON.parse(fs.readFileSync('./data/part6.json','utf8'));

const byId = new Map(d.people.map(p=>[p.id,p]));

// ---- A. Split Emperor Justin I out of the apologist's record ----
const emp = (p6.people||[]).find(p=>p.id==='justin');
if (emp && !byId.has('justin-i')) {
  const e = {...emp, id:'justin-i'};
  d.people.push(e); byId.set('justin-i', e);
}
// repoint the contaminating emperor relations
for (const r of d.relations) {
  if (r.from==='justin' && r.to==='papa-hormizda') r.from='justin-i';
  if (r.from==='justinijan' && r.to==='justin' && r.type==='nasljednik') r.to='justin-i';
}

// ---- B. Alias merges (same person, different id) ----
const alias = {
  'euzebije-nikomedijski':'euzebije-iz-nikomedije',
  'metodije-olimski':'metodije-olimpski',
  'flavijan':'flavijan-carigradski',
  'papa-damaz':'damaz',
  'konstancije-ii':'konstancije',
};
// merge person records
function mergePerson(dst, src){
  for (const k of Object.keys(src)){
    if (k==='id') continue;
    if (Array.isArray(src[k])) dst[k]=Array.from(new Set([...(dst[k]||[]),...src[k]].map(x=>typeof x==='object'?JSON.stringify(x):x))).map(x=>{try{return JSON.parse(x)}catch{return x}});
    else if (dst[k]==null || (typeof src[k]==='string' && src[k].length>(dst[k]||'').length)) dst[k]=src[k];
  }
}
for (const [from,to] of Object.entries(alias)){
  const s=byId.get(from), t=byId.get(to);
  if (s && t){ mergePerson(t,s); }
  else if (s && !t){ s.id=to; byId.set(to,s); }
  byId.delete(from);
}
d.people = d.people.filter(p=>!alias[p.id]);
const remap = id => alias[id] || id;

// ---- C. classify non-person reference ids to drop from relations ----
const heresyIds = new Set(d.heresies.map(h=>h.id));
const schoolIds = new Set(d.schools.map(s=>s.id));
const eventIds  = new Set(d.events.map(e=>e.id));
const dropRefs = new Set([...heresyIds,...schoolIds,...eventIds,'oktavije']);

// ---- D. stubs for genuine missing connective people ----
const stubs = [
  {id:'petar',name:'Apostol Petar',category:'apostolski-otac',tradition:'oba',side:'pravovjeran',deathYear:64,dateNote:'+oko 64. (mučeništvo u Rimu)',locations:['Rim','Antiohija'],bio:'Prvak apostola i prvi rimski biskup; po predaji mučen u Rimu za Neronova progona. Ishodište apostolskog naslijeđa na koje se pozivaju rimski biskupi.'},
  {id:'ivan-apostol',name:'Apostol Ivan',category:'apostolski-otac',tradition:'istok',side:'pravovjeran',deathYear:100,dateNote:'oko 100. (Efez)',locations:['Efez'],bio:'Apostol i evanđelist; po predaji posljednji preživjeli apostol, djelovao u Efezu. Učitelj Polikarpa i poveznica s ivanovskom tradicijom Male Azije.'},
  {id:'evodije',name:'Evodije Antiohijski',category:'ostalo',tradition:'istok',side:'pravovjeran',floruit:'I. st.',locations:['Antiohija'],bio:'Drugi antiohijski biskup, između apostola Petra i Ignacija Antiohijskog.'},
  {id:'potin',name:'Potin Lyonski',category:'ostalo',tradition:'zapad',side:'pravovjeran',deathYear:177,dateNote:'+177 (mučeništvo)',locations:['Lyon'],bio:'Prvi biskup Lyona, mučen u progonu 177.; prethodnik Ireneja Lyonskog na lyonskoj stolici.'},
  {id:'zefirin',name:'Papa Zefirin',category:'papa',tradition:'zapad',side:'pravovjeran',deathYear:217,dateNote:'papa 199.–217.',locations:['Rim'],bio:'Rimski biskup na prijelazu II./III. st.; za njegova pontifikata djeluje Hipolit i izbijaju monarhijanske rasprave.'},
  {id:'kalist',name:'Papa Kalist I.',category:'papa',tradition:'zapad',side:'pravovjeran',deathYear:222,dateNote:'papa 217.–222.',locations:['Rim'],bio:'Rimski biskup; protivnik Hipolita, koji mu je zamjerao blagost u pokorničkoj stezi. Povod prvom protupapinstvu (Hipolit).'},
  {id:'poncijan',name:'Papa Poncijan',category:'papa',tradition:'zapad',side:'pravovjeran',deathYear:235,dateNote:'papa 230.–235.',locations:['Rim','Sardinija'],bio:'Rimski biskup prognan u rudnike Sardinije zajedno s Hipolitom, s kojim se ondje pomirio.'},
  {id:'kornelije',name:'Papa Kornelije',category:'papa',tradition:'zapad',side:'pravovjeran',deathYear:253,dateNote:'papa 251.–253.',locations:['Rim'],bio:'Rimski biskup; suprotstavio mu se Novacijan kao protupapa u sporu o ponovnom primanju otpalih (lapsi). Podržavao ga je Ciprijan.'},
  {id:'amonije-sakas',name:'Amonije Saka',category:'ostalo',tradition:'istok',side:'svjetovni',floruit:'III. st.',locations:['Aleksandrija'],bio:'Neoplatonički filozof iz Aleksandrije, učitelj Plotina; po Euzebiju i Origenov učitelj filozofije.'},
  {id:'demetrije-aleksandrijski',name:'Demetrije Aleksandrijski',category:'ostalo',tradition:'istok',side:'pravovjeran',deathYear:232,dateNote:'biskup 189.–232.',locations:['Aleksandrija'],bio:'Aleksandrijski biskup koji je Origenu povjerio katehetsku školu, no kasnije ga osudio i prognao zbog samovoljnog ređenja.'},
  {id:'herakla',name:'Herakla Aleksandrijski',category:'ostalo',tradition:'istok',side:'pravovjeran',deathYear:247,dateNote:'biskup 232.–247.',locations:['Aleksandrija'],bio:'Origenov učenik i nasljednik na čelu aleksandrijske škole, potom aleksandrijski biskup.'},
  {id:'jakov-nisibski',name:'Jakov Nisibski',category:'otac',tradition:'istok',side:'pravovjeran',deathYear:338,dateNote:'+338',locations:['Nisibis'],bio:'Biskup Nisibisa, sudionik Nicejskog koncila; utemeljitelj nisibske škole i, po predaji, učitelj Efrema Sirskog.'},
  {id:'silvan-tarski',name:'Silvan Tarski',category:'ostalo',tradition:'istok',side:'pravovjeran',floruit:'IV. st.',locations:['Tarz'],bio:'Biskup iz Tarza, pripadnik homejusijanske (umjerene) struje u arijanskim raspravama.'},
];
for (const s of stubs){ if(!byId.has(s.id)){ s.isStub=true; d.people.push(s); byId.set(s.id,s); } }

// ---- apply remap + drops to relations ----
d.relations = d.relations
  .map(r=>({...r, from:remap(r.from), to:remap(r.to)}))
  .filter(r=> !dropRefs.has(r.from) && !dropRefs.has(r.to) && byId.has(r.from) && byId.has(r.to) && r.from!==r.to);
// dedupe again
const rm=new Map();
for(const r of d.relations){ rm.set(`${r.from}|${r.to}|${r.type}`, r); }
d.relations=[...rm.values()];

// ---- apply remap to event/heresy/school member refs, drop unresolved ----
const clean = (arr)=> Array.from(new Set((arr||[]).map(remap))).filter(id=>byId.has(id));
for (const e of d.events){ e.participants=clean(e.participants); }
for (const h of d.heresies){ h.founders=clean(h.founders); h.opponents=clean(h.opponents); }
for (const s of d.schools){ s.members=clean(s.members); }

// resort
d.people.sort((a,b)=>(a.deathYear??a.birthYear??9999)-(b.deathYear??b.birthYear??9999));

fs.writeFileSync('./data/clean.json', JSON.stringify(d,null,2));

// ---- final validation ----
const ids=new Set(d.people.map(p=>p.id));
const orphans=new Set();
for(const r of d.relations){ if(!ids.has(r.from))orphans.add(r.from); if(!ids.has(r.to))orphans.add(r.to); }
for(const e of d.events) for(const id of e.participants) if(!ids.has(id))orphans.add(id);
for(const h of d.heresies){for(const id of h.founders)if(!ids.has(id))orphans.add(id);for(const id of h.opponents)if(!ids.has(id))orphans.add(id);}
for(const s of d.schools) for(const id of s.members) if(!ids.has(id))orphans.add(id);
console.log('FINAL people:',d.people.length,'events:',d.events.length,'heresies:',d.heresies.length,'schools:',d.schools.length,'relations:',d.relations.length);
console.log('remaining orphans:', orphans.size, [...orphans].join(', '));
console.log('stubs added:', stubs.length);
const dated=d.people.filter(p=>p.deathYear!=null||p.birthYear!=null).length;
console.log('people with at least one date:', dated, '/', d.people.length);
