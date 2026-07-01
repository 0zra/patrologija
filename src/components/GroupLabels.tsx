import type { Orientation } from '../types';
import { Geometry } from '../lib/geometry';
import type { Layout } from '../lib/layout';

interface Tag { key: string; center: number; label: string; color: string; }

/** Sticky file headers that stay pinned while scrolling along the time axis. */
export default function GroupLabels({ geo, layout, orientation }: {
  geo: Geometry; layout: Layout; orientation: Orientation;
}) {
  const vertical = orientation === 'vertical';
  const tags: Tag[] = [];

  for (const g of layout.leftGroups) {
    const { min, size } = geo.zoneCrossRange('left', g.baseLane, g.baseLane + g.laneCount - 1);
    tags.push({ key: g.id, center: min + size / 2, label: g.label, color: g.color });
  }
  for (const g of layout.rightGroups) {
    const { min, size } = geo.zoneCrossRange('right', g.baseLane, g.baseLane + g.laneCount - 1);
    tags.push({ key: g.id, center: min + size / 2, label: g.label, color: g.color });
  }
  if (layout.lanes.rulers > 0) {
    const { min, size } = geo.zoneCrossRange('rulers', 0, layout.lanes.rulers - 1);
    tags.push({ key: 'vladari', center: min + size / 2, label: 'Vladari', color: '#8d8782' });
  }

  // container must take NO layout space (height 0) so it doesn't push the canvas.
  const container: React.CSSProperties = vertical
    ? { position: 'sticky', top: 0, left: 0, width: geo.crossSize, height: 0, zIndex: 16, pointerEvents: 'none' }
    : { position: 'sticky', left: 0, top: 0, width: 0, height: 0, zIndex: 16, pointerEvents: 'none' };

  return (
    <div style={container}>
      {tags.map((t) => {
        const style: React.CSSProperties = vertical
          ? { left: t.center, top: 8, transform: 'translateX(-50%)', borderColor: t.color, color: t.color }
          : { top: t.center, left: 8, transform: 'translateY(-50%)', borderColor: t.color, color: t.color };
        return <div key={t.key} className="group-tag" style={style}>{t.label}</div>;
      })}
    </div>
  );
}
