import React from 'react';

interface GraphsRowProps {
  expectedMean?: number;
  varianceScore?: number;
  zScore?: number;
}

export const GraphsRow: React.FC<GraphsRowProps> = ({
  expectedMean = 1.94,
  zScore = 2.45,
}) => {
  return (
    <div className="graphs-row">
      {/* Card 4: Utilization / Moments Variance */}
      <div className="white-card">
        <div className="chart-header">
          <div className="card-top-label" style={{ marginBottom: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Utilization</span>
          </div>

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)', cursor: 'pointer' }}>
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </div>

        <div className="chart-big-metric-row">
          <div style={{ textAlign: 'left' }}>
            <div className="sub-metric-val">65%</div>
            <div className="sub-metric-lbl">Syncs</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>82%</div>
            <div className="sub-metric-lbl">Fetches</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="sub-metric-lbl" style={{ textTransform: 'uppercase', fontSize: '9px', marginBottom: 2 }}>Average Account Stats</div>
            <div className="card-big-metric" style={{ marginBottom: 0, fontSize: '30px' }}>
              {expectedMean > 0 ? (expectedMean * 28.9).toFixed(1).replace('.', ',') : '56,1'}
              <span style={{ fontSize: '16px', fontWeight: 600, verticalAlign: 'super' }}>%</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">34%</div>
            <div className="sub-metric-lbl">Manuals</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>12%</div>
            <div className="sub-metric-lbl">Autosync</div>
          </div>
        </div>

        {/* Timeline Bar Chart */}
        <div style={{ position: 'relative', marginTop: 10 }}>
          <div className="histogram-sparkline" style={{ height: '70px', alignItems: 'flex-end' }}>
            {[15, 22, 35, 48, 62, 75, 80, 78, 65, 55, 60, 52, 45, 40, 38, 30, 25, 20, 15, 10].map((h, i) => (
              <div
                key={i}
                className={`hist-bar ${i === 14 ? 'highlight' : ''}`}
                style={{ height: `${h}%`, width: '4.5%' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-light)', marginTop: 4 }}>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>
      </div>

      {/* Card 5: Timely Closures / Z-Score Separation */}
      <div className="white-card">
        <div className="chart-header">
          <div className="card-top-label" style={{ marginBottom: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Timely Closures</span>
          </div>

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)', cursor: 'pointer' }}>
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </div>

        <div className="chart-big-metric-row">
          <div style={{ textAlign: 'left' }}>
            <div className="sub-metric-val">84</div>
            <div className="sub-metric-lbl">Done</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>24%</div>
            <div className="sub-metric-lbl">Active</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="sub-metric-lbl" style={{ textTransform: 'uppercase', fontSize: '9px', marginBottom: 2 }}>Average Account Stats</div>
            <div className="card-big-metric" style={{ marginBottom: 0, fontSize: '30px' }}>
              {zScore > 0 ? (zScore * 33.7).toFixed(1).replace('.', ',') : '82,6'}
              <span style={{ fontSize: '16px', fontWeight: 600, verticalAlign: 'super' }}>%</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">84/0%</div>
            <div className="sub-metric-lbl">OnTime</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>19/5</div>
            <div className="sub-metric-lbl">Timely</div>
          </div>
        </div>

        {/* Line & Histogram Chart */}
        <div style={{ position: 'relative', marginTop: 10 }}>
          <div className="histogram-sparkline" style={{ height: '70px', alignItems: 'flex-end' }}>
            {[10, 18, 25, 40, 55, 70, 75, 68, 60, 52, 48, 42, 35, 28, 22, 18, 15, 12, 10, 8].map((h, i) => (
              <div
                key={i}
                className={`hist-bar ${i === 13 ? 'highlight' : ''}`}
                style={{ height: `${h}%`, width: '4.5%' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-light)', marginTop: 4 }}>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>
      </div>
    </div>
  );
};
