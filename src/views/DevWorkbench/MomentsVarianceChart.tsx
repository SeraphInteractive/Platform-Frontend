import React from 'react';
import { EntryScoreBreakdown, calculate_moments_and_variance } from '@platform/internal-logic';

interface MomentsVarianceChartProps {
  breakdown: EntryScoreBreakdown;
  totalBallots: number;
}

export const MomentsVarianceChart: React.FC<MomentsVarianceChartProps> = ({
  breakdown,
  totalBallots,
}) => {
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
  const sigma = Math.max(0.001, moments.standardDeviation);

  const svgWidth = 420;
  const svgHeight = 135;
  const paddingX = 35;
  const paddingY = 22;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const xMin = -0.5;
  const xMax = 3.5;

  const getSvgX = (x: number) => paddingX + ((x - xMin) / (xMax - xMin)) * plotWidth;

  const normalPdf = (x: number) => {
    const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  };

  const peakPdf = normalPdf(mu) || 1;
  const getSvgY = (pdfVal: number) => svgHeight - paddingY - (pdfVal / peakPdf) * plotHeight;

  // Generate smooth Gaussian curve
  const curvePoints: string[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const yVal = normalPdf(x);
    const sx = getSvgX(x);
    const sy = getSvgY(yVal);
    curvePoints.push(`${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
  }
  const curvePath = curvePoints.join(' ');

  // Shaded 1-sigma region path
  const sigmaLeft = Math.max(xMin, mu - sigma);
  const sigmaRight = Math.min(xMax, mu + sigma);
  const sigmaPoints: string[] = [`M ${getSvgX(sigmaLeft).toFixed(1)} ${svgHeight - paddingY}`];
  for (let i = 0; i <= 24; i++) {
    const x = sigmaLeft + (i / 24) * (sigmaRight - sigmaLeft);
    sigmaPoints.push(`L ${getSvgX(x).toFixed(1)} ${getSvgY(normalPdf(x)).toFixed(1)}`);
  }
  sigmaPoints.push(`L ${getSvgX(sigmaRight).toFixed(1)} ${svgHeight - paddingY} Z`);
  const sigmaShadedPath = sigmaPoints.join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Formula Strip */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="badge badge-engine mono" style={{ fontSize: '11px', padding: '4px 8px' }}>
          E[X] = 3*p_3 + 2*p_2 + 1*p_1
        </span>
        <span className="badge badge-engine mono" style={{ fontSize: '11px', padding: '4px 8px' }}>
          Var(X) = E[X^2] - (E[X])^2
        </span>
        <span className="badge badge-engine mono" style={{ fontSize: '11px', padding: '4px 8px' }}>
          sigma = sqrt(Var(X))
        </span>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Candidate: <strong>{breakdown.entryId}</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* 1. Discrete PMF Histogram */}
        <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
              Discrete PMF P(X = k)
            </span>
            <span className="badge badge-engine" style={{ fontSize: '10px' }}>
              N={totalBallots}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 110, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
            {/* Rank 1 (3 pts) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <span className="mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {(p3 * 100).toFixed(0)}%
              </span>
              <div
                style={{
                  width: 34,
                  height: `${Math.round((p3 / maxP) * 70)}px`,
                  minHeight: 4,
                  background: '#f59e0b',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s ease',
                }}
                title={`Rank 1 (3p): ${breakdown.rank1Count} votes`}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)' }}>3p</span>
            </div>

            {/* Rank 2 (2 pts) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <span className="mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-silver)' }}>
                {(p2 * 100).toFixed(0)}%
              </span>
              <div
                style={{
                  width: 34,
                  height: `${Math.round((p2 / maxP) * 70)}px`,
                  minHeight: 4,
                  background: '#94a3b8',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s ease',
                }}
                title={`Rank 2 (2p): ${breakdown.rank2Count} votes`}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)' }}>2p</span>
            </div>

            {/* Rank 3 (1 pt) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <span className="mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                {(p1 * 100).toFixed(0)}%
              </span>
              <div
                style={{
                  width: 34,
                  height: `${Math.round((p1 / maxP) * 70)}px`,
                  minHeight: 4,
                  background: '#d97706',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s ease',
                }}
                title={`Rank 3 (1p): ${breakdown.rank3Count} votes`}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)' }}>1p</span>
            </div>

            {/* Unranked (0 pts) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {(p0 * 100).toFixed(0)}%
              </span>
              <div
                style={{
                  width: 34,
                  height: `${Math.round((p0 / maxP) * 70)}px`,
                  minHeight: 4,
                  background: 'var(--border-strong)',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s ease',
                }}
                title={`Unranked (0p): ${Math.round(p0 * total)} votes`}
              />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0p</span>
            </div>
          </div>
        </div>

        {/* 2. Continuous Gaussian Density & Variance Bell Curve */}
        <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
              Gaussian Density f(x | mu, sigma)
            </span>
            <span className="badge badge-engine mono" style={{ fontSize: '10px' }}>
              mu={mu.toFixed(2)} | sigma={sigma.toFixed(2)}
            </span>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 120 }}>
            <defs>
              <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Baseline */}
            <line
              x1={paddingX}
              y1={svgHeight - paddingY}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingY}
              stroke="var(--border-strong)"
              strokeWidth="1.2"
            />

            {/* 1-Sigma Shaded Region */}
            <path d={sigmaShadedPath} fill="url(#bellGrad)" />

            {/* Gaussian Bell Curve */}
            <path d={curvePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

            {/* Mean (mu) Vertical Marker */}
            <line
              x1={getSvgX(mu)}
              y1={paddingY}
              x2={getSvgX(mu)}
              y2={svgHeight - paddingY}
              stroke="#10b981"
              strokeWidth="1.8"
              strokeDasharray="3 3"
            />

            {/* Axis Ticks */}
            {[0, 1, 2, 3].map((tick) => (
              <g key={tick}>
                <line
                  x1={getSvgX(tick)}
                  y1={svgHeight - paddingY}
                  x2={getSvgX(tick)}
                  y2={svgHeight - paddingY + 4}
                  stroke="var(--text-muted)"
                  strokeWidth="1"
                />
                <text
                  x={getSvgX(tick)}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  {tick}p
                </text>
              </g>
            ))}

            {/* Mean Label */}
            <text
              x={getSvgX(mu)}
              y={paddingY - 5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#10b981"
              fontFamily="var(--font-mono)"
            >
              E[X]={mu.toFixed(2)}
            </text>
          </svg>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 0' }}>
        First moment E[X] tracks mean score per voter. Variance Var(X) measures consensus dispersion across sample N.
      </div>
    </div>
  );
};
