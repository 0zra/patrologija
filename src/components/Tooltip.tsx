import { CATEGORY_META, EVENT_META, SIDE_LABEL } from '../lib/constants';
import type { Heresy, HistEvent, Person } from '../types';

export interface HoverState {
  kind: 'person' | 'event' | 'heresy';
  person?: Person;
  event?: HistEvent;
  heresy?: Heresy;
  x: number;
  y: number;
}

export default function Tooltip({ hover }: { hover: HoverState | null }) {
  if (!hover) return null;
  const pad = 16;
  const left = Math.min(hover.x + pad, window.innerWidth - 300);
  const top = Math.min(hover.y + pad, window.innerHeight - 120);

  if (hover.kind === 'person' && hover.person) {
    const p = hover.person;
    const cat = CATEGORY_META[p.category];
    const life = p.birthYear != null
      ? `${p.birthYear}.–${p.deathYear}.`
      : p.dateNote ?? (p.deathYear != null ? `†${p.deathYear}.` : '');
    return (
      <div className="tooltip" style={{ left, top }}>
        <div className="t-name">{p.name}</div>
        <div className="t-meta" style={{ color: cat.color }}>{cat.label} · {SIDE_LABEL[p.side] ?? p.side}</div>
        <div className="t-meta">{life}{p.locations?.length ? ` · ${p.locations[0]}` : ''}</div>
        <div className="t-hint">Klikni za detalje</div>
      </div>
    );
  }
  if (hover.kind === 'event' && hover.event) {
    const e = hover.event;
    return (
      <div className="tooltip" style={{ left, top }}>
        <div className="t-name">{e.title}</div>
        <div className="t-meta" style={{ color: EVENT_META[e.type].color }}>
          {EVENT_META[e.type].label} · {e.year ?? `${e.yearStart}–${e.yearEnd}`}
        </div>
        {e.participants.length ? <div className="t-meta">{e.participants.length} sudionika</div> : null}
        <div className="t-hint">Klikni za detalje</div>
      </div>
    );
  }
  if (hover.kind === 'heresy' && hover.heresy) {
    const h = hover.heresy;
    return (
      <div className="tooltip" style={{ left, top }}>
        <div className="t-name">{h.name}</div>
        <div className="t-meta" style={{ color: '#b0413e' }}>Hereza · {h.period}</div>
        {h.opponents.length ? <div className="t-meta">⚔ {h.opponents.length} protivnika</div> : null}
        <div className="t-hint">Klikni za detalje</div>
      </div>
    );
  }
  return null;
}
