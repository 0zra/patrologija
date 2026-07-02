import type { Orientation } from '../types';
import { YEAR_MIN } from './constants';
import type { Layout, Zone } from './layout';

/** Anything placeable on the timeline: a person bar or a heresy bar. */
export interface Placed { zone: Zone; lane: number; startYear: number; endYear: number; }

export const EDGE_PAD = 46;
export const AXIS_BAND = 62;          // central gutter for year labels + event nodes
export const ZONE_PAD = 20;           // gap between axis gutter and first lane
export const BAR_THICK_MIN = 13;      // cross-axis thickness of a person bar
export const BAR_THICK_MAX = 30;
export const LANE_GAP_MIN = 9;
export const LANE_STEP_MIN = BAR_THICK_MIN + LANE_GAP_MIN;
export const LANE_STEP_MAX = 58;
export const RULER_GAP = 26;          // gap between orthodox zone and rulers track

export interface Box { left: number; top: number; width: number; height: number; }

export class Geometry {
  pxPerYear: number;
  orientation: Orientation;
  layout: Layout;
  timeLength: number;
  crossSize: number;
  centerCross: number;
  leftEdge: number;
  rightEdge: number;
  rulersOuter: number;
  laneStep: number;
  barThick: number;

  constructor(layout: Layout, pxPerYear: number, orientation: Orientation, timeSpan: number, availableCross = 0, fitCross = false) {
    this.layout = layout;
    this.pxPerYear = pxPerYear;
    this.orientation = orientation;
    this.timeLength = timeSpan * pxPerYear + EDGE_PAD * 2;

    const totalLanes = layout.lanes.left + layout.lanes.right + layout.lanes.rulers;
    const hasRulers = layout.lanes.rulers > 0;
    const fixedExtra = EDGE_PAD * 2 + AXIS_BAND + ZONE_PAD * 2 + (hasRulers ? RULER_GAP : 0);

    let laneStep = LANE_STEP_MIN;
    let barThick = Math.max(BAR_THICK_MIN, Math.min(BAR_THICK_MAX, laneStep - LANE_GAP_MIN));
    if (fitCross && totalLanes > 0) {
      // shrink lanes/bars (below the usual minimum if needed) so every lane fits
      // within the available cross-axis — the whole cluster is visible without scrolling it
      laneStep = Math.min(LANE_STEP_MAX, (availableCross - fixedExtra) / totalLanes);
      const gap = Math.min(LANE_GAP_MIN, laneStep * 0.3);
      barThick = Math.max(3, Math.min(BAR_THICK_MAX, laneStep - gap));
    } else if (totalLanes > 0 && availableCross > fixedExtra + totalLanes * LANE_STEP_MIN) {
      // stretch lanes/bars to fill the available cross-axis when there is spare room
      laneStep = Math.min(LANE_STEP_MAX, (availableCross - fixedExtra) / totalLanes);
      barThick = Math.max(BAR_THICK_MIN, Math.min(BAR_THICK_MAX, laneStep - LANE_GAP_MIN));
    }
    this.laneStep = laneStep;
    this.barThick = barThick;

    const leftW = layout.lanes.left * laneStep;
    const rightW = layout.lanes.right * laneStep;
    const rulersW = layout.lanes.rulers * laneStep;
    const rulersBlock = rulersW > 0 ? rulersW + RULER_GAP : 0;

    const natural = EDGE_PAD + rulersBlock + leftW + ZONE_PAD + AXIS_BAND + ZONE_PAD + rightW + EDGE_PAD;
    this.crossSize = Math.max(natural, availableCross);
    // center the whole cluster inside the (possibly wider) canvas
    const slack = (this.crossSize - natural) / 2;
    this.centerCross = slack + EDGE_PAD + rulersBlock + leftW + ZONE_PAD + AXIS_BAND / 2;
    this.leftEdge = this.centerCross - AXIS_BAND / 2;
    this.rightEdge = this.centerCross + AXIS_BAND / 2;
    this.rulersOuter = this.leftEdge - ZONE_PAD - leftW - RULER_GAP;
  }

  timeToPx(year: number): number {
    return (year - YEAR_MIN) * this.pxPerYear + EDGE_PAD;
  }

  crossStart(zone: Zone, lane: number): number {
    if (zone === 'left') return this.leftEdge - ZONE_PAD - lane * this.laneStep - this.barThick;
    if (zone === 'right') return this.rightEdge + ZONE_PAD + lane * this.laneStep;
    return this.rulersOuter - lane * this.laneStep - this.barThick;
  }

  crossCenter(l: Placed): number {
    return this.crossStart(l.zone, l.lane) + this.barThick / 2;
  }

  /** cross-axis extent (min coord + size) covering a lane range in a zone */
  zoneCrossRange(zone: Zone, fromLane: number, toLane: number): { min: number; size: number } {
    const a = this.crossStart(zone, fromLane);
    const b = this.crossStart(zone, toLane);
    const min = Math.min(a, b);
    const max = Math.max(a, b) + this.barThick;
    return { min, size: max - min };
  }

  toXY(timePx: number, crossPx: number): { x: number; y: number } {
    return this.orientation === 'vertical' ? { x: crossPx, y: timePx } : { x: timePx, y: crossPx };
  }

  canvas(): { width: number; height: number } {
    return this.orientation === 'vertical'
      ? { width: this.crossSize, height: this.timeLength }
      : { width: this.timeLength, height: this.crossSize };
  }

  barBox(l: Placed): Box {
    const t0 = this.timeToPx(l.startYear);
    const t1 = this.timeToPx(l.endYear);
    const cs = this.crossStart(l.zone, l.lane);
    if (this.orientation === 'vertical') {
      return { left: cs, top: t0, width: this.barThick, height: Math.max(t1 - t0, this.barThick) };
    }
    return { left: t0, top: cs, width: Math.max(t1 - t0, this.barThick), height: this.barThick };
  }

  anchor(l: Placed): { x: number; y: number } {
    const tMid = this.timeToPx((l.startYear + l.endYear) / 2);
    return this.toXY(tMid, this.crossCenter(l));
  }

  axisPoint(year: number): { x: number; y: number } {
    return this.toXY(this.timeToPx(year), this.centerCross);
  }
}
