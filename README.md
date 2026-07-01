# Patrologija — interaktivna vremenska crta

Interaktivna, pomična vremenska crta (timeline) crkvenih otaca, naučitelja, pisaca i
hereza patrističkog razdoblja (1.–9. st.), izrađena iz triju skripti *Patrologije*.

U sredini je os godina (≈30.–900.). **Lijevo** od osi su pravovjerni autori (apostolski
oci, oci, naučitelji, apologeti, pisci, biskupi, pape), **desno** heretici. Vodoravne
crte i točke na osi su sabori, koncili, edikti i drugi događaji.

## Pokretanje

```bash
npm install
npm run dev      # razvojni poslužitelj na http://localhost:5173
npm run build    # produkcijski build u dist/
npm run preview  # pregled builda
```

## Mogućnosti

- **Okomito / vodoravno** pomicanje (prekidač u izborniku).
- **Životne crte** od rođenja do smrti; isprekidani vrh = procijenjena godina rođenja
  (izvori često navode samo godinu smrti).
- **Simboli ređenja** na crti: ◆ đakon, ✚ prezbiter, ⬢ biskup, ✦ patrijarh, ♚ papa, ☩ monah.
- **Klik na osobu** → panel sa životopisom, naukom (npr. *homoousios*), djelima,
  ređenjima, odnosima i saborima na kojima je sudjelovala.
- **Klik na sabor/događaj** → opis, ishod, osuđene hereze i **sudionici** (povezani
  crtama s njihovim životnim crtama).
- **Odnosi** među osobama (učitelj/učenik, posvetio, nasljednik, protivnik, utjecaj,
  rod…) crtaju se kao lukovi pri odabiru osobe.
- **Škole** (aleksandrijska, antiohijska, kapadocijska) — isticanje članova.
- **Pretraga**, filtriranje po kategorijama, razmjer (zoom), uključivanje vladara (careva).

## Podatkovni model

Svi podaci su u jednoj strukturiranoj datoteci `src/data/patrologija.json`
(229 osoba, 74 događaja, 32 hereze, 3 škole, 320 odnosa). Model je relacijski po
dizajnu (ID-evi + zasebno polje `relations`), pa se lako prenosi u pravu bazu (Postgres,
SQLite) ako zatreba. Tipovi su u `src/types.ts`.

```
people[]    — osobe: id, name, fullName, category, side, tradition, birthYear, deathYear,
              dateNote, school, locations, ordinations[], teachings[], works[], bio, …
events[]    — koncili/sabori/edikti/progoni: year, type, description, participants[], …
heresies[]  — hereze: founders[], opponents[], condemnedAt[], description
schools[]   — škole: members[], characteristics
relations[] — usmjereni odnosi: { from, to, type, note }
```

## Kako su podaci nastali (`data-pipeline/`)

1. Tekst je izvučen iz triju PDF-ova (`patrologija_I/II/III.txt`).
2. Strukturirana ekstrakcija prema `EXTRACTION_SPEC.md`.
3. `merge.mjs` → spajanje i deduplikacija; `cleanup.mjs` → razrješavanje ID-eva,
   uklanjanje sirotih referenci, dodavanje veznih osoba; `finalize.mjs` → težine
   (prominencija), razdoblja, završni `patrologija.json`.

Čitljiva (formatirana) inačica podataka je `patrologija.pretty.json`.
Ispravke i dopune najlakše je raditi izravno u `src/data/patrologija.json`.

## Tehnologija

Vite + React + TypeScript, prilagođeni SVG/DOM prikaz vremenske crte (bez timeline
biblioteke radi dvostranog rasporeda, lukova odnosa i simbola ređenja), ručno pisani
CSS dizajnerski sustav („iluminirani rukopis” — pergament, tinta, zlato).
