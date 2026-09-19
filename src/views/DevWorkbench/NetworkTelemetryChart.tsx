import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiBaseUrl, setApiBaseUrl } from '../../api/client.ts';

interface EndpointConfig {
  id: string;
  name: string;
  category: 'System & Auth' | 'Rounds & Voting' | 'Proposals & Moderation' | 'GrabBox Pipeline';
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
}

interface EndpointMetric {
  id: string;
  status: number | 'ERR' | 'PENDING';
  latencyMs: number;
  history: number[];
  minLatency: number;
  maxLatency: number;
  totalPings: number;
  successPings: number;
  lastUpdated: number;
}

interface NetworkTelemetryChartProps {
  roundId?: string;
}

// Generate smooth cubic bezier SVG path from points
function generateSmoothSvgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export const NetworkTelemetryChart: React.FC<NetworkTelemetryChartProps> = ({
  roundId = '',
}) => {
  const [currentBaseUrl, setCurrentBaseUrl] = useState<string>(() => getApiBaseUrl());
  const [isEditingHost, setIsEditingHost] = useState<boolean>(false);
  const [customHostInput, setCustomHostInput] = useState<string>(() => getApiBaseUrl());
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(6);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredSampleIdx, setHoveredSampleIdx] = useState<number | null>(null);

  // Dynamic host parser
  const parsedHostInfo = useMemo(() => {
    try {
      if (currentBaseUrl.startsWith('http://') || currentBaseUrl.startsWith('https://')) {
        const urlObj = new URL(currentBaseUrl);
        return {
          protocol: urlObj.protocol.replace(':', '').toUpperCase(),
          host: urlObj.host,
          pathname: urlObj.pathname,
          isSecure: urlObj.protocol === 'https:',
          type: urlObj.hostname.includes('localhost') || urlObj.hostname === '127.0.0.1'
            ? 'Local Dev Gateway'
            : urlObj.hostname.includes('seraphinteractive.com')
            ? 'Cloud Production Gateway'
            : 'Custom Gateway',
        };
      }
      return {
        protocol: 'HTTP/WS',
        host: typeof window !== 'undefined' ? window.location.host : 'localhost:5173',
        pathname: currentBaseUrl,
        isSecure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        type: 'Vite Relative Proxy',
      };
    } catch {
      return {
        protocol: 'HTTP',
        host: currentBaseUrl,
        pathname: '',
        isSecure: false,
        type: 'Custom Gateway',
      };
    }
  }, [currentBaseUrl]);

  const handleApplyHost = (newUrl: string) => {
    const cleanUrl = newUrl.trim();
    if (!cleanUrl) return;
    setApiBaseUrl(cleanUrl);
    setCurrentBaseUrl(cleanUrl);
    setCustomHostInput(cleanUrl);
    setIsEditingHost(false);
  };

  const endpoints: EndpointConfig[] = useMemo(
    () => [
      // 1. System & Auth
      {
        id: 'ep_health',
        name: 'System Health',
        category: 'System & Auth',
        method: 'GET',
        path: '/health',
        description: 'PostgreSQL and Redis cluster liveness probe.',
      },
      {
        id: 'ep_root',
        name: 'Service Root',
        category: 'System & Auth',
        method: 'GET',
        path: '/',
        description: 'Gateway service metadata and version.',
      },
      {
        id: 'ep_auth_discord',
        name: 'Discord OAuth Init',
        category: 'System & Auth',
        method: 'GET',
        path: '/auth/discord',
        description: 'Discord OAuth2 handshake gateway.',
      },
      {
        id: 'ep_auth_me',
        name: 'Session Profile',
        category: 'System & Auth',
        method: 'GET',
        path: '/auth/me',
        description: 'Active bearer token verification.',
      },
      {
        id: 'ep_users_list',
        name: 'Users Directory',
        category: 'System & Auth',
        method: 'GET',
        path: '/users',
        description: 'Platform users registry and role assignments.',
      },
      {
        id: 'ep_users_presence',
        name: 'Discord Presence',
        category: 'System & Auth',
        method: 'GET',
        path: '/users/presence',
        description: 'Live Discord guild presence sync.',
      },
      {
        id: 'ep_auth_logout',
        name: 'Session Revocation',
        category: 'System & Auth',
        method: 'DELETE',
        path: '/auth/logout',
        description: 'Invalidates active access token.',
      },
      {
        id: 'ep_uploads',
        name: 'Media Storage',
        category: 'System & Auth',
        method: 'POST',
        path: '/uploads',
        description: 'Presigned asset upload dispatcher.',
      },

      // 2. Rounds & Voting
      {
        id: 'ep_rounds_list',
        name: 'Voting Rounds',
        category: 'Rounds & Voting',
        method: 'GET',
        path: '/rounds',
        description: 'Voting round catalog and active rounds.',
      },
      {
        id: 'ep_rounds_detail',
        name: 'Round Details',
        category: 'Rounds & Voting',
        method: 'GET',
        path: roundId ? `/rounds/${roundId}` : '/rounds',
        description: 'Rule parameters and window schedules.',
      },
      {
        id: 'ep_board',
        name: 'Live Leaderboard',
        category: 'Rounds & Voting',
        method: 'GET',
        path: roundId ? `/rounds/${roundId}/leaderboard` : '/rounds',
        description: 'Aggregated 6N mathematical scores.',
      },
      {
        id: 'ep_rounds_results',
        name: 'Finalized Results',
        category: 'Rounds & Voting',
        method: 'GET',
        path: roundId ? `/rounds/${roundId}/results` : '/rounds',
        description: 'Certified round outcome and winners.',
      },
      {
        id: 'ep_ballots_list',
        name: 'Ballot Ledger',
        category: 'Rounds & Voting',
        method: 'GET',
        path: roundId ? `/rounds/${roundId}/ballots` : '/rounds',
        description: 'Cast 3-2-1 Borda ballots audit feed.',
      },
      {
        id: 'ep_telemetry',
        name: 'Raid Telemetry',
        category: 'Rounds & Voting',
        method: 'GET',
        path: roundId ? `/rounds/${roundId}/telemetry` : '/rounds',
        description: 'Shannon entropy & velocity anomalies.',
      },
      {
        id: 'ep_finalize',
        name: 'Round Finalization',
        category: 'Rounds & Voting',
        method: 'POST',
        path: roundId ? `/rounds/${roundId}/finalize` : '/rounds',
        description: 'Supervisor round closure & lock.',
      },

      // 3. Proposals & Moderation
      {
        id: 'ep_entries_list',
        name: 'Proposal Pool',
        category: 'Proposals & Moderation',
        method: 'GET',
        path: roundId ? `/rounds/${roundId}/entries` : '/rounds',
        description: 'Candidate proposals and pitches.',
      },
      {
        id: 'ep_entries_submit',
        name: 'Submit Pitch',
        category: 'Proposals & Moderation',
        method: 'POST',
        path: roundId ? `/rounds/${roundId}/entries` : '/rounds',
        description: 'Creator pitch submission gateway.',
      },
      {
        id: 'ep_entries_status',
        name: 'Moderate Proposal',
        category: 'Proposals & Moderation',
        method: 'PATCH',
        path: roundId ? `/rounds/${roundId}/entries/status` : '/rounds',
        description: 'Supervisor review and flag assignment.',
      },

      // 4. GrabBox Pipeline
      {
        id: 'ep_shots_list',
        name: 'GrabBox Dispatcher',
        category: 'GrabBox Pipeline',
        method: 'GET',
        path: '/shots',
        description: 'Production 3D Blender shot tasks roster.',
      },
      {
        id: 'ep_shots_claim',
        name: 'Claim Shot',
        category: 'GrabBox Pipeline',
        method: 'POST',
        path: '/shots/claim',
        description: 'Animator shot reservation lock.',
      },
      {
        id: 'ep_shots_submit',
        name: 'Deliver Scene',
        category: 'GrabBox Pipeline',
        method: 'POST',
        path: '/shots/submit',
        description: 'S3/R2 blend & mp4 scene delivery.',
      },
      {
        id: 'ep_reviews_list',
        name: 'Review Desk',
        category: 'GrabBox Pipeline',
        method: 'GET',
        path: '/reviews',
        description: 'Supervisor submission QA review queue.',
      },
    ],
    [roundId]
  );

  const [metrics, setMetrics] = useState<Record<string, EndpointMetric>>(() => {
    const initial: Record<string, EndpointMetric> = {};
    endpoints.forEach((ep) => {
      initial[ep.id] = {
        id: ep.id,
        status: 'PENDING',
        latencyMs: 0,
        history: [],
        minLatency: 0,
        maxLatency: 0,
        totalPings: 0,
        successPings: 0,
        lastUpdated: Date.now(),
      };
    });
    return initial;
  });

  const pingEndpoint = useCallback(
    async (ep: EndpointConfig) => {
      const baseUrl = currentBaseUrl.replace(/\/+$/, '');
      const cleanPath = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
      
      // Determine request URL
      let url: string;
      if (ep.id === 'ep_root') {
        url = baseUrl.startsWith('http')
          ? (baseUrl.includes('/api/v1') ? baseUrl.replace('/api/v1', '') || '/' : baseUrl || '/')
          : '/health';
      } else if (ep.id === 'ep_health') {
        url = baseUrl.startsWith('http')
          ? (baseUrl.includes('/api/v1') ? baseUrl.replace('/api/v1', '/health') : `${baseUrl}/health`)
          : '/health';
      } else {
        url = `${baseUrl}${cleanPath}`;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('mcs_auth_token') : null;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const isOauthInit = ep.path.includes('/auth/discord') && !ep.path.includes('/callback');
      const start = performance.now();
      try {
        const res = await fetch(url, {
          method: ep.method === 'GET' ? 'GET' : 'HEAD',
          headers,
          signal: AbortSignal.timeout(4000),
          redirect: isOauthInit ? 'manual' : 'follow',
        });
        const elapsed = Math.max(1, Math.round(performance.now() - start));
        
        // Status determination: 2xx, 3xx, 400, 401, 403, 404, 405, 422 indicate the server is online and responding
        const isOpaqueRedirect = res.type === 'opaqueredirect';
        const statusNum = isOpaqueRedirect ? 302 : res.status;
        const isHealthy =
          isOpaqueRedirect ||
          (res.status >= 200 && res.status < 400) ||
          res.status === 400 ||
          res.status === 401 ||
          res.status === 403 ||
          res.status === 404 ||
          res.status === 405 ||
          res.status === 422;

        setMetrics((prev) => {
          const cur = prev[ep.id] || {
            id: ep.id,
            status: 'PENDING',
            latencyMs: 0,
            history: [],
            minLatency: elapsed,
            maxLatency: elapsed,
            totalPings: 0,
            successPings: 0,
            lastUpdated: Date.now(),
          };

          const newHistory = [...cur.history, elapsed].slice(-16);
          const newTotal = cur.totalPings + 1;
          const newSuccess = cur.successPings + (isHealthy ? 1 : 0);
          const newMin = cur.minLatency === 0 ? elapsed : Math.min(cur.minLatency, elapsed);
          const newMax = Math.max(cur.maxLatency, elapsed);

          return {
            ...prev,
            [ep.id]: {
              id: ep.id,
              status: statusNum,
              latencyMs: elapsed,
              history: newHistory,
              minLatency: newMin,
              maxLatency: newMax,
              totalPings: newTotal,
              successPings: newSuccess,
              lastUpdated: Date.now(),
            },
          };
        });
      } catch {
        setMetrics((prev) => {
          const cur = prev[ep.id] || {
            id: ep.id,
            status: 'ERR',
            latencyMs: 0,
            history: [],
            minLatency: 0,
            maxLatency: 0,
            totalPings: 0,
            successPings: 0,
            lastUpdated: Date.now(),
          };

          const newHistory = [...cur.history, 0].slice(-16);
          const newTotal = cur.totalPings + 1;

          return {
            ...prev,
            [ep.id]: {
              id: ep.id,
              status: 'ERR',
              latencyMs: 0,
              history: newHistory,
              minLatency: cur.minLatency,
              maxLatency: cur.maxLatency,
              totalPings: newTotal,
              successPings: cur.successPings,
              lastUpdated: Date.now(),
            },
          };
        });
      }
    },
    [currentBaseUrl]
  );

  const pingAll = useCallback(() => {
    endpoints.forEach((ep) => {
      pingEndpoint(ep);
    });
  }, [endpoints, pingEndpoint]);

  useEffect(() => {
    if (isPaused) return;
    pingAll();
    const interval = setInterval(pingAll, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [pingAll, refreshIntervalSec, isPaused]);

  // Aggregate stats
  const activeMetrics = Object.values(metrics);
  const totalPings = activeMetrics.reduce((acc, m) => acc + m.totalPings, 0);
  const successPings = activeMetrics.reduce((acc, m) => acc + m.successPings, 0);
  const availabilityPct = totalPings > 0 ? Math.round((successPings / totalPings) * 100) : 100;

  const validLatencies = activeMetrics.map((m) => m.latencyMs).filter((l) => l > 0);
  const avgLatency = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;
  const maxObservedLatency = validLatencies.length > 0 ? Math.max(...validLatencies) : 30;

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchCat = selectedCategory === 'all' || ep.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [endpoints, selectedCategory, searchQuery]);

  // SVG Multi-Series Wave Plot
  const sampleCount = 16;
  const graphWidth = 900;
  const graphHeight = 150;
  const padX = 42;
  const padY = 22;
  const plotW = graphWidth - padX * 2;
  const plotH = graphHeight - padY * 2;
  const yUpper = Math.max(50, Math.ceil((maxObservedLatency * 1.25) / 10) * 10);

  const topSeries = useMemo(() => {
    const primary = [
      { id: 'ep_health', color: '#10b981', label: 'System Health' },
      { id: 'ep_rounds_list', color: '#3b82f6', label: 'Voting Rounds' },
      { id: 'ep_auth_me', color: '#a855f7', label: 'Auth Profile' },
      { id: 'ep_shots_list', color: '#f59e0b', label: 'GrabBox Dispatcher' },
    ];

    return primary.map((p) => {
      const hist = metrics[p.id]?.history || [];
      const pts = hist.map((lat, idx) => {
        const x = padX + (idx / Math.max(1, sampleCount - 1)) * plotW;
        const y = padY + plotH - (Math.min(lat, yUpper) / yUpper) * plotH;
        return { x, y, lat, idx };
      });
      return { ...p, points: pts };
    });
  }, [metrics, yUpper, plotW, plotH, padX, padY]);

  const handleGraphMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normX = (clientX / rect.width) * graphWidth;
    if (normX >= padX && normX <= padX + plotW) {
      const sampleIdx = Math.round(((normX - padX) / plotW) * (sampleCount - 1));
      setHoveredSampleIdx(sampleIdx);
    } else {
      setHoveredSampleIdx(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Dynamic Gateway & Host Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: availabilityPct > 80 ? '#10b981' : '#ef4444',
                boxShadow: availabilityPct > 80 ? '0 0 10px #10b981' : '0 0 10px #ef4444',
                transition: 'all 0.3s ease',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  Network
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Host:</span>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                  {parsedHostInfo.host}
                </span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {parsedHostInfo.pathname}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Host switcher trigger button */}
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '5px 10px', gap: 4 }}
              onClick={() => setIsEditingHost(!isEditingHost)}
            >
              {isEditingHost ? 'Close Host Settings' : 'Switch Host'}
            </button>

            {/* Probe Interval selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card-muted)', padding: '3px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '0 6px' }}>Interval:</span>
              {[3, 6, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setRefreshIntervalSec(sec);
                    setIsPaused(false);
                  }}
                  style={{
                    background: refreshIntervalSec === sec && !isPaused ? 'var(--accent-blue)' : 'transparent',
                    color: refreshIntervalSec === sec && !isPaused ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '5px 10px' }}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <button
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11px', padding: '5px 12px' }}
              onClick={pingAll}
            >
              Probe All
            </button>
          </div>
        </div>

        {/* Expandable Gateway Preset / Custom URL Manager */}
        {isEditingHost && (
          <div
            style={{
              padding: '14px',
              background: 'var(--bg-card-muted)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginTop: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                Target Gateway Presets:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => handleApplyHost('https://api.seraphinteractive.com/api/v1')}
                >
                  Cloud Production (api.seraphinteractive.com)
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => handleApplyHost('http://localhost:3333/api/v1')}
                >
                  Local AdonisJS (localhost:3333)
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => handleApplyHost('/api/v1')}
                >
                  Vite Proxy (/api/v1)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className="input-field mono"
                style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
                value={customHostInput}
                onChange={(e) => setCustomHostInput(e.target.value)}
                placeholder="https://your-custom-gateway.com/api/v1"
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ fontSize: '11px', padding: '6px 14px' }}
                onClick={() => handleApplyHost(customHostInput)}
              >
                Apply & Probe
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Executive Stat Strip with In-Context Hoverboxes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Active Services
            </span>
            
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
            {endpoints.length} Endpoints
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Mean Edge Latency
            </span>
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: avgLatency > 0 ? '#10b981' : 'var(--text-muted)', marginTop: 2 }}>
            {avgLatency > 0 ? `${avgLatency} ms` : 'Offline'}
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              System Availability
            </span>
            
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: availabilityPct > 80 ? '#3b82f6' : '#ef4444', marginTop: 2 }}>
            {availabilityPct}%
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Probes Executed
            </span>
            
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
            {totalPings} requests
          </div>
        </div>
      </div>

      {/* 3. Enhanced Dark Oscilloscope Latency Waveform */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Oscilloscope
                </span>
                
              </div>
              
            </div>
          </div>

          {/* Series Legend & Dynamic Toggles */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {topSeries.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--bg-card-muted)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{s.label}</span>
                <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: s.color }}>
                  {metrics[s.id]?.latencyMs || 0}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Spark Wave with SLA Baselines and Crosshair */}
        <div style={{ width: '100%', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            onMouseMove={handleGraphMouseMove}
            onMouseLeave={() => setHoveredSampleIdx(null)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              background: 'rgba(0, 0, 0, 0.32)',
              borderRadius: '8px',
              cursor: 'crosshair',
            }}
          >
            <defs>
              {topSeries.map((s) => (
                <linearGradient key={`grad_${s.id}`} id={`grad_${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padY + plotH * (1 - ratio);
              const val = Math.round(yUpper * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={graphWidth - padX}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padX - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="9"
                    fill="var(--text-muted)"
                    fontFamily="var(--font-mono)"
                  >
                    {val}ms
                  </text>
                </g>
              );
            })}

            {/* SLA Target Baseline Line (20ms target) */}
            {yUpper >= 20 && (
              <g>
                <line
                  x1={padX}
                  y1={padY + plotH - (20 / yUpper) * plotH}
                  x2={graphWidth - padX}
                  y2={padY + plotH - (20 / yUpper) * plotH}
                  stroke="rgba(16, 185, 129, 0.45)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={graphWidth - padX - 4}
                  y={padY + plotH - (20 / yUpper) * plotH - 3}
                  textAnchor="end"
                  fontSize="8.5"
                  fill="#10b981"
                  fontFamily="var(--font-mono)"
                  fontWeight="bold"
                >
                  SLA Target (20ms)
                </text>
              </g>
            )}

            {/* Render Smoothed Splines for each Top Series */}
            {topSeries.map((s) => {
              if (s.points.length < 2) return null;
              const pathD = generateSmoothSvgPath(s.points);
              const areaD = `${pathD} L ${s.points[s.points.length - 1]!.x.toFixed(1)} ${(padY + plotH).toFixed(1)} L ${s.points[0]!.x.toFixed(1)} ${(padY + plotH).toFixed(1)} Z`;

              return (
                <g key={s.id}>
                  <path d={areaD} fill={`url(#grad_${s.id})`} />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {s.points.map((pt, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r="2.5"
                      fill={s.color}
                      stroke="var(--bg-card)"
                      strokeWidth="1"
                    />
                  ))}
                </g>
              );
            })}

            {/* Hover Laser Indicator */}
            {hoveredSampleIdx !== null && (
              <g style={{ pointerEvents: 'none' }}>
                <line
                  x1={padX + (hoveredSampleIdx / Math.max(1, sampleCount - 1)) * plotW}
                  y1={padY}
                  x2={padX + (hoveredSampleIdx / Math.max(1, sampleCount - 1)) * plotW}
                  y2={padY + plotH}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
              </g>
            )}
          </svg>

          {/* Hover Floating Tooltip */}
          {hoveredSampleIdx !== null && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: Math.min(
                  Math.max(padX + (hoveredSampleIdx / Math.max(1, sampleCount - 1)) * plotW - 60, padX + 8),
                  graphWidth - 180
                ),
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                zIndex: 10,
                fontSize: '11px',
                color: '#f8fafc',
              }}
            >
              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Sample #{hoveredSampleIdx + 1}</span>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>T-{(sampleCount - 1 - hoveredSampleIdx) * refreshIntervalSec}s</span>
              </div>
              {topSeries.map((s) => {
                const pt = s.points[hoveredSampleIdx];
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
                    <span style={{ color: '#cbd5e1' }}>{s.label}:</span>
                    <span className="mono" style={{ fontWeight: 800, color: s.color }}>
                      {pt ? `${pt.lat}ms` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Endpoints Matrix Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        {/* Filter Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'System & Auth', 'Rounds & Voting', 'Proposals & Moderation', 'GrabBox Pipeline'].map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All Endpoints' : cat}
              </button>
            ))}
          </div>

          <div style={{ minWidth: 220, flex: '0 1 260px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search route / endpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            />
          </div>
        </div>

        {/* High-Density Matrix Table */}
        <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: 80, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Method</span>
                    
                  </div>
                </th>
                <th style={{ minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Route / Target</span>
                    
                  </div>
                </th>
                <th style={{ width: 170, whiteSpace: 'nowrap' }}>Category</th>
                <th style={{ width: 130, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>HTTP Status</span>
                    
                  </div>
                </th>
                <th style={{ width: 100, whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Latency</span>
                    
                  </div>
                </th>
                <th style={{ width: 140, whiteSpace: 'nowrap' }}>Min / Max</th>
                <th style={{ width: 180, whiteSpace: 'nowrap' }}>Availability</th>
                <th style={{ width: 80, textAlign: 'right', whiteSpace: 'nowrap' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEndpoints.map((ep) => {
                const metric = metrics[ep.id] || {
                  id: ep.id,
                  status: 'PENDING',
                  latencyMs: 0,
                  history: [],
                  minLatency: 0,
                  maxLatency: 0,
                  totalPings: 0,
                  successPings: 0,
                  lastUpdated: Date.now(),
                };

                const isError = metric.status === 'ERR' || (typeof metric.status === 'number' && metric.status >= 500);
                const isNotFound = metric.status === 404;
                const isAuth = metric.status === 401;
                const isForbidden = metric.status === 403;
                const isRedirect = metric.status === 302 || metric.status === 301;
                const isMethodNotAllowed = metric.status === 405;

                const statusLabel =
                  metric.status === 'PENDING'
                    ? 'PROBING'
                    : isRedirect
                    ? '302 REDIRECT'
                    : isNotFound
                    ? '404 NOT FOUND'
                    : isAuth
                    ? '401 AUTH'
                    : isForbidden
                    ? '403 FORBIDDEN'
                    : isMethodNotAllowed
                    ? '405 LIVE'
                    : isError
                    ? 'OFFLINE'
                    : `${metric.status} OK`;

                const badgeClass =
                  isNotFound || isError
                    ? 'badge-danger'
                    : isAuth || isRedirect
                    ? 'badge-engine'
                    : isForbidden
                    ? 'badge-warning'
                    : isMethodNotAllowed
                    ? 'badge-light'
                    : 'badge-success';

                const availPct =
                  metric.totalPings > 0
                    ? Math.round((metric.successPings / metric.totalPings) * 100)
                    : 100;

                return (
                  <tr key={ep.id}>
                    <td>
                      <span
                        className="badge"
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background:
                            ep.method === 'GET'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : ep.method === 'POST'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : ep.method === 'PATCH'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            ep.method === 'GET'
                              ? '#60a5fa'
                              : ep.method === 'POST'
                              ? '#34d399'
                              : ep.method === 'PATCH'
                              ? '#fbbf24'
                              : '#f87171',
                        }}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                        {ep.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                        <span className="mono" style={{ fontSize: '11px', color: '#38bdf8' }}>
                          {ep.path}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          - {ep.description}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-light" style={{ fontSize: '10px' }}>
                        {ep.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '10px' }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: metric.latencyMs > 0 ? '#10b981' : 'var(--text-muted)' }}>
                        {metric.latencyMs > 0 ? `${metric.latencyMs}ms` : '-'}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {metric.minLatency}ms / {metric.maxLatency}ms
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${availPct}%`,
                              height: '100%',
                              background: availPct > 80 ? '#10b981' : '#ef4444',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: '11px', width: 32, textAlign: 'right' }}>
                          {availPct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10px', padding: '3px 10px' }}
                        onClick={() => pingEndpoint(ep)}
                        title="Send immediate probe"
                      >
                        Ping
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
