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
  points: TrajectoryPoint[];
  fillGradient?: boolean;
  annotations?: {
    x: number;
    y: number;
    text: string;
    color?: string;
    align?: 'start' | 'middle' | 'end';
  }[];
  description: string;
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
  showHelpGuide?: boolean;
}

// Generate smooth cubic bezier path string from points
function generateSmoothPath(
  points: TrajectoryPoint[],
  toSvgX: (x: number) => number,
  toSvgY: (y: number) => number
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${toSvgX(points[0].x).toFixed(1)} ${toSvgY(points[0].y).toFixed(1)}`;
  if (points.length === 2) {
    return `M ${toSvgX(points[0].x).toFixed(1)} ${toSvgY(points[0].y).toFixed(1)} L ${toSvgX(points[1].x).toFixed(1)} ${toSvgY(points[1].y).toFixed(1)}`;
  }

  const svgPts = points.map((p) => ({ x: toSvgX(p.x), y: toSvgY(p.y) }));
  let path = `M ${svgPts[0].x.toFixed(1)} ${svgPts[0].y.toFixed(1)}`;

  for (let i = 0; i < svgPts.length - 1; i++) {
    const p0 = svgPts[Math.max(0, i - 1)];
    const p1 = svgPts[i];
    const p2 = svgPts[i + 1];
    const p3 = svgPts[Math.min(svgPts.length - 1, i + 2)];

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
  baselineY: number
): string {
  if (points.length < 2) return '';
  const curve = generateSmoothPath(points, toSvgX, toSvgY);
  const first = points[0];
  const last = points[points.length - 1];
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
  yStep = 20,
  series,
  cohortBand,
  height = 360,
  xUnit = '',
  yUnit = '',
  timeSpans,
  activeTimeSpan,
  onTimeSpanChange,
  showHelpGuide = true,
}) => {
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);
  const [hoveredXVal, setHoveredXVal] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const graphId = useId().replace(/:/g, '_');

  const svgWidth = 860;
  const svgHeight = height;
  const padLeft = 85;
  const padRight = 32;
  const padTop = title ? 36 : 24;
  const padBottom = 50;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const safeXSpan = Math.max(1, xMax - xMin);
  const safeYSpan = Math.max(1, yMax - yMin);

  const toSvgX = (x: number) => padLeft + ((x - xMin) / safeXSpan) * plotW;
  const toSvgY = (y: number) => padTop + plotH - ((y - yMin) / safeYSpan) * plotH;
  const baselineY = padTop + plotH;

  // Major ticks calculation
  const xTicks: number[] = [];
  const calculatedXStep = Math.max(1, xStep);
  for (let x = xMin; x <= xMax; x += calculatedXStep) {
    xTicks.push(x);
  }
  if (xTicks[xTicks.length - 1] !== xMax) {
    xTicks.push(xMax);
  }

  const yTicks: number[] = [];
  const calculatedYStep = Math.max(1, yStep);
  for (let y = yMin; y <= yMax; y += calculatedYStep) {
    yTicks.push(y);
  }
  if (yTicks[yTicks.length - 1] !== yMax) {
    yTicks.push(yMax);
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          {title && (
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              {title}
            </div>
          )}
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
                border: '1px solid var(--border-subtle)',
              }}
            >
              {timeSpans.map((span) => (
                <button
                  key={span.id}
                  onClick={() => onTimeSpanChange(span.id)}
                  style={{
                    background: activeTimeSpan === span.id ? 'var(--accent-blue)' : 'transparent',
                    color: activeTimeSpan === span.id ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 9px',
                    fontSize: '11px',
                    fontWeight: activeTimeSpan === span.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {span.label}
                </button>
              ))}
            </div>
          )}

          <span
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              padding: '3px 8px',
              borderRadius: '5px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Range: [{xMin} – {xMax}]{xUnit}
          </span>
        </div>
      </div>

      {/* SVG Canvas Plot */}
      <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '100%',
            height: 'auto',
            minWidth: 500,
            display: 'block',
            background: 'var(--bg-card-muted)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            cursor: 'crosshair',
          }}
        >
          <defs>
            {/* Gradients for Series Area Fills */}
            {series.map((s) => (
              <linearGradient
                key={`grad_${s.id}_${graphId}`}
                id={`grad_${s.id}_${graphId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="85%" stopColor={s.color} stopOpacity="0.02" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
            <filter id={`glow_${graphId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Plot Area */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={plotH}
            fill="var(--bg-card)"
            opacity="0.5"
            rx="4"
          />

          {/* Grid Lines */}
          {xTicks.map((x) => (
            <line
              key={`grid-x-${x}`}
              x1={toSvgX(x)}
              y1={padTop}
              x2={toSvgX(x)}
              y2={padTop + plotH}
              stroke="var(--border-subtle)"
              strokeWidth="0.75"
              strokeDasharray="3 3"
            />
          ))}
          {yTicks.map((y) => (
            <line
              key={`grid-y-${y}`}
              x1={padLeft}
              y1={toSvgY(y)}
              x2={padLeft + plotW}
              y2={toSvgY(y)}
              stroke="var(--border-subtle)"
              strokeWidth="0.75"
              strokeDasharray="3 3"
            />
          ))}

          {/* Shaded Cohort Band */}
          {cohortBandPath && (
            <g>
              <path
                d={cohortBandPath}
                fill={cohortBand?.color || 'rgba(148, 163, 184, 0.12)'}
                stroke="none"
              />
              {cohortBand && cohortBand.upper.length > 0 && (
                <path
                  d={generateSmoothPath(cohortBand.upper, toSvgX, toSvgY)}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          )}

          {/* Series Gradient Area Fills (Rendered Behind Lines) */}
          {series.map((s) => {
            if (s.points.length < 2 || s.dashArray) return null;
            const areaPath = generateAreaPath(s.points, toSvgX, toSvgY, baselineY);
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

          {/* Axes Base Lines */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1.2"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1.2"
          />

          {/* Y Axis Numeric Ticks */}
          {yTicks.map((y) => (
            <g key={`lbl-y-${y}`}>
              <line
                x1={padLeft - 5}
                y1={toSvgY(y)}
                x2={padLeft}
                y2={toSvgY(y)}
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
              <text
                x={padLeft - 9}
                y={toSvgY(y) + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
                fontFamily="var(--font-mono)"
              >
                {y}{yUnit}
              </text>
            </g>
          ))}

          {/* X Axis Numeric Ticks */}
          {xTicks.map((x) => (
            <g key={`lbl-x-${x}`}>
              <line
                x1={toSvgX(x)}
                y1={padTop + plotH}
                x2={toSvgX(x)}
                y2={padTop + plotH + 5}
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
              <text
                x={toSvgX(x)}
                y={padTop + plotH + 16}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
                fontFamily="var(--font-mono)"
              >
                {x}{xUnit}
              </text>
            </g>
          ))}

          {/* Rotated Y Axis Label */}
          <text
            x={-(padTop + plotH / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="700"
            letterSpacing="0.02em"
            fill="var(--text-muted)"
          >
            {yLabel}
          </text>

          {/* X Axis Label */}
          <text
            x={padLeft + plotW / 2}
            y={padTop + plotH + 34}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="700"
            letterSpacing="0.02em"
            fill="var(--text-muted)"
          >
            {xLabel}
          </text>

          {/* Render Trajectory Lines & Smooth Curves */}
          {series.map((s) => {
            if (s.points.length === 0) return null;

            const isHovered = hoveredSeriesId === s.id;
            const pathData = generateSmoothPath(s.points, toSvgX, toSvgY);
            const showDots = s.points.length <= 35;

            return (
              <g
                key={s.id}
                onMouseEnter={() => setHoveredSeriesId(s.id)}
                onMouseLeave={() => setHoveredSeriesId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Curve Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isHovered ? (s.strokeWidth || 2.2) + 1.5 : (s.strokeWidth || 2.2)}
                  strokeDasharray={s.dashArray || 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={hoveredSeriesId && !isHovered ? 0.2 : 1}
                  filter={isHovered ? `url(#glow_${graphId})` : undefined}
                  style={{ transition: 'stroke-width 0.15s ease, opacity 0.15s ease' }}
                />

                {/* Keyframe Nodes */}
                {showDots && s.points.map((pt, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r={isHovered ? 4 : 2.5}
                    fill={s.color}
                    stroke="var(--bg-card)"
                    strokeWidth="1.5"
                    opacity={hoveredSeriesId && !isHovered ? 0.2 : 1}
                    style={{ transition: 'r 0.15s ease' }}
                  />
                ))}

                {/* Inline Trajectory Badges */}
                {s.annotations?.map((ann, aIdx) => {
                  const rawX = toSvgX(ann.x);
                  const rawY = toSvgY(ann.y);
                  const safeY = Math.min(padTop + plotH - 8, Math.max(padTop + 14, rawY - 8));
                  const safeX = ann.align === 'end'
                    ? Math.min(padLeft + plotW - 6, rawX)
                    : ann.align === 'start'
                    ? Math.max(padLeft + 6, rawX)
                    : rawX;

                  return (
                    <text
                      key={aIdx}
                      x={safeX}
                      y={safeY}
                      textAnchor={ann.align || 'middle'}
                      fontSize="10.5"
                      fontWeight="700"
                      fill={ann.color || s.color}
                      fontFamily="var(--font-mono)"
                      stroke="var(--bg-card)"
                      strokeWidth="2.5"
                      paintOrder="stroke"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {ann.text}
                    </text>
                  );
                })}
              </g>
            );
          })}

          {/* Interactive Laser Crosshair on Hover */}
          {hoveredXVal !== null && (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={toSvgX(hoveredXVal)}
                y1={padTop}
                x2={toSvgX(hoveredXVal)}
                y2={padTop + plotH}
                stroke="var(--accent-blue)"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              {/* Highlight circle on each series point at this X */}
              {series.map((s) => {
                const pt = s.points.find((p) => Math.round(p.x) === hoveredXVal);
                if (!pt) return null;
                return (
                  <circle
                    key={`pin_${s.id}`}
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r="4.5"
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter={`url(#glow_${graphId})`}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip readout on hover */}
        {hoveredXVal !== null && tooltipValues.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: Math.min(Math.max(toSvgX(hoveredXVal) - 70, padLeft + 6), padLeft + plotW - 160),
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '7px',
              padding: '7px 11px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: '11px',
              lineHeight: 1.45,
              color: '#f8fafc',
            }}
          >
            <div style={{ fontWeight: 800, color: '#93c5fd', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 3, marginBottom: 5 }}>
              Ballot #{hoveredXVal} {xUnit}
            </div>
            {tooltipValues.map((v) => (
              <div key={v.seriesId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginTop: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e2e8f0' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color }} />
                  {v.name}:
                </span>
                <span className="mono" style={{ fontWeight: 800, color: v.color }}>
                  {v.y}{yUnit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trajectory Legend Chips with Hover Focus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {series.map((s) => {
          const isSelected = hoveredSeriesId === s.id;
          return (
            <div
              key={s.id}
              onMouseEnter={() => setHoveredSeriesId(s.id)}
              onMouseLeave={() => setHoveredSeriesId(null)}
              style={{
                background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: isSelected ? `1px solid ${s.color}` : '1px solid var(--border-subtle)',
                borderRadius: '7px',
                padding: '9px 13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 12px ${s.color}22` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: s.color,
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {s.name}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {s.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide Footer */}
      {showHelpGuide && (
        <div
          style={{
            background: 'var(--bg-card-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '9px 13px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: 'var(--text-main)' }}>Telemetry Guide: </strong>
          The horizontal axis tracks cumulative ballot count (N). The green trajectory represents verified points awarded, matching the strict 6N conservation invariant (y = 6x).
        </div>
      )}
    </div>
  );
};
