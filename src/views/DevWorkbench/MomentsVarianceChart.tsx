import React, { useState } from 'react';
import { EntryScoreBreakdown, calculate_moments_and_variance } from '@platform/internal-logic';

interface MomentsVarianceChartProps {
  breakdown: EntryScoreBreakdown;
  totalBallots: number;
}

const DiagnosticHoverTag: React.FC<{ label: string; tooltip: string; statusColor?: string }> = ({ label, tooltip, statusColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltip}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '6px',
        background: statusColor ? `${statusColor}18` : 'var(--bg-card-muted)',
        color: statusColor || 'var(--text-muted)',
        fontSize: '11px',
        fontWeight: 700,
        cursor: 'help',
        transition: 'background 0.15s ease',
      }}
    >
      {label}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            zIndex: 100,
            pointerEvents: 'none',
            width: 'max-content',
            maxWidth: '260px',
            fontSize: '11px',
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 800, color: statusColor || '#38bdf8', marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ color: '#cbd5e1' }}>
            {tooltip}
          </div>
        </div>
      )}
    </span>
  );
};

export const MomentsVarianceChart: React.FC<MomentsVarianceChartProps> = ({
  breakdown,
  totalBallots,
}) => {
  const [hoveredX, setHoveredX] = useState<number | null>(null);
  const moments = calculate_moments_and_variance(breakdown, totalBallots);
  const total = totalBallots || 1;

  // Discrete probabilities
  const p3 = breakdown.rank1Count / total;
  const p2 = breakdown.rank2Count / total;
  const p1 = breakdown.rank3Count / total;
  const p0 = Math.max(0, 1 - (p3 + p2 + p1));

  const maxP = Math.max(p3, p2, p1, p0, 0.01);

  // Gaussian Curve Coordinates
  const mu = moments.expectedScorePerVoter;
  const isZeroState = totalBallots === 0;
  // If zero ballots, use reference sigma for graceful standby curve
  const displaySigma = isZeroState ? 0.8 : Math.max(0.2, moments.standardDeviation);

  const svgWidth = 500;
  const svgHeight = 150;
  const paddingX = 40;
  const paddingY = 24;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const xMin = -0.5;
  const xMax = 3.5;

  const getSvgX = (x: number) => paddingX + ((x - xMin) / (xMax - xMin)) * plotWidth;

  const normalPdf = (x: number) => {
    const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(displaySigma, 2));
    return (1 / (displaySigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  };

  const peakPdf = normalPdf(mu) || 1;
  const getSvgY = (pdfVal: number) => svgHeight - paddingY - (pdfVal / peakPdf) * plotHeight;

  // Generate smooth Gaussian curve
  const curvePoints: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const yVal = normalPdf(x);
    const sx = getSvgX(x);
    const sy = getSvgY(yVal);
    curvePoints.push(`${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
  }
  const curvePath = curvePoints.join(' ');

  // Shaded 1-sigma region path
  const sigmaLeft = Math.max(xMin, mu - displaySigma);
  const sigmaRight = Math.min(xMax, mu + displaySigma);
  const sigmaPoints: string[] = [`M ${getSvgX(sigmaLeft).toFixed(1)} ${(svgHeight - paddingY).toFixed(1)}`];
  for (let i = 0; i <= 30; i++) {
    const x = sigmaLeft + (i / 30) * (sigmaRight - sigmaLeft);
    sigmaPoints.push(`L ${getSvgX(x).toFixed(1)} ${getSvgY(normalPdf(x)).toFixed(1)}`);
  }
  sigmaPoints.push(`L ${getSvgX(sigmaRight).toFixed(1)} ${(svgHeight - paddingY).toFixed(1)} Z`);
  const sigmaShadedPath = sigmaPoints.join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isZeroState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normX = (clientX / rect.width) * svgWidth;
    if (normX >= paddingX && normX <= paddingX + plotWidth) {
      const dataX = xMin + ((normX - paddingX) / plotWidth) * (xMax - xMin);
      setHoveredX(Number(dataX.toFixed(2)));
    } else {
      setHoveredX(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Executive Stat Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Expected Value
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', marginTop: 2 }}>
            {mu.toFixed(3)} pts
          </div>
        </div>

        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Variance
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>
            {moments.singleBallotVariance.toFixed(3)}
          </div>
        </div>

        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Std Deviation
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: '#c084fc', marginTop: 2 }}>
            {moments.standardDeviation.toFixed(3)}
          </div>
        </div>

        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Sample Size
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
            {totalBallots} Ballots
          </div>
        </div>
      </div>

      {/* 2. Mathematical Invariants Formula Strip with Hover Tooltips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <DiagnosticHoverTag
          label="E[X] = 3p_3 + 2p_2 + 1p_1"
          tooltip="Expected score per ballot: weighted linear combination across rank tiers."
        />

        <DiagnosticHoverTag
          label="Var(X) = E[X^2] - (E[X])^2"
          tooltip="Variance dispersion: second central moment measuring agreement uniformity across voters."
        />

        <DiagnosticHoverTag
          label="sigma = sqrt(Var(X))"
          tooltip="Standard deviation: spread of individual voter preference distributions."
        />

        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: 4 }}>
          Target: <strong style={{ color: 'var(--text-main)' }}>{breakdown.entryId}</strong>
        </span>
      </div>

      {/* 3. Two-Column Visual PMF and Gaussian Bell Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        {/* 1. Discrete PMF Histogram */}
        <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              Discrete PMF
            </div>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              N = {totalBallots}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, paddingBottom: 6 }}>
            {/* Rank 1 (3 pts) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
              <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>
                {(p3 * 100).toFixed(1)}%
              </span>
              <div
                style={{
                  width: 40,
                  height: `${Math.max(4, Math.round((p3 / maxP) * 75))}px`,
                  minHeight: 4,
                  background: 'linear-gradient(180deg, #f59e0b, #d97706)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>3p</span>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({breakdown.rank1Count})</span>
            </div>

            {/* Rank 2 (2 pts) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
              <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                {(p2 * 100).toFixed(1)}%
              </span>
              <div
                style={{
                  width: 40,
                  height: `${Math.max(4, Math.round((p2 / maxP) * 75))}px`,
                  minHeight: 4,
                  background: 'linear-gradient(180deg, #38bdf8, #0284c7)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>2p</span>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({breakdown.rank2Count})</span>
            </div>

            {/* Rank 3 (1 pt) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
              <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc' }}>
                {(p1 * 100).toFixed(1)}%
              </span>
              <div
                style={{
                  width: 40,
                  height: `${Math.max(4, Math.round((p1 / maxP) * 75))}px`,
                  minHeight: 4,
                  background: 'linear-gradient(180deg, #c084fc, #9333ea)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 700 }}>1p</span>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({breakdown.rank3Count})</span>
            </div>

            {/* Unranked (0 pts) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {(p0 * 100).toFixed(1)}%
              </span>
              <div
                style={{
                  width: 40,
                  height: `${Math.max(4, Math.round((p0 / maxP) * 75))}px`,
                  minHeight: 4,
                  background: 'var(--bg-card-muted)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>0p</span>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({Math.round(p0 * total)})</span>
            </div>
          </div>
        </div>

        {/* 2. Continuous Gaussian Density & Variance Bell Curve */}
        <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              Gaussian Density
            </div>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              mu={mu.toFixed(2)} | sigma={moments.standardDeviation.toFixed(2)}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredX(null)}
            style={{ width: '100%', height: 'auto', display: 'block', background: 'var(--bg-card-muted)', borderRadius: '10px', cursor: isZeroState ? 'default' : 'crosshair' }}
          >
            <defs>
              <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={paddingX}
                y1={paddingY + plotHeight * ratio}
                x2={svgWidth - paddingX}
                y2={paddingY + plotHeight * ratio}
                stroke="var(--text-muted)"
                strokeOpacity="0.12"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            ))}

            {/* Baseline */}
            <line
              x1={paddingX}
              y1={svgHeight - paddingY}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingY}
              stroke="var(--text-muted)"
              strokeOpacity="0.25"
              strokeWidth="1.2"
            />

            {/* 1-Sigma Shaded Region */}
            {!isZeroState && (
              <path d={sigmaShadedPath} fill="url(#bellGrad)" />
            )}

            {/* Gaussian Bell Curve */}
            <path
              d={curvePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.2"
              strokeDasharray={isZeroState ? '4 4' : 'none'}
              strokeOpacity={isZeroState ? 0.4 : 1}
              strokeLinecap="round"
            />

            {/* Mean (mu) Vertical Marker */}
            {!isZeroState && (
              <line
                x1={getSvgX(mu)}
                y1={paddingY}
                x2={getSvgX(mu)}
                y2={svgHeight - paddingY}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Axis Ticks */}
            {[0, 1, 2, 3].map((tick) => (
              <g key={tick}>
                <line
                  x1={getSvgX(tick)}
                  y1={svgHeight - paddingY}
                  x2={getSvgX(tick)}
                  y2={svgHeight - paddingY + 4}
                  stroke="var(--text-muted)"
                  strokeOpacity="0.3"
                  strokeWidth="1"
                />
                <text
                  x={getSvgX(tick)}
                  y={svgHeight - paddingY + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  {tick}p
                </text>
              </g>
            ))}

            {/* Mean Label or Zero State Badge */}
            {isZeroState ? (
              <text
                x={svgWidth / 2}
                y={svgHeight / 2 + 3}
                textAnchor="middle"
                fontSize="11"
                fontStyle="italic"
                fill="var(--text-muted)"
                fontFamily="var(--font-mono)"
              >
                Standby: awaiting initial ballots
              </text>
            ) : (
              <text
                x={getSvgX(mu)}
                y={paddingY - 6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#10b981"
                fontFamily="var(--font-mono)"
              >
                E[X]={mu.toFixed(2)}
              </text>
            )}

            {/* Hover Crosshair */}
            {hoveredX !== null && !isZeroState && (
              <g style={{ pointerEvents: 'none' }}>
                <line
                  x1={getSvgX(hoveredX)}
                  y1={paddingY}
                  x2={getSvgX(hoveredX)}
                  y2={svgHeight - paddingY}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getSvgX(hoveredX)}
                  cy={getSvgY(normalPdf(hoveredX))}
                  r="3.5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>

          {/* Hover Floating Tooltip */}
          {hoveredX !== null && !isZeroState && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: Math.min(Math.max(getSvgX(hoveredX) - 40, paddingX), svgWidth - 140),
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(12px)',
                borderRadius: '8px',
                padding: '6px 10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                pointerEvents: 'none',
                zIndex: 10,
                fontSize: '11px',
                color: '#f8fafc',
              }}
            >
              <div className="mono" style={{ color: '#38bdf8', fontWeight: 800 }}>
                x = {hoveredX}p
              </div>
              <div className="mono" style={{ color: '#94a3b8', fontSize: '10px' }}>
                f(x) = {normalPdf(hoveredX).toFixed(3)}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
