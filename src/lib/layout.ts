import type { Heresy, Person } from '../types';
import { data } from './data';
import {
  DEFAULT_LIFESPAN, LEFT_GROUP_ORDER, LEFT_GROUP_META, type LeftGroupId,
  RIGHT_GROUP_ORDER, RIGHT_GROUP_META, POSTHUMOUSLY_CONDEMNED, type RightGroupId,
} from './constants';

export type Zone = 'left' | 'right' | 'rulers';

export interface LaidPerson {
  person: Person;
  zone: Zone;
  lane: number;            // fractional global lane within the zone
  groupId?: LeftGroupId;   // which clustered file (left zone only)
  rightGroupId?: RightGroupId; // which clustered file (right zone only)
  startYear: number;
  endYear: number;
  estimatedBirth: boolean;
}

/** A heresy drawn as a bar, packed into the right zone alongside the heretic people. */
export interface LaidHeresy {
  heresy: Heresy;
  zone: 'right';
  lane: number;
  startYear: number;
  endYear: number;
}

/** Anything with a time span that can share the lane-packing. */
interface Laned { startYear: number; endYear: number; lane: number; }

export interface LeftGroup {
  id: LeftGroupId;
  label: string;
  color: string;
  isWest: boolean;
  baseLane: number;
  laneCount: number;
  count: number;
}

export interface RightGroup {
  id: RightGroupId;
  label: string;
  color: string;
  baseLane: number;
  laneCount: number;
  count: number;
}

/** A pope shown by its pontificate only (not specially treated as a father). */
export function popeReignOnly(p: Person): boolean {
  return p.category === 'papa' && p.reignStart != null && p.weight < 4;
}

/** Which side of the axis a person belongs to. null = not placeable. */
export function zoneOf(p: Person): Zone | null {
  if (p.side === 'svjetovni') return p.reignStart != null ? 'rulers' : null;
  if (p.side === 'heretik') return p.deathYear != null ? 'right' : null;
  // orthodox: popes can be placed by pontificate even without a death year
  if (p.category === 'papa') return p.deathYear != null || p.reignStart != null ? 'left' : null;
  return p.deathYear != null ? 'left' : null;
}

/** Which clustered file an orthodox person belongs to. */
export function groupOf(p: Person): LeftGroupId {
  if (p.category === 'papa') return 'pape';
  if (p.school === 'aleksandrijska' || p.school === 'antiohijska' || p.school === 'kapadocijska') return p.school;
  if (p.tradition === 'zapad' || p.tradition === 'oba') return 'zapad';
  return 'istok';
}

/** Which clustered file a right-zone person belongs to. */
export function rightGroupOf(p: Person): RightGroupId {
  return POSTHUMOUSLY_CONDEMNED.has(p.id) ? 'osudeni' : 'heretici';
}

export function spanOf(p: Person): { start: number; end: number; estimated: boolean } {
  // emperors always show reign; popes show pontificate unless specially mentioned (weight >= 4)
  if ((p.side === 'svjetovni' || popeReignOnly(p)) && p.reignStart != null) {
    return { start: p.reignStart, end: p.reignEnd ?? p.reignStart + 1, estimated: false };
  }
  const end = p.deathYear ?? (p.reignEnd ?? p.reignStart!);
  if (p.birthYear != null && p.birthYear < end) return { start: p.birthYear, end, estimated: false };
  return { start: end - DEFAULT_LIFESPAN, end, estimated: true };
}

const GAP_YEARS = 3;
const GROUP_GAP_LANES = 0.7;  // spacing between adjacent files
const WEST_GAP_LANES = 1.8;   // wider divide between East and West clusters

/** Greedy interval partitioning → minimal lane count. Sets within-group lane on each item. */
export function packLanes<T extends Laned>(items: T[]): number {
  const sorted = [...items].sort((a, b) => a.startYear - b.startYear || b.endYear - a.endYear);
  const laneEnds: number[] = [];
  for (const it of sorted) {
    let lane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] + GAP_YEARS <= it.startYear) { lane = i; break; }
    }
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(it.endYear); }
    else laneEnds[lane] = it.endYear;
    it.lane = lane;
  }
  return laneEnds.length;
}

export interface Layout {
  laid: LaidPerson[];
  byId: Map<string, LaidPerson>;
  laidHeresies: LaidHeresy[];
  byHeresyId: Map<string, LaidHeresy>;
  lanes: Record<Zone, number>;
  leftGroups: LeftGroup[];
  rightGroups: RightGroup[];
}

export function buildLayout(people: Person[]): Layout {
  const zones: Record<Zone, LaidPerson[]> = { left: [], right: [], rulers: [] };
  for (const p of people) {
    const z = zoneOf(p);
    if (!z) continue;
    const { start, end, estimated } = spanOf(p);
    const lp: LaidPerson = { person: p, zone: z, lane: 0, startYear: start, endYear: end, estimatedBirth: estimated };
    if (z === 'left') lp.groupId = groupOf(p);
    if (z === 'right') lp.rightGroupId = rightGroupOf(p);
    zones[z].push(lp);
  }

  // ---- left zone: clustered files with East/West divide ----
  const buckets: Record<LeftGroupId, LaidPerson[]> = {
    aleksandrijska: [], antiohijska: [], kapadocijska: [], istok: [], zapad: [], pape: [],
  };
  for (const lp of zones.left) buckets[lp.groupId!].push(lp);

  const leftGroups: LeftGroup[] = [];
  let cursor = 0;
  let first = true;
  for (const id of LEFT_GROUP_ORDER) {
    const items = buckets[id];
    if (!items.length) continue;
    cursor += first ? 0 : id === 'zapad' ? WEST_GAP_LANES : GROUP_GAP_LANES;
    const base = cursor;
    const count = packLanes(items);
    for (const it of items) it.lane = base + it.lane;
    leftGroups.push({
      id, label: LEFT_GROUP_META[id].label, color: LEFT_GROUP_META[id].color,
      isWest: LEFT_GROUP_META[id].isWest, baseLane: base, laneCount: count, count: items.length,
    });
    cursor = base + count;
    first = false;
  }

  // ---- right zone: clustered files (posthumously condemned nearest the axis) ----
  // Heresies are packed into the outer "heretici" file alongside the heretic people,
  // interleaved by period so each crisis sits next to the people who drove or fought it.
  const rightBuckets: Record<RightGroupId, LaidPerson[]> = { osudeni: [], heretici: [] };
  for (const lp of zones.right) rightBuckets[lp.rightGroupId!].push(lp);

  const laidHeresies: LaidHeresy[] = data.heresies.map((h) => ({
    heresy: h, zone: 'right' as const, lane: 0, startYear: h.yearStart, endYear: h.yearEnd,
  }));

  const rightGroups: RightGroup[] = [];
  let rCursor = 0;
  let rFirst = true;
  for (const id of RIGHT_GROUP_ORDER) {
    const people = rightBuckets[id];
    const combined: Laned[] = id === 'heretici' ? [...people, ...laidHeresies] : people;
    if (!combined.length) continue;
    rCursor += rFirst ? 0 : GROUP_GAP_LANES;
    const base = rCursor;
    const count = packLanes(combined);
    for (const it of combined) it.lane = base + it.lane;
    rightGroups.push({
      id, label: RIGHT_GROUP_META[id].label, color: RIGHT_GROUP_META[id].color,
      baseLane: base, laneCount: count, count: combined.length,
    });
    rCursor = base + count;
    rFirst = false;
  }

  const lanes: Record<Zone, number> = {
    left: cursor,
    right: rCursor,
    rulers: packLanes(zones.rulers),
  };
  const laid = [...zones.left, ...zones.right, ...zones.rulers];
  const byId = new Map(laid.map((l) => [l.person.id, l]));
  const byHeresyId = new Map(laidHeresies.map((l) => [l.heresy.id, l]));
  return { laid, byId, laidHeresies, byHeresyId, lanes, leftGroups, rightGroups };
}
