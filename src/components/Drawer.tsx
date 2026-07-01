import { useEffect } from 'react';
import type { Relation, RelationType } from '../types';
import {
  CATEGORY_META, EVENT_META, ORDINATION_META, PERIOD_META, RELATION_META, SCHOOL_META, SIDE_LABEL,
} from '../lib/constants';
import {
  eventById, eventYear, eventsByPerson, heresiesByPerson, heresyById, peopleById, personName, relationsByPerson,
} from '../lib/data';
import { isPrimary } from '../lib/coverage';

interface Props {
  personId: string | null;
  eventId: string | null;
  heresyId: string | null;
  onClose: () => void;
  onSelectPerson: (id: string) => void;
  onSelectEvent: (id: string) => void;
  onSelectHeresy: (id: string) => void;
}

export default function Drawer({ personId, eventId, heresyId, onClose, onSelectPerson, onSelectEvent, onSelectHeresy }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!personId && !eventId && !heresyId) return null;

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        {personId ? (
          <PersonView id={personId} onClose={onClose} onSelectPerson={onSelectPerson} onSelectEvent={onSelectEvent} onSelectHeresy={onSelectHeresy} />
        ) : eventId ? (
          <EventView id={eventId} onClose={onClose} onSelectPerson={onSelectPerson} onSelectHeresy={onSelectHeresy} />
        ) : (
          <HeresyView id={heresyId!} onClose={onClose} onSelectPerson={onSelectPerson} onSelectEvent={onSelectEvent} />
        )}
      </aside>
    </>
  );
}

function lifeStr(by: number | null, dy: number | null, note?: string): string {
  const b = by != null ? `${by}.` : '?';
  const d = dy != null ? `${dy}.` : '?';
  if (by == null && note) return note;
  return `${b} – ${d}`;
}

function PersonView({ id, onClose, onSelectPerson, onSelectEvent, onSelectHeresy }: {
  id: string; onClose: () => void; onSelectPerson: (id: string) => void; onSelectEvent: (id: string) => void; onSelectHeresy: (id: string) => void;
}) {
  const p = peopleById.get(id);
  if (!p) return null;
  const cat = CATEGORY_META[p.category];
  const rels = relationsByPerson.get(id) ?? [];
  const evs = (eventsByPerson.get(id) ?? []).slice().sort((a, b) => eventYear(a) - eventYear(b));
  const her = heresiesByPerson.get(id) ?? [];

  // group relations by type
  const groups = new Map<RelationType, { r: Relation; out: boolean }[]>();
  for (const r of rels) {
    const out = r.from === id;
    if (!groups.has(r.type)) groups.set(r.type, []);
    groups.get(r.type)!.push({ r, out });
  }

  return (
    <>
      <div className="drawer-head">
        <div className="accent" style={{ background: cat.color }} />
        <button className="close" onClick={onClose} aria-label="Zatvori">×</button>
        <div className="kicker" style={{ color: cat.color }}>{cat.label}</div>
        <h2>{p.name}</h2>
        {p.fullName && <div className="full">{p.fullName}</div>}
        <div className="dates">
          {p.category === 'papa' && p.reignStart != null
            ? <span>⛪ <b>pontifikat {p.reignStart}.–{p.reignEnd}.</b></span>
            : p.reignStart != null
            ? <span>👑 <b>vladao {p.reignStart}.–{p.reignEnd}.</b></span>
            : <span>🗓 <b>{lifeStr(p.birthYear, p.deathYear, p.dateNote)}</b></span>}
          {p.reignStart != null && (p.birthYear != null || p.deathYear != null)
            ? <span>🗓 {lifeStr(p.birthYear, p.deathYear, p.dateNote)}</span> : null}
          {p.dateNote && <span>{p.dateNote}</span>}
          {p.locations?.length ? <span>📍 {p.locations.join(', ')}</span> : null}
        </div>
      </div>

      <div className="drawer-body">
        <div className="badges">
          {!isPrimary(p) && <span className="badge" style={{ fontStyle: 'italic' }}>usputno spomenut</span>}
          <span className="badge">{SIDE_LABEL[p.side] ?? p.side}</span>
          <span className="badge">{p.tradition === 'oba' ? 'Istok i Zapad' : p.tradition === 'istok' ? 'Istok' : 'Zapad'}</span>
          {p.period && <span className="badge" style={{ background: PERIOD_META[p.period].color + '44' }}>{PERIOD_META[p.period].label}</span>}
          {p.school && <span className="badge school" style={{ background: SCHOOL_META[p.school].color }}>{SCHOOL_META[p.school].label}</span>}
          {p.language?.map((l) => <span key={l} className="badge">{l}</span>)}
          {p.titles?.map((t) => <span key={t} className="badge" style={{ borderColor: cat.color, color: cat.color }}>{t}</span>)}
        </div>

        {p.keyFact && <div className="sect"><p className="bio" style={{ fontStyle: 'italic' }}>„{p.keyFact}”</p></div>}

        {p.bio && <div className="sect"><h3>Životopis</h3><p className="bio">{p.bio}</p></div>}

        {p.ordinations?.length ? (
          <div className="sect">
            <h3>Ređenja</h3>
            {p.ordinations.map((o, i) => (
              <div key={i} className="tline">
                <span className="yr">{o.year ?? '—'}</span>
                <span className="gl">
                  <b>{ORDINATION_META[o.type]?.glyph} {ORDINATION_META[o.type]?.label}</b>
                  {o.place ? ` · ${o.place}` : ''}
                  {o.note ? <div className="src-note">{o.note}</div> : null}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {p.teachings?.length ? (
          <div className="sect">
            <h3>Nauk</h3>
            {p.teachings.map((t, i) => (
              <div key={i} className="teaching">
                <div className="term">{t.term}</div>
                <div className="sum">{t.summary}</div>
              </div>
            ))}
          </div>
        ) : null}

        {p.works?.length ? (
          <div className="sect">
            <h3>Djela</h3>
            {p.works.map((w, i) => (
              <div key={i} className="work">
                <span className="ti">{w.title}</span>
                {w.year != null ? <span className="no"> ({w.year}.)</span> : null}
                {w.note ? <div className="no">{w.note}</div> : null}
              </div>
            ))}
          </div>
        ) : null}

        {groups.size ? (
          <div className="sect">
            <h3>Odnosi</h3>
            {[...groups.entries()].map(([type, list]) => {
              const meta = RELATION_META[type];
              return (
                <div key={type} className="rel-group">
                  <div className="lbl"><span className="bar3" style={{ background: meta.color }} />{meta.label}</div>
                  <div className="rel-list">
                    {list.map(({ r, out }, i) => {
                      const other = out ? r.to : r.from;
                      return (
                        <button key={i} className="rel-pill" onClick={() => onSelectPerson(other)} title={r.note ?? ''}>
                          {meta.arrow ? (out ? '→ ' : '← ') : ''}{personName(other)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {her.length ? (
          <div className="sect">
            <h3>Hereze</h3>
            {(['zacetnik', 'protivnik'] as const).map((role) => {
              const list = her.filter((x) => x.role === role);
              if (!list.length) return null;
              return (
                <div key={role} className="rel-group">
                  <div className="lbl">
                    <span className="bar3" style={{ background: role === 'zacetnik' ? '#b0413e' : '#c9a227' }} />
                    {role === 'zacetnik' ? 'začetnik / širitelj' : 'borio se protiv'}
                  </div>
                  <div className="rel-list">
                    {list.map(({ heresy }) => (
                      <button key={heresy.id} className="rel-pill" onClick={() => onSelectHeresy(heresy.id)} title={heresy.description}>
                        {heresy.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {evs.length ? (
          <div className="sect">
            <h3>Sudjelovao na</h3>
            {evs.map((e) => (
              <button key={e.id} className="evt-item" onClick={() => onSelectEvent(e.id)}>
                <span className="ey">{eventYear(e)}</span>
                <span className="et">{e.title}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

function EventView({ id, onClose, onSelectPerson, onSelectHeresy }: { id: string; onClose: () => void; onSelectPerson: (id: string) => void; onSelectHeresy: (id: string) => void; }) {
  const e = eventById.get(id);
  if (!e) return null;
  const meta = EVENT_META[e.type];
  const condemned = (e.heresiesCondemned ?? []).map((h) => heresyById.get(h)).filter(Boolean);

  return (
    <>
      <div className="drawer-head">
        <div className="accent" style={{ background: meta.color }} />
        <button className="close" onClick={onClose} aria-label="Zatvori">×</button>
        <div className="kicker" style={{ color: meta.color }}>{meta.label}</div>
        <h2>{e.title}</h2>
        <div className="dates"><span>🗓 <b>{e.year ?? `${e.yearStart}.–${e.yearEnd}.`}</b></span></div>
      </div>
      <div className="drawer-body">
        <div className="sect"><h3>Opis</h3><p className="bio">{e.description}</p></div>
        {e.outcome && <div className="sect"><h3>Ishod</h3><p className="bio">{e.outcome}</p></div>}
        {condemned.length ? (
          <div className="sect">
            <h3>Osuđene hereze</h3>
            <div className="rel-list">{condemned.map((h) => (
              <button key={h!.id} className="rel-pill heresy" onClick={() => onSelectHeresy(h!.id)} title={h!.description}>{h!.name}</button>
            ))}</div>
          </div>
        ) : null}
        {e.participants.length ? (
          <div className="sect">
            <h3>Sudionici</h3>
            <div className="rel-list">
              {e.participants.map((pid) => (
                <button key={pid} className="rel-pill" onClick={() => onSelectPerson(pid)}>{personName(pid)}</button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function HeresyView({ id, onClose, onSelectPerson, onSelectEvent }: {
  id: string; onClose: () => void; onSelectPerson: (id: string) => void; onSelectEvent: (id: string) => void;
}) {
  const h = heresyById.get(id);
  if (!h) return null;
  const HERESY_COLOR = '#b0413e';
  const condemnedEvents = (h.condemnedAt ?? []).map((eid) => eventById.get(eid)).filter(Boolean);

  return (
    <>
      <div className="drawer-head">
        <div className="accent" style={{ background: HERESY_COLOR }} />
        <button className="close" onClick={onClose} aria-label="Zatvori">×</button>
        <div className="kicker" style={{ color: HERESY_COLOR }}>Hereza / krivovjerje</div>
        <h2>{h.name}</h2>
        <div className="dates"><span>🗓 <b>{h.period}</b></span></div>
      </div>
      <div className="drawer-body">
        <div className="sect"><h3>Opis</h3><p className="bio">{h.description}</p></div>

        {h.founders.length ? (
          <div className="sect">
            <h3>Začetnici / širitelji</h3>
            <div className="rel-list">
              {h.founders.map((pid) => (
                <button key={pid} className="rel-pill heresy" onClick={() => onSelectPerson(pid)}>{personName(pid)}</button>
              ))}
            </div>
          </div>
        ) : null}

        {h.opponents.length ? (
          <div className="sect">
            <h3>Borili se protiv ({h.opponents.length})</h3>
            <div className="rel-list">
              {h.opponents.map((pid) => (
                <button key={pid} className="rel-pill" onClick={() => onSelectPerson(pid)}>⚔ {personName(pid)}</button>
              ))}
            </div>
          </div>
        ) : null}

        {condemnedEvents.length ? (
          <div className="sect">
            <h3>Osuđena na</h3>
            {condemnedEvents.map((e) => (
              <button key={e!.id} className="evt-item" onClick={() => onSelectEvent(e!.id)}>
                <span className="ey">{eventYear(e!)}</span>
                <span className="et">{e!.title}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
