import type { Orientation } from '../types';
import { YEAR_MAX, YEAR_MIN, PERIOD_META } from '../lib/constants';
import { Geometry } from '../lib/geometry';

export default function AxisLayer({ geo, orientation }: { geo: Geometry; orientation: Orientation }) {
  const vertical = orientation === 'vertical';
  const ticks: number[] = [];
  for (let y = 50; y <= YEAR_MAX; y += 50) ticks.push(y);

  const eraBounds: [number, number, 1 | 2 | 3][] = [
    [YEAR_MIN, 325, 1],
    [325, 461, 2],
    [461, YEAR_MAX, 3],
  ];

  return (
    <>
      {/* era bands behind everything */}
      {eraBounds.map(([a, b, p]) => {
        const t0 = geo.timeToPx(a);
        const t1 = geo.timeToPx(b);
        const meta = PERIOD_META[p];
        const tint = meta.color + '22';
        const style: React.CSSProperties = vertical
          ? { left: 0, top: t0, width: geo.crossSize, height: t1 - t0, background: tint, borderTop: '1px dashed var(--line)' }
          : { top: 0, left: t0, height: geo.crossSize, width: t1 - t0, background: tint, borderLeft: '1px dashed var(--line)' };
        return <div key={p} className="era-band" style={style} />;
      })}
      {/* era labels */}
      {eraBounds.map(([a, b, p]) => {
        const mid = geo.timeToPx((a + b) / 2);
        const meta = PERIOD_META[p];
        const style: React.CSSProperties = vertical
          ? { top: mid, left: 8, transform: 'translateY(-50%)' }
          : { left: mid, top: 6, transform: 'translateX(-50%)' };
        return <div key={'l' + p} className="era-label" style={style}>{meta.label} · {meta.range}</div>;
      })}

      {/* central axis line */}
      <div className="axis-line" style={vertical
        ? { left: geo.centerCross - 1, top: 0, width: 2, height: geo.timeLength }
        : { top: geo.centerCross - 1, left: 0, height: 2, width: geo.timeLength }} />

      {/* year ticks */}
      {ticks.map((y) => {
        const t = geo.timeToPx(y);
        const style: React.CSSProperties = vertical
          ? { left: geo.centerCross, top: t, transform: 'translate(-50%, -50%)' }
          : { top: geo.centerCross, left: t, transform: 'translate(-50%, -50%)' };
        return (
          <div key={y} className="axis-tick" style={style}>
            <span className="lbl">{y}</span>
          </div>
        );
      })}
    </>
  );
}
