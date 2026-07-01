import { useMemo, useState } from 'react';
import type { Category, Orientation, Person, SchoolId } from '../types';
import { CATEGORY_META, ORDINATION_META, RELATION_META, SCHOOL_META } from '../lib/constants';
import { data } from '../lib/data';

export interface Filters {
  categories: Set<Category>;
  showRulers: boolean;
}

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  zoom: number;
  setZoom: (z: number) => void;
  showRelations: boolean;
  setShowRelations: (b: boolean) => void;
  showStubs: boolean;
  setShowStubs: (b: boolean) => void;
  showAllPopes: boolean;
  setShowAllPopes: (b: boolean) => void;
  onlyPrimary: boolean;
  setOnlyPrimary: (b: boolean) => void;
  highlightSchool: SchoolId | null;
  setHighlightSchool: (s: SchoolId | null) => void;
  onPick: (id: string) => void;
}

const CAT_ORDER: Category[] = ['apostolski-otac', 'otac', 'naucitelj', 'apologet', 'pisac', 'biskup', 'papa', 'heretik', 'ostalo'];

export default function Sidebar(props: Props) {
  const { filters, setFilters, orientation, setOrientation, zoom, setZoom,
    showRelations, setShowRelations, showStubs, setShowStubs, showAllPopes, setShowAllPopes,
    onlyPrimary, setOnlyPrimary, highlightSchool, setHighlightSchool, onPick } = props;
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const ns = norm(s);
    return data.people
      .filter((p) => norm(p.name).includes(ns) || (p.aka ?? []).some((a) => norm(a).includes(ns)))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 12);
  }, [q]);

  const toggleCat = (c: Category) => {
    const next = new Set(filters.categories);
    next.has(c) ? next.delete(c) : next.add(c);
    setFilters({ ...filters, categories: next });
  };

  return (
    <aside className="sidebar">
      <div className="field">
        <label>Pretraži osobu</label>
        <input className="search" placeholder="npr. Origen, Augustin…" value={q} onChange={(e) => setQ(e.target.value)} />
        {results.length > 0 && (
          <div className="search-results">
            {results.map((p: Person) => (
              <button key={p.id} onClick={() => { onPick(p.id); setQ(''); }}>
                <span className="dot" style={{ background: CATEGORY_META[p.category].color }} />
                {p.name}
                <span className="yr">{p.deathYear != null ? `†${p.deathYear}` : p.floruit ?? ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label>Smjer pomicanja</label>
        <div className="seg">
          <button className={orientation === 'vertical' ? 'on' : ''} onClick={() => setOrientation('vertical')}>↕ Okomito</button>
          <button className={orientation === 'horizontal' ? 'on' : ''} onClick={() => setOrientation('horizontal')}>↔ Vodoravno</button>
        </div>
      </div>

      <div className="field">
        <label>Razmjer (godina/px): {zoom.toFixed(1)}</label>
        <input type="range" min={2.5} max={11} step={0.5} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
      </div>

      <div className="field">
        <div className="toggle-row">
          <span>Prikaži odnose pri odabiru</span>
          <button className={'switch' + (showRelations ? ' on' : '')} onClick={() => setShowRelations(!showRelations)} aria-label="odnosi" />
        </div>
        <div className="toggle-row">
          <span>Prikaži vladare (carevi)</span>
          <button className={'switch' + (filters.showRulers ? ' on' : '')} onClick={() => setFilters({ ...filters, showRulers: !filters.showRulers })} aria-label="vladari" />
        </div>
        <div className="toggle-row">
          <span>Prikaži sve pape</span>
          <button className={'switch' + (showAllPopes ? ' on' : '')} onClick={() => setShowAllPopes(!showAllPopes)} aria-label="pape" />
        </div>
        <div className="toggle-row">
          <span>Samo glavne (obrađene) osobe</span>
          <button className={'switch' + (onlyPrimary ? ' on' : '')} onClick={() => setOnlyPrimary(!onlyPrimary)} aria-label="glavne" />
        </div>
        <div className="toggle-row">
          <span>Prikaži dodatne osobe <small style={{ color: 'var(--ink-faint)' }}>(izvan skripti)</small></span>
          <button className={'switch' + (showStubs ? ' on' : '')} onClick={() => setShowStubs(!showStubs)} aria-label="dodatne" />
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '2px 0 0', lineHeight: 1.4 }}>
          Pune trake = osobe obrađene u skriptama; uže i blijede trake = osobe tek usputno spomenute.
        </p>
      </div>

      <div className="divider" />

      <div className="field">
        <label>Kategorije</label>
        <div className="chips">
          {CAT_ORDER.map((c) => {
            const on = filters.categories.has(c);
            return (
              <button key={c} className={'chip ' + (on ? 'on' : 'off')}
                style={on ? { background: CATEGORY_META[c].color } : {}}
                onClick={() => toggleCat(c)}>
                <span className="dot" style={{ background: on ? '#fff' : CATEGORY_META[c].color }} />
                {CATEGORY_META[c].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label>Istakni školu</label>
        <div className="chips">
          {(Object.keys(SCHOOL_META) as SchoolId[]).map((s) => {
            const on = highlightSchool === s;
            return (
              <button key={s} className={'chip ' + (on ? 'on' : 'off')}
                style={on ? { background: SCHOOL_META[s].color } : {}}
                onClick={() => setHighlightSchool(on ? null : s)}>
                <span className="dot" style={{ background: on ? '#fff' : SCHOOL_META[s].color }} />
                {SCHOOL_META[s].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="divider" />

      <div className="field">
        <label>Legenda — ređenja</label>
        <div className="legend">
          {Object.values(ORDINATION_META).map((o) => (
            <div key={o.label} className="row"><span className="gl">{o.glyph}</span> {o.label}</div>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Legenda — odnosi</label>
        <div className="legend">
          {Object.values(RELATION_META).map((r) => (
            <div key={r.label} className="row"><span className="sw" style={{ background: r.color, height: 3 }} /> {r.label}</div>
          ))}
        </div>
      </div>
    </aside>
  );
}
