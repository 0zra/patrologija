import type { HistEvent, Relation } from '../types';
import { RELATION_META } from '../lib/constants';
import { Geometry } from '../lib/geometry';
import type { LaidPerson } from '../lib/layout';

interface Props {
  geo: Geometry;
  laidById: Map<string, LaidPerson>;
  selectedPerson: string | null;
  personRelations: Relation[];
  selectedEvent: HistEvent | null;
}

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(len * 0.22, 70);
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export default function RelationLayer({ geo, laidById, selectedPerson, personRelations, selectedEvent }: Props) {
  const { width, height } = geo.canvas();

  const arcs: React.ReactNode[] = [];

  if (selectedPerson && laidById.has(selectedPerson)) {
    const a = geo.anchor(laidById.get(selectedPerson)!);
    personRelations.forEach((r, i) => {
      const otherId = r.from === selectedPerson ? r.to : r.from;
      const ol = laidById.get(otherId);
      if (!ol) return;
      const b = geo.anchor(ol);
      const meta = RELATION_META[r.type];
      const col = meta?.color ?? '#888';
      arcs.push(
        <g key={'r' + i}>
          <path d={curve(a.x, a.y, b.x, b.y)} fill="none" stroke={col} strokeWidth={2} strokeOpacity={0.75} strokeLinecap="round" />
          <circle cx={b.x} cy={b.y} r={4} fill={col} />
        </g>
      );
    });
  }

  if (selectedEvent) {
    const yr = selectedEvent.year ?? selectedEvent.yearStart ?? selectedEvent.yearEnd ?? 0;
    const a = geo.axisPoint(yr);
    selectedEvent.participants.forEach((pid, i) => {
      const ol = laidById.get(pid);
      if (!ol) return;
      const b = geo.anchor(ol);
      arcs.push(
        <g key={'e' + i}>
          <path d={curve(a.x, a.y, b.x, b.y)} fill="none" stroke="#b8860b" strokeWidth={2.2} strokeOpacity={0.9} strokeDasharray="1 5" strokeLinecap="round" />
          <circle cx={b.x} cy={b.y} r={4} fill="#b8860b" />
        </g>
      );
    });
  }

  return (
    <svg className="svg-layer" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {arcs}
    </svg>
  );
}
