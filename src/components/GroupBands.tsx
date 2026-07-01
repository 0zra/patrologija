import type { Orientation } from '../types';
import { Geometry } from '../lib/geometry';
import type { Layout } from '../lib/layout';

/** Tinted background bands per clustered file + an East/West divider. */
export default function GroupBands({ geo, layout, orientation }: {
  geo: Geometry; layout: Layout; orientation: Orientation;
}) {
  const vertical = orientation === 'vertical';
  const bandFor = (zone: 'left' | 'right', id: string, color: string, baseLane: number, laneCount: number) => {
    const { min, size } = geo.zoneCrossRange(zone, baseLane, baseLane + laneCount - 1);
    const style: React.CSSProperties = vertical
      ? { left: min - 5, top: 0, width: size + 10, height: geo.timeLength, background: color + '12' }
      : { top: min - 5, left: 0, height: size + 10, width: geo.timeLength, background: color + '12' };
    return <div key={zone + '-' + id} className="group-band" style={style} />;
  };
  const bands = [
    ...layout.leftGroups.map((g) => bandFor('left', g.id, g.color, g.baseLane, g.laneCount)),
    ...layout.rightGroups.map((g) => bandFor('right', g.id, g.color, g.baseLane, g.laneCount)),
  ];

  // East/West divider — placed just before the West cluster
  const west = layout.leftGroups.find((g) => g.isWest);
  let divider = null;
  if (west) {
    const boundary = west.baseLane - 0.9; // mid-gap lane position
    const c = geo.crossStart('left', boundary) + geo.barThick / 2;
    const style: React.CSSProperties = vertical
      ? { left: c, top: 0, width: 0, height: geo.timeLength, borderLeft: '1.5px dashed rgba(70,58,38,0.35)' }
      : { top: c, left: 0, height: 0, width: geo.timeLength, borderTop: '1.5px dashed rgba(70,58,38,0.35)' };
    divider = <div className="group-divider" style={style} />;
  }

  return <>{bands}{divider}</>;
}
