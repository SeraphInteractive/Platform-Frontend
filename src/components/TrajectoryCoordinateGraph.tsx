import React, { useState, useRef, useId } from 'react';

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface TrajectorySeries {
  id: string;
  name: string;
  color: string;
  strokeWidth?: number;
  dashArray?: string;
  isLinear?: boolean;
  points: TrajectoryPoint[];
  fillGradient?: boolean;
  annotations?: {
    x: number;
    y: number;
    text: string;
    color?: string;
    align?: 'start' | 'middle' | 'end';
  }[];
  description?: string;
}

export interface CohortBand {
  upper: TrajectoryPoint[];
  lower: TrajectoryPoint[];
  label: string;
  color?: string;
}

export interface TimeSpanOption {
  id: string;
  label: string;
}

interface TrajectoryCoordinateGraphProps {
  title?: string;
  xLabel: string;
  yLabel: string;
  xMin?: number;
  xMax: number;
  yMin?: number;
  yMax: number;
  xStep?: number;
  yStep?: number;
  series: TrajectorySeries[];
  cohortBand?: CohortBand;
  height?: number;
  xUnit?: string;
  yUnit?: string;
  timeSpans?: TimeSpanOption[];
  activeTimeSpan?: string;
  onTimeSpanChange?: (span: string) => void;
}

// Generate smooth cubic bezier or crisp linear path string from points
function generateSmoothPath(
  points: TrajectoryPoint[],
  toSvgX: (x: number) => number,
  toSvgY: (y: number) => number,
  isLinear?: boolean
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${toSvgX(points[0].x).toFixed(1)} ${toSvgY(points[0].y).toFixed(1)}`;
  if (points.length === 2 || isLinear) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x).toFixed(1)} ${toSvgY(p.y).toFixed(1)}`).join(' ');
  }

  const svgPts = points.map((p) => ({ x: toSvgX(p.x), y: toSvgY(p.y) }));
  let path = `M ${svgPts[0].x.toFixed(1)} ${svgPts[0].y.toFixed(1)}`;

  for (let i = 0; i < svgPts.length - 1; i++) {
    const p0 = svgPts[Math.max(0, i - 1)]!;
    const p1 = svgPts[i]!;
    const p2 = svgPts[i + 1]!;
    const p3 = svgPts[Math.min(svgPts.length - 1, i + 2)]!;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

// Generate closed area path under a curve for gradient fills
function generateAreaPath(
  points: TrajectoryPoint[],
  toSvgX: (x: number) => number,
  toSvgY: (y: number) => number,
  baselineY: number,
  isLinear?: boolean
): string {
  if (points.length < 2) return '';
  const curve = generateSmoothPath(points, toSvgX, toSvgY, isLinear);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${curve} L ${toSvgX(last.x).toFixed(1)} ${baselineY.toFixed(1)} L ${toSvgX(first.x).toFixed(1)} ${baselineY.toFixed(1)} Z`;
}

export const TrajectoryCoordinateGraph: React.FC<TrajectoryCoordinateGraphProps> = ({
  title,
  xLabel,
  yLabel,
  xMin = 0,
  xMax,
  yMin = 0,
  yMax,
  xStep = 2,
  yStep = 10,
  series,
  cohortBand,
  height = 280,
  xUnit = '',
  yUnit = '',
  timeSpans,
  activeTimeSpan,
  onTimeSpanChange,
}) => {
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);
  const [hoveredXVal, setHoveredXVal] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const graphId = useId().replace(/:/g, '_');

  const svgWidth = 800;
  const svgHeight = height;
  const padLeft = 44;
  const padRight = 28;
  const padTop = 18;
  const padBottom = 28;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const safeXSpan = Math.max(1, xMax - xMin);
  const safeYSpan = Math.max(1, yMax - yMin);

  const toSvgX = (x: number) => padLeft + ((x - xMin) / safeXSpan) * plotW;
  const toSvgY = (y: number) => padTop + plotH - ((y - yMin) / safeYSpan) * plotH;
  const baselineY = padTop + plotH;

  // X ticks: clean numbers
  const xTicks: number[] = [];
  const calculatedXStep = Math.max(1, xStep);
  for (let x = xMin; x <= xMax; x += calculatedXStep) {
    xTicks.push(x);
  }
  if (xTicks.length > 0 && xTicks[xTicks.length - 1]! < xMax) {
    if (xMax - xTicks[xTicks.length - 1]! >= calculatedXStep * 0.4) {
      xTicks.push(xMax);
    } else {
      xTicks[xTicks.length - 1] = xMax;
    }
  }

  // Y ticks: clean numbers
  const yTicks: number[] = [];
  const calculatedYStep = Math.max(1, yStep);
  for (let y = yMin; y <= yMax; y += calculatedYStep) {
    yTicks.push(y);
  }
  if (yTicks.length > 0 && yTicks[yTicks.length - 1]! < yMax) {
    if (yMax - yTicks[yTicks.length - 1]! >= calculatedYStep * 0.4) {
      yTicks.push(yMax);
    } else {
      yTicks[yTicks.length - 1] = yMax;
    }
  }

  const hasData = series.some((s) => s.points.some((p) => p.x > 0 || p.y > 0));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !hasData) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normX = (clientX / rect.width) * svgWidth;

    if (normX >= padLeft && normX <= padLeft + plotW) {
      const dataX = xMin + ((normX - padLeft) / plotW) * safeXSpan;
      const roundedX = Math.round(dataX);
      setHoveredXVal(roundedX);
    } else {
      setHoveredXVal(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredXVal(null);
  };

  const tooltipValues = hoveredXVal !== null
    ? series.map((s) => {
        const exact = s.points.find((p) => Math.round(p.x) === hoveredXVal);
        const nearest = exact || s.points.reduce((prev, curr) =>
          Math.abs(curr.x - hoveredXVal) < Math.abs(prev.x - hoveredXVal) ? curr : prev,
          s.points[0] || { x: 0, y: 0 }
        );
        return {
          seriesId: s.id,
          name: s.name,
          color: s.color,
          y: nearest?.y ?? 0,
        };
      })
    : [];

  let cohortBandPath = '';
  if (cohortBand && cohortBand.upper.length > 0 && cohortBand.lower.length > 0) {
    const upperStr = cohortBand.upper
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.x).toFixed(1)} ${toSvgY(p.y).toFixed(1)}`)
      .join(' ');
    const lowerReversed = [...cohortBand.lower].reverse();
    const lowerStr = lowerReversed
      .map((p) => `L ${toSvgX(p.x).toFixed(1)} ${toSvgY(p.y).toFixed(1)}`)
      .join(' ');
    cohortBandPath = `${upperStr} ${lowerStr} Z`;
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {title && (
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              {title}
            </span>
          )}
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {yLabel && xLabel ? `${yLabel} vs ${xLabel}` : (yLabel || '')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {timeSpans && timeSpans.length > 0 && onTimeSpanChange && (
            <div
              style={{
                display: 'flex',
                gap: 2,
                background: 'var(--bg-card)',
                padding: '2px',
                borderRadius: '6px',
              }}
            >
              {timeSpans.map((span) => {
                const isActive = activeTimeSpan === span.id;
                return (
                  <button
                    key={span.id}
                    onClick={() => onTimeSpanChange(span.id)}
                    style={{
                      background: isActive ? '#3b82f6' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {span.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Plot */}
      <div style={{ width: '100%', position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            cursor: hasData ? 'crosshair' : 'default',
          }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={`grad_${s.id}_${graphId}`}
                id={`grad_${s.id}_${graphId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((y) => (
            <line
              key={`grid-y-${y}`}
              x1={padLeft}
              y1={toSvgY(y)}
              x2={padLeft + plotW}
              y2={toSvgY(y)}
              stroke="var(--text-muted)"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          ))}

          {/* Shaded Cohort Band */}
          {cohortBandPath && (
            <path
              d={cohortBandPath}
              fill={cohortBand?.color || 'rgba(56, 189, 248, 0.06)'}
              stroke="none"
            />
          )}

          {/* Series Gradient Area Fills */}
          {series.map((s) => {
            if (s.points.length < 2 || s.dashArray || !s.fillGradient) return null;
            const areaPath = generateAreaPath(s.points, toSvgX, toSvgY, baselineY, s.isLinear);
            const isHovered = hoveredSeriesId === s.id;
            return (
              <path
                key={`area_${s.id}`}
                d={areaPath}
                fill={`url(#grad_${s.id}_${graphId})`}
                opacity={hoveredSeriesId && !isHovered ? 0.15 : 1}
                style={{ transition: 'opacity 0.2s ease' }}
              />
            );
          })}

          {/* Baseline */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="var(--text-muted)"
            strokeOpacity="0.2"
            strokeWidth="1"
          />

          {/* Y Axis Numeric Ticks */}
          {yTicks.map((y) => (
            <text
              key={`lbl-y-${y}`}
              x={padLeft - 8}
              y={toSvgY(y) + 3.5}
              textAnchor="end"
              fontSize="10"
              fontWeight="600"
              fill="var(--text-muted)"
              fontFamily="var(--font-mono)"
            >
              {y}
            </text>
          ))}

          {/* X Axis Numeric Ticks */}
          {xTicks.map((x, idx) => {
            if (idx === 0) return null; // Avoid corner overlap at (0, 0)
            return (
              <text
                key={`lbl-x-${x}`}
                x={toSvgX(x)}
                y={padTop + plotH + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="var(--text-muted)"
                fontFamily="var(--font-mono)"
              >
                {x}
              </text>
            );
          })}

          {/* Zero State Standby Overlay */}
          {!hasData && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={svgWidth / 2 - 90}
                y={svgHeight / 2 - 14}
                width={180}
                height={28}
                rx={14}
                fill="var(--bg-card-muted)"
              />
              <circle
                cx={svgWidth / 2 - 70}
                cy={svgHeight / 2}
                r="3.5"
                fill="#38bdf8"
              />
              <text
                x={svgWidth / 2 + 6}
                y={svgHeight / 2 + 3.5}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="var(--text-muted)"
              >
                Standby: awaiting ballots
              </text>
            </g>
          )}

          {/* Render Trajectory Lines */}
          {hasData && series.map((s) => {
            if (s.points.length === 0) return null;

            const isHovered = hoveredSeriesId === s.id;
            const pathData = generateSmoothPath(s.points, toSvgX, toSvgY, s.isLinear || !!s.dashArray);
            const showDots = s.points.length <= 35;

            return (
              <g
                key={s.id}
                onMouseEnter={() => setHoveredSeriesId(s.id)}
                onMouseLeave={() => setHoveredSeriesId(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={pathData}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isHovered ? (s.strokeWidth || 2.2) + 1.2 : (s.strokeWidth || 2.2)}
                  strokeDasharray={s.dashArray || 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={hoveredSeriesId && !isHovered ? 0.2 : 1}
                  style={{ transition: 'stroke-width 0.15s ease, opacity 0.15s ease' }}
                />

                {showDots && s.points.map((pt, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r={isHovered ? 3.5 : 2}
                    fill={s.color}
                    opacity={hoveredSeriesId && !isHovered ? 0.2 : 1}
                  />
                ))}
              </g>
            );
          })}

          {/* Interactive Crosshair on Hover */}
          {hoveredXVal !== null && hasData && (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={toSvgX(hoveredXVal)}
                y1={padTop}
                x2={toSvgX(hoveredXVal)}
                y2={padTop + plotH}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              {series.map((s) => {
                const pt = s.points.find((p) => Math.round(p.x) === hoveredXVal);
                if (!pt) return null;
                return (
                  <circle
                    key={`pin_${s.id}`}
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r="3.5"
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip readout on hover */}
        {hoveredXVal !== null && tooltipValues.length > 0 && hasData && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: Math.min(Math.max(toSvgX(hoveredXVal) - 60, padLeft + 6), padLeft + plotW - 140),
              background: 'rgba(11, 15, 25, 0.95)',
              backdropFilter: 'blur(12px)',
              borderRadius: '8px',
              padding: '6px 10px',
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: '11px',
              lineHeight: 1.4,
              color: '#f8fafc',
            }}
          >
            <div style={{ fontWeight: 800, color: '#38bdf8', paddingBottom: 2 }}>
              {xUnit ? `${xUnit} #${hoveredXVal}` : `#${hoveredXVal}`}
            </div>
            {tooltipValues.map((v) => (
              <div key={v.seriesId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e2e8f0' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color }} />
                  {v.name}:
                </span>
                <span className="mono" style={{ fontWeight: 800, color: v.color }}>
                  {v.y}{yUnit ? ` ${yUnit}` : ' pts'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Legend Chips */}
      {series.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {series.map((s) => {
            const isSelected = hoveredSeriesId === s.id;
            return (
              <div
                key={s.id}
                onMouseEnter={() => setHoveredSeriesId(s.id)}
                onMouseLeave={() => setHoveredSeriesId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: s.color,
                  }}
                />
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
