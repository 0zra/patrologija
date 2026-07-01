import fs from 'fs';
const path = '../src/data/patrologija.json';
const d = JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));

// Well-known reign / power spans for the rulers that appear (historical facts).
const REIGN = {
  domicijan: [81, 96], trajan: [98, 117],
  dioklecijan: [284, 305], maksimilijan: [286, 305],
  'konstancije-klor': [305, 306], galerije: [305, 311], maksencije: [306, 312],
  licinije: [308, 324], krisp: [317, 326],
  konstantin: [306, 337], konstancije: [337, 361], 'julijan-apostata': [361, 363],
  valent: [364, 378], gracijan: [367, 383], teodozije: [379, 395], 'teodozije-ii': [408, 450],
  marcijan: [450, 457], pulherija: [450, 453],
  zenon: [474, 491], bazilisk: [475, 476], 'anastazije-i': [491, 518], teodorik: [493, 526],
  'justin-i': [518, 527], justinijan: [527, 565], teodora: [527, 548],
  heraklije: [610, 641], 'konstans-ii': [641, 668], 'konstantin-iv': [668, 685], 'justinijan-ii': [685, 711],
  'leon-iii-izaurijski': [717, 741], 'konstantin-v': [741, 775], 'konstantin-vi': [780, 797], irena: [780, 802],
  'leon-v-armenac': [813, 820], 'teodora-carica': [842, 856],
  klodoveo: [481, 511], leovigildo: [568, 586], rekaredo: [586, 601], ermenegildo: [579, 585],
};

let n = 0;
for (const p of d.people) {
  const r = REIGN[p.id];
  if (Array.isArray(r)) { p.reignStart = r[0]; p.reignEnd = r[1]; n++; }
}
fs.writeFileSync(new URL(path, import.meta.url), JSON.stringify(d));
fs.writeFileSync(new URL('../src/data/patrologija.pretty.json', import.meta.url), JSON.stringify(d, null, 2));
console.log('patched reigns:', n);
