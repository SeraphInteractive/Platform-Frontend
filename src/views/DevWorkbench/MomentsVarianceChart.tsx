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

  // Generate normal distribution curve points from x = -0.5 to x = 3.5
  const svgWidth = 400;
  const svgHeight = 120;
  const paddingX = 30;
  const paddingY = 20;
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

  // Generate curve path
  const curvePoints: string[] = [];
  const steps = 40;
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
  for (let i = 0; i <= 20; i++) {
    const x = sigmaLeft + (i / 20) * (sigmaRight - sigmaLeft);
    sigmaPoints.push(`L ${getSvgX(x).toFixed(1)} ${getSvgY(normalPdf(x)).toFixed(1)}`);
  }
  sigmaPoints.push(`L ${getSvgX(sigmaRight).toFixed(1)} ${svgHeight - paddingY} Z`);
  const sigmaShadedPath = sigmaPoints.join(' ');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
      {/* 1. Discrete PMF Histogram */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>
          Discrete Probability Mass Function P(X)
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 130, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
          {/* Rank 1 (3 pts) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {(p3 * 100).toFixed(0)}%
            </span>
            <div
              style={{
                width: 36,
                height: `${Math.round((p3 / maxP) * 80)}px`,
                minHeight: 4,
                background: 'var(--accent-gold)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
              }}
              title={`Rank 1 (3p): ${breakdown.rank1Count} votes`}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>3 pts</span>
          </div>

          {/* Rank 2 (2 pts) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {(p2 * 100).toFixed(0)}%
            </span>
            <div
              style={{
                width: 36,
                height: `${Math.round((p2 / maxP) * 80)}px`,
                minHeight: 4,
                background: 'var(--accent-silver)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
              }}
              title={`Rank 2 (2p): ${breakdown.rank2Count} votes`}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>2 pts</span>
          </div>

          {/* Rank 3 (1 pt) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {(p1 * 100).toFixed(0)}%
            </span>
            <div
              style={{
                width: 36,
                height: `${Math.round((p1 / maxP) * 80)}px`,
                minHeight: 4,
                background: 'var(--accent-bronze)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
              }}
              title={`Rank 3 (1p): ${breakdown.rank3Count} votes`}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>1 pt</span>
          </div>

          {/* Unranked (0 pts) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {(p0 * 100).toFixed(0)}%
            </span>
            <div
              style={{
                width: 36,
                height: `${Math.round((p0 / maxP) * 80)}px`,
                minHeight: 4,
                background: 'var(--border-strong)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
              }}
              title={`Unranked (0p): ${Math.round(p0 * total)} votes`}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>0 pts</span>
          </div>
        </div>
      </div>

      {/* 2. Continuous Gaussian Density & Variance Bell Curve */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            Score Distribution Density Curve
          </div>
          <span className="badge badge-engine">
            mu={mu.toFixed(2)} | sigma={sigma.toFixed(2)}
          </span>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 130 }}>
          {/* Baseline */}
          <line
            x1={paddingX}
            y1={svgHeight - paddingY}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />

          {/* 1-Sigma Shaded Region */}
          <path d={sigmaShadedPath} fill="var(--accent-green)" opacity="0.18" />

          {/* Gaussian Bell Curve */}
          <path d={curvePath} fill="none" stroke="var(--accent-green)" strokeWidth="2.5" />

          {/* Mean (mu) Vertical Marker */}
          <line
            x1={getSvgX(mu)}
            y1={paddingY}
            x2={getSvgX(mu)}
            y2={svgHeight - paddingY}
            stroke="var(--accent-green)"
            strokeWidth="2"
            strokeDasharray="4 3"
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
            y={paddingY - 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="var(--accent-green)"
            fontFamily="var(--font-mono)"
          >
            E[X]={mu.toFixed(2)}
          </text>
        </svg>
      </div>
    </div>
  );
};
