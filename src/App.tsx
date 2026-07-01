import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category, Heresy, HistEvent, Orientation, Person, SchoolId } from './types';
import { YEAR_MAX, YEAR_MIN } from './lib/constants';
import { data, eventById, heresiesByPerson, heresyById, relationsByPerson, schoolById } from './lib/data';
import { isPrimary } from './lib/coverage';
import { buildLayout } from './lib/layout';
import { Geometry } from './lib/geometry';
import AxisLayer from './components/AxisLayer';
import GroupBands from './components/GroupBands';
import GroupLabels from './components/GroupLabels';
import PersonBars from './components/PersonBars';
import EventLayer from './components/EventLayer';
import RelationLayer from './components/RelationLayer';
import SchoolBracket from './components/SchoolBracket';
import Drawer from './components/Drawer';
import HeresyBars from './components/HeresyBars';
import Sidebar, { type Filters } from './components/Sidebar';
import Tooltip, { type HoverState } from './components/Tooltip';

const ALL_CATS: Category[] = ['apostolski-otac', 'otac', 'naucitelj', 'apologet', 'pisac', 'biskup', 'papa', 'heretik', 'ostalo', 'car'];

export default function App() {
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [zoom, setZoom] = useState(5);
  const [showRelations, setShowRelations] = useState(true);
  const [showStubs, setShowStubs] = useState(false);
  const [showAllPopes, setShowAllPopes] = useState(false);
  const [onlyPrimary, setOnlyPrimary] = useState(false);
  const [filters, setFilters] = useState<Filters>({ categories: new Set(ALL_CATS), showRulers: false });
  const [highlightSchool, setHighlightSchool] = useState<SchoolId | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedHeresy, setSelectedHeresy] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [welcome, setWelcome] = useState(() => localStorage.getItem('patrologija.welcomeSeen') !== '1');
  const dismissWelcome = () => {
    setWelcome(false);
    try { localStorage.setItem('patrologija.welcomeSeen', '1'); } catch { /* storage unavailable */ }
  };

  const mainRef = useRef<HTMLDivElement>(null);
  const [mainSize, setMainSize] = useState({ w: 1000, h: 800 });

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMainSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setMainSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const filteredPeople = useMemo(() => {
    return data.people.filter((p) => {
      if (p.isStub && !showStubs) return false;
      if (onlyPrimary && !isPrimary(p)) return false;
      if (p.side === 'svjetovni') return filters.showRulers && filters.categories.has('car');
      if (p.category === 'papa') {
        if (!filters.categories.has('papa')) return false;
        return showAllPopes || p.weight >= 3; // only relevant popes by default
      }
      return filters.categories.has(p.category);
    });
  }, [filters, showStubs, showAllPopes, onlyPrimary]);

  const layout = useMemo(() => buildLayout(filteredPeople), [filteredPeople]);
  const availableCross = (orientation === 'vertical' ? mainSize.w : mainSize.h) - 16;
  const geo = useMemo(
    () => new Geometry(layout, zoom, orientation, YEAR_MAX - YEAR_MIN, availableCross),
    [layout, zoom, orientation, availableCross],
  );

  // focus set: which person ids stay highlighted (others dim)
  const focusSet = useMemo<Set<string> | null>(() => {
    if (selectedPerson) {
      const s = new Set<string>([selectedPerson]);
      for (const r of relationsByPerson.get(selectedPerson) ?? []) {
        s.add(r.from); s.add(r.to);
      }
      return s;
    }
    if (selectedEvent) {
      const e = eventById.get(selectedEvent);
      return e ? new Set(e.participants) : null;
    }
    if (selectedHeresy) {
      const h = heresyById.get(selectedHeresy);
      return h ? new Set([...h.founders, ...h.opponents]) : null;
    }
    if (highlightSchool) {
      const sc = schoolById.get(highlightSchool);
      return sc ? new Set(sc.members) : null;
    }
    return null;
  }, [selectedPerson, selectedEvent, selectedHeresy, highlightSchool]);

  // which heresy bars stay highlighted (others dim). null = no dimming
  const focusHeresies = useMemo<Set<string> | null>(() => {
    if (selectedHeresy) return new Set([selectedHeresy]);
    if (selectedPerson) return new Set((heresiesByPerson.get(selectedPerson) ?? []).map((x) => x.heresy.id));
    if (selectedEvent) {
      const e = eventById.get(selectedEvent);
      return new Set(e?.heresiesCondemned ?? []);
    }
    if (highlightSchool) return new Set();
    return null;
  }, [selectedHeresy, selectedPerson, selectedEvent, highlightSchool]);

  const selectedEventObj: HistEvent | null = selectedEvent ? eventById.get(selectedEvent) ?? null : null;
  const personRelations = selectedPerson ? relationsByPerson.get(selectedPerson) ?? [] : [];

  // scroll selected person into view
  useEffect(() => {
    if (!selectedPerson || !mainRef.current) return;
    const l = layout.byId.get(selectedPerson);
    if (!l) return;
    const box = geo.barBox(l);
    const el = mainRef.current;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    el.scrollTo({
      left: cx - el.clientWidth / 2,
      top: cy - el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [selectedPerson, geo, layout]);

  // scroll selected heresy bar into view (e.g. when picked from a drawer)
  useEffect(() => {
    if (!selectedHeresy || !mainRef.current) return;
    const l = layout.byHeresyId.get(selectedHeresy);
    if (!l) return;
    const box = geo.barBox(l);
    const el = mainRef.current;
    el.scrollTo({
      left: box.left + box.width / 2 - el.clientWidth / 2,
      top: box.top + box.height / 2 - el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [selectedHeresy, geo, layout]);

  const pickPerson = (id: string) => {
    setSelectedEvent(null);
    setSelectedHeresy(null);
    setSelectedPerson(id);
    setWelcome(false);
  };
  const pickEvent = (id: string) => {
    setSelectedPerson(null);
    setSelectedHeresy(null);
    setSelectedEvent(id);
    setWelcome(false);
  };
  const pickHeresy = (id: string) => {
    setSelectedPerson(null);
    setSelectedEvent(null);
    setSelectedHeresy(id);
    setWelcome(false);
  };
  const closeDrawer = () => { setSelectedPerson(null); setSelectedEvent(null); setSelectedHeresy(null); };

  const onCanvasClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.bar, .hbar, .event-node, .event-chip')) {
      setSelectedPerson(null);
      setSelectedEvent(null);
      setSelectedHeresy(null);
    }
  };

  const onHoverPerson = (p: Person | null, e?: React.MouseEvent) => {
    if (!p || !e) return setHover(null);
    setHover({ kind: 'person', person: p, x: e.clientX, y: e.clientY });
  };
  const onHoverEvent = (ev: HistEvent | null, e?: React.MouseEvent) => {
    if (!ev || !e) return setHover(null);
    setHover({ kind: 'event', event: ev, x: e.clientX, y: e.clientY });
  };
  const onHoverHeresy = (h: Heresy | null, e?: React.MouseEvent) => {
    if (!h || !e) return setHover(null);
    setHover({ kind: 'heresy', heresy: h, x: e.clientX, y: e.clientY });
  };

  const { width, height } = geo.canvas();
  const focusActive = focusSet != null;

  return (
    <div className={'app' + (sideOpen ? '' : ' no-side')}>
      <header className="header">
        <button className="icon-btn" onClick={() => setSideOpen((s) => !s)} title="Izbornik">☰</button>
        <div className="brand">
          <h1>Patrologija</h1>
          <span className="sub">Vremenska crta otaca, pisaca i hereza · 1.–9. st.</span>
        </div>
        <div className="spacer" />
        <div className="stat">
          <b>{data.people.length}</b> osoba · <b>{data.events.length}</b> događaja · <b>{data.heresies.length}</b> hereza<br />
          <span style={{ opacity: 0.75 }}>iz triju skripti Patrologije</span>
        </div>
      </header>

      <Sidebar
        filters={filters} setFilters={setFilters}
        orientation={orientation} setOrientation={setOrientation}
        zoom={zoom} setZoom={setZoom}
        showRelations={showRelations} setShowRelations={setShowRelations}
        showStubs={showStubs} setShowStubs={setShowStubs}
        showAllPopes={showAllPopes} setShowAllPopes={setShowAllPopes}
        onlyPrimary={onlyPrimary} setOnlyPrimary={setOnlyPrimary}
        highlightSchool={highlightSchool} setHighlightSchool={setHighlightSchool}
        onPick={pickPerson}
      />

      <main className="main" ref={mainRef} onClick={onCanvasClick}>
        <GroupLabels geo={geo} layout={layout} orientation={orientation} />
        <div className="canvas" style={{ width, height }}>
          <GroupBands geo={geo} layout={layout} orientation={orientation} />
          <AxisLayer geo={geo} orientation={orientation} />

          {highlightSchool && (
            <SchoolBracket geo={geo} school={highlightSchool} laidById={layout.byId} orientation={orientation} />
          )}

          <EventLayer
            geo={geo} events={data.events} orientation={orientation}
            selectedEvent={selectedEvent} dim={focusActive}
            onSelect={pickEvent} onHover={onHoverEvent}
          />

          <PersonBars
            geo={geo} laid={layout.laid} orientation={orientation}
            selectedId={selectedPerson} relatedIds={focusSet}
            onHover={onHoverPerson} onSelect={pickPerson}
          />

          <HeresyBars
            geo={geo} laid={layout.laidHeresies} orientation={orientation}
            selectedId={selectedHeresy} relatedIds={focusHeresies}
            onHover={onHoverHeresy} onSelect={pickHeresy}
          />

          {(showRelations || selectedEventObj) && (
            <RelationLayer
              geo={geo} laidById={layout.byId}
              selectedPerson={showRelations ? selectedPerson : null}
              personRelations={showRelations ? personRelations : []}
              selectedEvent={selectedEventObj}
            />
          )}
        </div>

        {welcome && (
          <div className="welcome">
            <button className="x" onClick={dismissWelcome}>×</button>
            <h2>Vremenska crta patrologije</h2>
            <p>
              U sredini je os godina. <b>Lijevo</b> su pravovjerni oci, naučitelji i pisci; <b>desno</b> su, uz os,
              pisci osuđeni posmrtno (umrli u jedinstvu s Crkvom), a dalje pravi heretici. Među njima su <b>crtkane crvene trake</b> —
              same hereze (arijanizam, monoteletizam…), položene uz osobe koje su ih širile ili pobijale; klikni traku za sve detalje.
              Zlatne točke su sabori i događaji. Klikni osobu, herezu ili događaj za detalje,
              pretraži ili filtriraj lijevo. Simboli na crti označavaju ređenja (đakon, prezbiter, biskup…).
            </p>
            <p className="welcome-note">💻 Najbolje se pregledava na računalu (širem zaslonu).</p>
          </div>
        )}
      </main>

      <Tooltip hover={hover} />

      <Drawer
        personId={selectedPerson} eventId={selectedEvent} heresyId={selectedHeresy}
        onClose={closeDrawer}
        onSelectPerson={pickPerson} onSelectEvent={pickEvent} onSelectHeresy={pickHeresy}
      />
    </div>
  );
}
