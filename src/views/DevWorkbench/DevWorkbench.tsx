import React, { useState, useEffect } from 'react';
import {
  useActiveRound,
  useRoundEntries,
  useLiveLeaderboard,
  useCastBallot,
  useLiveTelemetry,
} from '../../hooks/useVotingApi.ts';
import { useAuth, UserRole } from '../../context/AuthContext.tsx';
import { getApiBaseUrl, setApiBaseUrl } from '../../api/client.ts';
import {
  calculate_moments_and_variance,
  calculate_pairwise_covariance,
  evaluate_rank_separation,
  calculate_confidence_interval,
  calculate_regularized_leaderboard,
  analyze_raid_risk,
  POINTS_PER_BALLOT,
  type EntryId,
  type Ballot,
} from '@platform/internal-logic';

export const DevWorkbench: React.FC = () => {
  const { user, loginAsDevUser } = useAuth();
  const { activeRound } = useActiveRound();
  const roundId = activeRound?.id || '';

  const { data: entries = [] } = useRoundEntries(roundId);
  const { data: leaderboardData } = useLiveLeaderboard(roundId, entries);

  const leaderboard = leaderboardData?.leaderboard || [];
  const totalBallots = leaderboardData?.totalBallots || 0;
  const totalPointsAwarded = leaderboardData?.totalPointsAwarded || 0;
  const expectedPoints = leaderboardData?.expectedPoints || 0;
  const isConserved = leaderboardData?.isConserved ?? true;
  const deltaPoints = totalPointsAwarded - expectedPoints;

  // Selected entry pointers for statistical inspection
  const [selectedMomentsEntry, setSelectedMomentsEntry] = useState<string>(
    entries[0]?.id || ''
  );
  const [entryA, setEntryA] = useState<string>(entries[0]?.id || '');
  const [entryB, setEntryB] = useState<string>(entries[1]?.id || '');
  const [zThreshold, setZThreshold] = useState<number>(1.96);
  const [priorK, setPriorK] = useState<number>(30);
  const [selectedRaidEntry, setSelectedRaidEntry] = useState<string>(
    entries[0]?.id || ''
  );
  const [velocityZ, setVelocityZ] = useState<number>(0.5);

  // Editable backend URL state
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null);

  const castMutation = useCastBallot(roundId);
  const { data: telemetryList = [] } = useLiveTelemetry(roundId, leaderboard);

  // Make sure selection defaults don't point to empty strings
  useEffect(() => {
    if (entries.length > 0) {
      if (!selectedMomentsEntry) setSelectedMomentsEntry(entries[0]!.id);
      if (!entryA) setEntryA(entries[0]!.id);
      if (!entryB) setEntryB(entries[1]?.id || entries[0]!.id);
      if (!selectedRaidEntry) setSelectedRaidEntry(entries[0]!.id);
    }
  }, [entries, selectedMomentsEntry, entryA, entryB, selectedRaidEntry]);

  // Statistical calculations for chosen entry
  const currentBreakdown = leaderboard.find((item) => item.entryId === selectedMomentsEntry) || {
    entryId: selectedMomentsEntry,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    appearanceCount: 0,
    rawScore: 0,
  };

  const moments = calculate_moments_and_variance(currentBreakdown, totalBallots);

  const breakdownA = leaderboard.find((item) => item.entryId === entryA) || {
    entryId: entryA,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    appearanceCount: 0,
    rawScore: 0,
  };

  const breakdownB = leaderboard.find((item) => item.entryId === entryB) || {
    entryId: entryB,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    appearanceCount: 0,
    rawScore: 0,
  };

  // Pull raw ballots from query result or local store
  const rawBallots: Ballot[] = (leaderboardData as unknown as { rawBallots?: Ballot[] })?.rawBallots || [];
  const covResult = calculate_pairwise_covariance(entryA, entryB, rawBallots);
  const separation = evaluate_rank_separation(breakdownA, breakdownB, rawBallots, zThreshold);
  const ci = calculate_confidence_interval(separation.deltaScore, separation.standardError, zThreshold);

  // Compute regularized Bayesian standings
  const M = entries.length || 1;
  const globalMean = POINTS_PER_BALLOT / M;
  const regularizedList = calculate_regularized_leaderboard(leaderboard, M, totalBallots, priorK);

  // Batman raid anomaly inspection
  const targetRaidBreakdown = leaderboard.find((item) => item.entryId === selectedRaidEntry) || {
    entryId: selectedRaidEntry,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    appearanceCount: 0,
    rawScore: 0,
  };
  const targetRaidTelemetry = analyze_raid_risk(targetRaidBreakdown, velocityZ);

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    setApiStatusMessage('API URL saved. Queries will route to this endpoint.');
    setTimeout(() => setApiStatusMessage(null), 3000);
  };

  // Inject test ballots into the pool
  const handleInjectBurst = async (type: 'organic' | 'raid') => {
    if (entries.length < 3) return;
    const entryIds = entries.map((e) => e.id);
    const N_burst = type === 'raid' ? 30 : 15;

    for (let i = 0; i < N_burst; i++) {
      let r1: EntryId, r2: EntryId, r3: EntryId;
      if (type === 'raid') {
        r1 = selectedRaidEntry;
        const remaining = entryIds.filter((id) => id !== selectedRaidEntry);
        r2 = remaining[0]!;
        r3 = remaining[1]!;
      } else {
        const shuffled = [...entryIds].sort(() => Math.random() - 0.5);
        r1 = shuffled[0]!;
        r2 = shuffled[1]!;
        r3 = shuffled[2]!;
      }

      await castMutation.mutateAsync({ rank1: r1, rank2: r2, rank3: r3 });
    }
  };

  return (
    <div className="container">
      {/* Dev Header and Connection Config */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Developer and Admin Statistical Diagnostics</div>
            <div className="card-desc">
              Real-time audit of mathematical invariants, moments, Z-score hypothesis testing, and Batman raid telemetry against live API.
            </div>
          </div>
          <span className="badge badge-engine">Dev Mode Active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Live vote-api Base URL:
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                className="input-field"
                style={{ flex: 1 }}
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3333/api/v1"
              />
              <button className="btn btn-secondary btn-sm" onClick={handleSaveApiUrl}>
                Save URL
              </button>
            </div>
            {apiStatusMessage && (
              <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: 4 }}>
                {apiStatusMessage}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Impersonate User Role for Testing:
            </label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {(['admin', 'moderator', 'user'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  className={`btn btn-sm ${user?.role === r ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => loginAsDevUser(r, `Test${r.toUpperCase()}`)}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6N Conservation Invariant Audit Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">6N Point Conservation Invariant Audit</div>
            <div className="card-desc">
              Verification of Conservation of Points: sum(S_j) = 6N across all cast ballots.
            </div>
          </div>
          <span className={`badge ${isConserved ? 'badge-success' : 'badge-danger'}`}>
            {isConserved ? '100% Conserved' : 'Point Leak Detected'}
          </span>
        </div>

        <div className="metric-grid">
          <div className="metric-item">
            <div className="label">Total Ballots (N)</div>
            <div className="value mono text-blue">{totalBallots}</div>
          </div>
          <div className="metric-item">
            <div className="label">Expected Credits (6N)</div>
            <div className="value mono">{expectedPoints}</div>
          </div>
          <div className="metric-item">
            <div className="label">Total Awarded (sum S_j)</div>
            <div className="value mono">{totalPointsAwarded}</div>
          </div>
          <div className="metric-item">
            <div className="label">Conservation Delta</div>
            <div className={`value mono ${deltaPoints === 0 ? 'text-success' : 'text-danger'}`}>
              {deltaPoints === 0 ? '0 Delta (PASS)' : `${deltaPoints} Delta (FAIL)`}
            </div>
          </div>
        </div>
      </div>

      {/* Statistical Moments and Covariance Inspector */}
      <div className="view-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Statistical Moments (Squared Payoffs)</div>
          </div>

          <div className="form-group">
            <label>Target Pitch to Inspect:</label>
            <select
              className="select-field"
              value={selectedMomentsEntry}
              onChange={(e) => setSelectedMomentsEntry(e.target.value)}
            >
              {entries.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, margin: '12px 0', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-primary)', padding: 6, borderRadius: 4 }}>
              <div style={{ fontSize: '9px', color: 'var(--accent-gold)' }}>p1 (Rank 1)</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{(moments.p1 * 100).toFixed(1)}%</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: 6, borderRadius: 4 }}>
              <div style={{ fontSize: '9px', color: 'var(--accent-silver)' }}>p2 (Rank 2)</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{(moments.p2 * 100).toFixed(1)}%</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: 6, borderRadius: 4 }}>
              <div style={{ fontSize: '9px', color: 'var(--accent-bronze)' }}>p3 (Rank 3)</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{(moments.p3 * 100).toFixed(1)}%</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: 6, borderRadius: 4 }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>p0 (0 pts)</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{(moments.p0 * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-item">
              <div className="label">Expected Score mu = E[X]</div>
              <div className="value mono text-blue">{moments.expectedScorePerVoter.toFixed(3)}</div>
            </div>
            <div className="metric-item">
              <div className="label">Second Moment E[X^2]</div>
              <div className="value mono">{moments.secondMoment.toFixed(3)}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>9p1 + 4p2 + 1p3</div>
            </div>
            <div className="metric-item">
              <div className="label">Single-Ballot Var(X)</div>
              <div className="value mono text-warning">{moments.singleBallotVariance.toFixed(4)}</div>
            </div>
            <div className="metric-item">
              <div className="label">Total Var(S)</div>
              <div className="value mono text-warning">{moments.totalVariance.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Pairwise Covariance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pairwise Covariance and Mutual Exclusion</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: '11px' }}>Entry A:</label>
              <select className="select-field" value={entryA} onChange={(e) => setEntryA(e.target.value)}>
                {entries.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px' }}>Entry B:</label>
              <select className="select-field" value={entryB} onChange={(e) => setEntryB(e.target.value)}>
                {entries.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-item">
              <div className="label">Single Cov(X_a, X_b)</div>
              <div className={`value mono ${covResult.singleBallotCovariance <= 0 ? 'text-blue' : 'text-warning'}`}>
                {covResult.singleBallotCovariance.toFixed(4)}
              </div>
            </div>
            <div className="metric-item">
              <div className="label">Total Cov(S_a, S_b)</div>
              <div className={`value mono ${covResult.totalCovariance <= 0 ? 'text-blue' : 'text-warning'}`}>
                {covResult.totalCovariance.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="callout callout-info" style={{ marginTop: 12, marginBottom: 0, fontSize: '12px' }}>
            Mutual slot exclusion ensures Cov(S_a, S_b) is non-positive, correctly widening the error margin when evaluating close leads.
          </div>
        </div>
      </div>

      {/* Paired Z-Score Rank Separation and Wobble Testing */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Paired Z-Score Rank Separation (Tie vs Lead)</div>
            <div className="card-desc">
              Z = Delta / SE(Delta) with two-tailed p-value and tiered runoff recommendation.
            </div>
          </div>
          <span className={`badge ${separation.status === 'STATISTICAL_TIE' ? 'badge-warning' : 'badge-success'}`}>
            {separation.status}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <label style={{ fontSize: '12px' }}>Significance Threshold Z_crit:</label>
          <input
            type="range"
            min="1.0"
            max="3.5"
            step="0.01"
            value={zThreshold}
            onChange={(e) => setZThreshold(parseFloat(e.target.value))}
          />
          <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
            Z = {zThreshold.toFixed(2)}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
          <div className="metric-item">
            <div className="label">Point Gap (Delta)</div>
            <div className="value mono text-blue">{separation.deltaScore > 0 ? '+' : ''}{separation.deltaScore} pts</div>
          </div>
          <div className="metric-item">
            <div className="label">Standard Error SE</div>
            <div className="value mono">{separation.standardError.toFixed(3)}</div>
          </div>
          <div className="metric-item">
            <div className="label">Z-Score</div>
            <div className="value mono">{separation.zScore.toFixed(3)}</div>
          </div>
          <div className="metric-item">
            <div className="label">p-value</div>
            <div className="value mono">p = {separation.pValue.toFixed(4)}</div>
          </div>
          <div className="metric-item">
            <div className="label">Confidence Interval</div>
            <div className="value mono text-blue">[{ci.lower.toFixed(1)}, {ci.upper.toFixed(1)}]</div>
          </div>
        </div>

        <div className={`callout ${separation.status === 'STATISTICAL_TIE' ? 'callout-warning' : 'callout-success'}`} style={{ marginBottom: 0 }}>
          <strong>Recommended Action: {separation.recommendedAction}</strong>: {separation.explanation}
        </div>
      </div>

      {/* Bayesian Shrinkage Explorer */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Bayesian Shrinkage Exposure Regularizer</div>
            <div className="card-desc">
              S_reg = (S_j + K * mu_0) / (n_j + K) with global mean mu_0 = {globalMean.toFixed(2)} pts.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '12px' }}>Prior K:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={priorK}
              onChange={(e) => setPriorK(parseInt(e.target.value, 10))}
            />
            <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-blue)', minWidth: 40 }}>
              K = {priorK}
            </span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Pitch Idea</th>
                <th style={{ textAlign: 'right' }}>Appearances</th>
                <th style={{ textAlign: 'right' }}>Raw Score</th>
                <th style={{ textAlign: 'right' }}>Regularized Score</th>
                <th>Exposure Regularization Status</th>
              </tr>
            </thead>
            <tbody>
              {regularizedList.map((item, idx) => (
                <tr key={item.entryId}>
                  <td className="mono" style={{ fontWeight: 700 }}>#{idx + 1}</td>
                  <td>{entries.find((e) => e.id === item.entryId)?.title || item.entryId}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{item.appearances}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{item.rawScore}</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {item.regularizedTotalScore.toFixed(1)}
                  </td>
                  <td>
                    {item.appearances <= 3 && item.rawScore >= 3 ? (
                      <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                        Cold-Start Diluted
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>
                        High Confidence
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batman Protocol Multi-Factor Streamer Raid Telemetry */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Batman Protocol: Streamer Raid Telemetry ({telemetryList.length} Entries Monitored)</div>
            <div className="card-desc">
              Multi-factor anomaly scoring: Skew Ratio (45%), Entropy (35%), Velocity Z (20%).
            </div>
          </div>
          <span className={`badge ${targetRaidTelemetry.severity === 'CRITICAL_RAID' ? 'badge-danger' : targetRaidTelemetry.severity === 'SUSPICIOUS' ? 'badge-warning' : 'badge-success'}`}>
            {targetRaidTelemetry.severity}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: '11px' }}>Inspect Pitch Telemetry:</label>
            <select className="select-field" value={selectedRaidEntry} onChange={(e) => setSelectedRaidEntry(e.target.value)}>
              {entries.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px' }}>Simulate Influx Velocity Z-Score:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={velocityZ}
                onChange={(e) => setVelocityZ(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-blue)', minWidth: 45 }}>
                Z = {velocityZ.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric-item">
            <div className="label">Composite Threat Score</div>
            <div className="value mono" style={{ color: targetRaidTelemetry.compositeScore >= 0.75 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {(targetRaidTelemetry.compositeScore * 100).toFixed(1)} / 100
            </div>
          </div>
          <div className="metric-item">
            <div className="label">Rank Skew Ratio (R)</div>
            <div className="value mono">{targetRaidTelemetry.skewRatio.toFixed(2)}</div>
          </div>
          <div className="metric-item">
            <div className="label">Shannon Entropy (H)</div>
            <div className="value mono">{targetRaidTelemetry.rankEntropy.toFixed(3)}</div>
          </div>
          <div className="metric-item">
            <div className="label">Rank 1 Point Share</div>
            <div className="value mono">
              {((targetRaidTelemetry.breakdown.rank1ToTotalRatio) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Live Simulator Injector */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleInjectBurst('organic')}
          >
            Inject +15 Organic Ballots
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleInjectBurst('raid')}
          >
            Simulate +30 Streamer Raid Spam on Selected Pitch
          </button>
        </div>
      </div>
    </div>
  );
};
