import raw from '../data/patrologija.json';
import type { Dataset, HistEvent, Heresy, Person, Relation, School } from '../types';

export const data = raw as unknown as Dataset;

export const peopleById = new Map<string, Person>(data.people.map((p) => [p.id, p]));
export const heresyById = new Map<string, Heresy>(data.heresies.map((h) => [h.id, h]));
export const schoolById = new Map<string, School>(data.schools.map((s) => [s.id, s]));
export const eventById = new Map<string, HistEvent>(data.events.map((e) => [e.id, e]));

/** Relations grouped by person id (both directions). */
export const relationsByPerson = new Map<string, Relation[]>();
for (const r of data.relations) {
  if (!relationsByPerson.has(r.from)) relationsByPerson.set(r.from, []);
  if (!relationsByPerson.has(r.to)) relationsByPerson.set(r.to, []);
  relationsByPerson.get(r.from)!.push(r);
  relationsByPerson.get(r.to)!.push(r);
}

/** Heresies a person is tied to, with their role (founder/širitelj vs protivnik). */
export type HeresyRole = 'zacetnik' | 'protivnik';
export const heresiesByPerson = new Map<string, { heresy: Heresy; role: HeresyRole }[]>();
for (const h of data.heresies) {
  for (const pid of h.founders) {
    if (!heresiesByPerson.has(pid)) heresiesByPerson.set(pid, []);
    heresiesByPerson.get(pid)!.push({ heresy: h, role: 'zacetnik' });
  }
  for (const pid of h.opponents) {
    if (!heresiesByPerson.has(pid)) heresiesByPerson.set(pid, []);
    heresiesByPerson.get(pid)!.push({ heresy: h, role: 'protivnik' });
  }
}

/** Events a person participated in. */
export const eventsByPerson = new Map<string, HistEvent[]>();
for (const e of data.events) {
  for (const pid of e.participants) {
    if (!eventsByPerson.has(pid)) eventsByPerson.set(pid, []);
    eventsByPerson.get(pid)!.push(e);
  }
}

export const eventYear = (e: HistEvent): number =>
  e.year ?? e.yearStart ?? e.yearEnd ?? 0;

export function personName(id: string): string {
  return peopleById.get(id)?.name ?? id;
}
