import { memo } from 'react';
import type { Heresy, Orientation } from '../types';
import type { Geometry } from '../lib/geometry';
import type { LaidHeresy } from '../lib/layout';

interface Props {
  geo: Geometry;
  laid: LaidHeresy[];
  orientation: Orientation;
  selectedId: string | null;
  relatedIds: Set<string> | null; // heresy ids to emphasize; others dim. null = no dimming
  onHover: (h: Heresy | null, e?: React.MouseEvent) => void;
  onSelect: (id: string) => void;
}

const HERESY_COLOR = '#b0413e';

function HBar({ l, geo, orientation, state, onHover, onSelect }: {
  l: LaidHeresy; geo: Geometry; orientation: Orientation;
  state: 'sel' | 'rel' | 'dim' | 'normal';
  onHover: Props['onHover']; onSelect: Props['onSelect'];
}) {
  const box = geo.barBox(l);
  const h = l.heresy;
  const vertical = orientation === 'vertical';
  const cls = ['hbar', vertical ? 'v' : 'h'];
  if (state === 'dim') cls.push('dim');
  if (state === 'sel') cls.push('sel');
  if (state === 'rel') cls.push('rel');
  const opacity = state === 'dim' ? 0.14 : 1;

  // diagonal hatch so a heresy reads as a "crisis band", distinct from a person's solid lifeline
  const hatch = `repeating-linear-gradient(45deg, ${HERESY_COLOR}, ${HERESY_COLOR} 2px, ${HERESY_COLOR}cc 2px, ${HERESY_COLOR}cc 6px)`;

  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const lstyle: React.CSSProperties = vertical
    ? { left: cx + 5, top: box.top + 4, transformOrigin: '0 0', transform: 'rotate(90deg)' }
    : { left: box.left + 6, top: cy, transform: 'translateY(-50%)' };

  return (
    <>
      <div
        className={cls.join(' ')}
        style={{ left: box.left, top: box.top, width: box.width, height: box.height, background: hatch, opacity }}
        onMouseEnter={(e) => onHover(h, e)}
        onMouseMove={(e) => onHover(h, e)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(h.id)}
      />
      <span
        className={'hbar-label' + (state === 'dim' ? ' dim' : '')}
        style={{ ...lstyle, textShadow: '0 0 3px var(--bg), 0 0 3px var(--bg), 0 1px 0 var(--bg)' }}
      >
        {h.name}
      </span>
    </>
  );
}

function HeresyBars({ geo, laid, orientation, selectedId, relatedIds, onHover, onSelect }: Props) {
  return (
    <>
      {laid.map((l) => {
        let state: 'sel' | 'rel' | 'dim' | 'normal' = 'normal';
        if (selectedId === l.heresy.id) state = 'sel';
        else if (relatedIds) state = relatedIds.has(l.heresy.id) ? 'rel' : 'dim';
        return (
          <HBar key={l.heresy.id} l={l} geo={geo} orientation={orientation}
                state={state} onHover={onHover} onSelect={onSelect} />
        );
      })}
    </>
  );
}

export default memo(HeresyBars);
