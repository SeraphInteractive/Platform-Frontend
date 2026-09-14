import React, { useState, useRef } from 'react';

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
  height = 380,
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

  // Widen viewBox to 880 to allow comfortable breathing room and wide aspect ratio
  const svgWidth = 880;
  const svgHeight = height;
  const padLeft = 110; // Generous margin for rotated Y label + monospace ticks
  const padRight = 36;
  const padTop = title ? 40 : 28;
  const padBottom = 56;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const safeXSpan = Math.max(1, xMax - xMin);
  const safeYSpan = Math.max(1, yMax - yMin);

  const toSvgX = (x: number) => padLeft + ((x - xMin) / safeXSpan) * plotW;
  const toSvgY = (y: number) => padTop + plotH - ((y - yMin) / safeYSpan) * plotH;

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

  // Handle interactive SVG hover crosshair
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

  // Find series values at current hovered X
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

  // Generate Cohort Band SVG Polygon if provided
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
      {/* Top Controls: Title, Time Span Filter, Unit Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          {title && (
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              {title}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {timeSpans && timeSpans.length > 0 && onTimeSpanChange && (
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: '3px 4px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              {timeSpans.map((span) => (
                <button
                  key={span.id}
                  onClick={() => onTimeSpanChange(span.id)}
                  style={{
                    background: activeTimeSpan === span.id ? 'var(--accent-blue)' : 'none',
                    color: activeTimeSpan === span.id ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: activeTimeSpan === span.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {span.label}
                </button>
              ))}
            </div>
          )}

          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-card-muted)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            Range: [{xMin} - {xMax}]{xUnit}
          </span>
        </div>
      </div>

      {/* SVG Cartesian Plot */}
      <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '100%',
            height: 'auto',
            minWidth: 540,
            display: 'block',
            background: 'var(--bg-card-muted)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            cursor: 'crosshair',
          }}
        >
          {/* Subtle Grid Lines */}
          {xTicks.map((x) => (
            <line
              key={`maj-x-${x}`}
              x1={toSvgX(x)}
              y1={padTop}
              x2={toSvgX(x)}
              y2={padTop + plotH}
              stroke="var(--border-subtle)"
              strokeWidth="0.8"
            />
          ))}
          {yTicks.map((y) => (
            <line
              key={`maj-y-${y}`}
              x1={padLeft}
              y1={toSvgY(y)}
              x2={padLeft + plotW}
              y2={toSvgY(y)}
              stroke="var(--border-subtle)"
              strokeWidth="0.8"
            />
          ))}

          {/* Coordinate Axes */}
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
                  d={cohortBand.upper.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.x).toFixed(1)} ${toSvgY(p.y).toFixed(1)}`).join(' ')}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )}
            </g>
          )}

          {/* Y Axis Numeric Ticks */}
          {yTicks.map((y) => (
            <g key={`lbl-y-${y}`}>
              <line
                x1={padLeft - 4}
                y1={toSvgY(y)}
                x2={padLeft}
                y2={toSvgY(y)}
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={toSvgY(y) + 3.5}
                textAnchor="end"
                fontSize="11"
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
                y2={padTop + plotH + 4}
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
              <text
                x={toSvgX(x)}
                y={padTop + plotH + 16}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-muted)"
                fontFamily="var(--font-mono)"
              >
                {x}{xUnit}
              </text>
            </g>
          ))}

          {/* Rotated Y Axis Label placed safely on left */}
          <text
            x={-(padTop + plotH / 2)}
            y={22}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--text-muted)"
          >
            {yLabel}
          </text>

          {/* X Axis Label */}
          <text
            x={padLeft + plotW / 2}
            y={padTop + plotH + 38}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--text-muted)"
          >
            {xLabel}
          </text>

          {/* Render Trajectory Curves */}
          {series.map((s) => {
            if (s.points.length === 0) return null;

            const isHovered = hoveredSeriesId === s.id;
            const pathData = s.points
              .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(pt.x).toFixed(1)} ${toSvgY(pt.y).toFixed(1)}`)
              .join(' ');

            const showDots = s.points.length <= 40;

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
                  strokeWidth={isHovered ? (s.strokeWidth || 2) + 1.5 : (s.strokeWidth || 2)}
                  strokeDasharray={s.dashArray || 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={hoveredSeriesId && !isHovered ? 0.25 : 1}
                  style={{ transition: 'stroke-width 0.15s ease, opacity 0.15s ease' }}
                />

                {/* Keyframe Dots */}
                {showDots && s.points.map((pt, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r={isHovered ? 3.5 : 2.5}
                    fill={s.color}
                    opacity={hoveredSeriesId && !isHovered ? 0.25 : 1}
                  />
                ))}

                {/* Minimalist Inline Curve Tags */}
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
                      fontSize="11"
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

          {/* Interactive Hover Crosshair */}
          {hoveredXVal !== null && (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={toSvgX(hoveredXVal)}
                y1={padTop}
                x2={toSvgX(hoveredXVal)}
                y2={padTop + plotH}
                stroke="var(--text-main)"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.6"
              />
              <circle
                cx={toSvgX(hoveredXVal)}
                cy={padTop + plotH}
                r="3"
                fill="var(--text-main)"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip readout on hover */}
        {hoveredXVal !== null && tooltipValues.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: Math.min(Math.max(toSvgX(hoveredXVal) - 60, padLeft), padLeft + plotW - 140),
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              padding: '6px 10px',
              boxShadow: 'var(--shadow-card)',
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: '11px',
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 2, marginBottom: 4 }}>
              Step {hoveredXVal} {xUnit}
            </div>
            {tooltipValues.map((v) => (
              <div key={v.seriesId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: v.color }}>
                <span>{v.name}:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{v.y}{yUnit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trajectory Legend Cards with Hover Focus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
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
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
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

      {/* Mathematical Guide Footer */}
      {showHelpGuide && (
        <div
          style={{
            background: 'var(--bg-card-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Graph Guide: </span>
          The horizontal axis tracks cumulative ballot volume (N), while the vertical axis tracks points. The green line represents verified points, which must adhere to the 6N invariant line (y = 6x).
        </div>
      )}
    </div>
  );
};
