import type { HistEvent, Orientation } from '../types';
import { EVENT_META } from '../lib/constants';
import { eventYear } from '../lib/data';
import { Geometry } from '../lib/geometry';

const MAJOR = new Set(['koncil', 'sabor', 'edikt', 'raskol']);
const LINE = new Set(['koncil', 'sabor']);
const ECU_COLOR = '#b8860b';
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

interface Props {
  geo: Geometry;
  events: HistEvent[];
  orientation: Orientation;
  selectedEvent: string | null;
  dim: boolean;
  onSelect: (id: string) => void;
  onHover: (e: HistEvent | null, ev?: React.MouseEvent) => void;
}

export default function EventLayer({ geo, events, orientation, selectedEvent, dim, onSelect, onHover }: Props) {
  const vertical = orientation === 'vertical';

  const chipEvents = events
    .filter((e) => MAJOR.has(e.type) || e.ecumenical || e.id === selectedEvent)
    .sort((a, b) => eventYear(a) - eventYear(b));
  const MIN_GAP = 19;
  let lastPos = -Infinity;
  const chipPos = new Map<string, number>();
  for (const e of chipEvents) {
    let pos = geo.timeToPx(eventYear(e));
    if (pos - lastPos < MIN_GAP) pos = lastPos + MIN_GAP;
    chipPos.set(e.id, pos);
    lastPos = pos;
  }

  return (
    <>
      {/* full-cross lines: prominent for ecumenical councils, faint for other councils */}
      {events.filter((e) => LINE.has(e.type) || e.ecumenical).map((e) => {
        const t = geo.timeToPx(eventYear(e));
        const sel = e.id === selectedEvent;
        const ecu = !!e.ecumenical;
        const col = ecu ? ECU_COLOR : EVENT_META[e.type].color;
        const w = ecu ? (sel ? 3 : 2) : (sel ? 2 : 1);
        const op = ecu ? 0.6 : (sel ? 0.9 : 0.32);
        const style: React.CSSProperties = vertical
          ? { left: 0, top: t, width: geo.crossSize, height: 0, borderTop: `${w}px ${ecu ? 'solid' : sel ? 'solid' : 'dashed'} ${col}`, opacity: op }
          : { top: 0, left: t, height: geo.crossSize, width: 0, borderLeft: `${w}px ${ecu ? 'solid' : sel ? 'solid' : 'dashed'} ${col}`, opacity: op };
        return <div key={'ln' + e.id} className="event-line" style={style} />;
      })}

      {/* nodes */}
      {events.map((e) => {
        const { x, y } = geo.axisPoint(eventYear(e));
        const sel = e.id === selectedEvent;
        const ecu = !!e.ecumenical;
        const col = ecu ? ECU_COLOR : EVENT_META[e.type].color;
        if (ecu) {
          return (
            <div key={'nd' + e.id} className={'event-node ecu' + (sel ? ' sel' : '')}
              style={{ left: x, top: y, background: col, opacity: dim && !sel ? 0.5 : 1 }}
              onClick={() => onSelect(e.id)}
              onMouseEnter={(ev) => onHover(e, ev)} onMouseMove={(ev) => onHover(e, ev)} onMouseLeave={() => onHover(null)}>
              <span className="ecu-star">✦</span>
            </div>
          );
        }
        return (
          <div key={'nd' + e.id} className={'event-node' + (sel ? ' sel' : '')}
            style={{ left: x, top: y, background: col, opacity: dim && !sel ? 0.4 : 1 }}
            onClick={() => onSelect(e.id)}
            onMouseEnter={(ev) => onHover(e, ev)} onMouseMove={(ev) => onHover(e, ev)} onMouseLeave={() => onHover(null)} />
        );
      })}

      {/* chips */}
      {chipEvents.map((e) => {
        const pos = chipPos.get(e.id)!;
        const ecu = !!e.ecumenical;
        const col = ecu ? ECU_COLOR : EVENT_META[e.type].color;
        const sel = e.id === selectedEvent;
        const off = geo.centerCross + (ecu ? 30 : 26);
        const style: React.CSSProperties = vertical
          ? { left: off, top: pos, transform: 'translateY(-50%)', borderLeftColor: col }
          : { top: off, left: pos, transform: 'translateX(-50%)', borderLeftColor: col };
        return (
          <div key={'ch' + e.id}
            className={'event-chip' + (ecu ? ' ecu' : '') + (sel ? '' : dim ? ' dim' : '')}
            style={style}
            onClick={() => onSelect(e.id)}
            onMouseEnter={(ev) => onHover(e, ev)} onMouseMove={(ev) => onHover(e, ev)} onMouseLeave={() => onHover(null)}>
            {ecu && <span className="ecu-badge">✦ {ROMAN[e.ecumenicalNo ?? 0]}. ekum.</span>}
            <span className="yr" style={{ color: col }}>{eventYear(e)}</span>
            <span className="ttl">{e.title}</span>
          </div>
        );
      })}
    </>
  );
}
