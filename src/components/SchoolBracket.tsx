import type { Orientation, SchoolId } from '../types';
import { SCHOOL_META } from '../lib/constants';
import { schoolById } from '../lib/data';
import { Geometry } from '../lib/geometry';
import type { LaidPerson } from '../lib/layout';

export default function SchoolBracket({ geo, school, laidById, orientation }: {
  geo: Geometry; school: SchoolId; laidById: Map<string, LaidPerson>; orientation: Orientation;
}) {
  const s = schoolById.get(school);
  if (!s) return null;
  const members = s.members.map((id) => laidById.get(id)).filter(Boolean) as LaidPerson[];
  if (!members.length) return null;
  const t0 = geo.timeToPx(Math.min(...members.map((m) => m.startYear)));
  const t1 = geo.timeToPx(Math.max(...members.map((m) => m.endYear)));
  const col = SCHOOL_META[school].color;
  const vertical = orientation === 'vertical';

  const ribbon: React.CSSProperties = vertical
    ? { left: 6, top: t0, width: 7, height: t1 - t0, background: col, opacity: 0.85 }
    : { top: 6, left: t0, height: 7, width: t1 - t0, background: col, opacity: 0.85 };
  const tag: React.CSSProperties = vertical
    ? { left: 18, top: t0, transform: 'translateY(-4px)', background: col }
    : { left: t0, top: 18, background: col };

  return (
    <>
      <div className="school-bracket" style={ribbon} />
      <div className="school-tag" style={tag}>{SCHOOL_META[school].label}</div>
    </>
  );
}
