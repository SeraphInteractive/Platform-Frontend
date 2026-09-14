import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getApiBaseUrl, setApiBaseUrl } from '../../api/client.ts';
import { TrajectoryCoordinateGraph, TrajectorySeries } from '../../components/TrajectoryCoordinateGraph.tsx';

interface EndpointConfig {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
}

interface EndpointMetric {
  id: string;
  status: number | 'ERR' | 'PENDING';
  latencyMs: number;
  history: number[]; // Last N latency samples
  minLatency: number;
  maxLatency: number;
  totalPings: number;
  successPings: number;
  lastUpdated: number;
}

interface NetworkTelemetryChartProps {
  roundId?: string;
}

export const NetworkTelemetryChart: React.FC<NetworkTelemetryChartProps> = ({
  roundId = 'round-01',
}) => {
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('all');

  const endpoints: EndpointConfig[] = [
    {
      id: 'ep_root',
      name: 'Service Health',
      method: 'GET',
      path: '/',
      description: 'API root availability and server status.',
    },
    {
      id: 'ep_rounds',
      name: 'Voting Rounds',
      method: 'GET',
      path: '/rounds',
      description: 'Active rounds and configuration stream.',
    },
    {
      id: 'ep_entries',
      name: 'Proposal Pool',
      method: 'GET',
      path: `/rounds/${roundId}/entries`,
      description: 'Approved pitch entries and metadata.',
    },
    {
      id: 'ep_board',
      name: 'Live Leaderboard',
      method: 'GET',
      path: `/rounds/${roundId}/leaderboard`,
      description: '6N conservation scores and ranks.',
    },
    {
      id: 'ep_shots',
      name: 'GrabBox Dispatcher',
      method: 'GET',
      path: '/shots',
      description: 'Modular 3D shot tasks and claims.',
    },
    {
      id: 'ep_telemetry',
      name: 'Raid Telemetry',
      method: 'GET',
      path: `/rounds/${roundId}/telemetry`,
      description: 'Entropy and velocity anomaly monitor.',
    },
    {
      id: 'ep_auth',
      name: 'Auth Session',
      method: 'GET',
      path: '/auth/me',
      description: 'Discord session and role validation.',
    },
  ];

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

  const [tickCount, setTickCount] = useState<number>(0);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const pingEndpoint = useCallback(async (ep: EndpointConfig) => {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    const cleanPath = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
    const url = ep.id === 'ep_root'
      ? (baseUrl.includes('/api/v1') ? baseUrl.replace('/api/v1', '/') : `${baseUrl}/`)
      : `${baseUrl}${cleanPath}`;

    const token = typeof window !== 'undefined' ? localStorage.getItem('mcs_auth_token') : null;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: ep.method,
        headers,
        signal: AbortSignal.timeout(4000),
      });
      const end = performance.now();
      const elapsed = Math.round(end - start);

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

        const newHistory = [...cur.history, elapsed].slice(-12);
        const newTotal = cur.totalPings + 1;
        const isSuccess = res.status >= 200 && res.status < 400;
        const newSuccess = cur.successPings + (isSuccess ? 1 : 0);
        const newMin = cur.minLatency === 0 ? elapsed : Math.min(cur.minLatency, elapsed);
        const newMax = Math.max(cur.maxLatency, elapsed);

        return {
          ...prev,
          [ep.id]: {
            id: ep.id,
            status: res.status,
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
      const end = performance.now();
      const elapsed = Math.round(end - start);

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

        const newHistory = [...cur.history, elapsed].slice(-12);
        const newTotal = cur.totalPings + 1;

        return {
          ...prev,
          [ep.id]: {
            ...cur,
            status: 'ERR',
            latencyMs: elapsed,
            history: newHistory,
            totalPings: newTotal,
            lastUpdated: Date.now(),
          },
        };
      });
    }
  }, []);

  const pingAllEndpoints = useCallback(async () => {
    await Promise.all(endpoints.map((ep) => pingEndpoint(ep)));
    setTickCount((prev) => prev + 1);
  }, [endpoints, pingEndpoint]);

  // Periodic polling timer
  useEffect(() => {
    if (isPaused || refreshIntervalSec <= 0) return;
    pingAllEndpoints();
    const interval = setInterval(() => {
      pingAllEndpoints();
    }, refreshIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [isPaused, refreshIntervalSec, pingAllEndpoints]);

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    setApiStatusMessage('API URL updated.');
    pingAllEndpoints();
    setTimeout(() => setApiStatusMessage(null), 3000);
  };

  // Convert endpoint metrics into Cartesian Trajectory Series
  const colorPalette = [
    '#10b981', // green baseline
    '#3b82f6', // blue
    '#a855f7', // purple
    '#f59e0b', // gold
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#94a3b8', // slate
  ];

  const activeEndpoints =
    selectedEndpointId === 'all'
      ? endpoints
      : endpoints.filter((e) => e.id === selectedEndpointId);

  let maxLatencyFound = 50;
  Object.values(metrics).forEach((m) => {
    m.history.forEach((lat) => {
      if (lat > maxLatencyFound) maxLatencyFound = lat;
    });
  });

  const yMaxScaled = Math.max(100, Math.ceil((maxLatencyFound * 1.25) / 20) * 20);
  const historyLen = Math.max(
    6,
    ...Object.values(metrics).map((m) => m.history.length)
  );

  const trajectorySeries: TrajectorySeries[] = activeEndpoints.map((ep, idx) => {
    const met = metrics[ep.id];
    const hist = met?.history || [];
    const isDegraded = met?.status === 'ERR' || (met?.latencyMs || 0) > 250;
    const seriesColor = isDegraded ? '#ef4444' : (idx === 0 ? '#10b981' : colorPalette[idx % colorPalette.length]);

    const points = hist.map((lat, hIdx) => ({
      x: hIdx,
      y: lat,
    }));

    return {
      id: ep.id,
      name: ep.name,
      color: seriesColor,
      strokeWidth: selectedEndpointId === ep.id ? 2.5 : 1.8,
      points,
      annotations:
        points.length > 0 && points[points.length - 1]
          ? [
              {
                x: points[points.length - 1]!.x,
                y: points[points.length - 1]!.y,
                text: `${points[points.length - 1]!.y}ms`,
                color: seriesColor,
                align: 'start',
              },
            ]
          : [],
      description: `${ep.method} ${ep.path} (cur: ${met?.latencyMs || 0}ms, avg: ${
        met?.history.length ? Math.round(met.history.reduce((a, b) => a + b, 0) / met.history.length) : 0
      }ms)`,
    };
  });

  // Calculate overall network health
  const totalCalls = Object.values(metrics).reduce((acc, cur) => acc + cur.totalPings, 0);
  const totalSuccess = Object.values(metrics).reduce((acc, cur) => acc + cur.successPings, 0);
  const uptimeRatio = totalCalls > 0 ? ((totalSuccess / totalCalls) * 100).toFixed(1) : '100.0';
  const averageLatency =
    totalCalls > 0
      ? Math.round(
          Object.values(metrics).reduce((acc, cur) => acc + cur.latencyMs, 0) /
            (Object.keys(metrics).length || 1)
        )
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. API Configuration & Control Bar */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              API Gateway
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Active target endpoint base URL and live connection settings.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Polling Interval Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Interval:</span>
              <select
                className="select-field"
                style={{ padding: '4px 8px', fontSize: '11px', minWidth: 80 }}
                value={refreshIntervalSec}
                onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              >
                <option value={2}>2s</option>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
              </select>
            </div>

            {/* Pause / Resume Button */}
            <button
              className={`btn btn-sm ${isPaused ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            {/* Ping Now Button */}
            <button
              className="btn btn-primary btn-sm"
              onClick={pingAllEndpoints}
            >
              Ping Now
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="input-field"
            style={{ flex: 1 }}
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3333/api/v1"
          />
          <button className="btn btn-primary" onClick={handleSaveApiUrl}>
            Save
          </button>
        </div>

        {apiStatusMessage && (
          <div style={{ marginTop: 8, color: 'var(--accent-green)', fontSize: '12px', fontWeight: 700 }}>
            {apiStatusMessage}
          </div>
        )}
      </div>

      {/* 2. Top-level Network KPI Metrics */}
      <div className="landing-metrics-grid">
        <div className="landing-metric-card">
          <div className="landing-metric-label">Availability</div>
          <div className={`landing-metric-value mono ${Number(uptimeRatio) >= 95 ? 'text-green' : 'text-danger'}`}>
            {uptimeRatio}%
          </div>
        </div>
        <div className="landing-metric-card">
          <div className="landing-metric-label">Mean Latency</div>
          <div className={`landing-metric-value mono ${averageLatency < 100 ? 'text-green' : 'text-danger'}`}>
            {averageLatency}ms
          </div>
        </div>
        <div className="landing-metric-card">
          <div className="landing-metric-label">Active Endpoints</div>
          <div className="landing-metric-value mono">{endpoints.length}</div>
        </div>
        <div className="landing-metric-card">
          <div className="landing-metric-label">Sample Ticks</div>
          <div className="landing-metric-value mono">{tickCount}</div>
        </div>
      </div>

      {/* 3. Live Cartesian Coordinate Latency Line Graph */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              Latency Trajectory
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Real-time response time progression in milliseconds across API endpoints.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Filter:</span>
            <select
              className="select-field"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              value={selectedEndpointId}
              onChange={(e) => setSelectedEndpointId(e.target.value)}
            >
              <option value="all">All Endpoints</option>
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name} ({ep.path})
                </option>
              ))}
            </select>
          </div>
        </div>

        <TrajectoryCoordinateGraph
          title="Endpoint Response Time"
          xLabel="Sample Tick (latest 12 pings)"
          yLabel="Latency (ms)"
          xMin={0}
          xMax={Math.max(10, historyLen - 1)}
          yMin={0}
          yMax={yMaxScaled}
          xStep={2}
          yStep={Math.max(20, Math.round(yMaxScaled / 5))}
          series={trajectorySeries}
          height={320}
        />
      </div>

      {/* 4. Live Endpoint Health Roster */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>
          Endpoint Health
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint Path</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Min / Max</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => {
                const met = metrics[ep.id];
                const isErr = met?.status === 'ERR' || (typeof met?.status === 'number' && met.status >= 400);
                const isSuccess = typeof met?.status === 'number' && met.status >= 200 && met.status < 400;
                const availabilityPct = met && met.totalPings > 0 ? ((met.successPings / met.totalPings) * 100).toFixed(0) : '100';

                return (
                  <tr key={ep.id}>
                    <td>
                      <span className="badge badge-engine" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                        {ep.method}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '12px' }}>
                        {ep.name}
                      </div>
                      <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ep.path}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${isSuccess ? 'badge-success' : isErr ? 'badge-danger' : 'badge-engine'}`}
                      >
                        {met?.status === 'PENDING' ? 'PENDING' : met?.status === 'ERR' ? 'ERROR' : `${met?.status} OK`}
                      </span>
                    </td>
                    <td>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 800,
                          fontSize: '12px',
                          color: (met?.latencyMs || 0) < 100 ? 'var(--accent-green)' : (met?.latencyMs || 0) < 250 ? 'var(--text-main)' : 'var(--color-danger)',
                        }}
                      >
                        {met?.latencyMs || 0}ms
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {met?.minLatency || 0}ms / {met?.maxLatency || 0}ms
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${availabilityPct}%`,
                              height: '100%',
                              background: Number(availabilityPct) >= 90 ? 'var(--accent-green)' : 'var(--color-danger)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: '11px' }}>
                          {availabilityPct}%
                        </span>
                      </div>
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
