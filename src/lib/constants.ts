import type { Category, EventType, OrdinationType, RelationType, SchoolId } from '../types';

export const YEAR_MIN = 30;
export const YEAR_MAX = 900;
export const DEFAULT_LIFESPAN = 62; // estimate birth when only death is known

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  'apostolski-otac': { label: 'Apostolski otac', color: '#b07d2b' },
  otac:              { label: 'Crkveni otac',    color: '#1f6f8b' },
  naucitelj:         { label: 'Crkveni naučitelj', color: '#2e8b6b' },
  apologet:          { label: 'Apologet',        color: '#4a6fa5' },
  pisac:             { label: 'Crkveni pisac',   color: '#6f8ba0' },
  biskup:            { label: 'Biskup',          color: '#6f9e86' },
  papa:              { label: 'Papa',            color: '#a98235' },
  car:               { label: 'Vladar / car',   color: '#8d8782' },
  heretik:           { label: 'Heretik',         color: '#b0413e' },
  ostalo:            { label: 'Ostalo',          color: '#9a948c' },
};

export const SIDE_LABEL: Record<string, string> = {
  pravovjeran: 'Pravovjerni',
  heretik: 'Heretici',
  svjetovni: 'Vladari',
  ostalo: 'Ostalo',
};

export const ORDINATION_META: Record<OrdinationType, { label: string; glyph: string }> = {
  dakon:     { label: 'Đakon',     glyph: '◆' },
  prezbiter: { label: 'Prezbiter (svećenik)', glyph: '✚' },
  biskup:    { label: 'Biskup',    glyph: '⬢' },
  patrijarh: { label: 'Patrijarh', glyph: '✦' },
  papa:      { label: 'Papa',      glyph: '♚' },
  monah:     { label: 'Monah',     glyph: '☩' },
};

export const EVENT_META: Record<EventType, { label: string; color: string }> = {
  koncil: { label: 'Ekumenski koncil', color: '#c9a227' },
  sabor:  { label: 'Sabor',            color: '#c9a227' },
  sinoda: { label: 'Sinoda',           color: '#9c8b4e' },
  edikt:  { label: 'Edikt / zakon',    color: '#5b8c7b' },
  progon: { label: 'Progon',           color: '#a8423f' },
  raskol: { label: 'Raskol',           color: '#8a5a9e' },
  ostalo: { label: 'Događaj',          color: '#8d8782' },
};

export const RELATION_META: Record<RelationType, { label: string; color: string; arrow: boolean }> = {
  'ucitelj-od':  { label: 'učitelj od',   color: '#2e8b6b', arrow: true },
  'ucenik-od':   { label: 'učenik od',    color: '#56a98b', arrow: true },
  nasljednik:    { label: 'nasljednik',   color: '#4a6fa5', arrow: true },
  prethodnik:    { label: 'prethodnik',   color: '#6f8ba0', arrow: true },
  posvetio:      { label: 'posvetio/zaredio', color: '#b07d2b', arrow: true },
  protivnik:     { label: 'protivnik',    color: '#b0413e', arrow: false },
  osudio:        { label: 'osudio',       color: '#8c2f2c', arrow: true },
  branio:        { label: 'branio',       color: '#c9a227', arrow: true },
  'utjecao-na':  { label: 'utjecao na',   color: '#8a5a9e', arrow: true },
  suradnik:      { label: 'suradnik',     color: '#5b8c7b', arrow: false },
  prijatelj:     { label: 'prijatelj',    color: '#d08a3e', arrow: false },
  brat:          { label: 'brat / sestra', color: '#c25e8a', arrow: false },
  rod:           { label: 'rod / obitelj', color: '#c25e8a', arrow: false },
};

export const SCHOOL_META: Record<SchoolId, { label: string; color: string }> = {
  aleksandrijska: { label: 'Aleksandrijska škola', color: '#c08a2e' },
  antiohijska:    { label: 'Antiohijska škola',    color: '#2f7d8b' },
  kapadocijska:   { label: 'Kapadocijska škola',   color: '#7a5aa0' },
};

/** Order of clustered "files" in the orthodox (left) zone, from axis outward. */
export const LEFT_GROUP_ORDER = ['aleksandrijska', 'antiohijska', 'kapadocijska', 'istok', 'zapad', 'pape'] as const;
export type LeftGroupId = (typeof LEFT_GROUP_ORDER)[number];

/**
 * Writers who died in communion with the Church but were condemned post-mortem.
 * They sit in the inner file of the right zone (next to the axis), apart from the
 * outright heresiarchs in the outer file.
 */
export const POSTHUMOUSLY_CONDEMNED = new Set<string>([
  'didim-slijepi',        // Didim Slijepi — osuđen na II. carigradskom (553.)
  'evagrije-pontski',     // Evagrije Pontski — osuđen 553.
  'teodor-mopsuestijski', // Teodor iz Mopsuestije — umro u jedinstvu s Crkvom, osuđen 553.
]);

/** Order of clustered "files" in the right zone, from axis outward. */
export const RIGHT_GROUP_ORDER = ['osudeni', 'heretici'] as const;
export type RightGroupId = (typeof RIGHT_GROUP_ORDER)[number];

export const RIGHT_GROUP_META: Record<RightGroupId, { label: string; color: string }> = {
  osudeni:  { label: 'Posmrtno osuđeni',    color: '#a9748c' },
  heretici: { label: 'Hereze i heretici',   color: '#b0413e' },
};

export const LEFT_GROUP_META: Record<LeftGroupId, { label: string; color: string; isWest: boolean }> = {
  aleksandrijska: { label: 'Aleksandrijska škola', color: SCHOOL_META.aleksandrijska.color, isWest: false },
  antiohijska:    { label: 'Antiohijska škola',    color: SCHOOL_META.antiohijska.color, isWest: false },
  kapadocijska:   { label: 'Kapadocijska škola',   color: SCHOOL_META.kapadocijska.color, isWest: false },
  istok:          { label: 'Istočni oci',          color: '#3a7a86', isWest: false },
  zapad:          { label: 'Zapadni oci',          color: '#9c6b3c', isWest: true },
  pape:           { label: 'Pape',                 color: '#a98235', isWest: true },
};

export const PERIOD_META: Record<1 | 2 | 3, { label: string; short: string; color: string; range: string }> = {
  1: { label: 'Razdoblje rasta', short: 'I. rast', color: '#9aa7a0', range: 'do Niceje (325.)' },
  2: { label: 'Zlatno razdoblje', short: 'II. zlatno', color: '#c9b27a', range: '325.–451.' },
  3: { label: 'Razdoblje opadanja', short: 'III. opadanje', color: '#a99a8c', range: '451.–oko 750.' },
};
