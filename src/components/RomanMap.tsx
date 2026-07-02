import { useMemo } from 'react';
import landRaw from '../data/roman-world-land.json';
import { PLACES, type ResolvedPlace } from '../lib/places';

type LandData = { bbox: [number, number, number, number]; polygons: number[][][][] };
const LAND = landRaw as LandData;

// Faint context cities always drawn, so a lone marker has geographic reference points.
const ANCHORS = ['Rim', 'Carigrad', 'Aleksandrija', 'Antiohija', 'Jeruzalem', 'Kartaga'];

interface Props {
  places: ResolvedPlace[];
  /** rendered pixel width; height derives from the map aspect ratio */
  width: number;
  /** show labels for the person's places (off for the compact thumbnail to avoid clutter) */
  showPlaceLabels?: boolean;
  /** show labels for the anchor context cities too (full view only) */
  showAnchorLabels?: boolean;
  onClick?: () => void;
  title?: string;
}

function mercY(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

export default function RomanMap({ places, width, showPlaceLabels = true, showAnchorLabels, onClick, title }: Props) {
  const { height, project, landPath } = useMemo(() => {
    const [LON0, LAT0, LON1, LAT1] = LAND.bbox;
    const x0 = (LON0 * Math.PI) / 180;
    const x1 = (LON1 * Math.PI) / 180;
    const yTop = mercY(LAT1);
    const yBot = mercY(LAT0);
    const k = width / (x1 - x0);
    const h = (yTop - yBot) * k;
    const project = (lon: number, lat: number): [number, number] => [
      ((lon * Math.PI) / 180 - x0) * k,
      (yTop - mercY(lat)) * k,
    ];
    // one combined path (even-odd handles any holes)
    let d = '';
    for (const poly of LAND.polygons) {
      for (const ring of poly) {
        d += 'M';
        for (const [lon, lat] of ring) {
          const [px, py] = project(lon, lat);
          d += `${px.toFixed(1)},${py.toFixed(1)} `;
        }
        d += 'Z';
      }
    }
    return { height: h, project, landPath: d };
  }, [width]);

  // anchors that aren't already among the person's own places
  const ownKeys = new Set(places.map((p) => `${p.lat},${p.lon}`));
  const anchors = ANCHORS.map((n) => ({ name: n, ...PLACES[n] })).filter(
    (a) => a && !ownKeys.has(`${a.lat},${a.lon}`),
  );

  const label = (
    name: string,
    px: number,
    py: number,
    cls: string,
  ) => {
    const flip = px > width * 0.7; // keep labels from spilling off the right edge
    return (
      <text
        key={'l' + name + px}
        x={flip ? px - 6 : px + 6}
        y={py + 3}
        textAnchor={flip ? 'end' : 'start'}
        className={cls}
      >
        {name}
      </text>
    );
  };

  return (
    <svg
      className={'roman-map' + (onClick ? ' clickable' : '')}
      viewBox={`0 0 ${width} ${height.toFixed(1)}`}
      width={width}
      height={height}
      role="img"
      aria-label={title ?? 'Zemljovid'}
      onClick={onClick}
    >
      <rect x={0} y={0} width={width} height={height} className="rm-sea" />
      <path d={landPath} className="rm-land" fillRule="evenodd" />

      {/* context cities */}
      {anchors.map((a) => {
        const [px, py] = project(a.lon, a.lat);
        return (
          <g key={'a' + a.name}>
            <circle cx={px} cy={py} r={2.5} className="rm-anchor" />
            {showAnchorLabels ? label(a.name, px, py, 'rm-anchor-label') : null}
          </g>
        );
      })}

      {/* the person's places */}
      {places.map((p) => {
        const [px, py] = project(p.lon, p.lat);
        return (
          <g key={p.name}>
            {p.kind === 'regija' ? (
              <circle cx={px} cy={py} r={9} className="rm-region" />
            ) : null}
            <circle cx={px} cy={py} r={4.5} className="rm-place" />
            {showPlaceLabels ? label(p.name, px, py, 'rm-place-label') : null}
          </g>
        );
      })}
    </svg>
  );
}
