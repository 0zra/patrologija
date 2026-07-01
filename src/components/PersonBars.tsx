import { memo } from 'react';
import type { Orientation, Person } from '../types';
import { CATEGORY_META, ORDINATION_META } from '../lib/constants';
import { isPrimary } from '../lib/coverage';
import type { Geometry } from '../lib/geometry';
import type { LaidPerson } from '../lib/layout';

interface Props {
  geo: Geometry;
  laid: LaidPerson[];
  orientation: Orientation;
  selectedId: string | null;
  relatedIds: Set<string> | null; // ids to emphasize; others dim. null = no dimming
  onHover: (p: Person | null, e?: React.MouseEvent) => void;
  onSelect: (id: string) => void;
}

function Bar({ l, geo, orientation, state, showLabel, onHover, onSelect }: {
  l: LaidPerson; geo: Geometry; orientation: Orientation;
  state: 'sel' | 'rel' | 'dim' | 'normal'; showLabel: boolean;
  onHover: Props['onHover']; onSelect: Props['onSelect'];
}) {
  let box = geo.barBox(l);
  const p = l.person;
  const primary = isPrimary(p);
  const color = CATEGORY_META[p.category]?.color ?? '#8d8782';
  const vertical = orientation === 'vertical';
  const cls = ['bar', vertical ? 'v' : 'h'];
  if (l.estimatedBirth) cls.push('estimated-cap');
  if (!primary) cls.push('secondary');
  if (state === 'dim') cls.push('dim');
  if (state === 'sel') cls.push('sel');
  if (state === 'rel') cls.push('rel');

  // secondary (merely-mentioned) figures render thinner and muted
  if (!primary) {
    if (vertical) { const nw = box.width * 0.58; box = { ...box, left: box.left + (box.width - nw) / 2, width: nw }; }
    else { const nh = box.height * 0.58; box = { ...box, top: box.top + (box.height - nh) / 2, height: nh }; }
  }
  const opacity = state === 'dim' ? 0.16 : !primary && state === 'normal' ? 0.6 : 1;
  const grad = primary
    ? `linear-gradient(${vertical ? '180deg' : '90deg'}, ${color}, ${shade(color, -14)})`
    : color;

  // ordination glyphs positioned along the bar at their year
  const glyphs = (p.ordinations ?? [])
    .filter((o) => o.year != null && o.year >= l.startYear - 2 && o.year <= l.endYear + 2)
    .map((o, i) => {
      const t = geo.timeToPx(o.year as number);
      const along = t - (vertical ? box.top : box.left);
      const style: React.CSSProperties = vertical
        ? { left: '50%', top: along }
        : { top: '50%', left: along };
      return (
        <span key={i} className="glyph" style={style} title={ORDINATION_META[o.type]?.label}>
          {ORDINATION_META[o.type]?.glyph ?? '•'}
        </span>
      );
    });

  // label
  let label = null;
  if (showLabel) {
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const lstyle: React.CSSProperties = vertical
      ? { left: cx + 5, top: box.top + 4, transformOrigin: '0 0', transform: 'rotate(90deg)' }
      : { left: box.left + 5, top: cy, transform: 'translateY(-50%)' };
    label = (
      <span className={'bar-label' + (state === 'dim' ? ' dim' : '') + (!primary ? ' secondary' : '')} style={{ ...lstyle, textShadow: '0 0 3px var(--bg), 0 0 3px var(--bg), 0 1px 0 var(--bg)' }}>
        {p.name}
      </span>
    );
  }

  return (
    <>
      <div
        className={cls.join(' ')}
        style={{ left: box.left, top: box.top, width: box.width, height: box.height, background: grad, opacity }}
        onMouseEnter={(e) => onHover(p, e)}
        onMouseMove={(e) => onHover(p, e)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(p.id)}
      >
        <div className="glyphs">{glyphs}</div>
      </div>
      {label}
    </>
  );
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function PersonBars({ geo, laid, orientation, selectedId, relatedIds, onHover, onSelect }: Props) {
  return (
    <>
      {laid.map((l) => {
        let state: 'sel' | 'rel' | 'dim' | 'normal' = 'normal';
        if (selectedId === l.person.id) state = 'sel';
        else if (relatedIds) state = relatedIds.has(l.person.id) ? 'rel' : 'dim';
        return (
          <Bar key={l.person.id} l={l} geo={geo} orientation={orientation}
               state={state} showLabel onHover={onHover} onSelect={onSelect} />
        );
      })}
    </>
  );
}

export default memo(PersonBars);
