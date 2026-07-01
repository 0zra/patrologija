# Patrologija data extraction spec

You are extracting structured data from Croatian patrology lecture notes to power an interactive timeline app. Be THOROUGH and ACCURATE — this is a study tool, so errors and omissions matter. Extract every person, event, heresy, school, and relationship mentioned in your assigned text range, with as much detail as the text provides.

Output ONE JSON object with these top-level arrays: `people`, `events`, `heresies`, `schools`, `relations`.
All textual content (bios, descriptions, teachings) MUST be in **Croatian**, matching the source. Keep original-language work titles and theological terms as written (e.g. *De civitate Dei*, homoousios, *Adversus haereses*).

## ID rules (CRITICAL for cross-agent consistency)
- IDs are lowercase kebab-case slugs of the Croatian name, with diacritics stripped (č→c, ć→c, š→s, ž→z, đ→d).
- Examples: "Origen"→`origen`, "Atanazije"→`atanazije`, "Ivan Zlatousti"→`ivan-zlatousti`, "Ćiril Aleksandrijski"→`ciril-aleksandrijski`, "Grgur Nazijanski"→`grgur-nazijanski`, "Ivan Damaščanin"→`ivan-damascanin`, "Klement Rimski"→`klement-rimski`.
- Use these CANONICAL ids when you encounter these figures (so all agents agree):
  klement-rimski, ignacije-antiohijski, papija-hijerapolski, polikarp, justin, tacijan, irenej-lionski, kvadrat, aristid, atenagora, teofil-antiohijski, meliton-sardski, hegezip, hermija, minucije-feliks,
  panten, klement-aleksandrijski, origen, tertulijan, ciprijan, hipolit, novacijan, dionizije-aleksandrijski,
  euzebije-cezarejski, lucijan-antiohijski, arije, diodor-iz-tarza, ivan-zlatousti, teodor-mopsuestijski, teodoret-cirski,
  atanazije, bazilije, grgur-nazijanski, grgur-iz-nise, didim-slijepi, ciril-jeruzalemski, ciril-aleksandrijski, ivan-damascanin, pseudo-dionizije-areopagit, makarije-egipatski, evagrije-pontski,
  hilarije, ambrozije, jeronim, augustin, leon-veliki, petar-krizolog, vincencije-lerinski,
  boecije, grgur-veliki, kasiodor, izidor-seviljski, beda-casni, teodor-studit, ildefons-iz-toleda,
  efrem-sirski, afraat, nestorije, eutih, apolinar-iz-laodiceje, marcion, valentin, bazilid, montan, sabelije, pelagije, donat, maksim-ispovjedalac, severijan
- For people not in the list, derive the slug by the rule above. For emperors/popes use the same rule (e.g. konstantin, dioklecijan, teodozije, papa-damaz).

## people[] — each object:
- `id` (slug), `name` (Croatian, as commonly written), `fullName` (optional, latin/greek form if given),
- `aka` (array of alternate names/spellings found, optional),
- `category`: one of `apostolski-otac` | `apologet` | `otac` | `naucitelj` | `pisac` | `heretik` | `car` | `papa` | `ostalo`
- `tradition`: `istok` | `zapad` | `oba` (East/West/both)
- `side`: `pravovjeran` (orthodox father/teacher/writer) | `heretik` | `svjetovni` (emperor/secular). Heretics and condemned writers → `heretik`.
- `birthYear` (integer, negative for BC; null if unknown), `deathYear` (integer; null if unknown),
- `dateNote` (string, e.g. "+339", "oko 254", "konac 5. st." — preserve the source's hedging),
- `floruit` (optional rough active-period string if no dates, e.g. "II. st."),
- `school`: `aleksandrijska` | `antiohijska` | `kapadocijska` | null,
- `locations` (array of place names, Croatian, e.g. ["Aleksandrija","Cezareja"]),
- `language` (array, e.g. ["grčki"], ["latinski"], ["sirijski"]),
- `ordinations` (array of {`type`: `dakon`|`prezbiter`|`biskup`|`patrijarh`|`papa`|`monah`, `year`: int|null, `place`: string|null, `note`: string|null}),
- `titles` (array of honorifics, e.g. ["crkveni naučitelj","veliki kapadokijac"]),
- `bio` (Croatian, 2–6 sentences: who they were, key life events, significance),
- `teachings` (array of {`term`: short label e.g. "homoousios"|"hipostaza", `summary`: Croatian explanation}),
- `works` (array of {`title`: original title, `note`: optional Croatian description, `year`: optional int}),
- `feast` (optional, if a feast day is mentioned),
- `keyFact` (optional one-line highlight).

## events[] — councils, edicts, persecutions, schisms, key moments:
- `id` (slug, e.g. `nicejski-koncil-325`, `milanski-edikt`, `kalcedonski-sabor`),
- `year` (int) OR `yearStart`+`yearEnd` for spans,
- `title` (Croatian), `type`: `koncil`|`sabor`|`edikt`|`progon`|`raskol`|`sinoda`|`ostalo`,
- `description` (Croatian, what happened and why it matters),
- `participants` (array of person ids present/involved),
- `heresiesCondemned` (array of heresy ids), `heresiesAffirmed` (optional),
- `outcome` (optional Croatian, e.g. dogmatic definition).

## heresies[] :
- `id` (slug, e.g. `arijanizam`, `nestorijanizam`, `gnosticizam`, `doketizam`, `monofizitizam`),
- `name` (Croatian), `founders` (array of person ids), `period` (string),
- `description` (Croatian: what it taught and why condemned),
- `opponents` (array of person ids who refuted it),
- `condemnedAt` (array of event ids).

## schools[] :
- `id` (`aleksandrijska`|`antiohijska`|`kapadocijska`|...), `name` (Croatian),
- `location`, `period`, `characteristics` (Croatian),
- `members` (array of person ids).

## relations[] — directed relationships between people:
- `from` (person id), `to` (person id),
- `type`: `ucitelj-od` (teacher of) | `ucenik-od` (student of) | `nasljednik` (successor on a see) | `prethodnik` | `posvetio` (ordained) | `protivnik` (opponent of) | `osudio` (condemned) | `branio` (defended) | `utjecao-na` (influenced) | `suradnik` (collaborator) | `prijatelj` | `brat`/`rod` (family),
- `note` (optional Croatian context, e.g. "Atanazije je postavio Didima za učitelja u aleksandrijskoj školi").

Capture relationships explicitly — they are central to the app. Examples to watch for: who taught whom, who ordained whom, who succeeded whom on a bishopric, who opposed/refuted whom, teacher-student chains in the schools, family ties (e.g. Bazilije & Grgur iz Nise braća; Grgur Nazijanski prijatelj).

## Quality rules
- Only include people/events actually discussed in YOUR assigned text range. Don't invent.
- If the text gives a death year as "(+339)" set deathYear=339 and dateNote="+339".
- Prefer richer bios for major figures (Origen, Augustin, Atanazije, etc.); brief is fine for minor ones.
- Valid JSON only. No trailing commas. No comments in the JSON.
