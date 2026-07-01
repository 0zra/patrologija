export type Category =
  | 'apostolski-otac' | 'apologet' | 'otac' | 'naucitelj' | 'pisac'
  | 'biskup' | 'papa' | 'car' | 'heretik' | 'ostalo';

export type Side = 'pravovjeran' | 'heretik' | 'svjetovni' | 'ostalo';
export type Tradition = 'istok' | 'zapad' | 'oba';
export type SchoolId = 'aleksandrijska' | 'antiohijska' | 'kapadocijska';

export type OrdinationType =
  | 'dakon' | 'prezbiter' | 'biskup' | 'patrijarh' | 'papa' | 'monah';

export interface Ordination {
  type: OrdinationType;
  year?: number | null;
  place?: string | null;
  note?: string | null;
}
export interface Teaching { term: string; summary: string; }
export interface Work { title: string; note?: string; year?: number | null; }

export interface Person {
  id: string;
  name: string;
  fullName?: string;
  aka?: string[];
  category: Category;
  tradition: Tradition;
  side: Side;
  birthYear: number | null;
  deathYear: number | null;
  reignStart?: number;
  reignEnd?: number;
  dateNote?: string;
  floruit?: string;
  school?: SchoolId | null;
  locations?: string[];
  language?: string[];
  ordinations?: Ordination[];
  titles?: string[];
  bio?: string;
  teachings?: Teaching[];
  works?: Work[];
  feast?: string;
  keyFact?: string;
  isStub?: boolean;
  relCount: number;
  period: 1 | 2 | 3 | null;
  weight: 1 | 2 | 3 | 4 | 5;
}

export type EventType =
  | 'koncil' | 'sabor' | 'edikt' | 'progon' | 'raskol' | 'sinoda' | 'ostalo';

export interface HistEvent {
  id: string;
  year?: number;
  yearStart?: number;
  yearEnd?: number;
  title: string;
  type: EventType;
  description: string;
  participants: string[];
  heresiesCondemned?: string[];
  heresiesAffirmed?: string[];
  outcome?: string;
  ecumenical?: boolean;
  ecumenicalNo?: number;
}

export interface Heresy {
  id: string;
  name: string;
  founders: string[];
  period: string;
  yearStart: number;
  yearEnd: number;
  description: string;
  opponents: string[];
  condemnedAt: string[];
}

export interface School {
  id: SchoolId;
  name: string;
  location: string;
  period: string;
  characteristics: string;
  members: string[];
}

export type RelationType =
  | 'ucitelj-od' | 'ucenik-od' | 'nasljednik' | 'prethodnik' | 'posvetio'
  | 'protivnik' | 'osudio' | 'branio' | 'utjecao-na' | 'suradnik'
  | 'prijatelj' | 'brat' | 'rod';

export interface Relation {
  from: string;
  to: string;
  type: RelationType;
  note?: string;
}

export interface Dataset {
  people: Person[];
  events: HistEvent[];
  heresies: Heresy[];
  schools: School[];
  relations: Relation[];
}

export type Orientation = 'vertical' | 'horizontal';
export type LabelMode = 'major' | 'all' | 'none';
