import React, { useState, useEffect } from 'react';
import {
  useActiveRound,
  useVotingRounds,
  useRoundEntries,
  useLiveLeaderboard,
  useLiveTelemetry,
} from '../../hooks/useVotingApi.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { getApiBaseUrl, setApiBaseUrl } from '../../api/client.ts';
import { PitchCatalog } from '../VoterApp/PitchCatalog.tsx';
import {
  calculate_moments_and_variance,
  analyze_raid_risk,
} from '@platform/internal-logic';

interface DevWorkbenchProps {
  onOpenCreatePitch?: () => void;
  onOpenCreateRound?: () => void;
}

export const DevWorkbench: React.FC<DevWorkbenchProps> = ({
  onOpenCreatePitch,
  onOpenCreateRound,
}) => {
  const { user } = useAuth();
  const [activeConsoleTab, setActiveConsoleTab] = useState<'moderation' | 'invariants' | 'telemetry' | 'network'>('moderation');

  const { data: rounds = [] } = useVotingRounds();
  const { activeRound } = useActiveRound();
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const currentRoundId = selectedRoundId || activeRound?.id || 'round-01';
  const currentRound = rounds.find((r) => r.id === currentRoundId) || activeRound;

  const { data: entries = [] } = useRoundEntries(currentRoundId);
  const { data: leaderboardData } = useLiveLeaderboard(currentRoundId, entries);

  const leaderboard = leaderboardData?.leaderboard || [];
  const totalBallots = leaderboardData?.totalBallots || 0;
  const totalPointsAwarded = leaderboardData?.totalPointsAwarded || 0;
  const expectedPoints = leaderboardData?.expectedPoints || 0;
  const isConserved = leaderboardData?.isConserved ?? true;
  const deltaPoints = totalPointsAwarded - expectedPoints;

  // Selected entry pointers for statistical inspection
  const [selectedMomentsEntry, setSelectedMomentsEntry] = useState<string>(entries[0]?.id || '');
  const [selectedRaidEntry, setSelectedRaidEntry] = useState<string>(entries[0]?.id || '');

  // Editable backend URL state
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null);

  const { data: telemetryList = [] } = useLiveTelemetry(currentRoundId, leaderboard);

  useEffect(() => {
    if (entries.length > 0) {
      if (!selectedMomentsEntry) setSelectedMomentsEntry(entries[0]!.id);
      if (!selectedRaidEntry) setSelectedRaidEntry(entries[0]!.id);
    }
  }, [entries, selectedMomentsEntry, selectedRaidEntry]);

  const currentBreakdown = leaderboard.find((item) => item.entryId === selectedMomentsEntry) || {
    entryId: selectedMomentsEntry,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    appearanceCount: 0,
    rawScore: 0,
  };

  const moments = calculate_moments_and_variance(currentBreakdown, totalBallots);

  const targetRaidBreakdown = leaderboard.find((item) => item.entryId === selectedRaidEntry) || {
    entryId: selectedRaidEntry,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    appearanceCount: 0,
    rawScore: 0,
  };
  const observedTelemetry = telemetryList.find((t) => t.entryId === selectedRaidEntry);
  const observedVelocityZ = observedTelemetry?.velocityZScore ?? 0.5;
  const targetRaidTelemetry = analyze_raid_risk(targetRaidBreakdown, observedVelocityZ);

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    setApiStatusMessage('API URL updated.');
    setTimeout(() => setApiStatusMessage(null), 3000);
  };

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
          Restricted Developer Console
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          Sign in with an Administrator or Moderator account to access moderation and diagnostics tools.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Console Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'moderation' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('moderation')}
          >
            Pitches & Moderation
          </button>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'invariants' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('invariants')}
          >
            Invariants & Math
          </button>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'telemetry' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('telemetry')}
          >
            Raid Telemetry
          </button>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'network' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('network')}
          >
            Network
          </button>
        </div>

        <span className="badge badge-engine">
          {user.role.toUpperCase()} MODE
        </span>
      </div>

      {/* Sub-View 1: Moderation & Pitches */}
      {activeConsoleTab === 'moderation' && (
        <PitchCatalog
          entries={entries}
          activeRound={currentRound}
          rounds={rounds}
          selectedRoundId={currentRoundId}
          onSelectRound={setSelectedRoundId}
          selectedRank1=""
          selectedRank2=""
          selectedRank3=""
          onSelectRank={() => {}}
          onOpenCreatePitch={onOpenCreatePitch}
          onOpenCreateRound={onOpenCreateRound}
        />
      )}

      {/* Sub-View 2: Invariants & Math */}
      {activeConsoleTab === 'invariants' && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Conservation (6N)</div>
              <span className={`badge ${isConserved ? 'badge-success' : 'badge-danger'}`}>
                {isConserved ? 'Conserved' : 'Point Leak'}
              </span>
            </div>

            <div className="landing-metrics-grid">
              <div className="landing-metric-card">
                <div className="landing-metric-label">Ballots (N)</div>
                <div className="landing-metric-value mono text-blue">{totalBallots}</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Expected (6N)</div>
                <div className="landing-metric-value mono">{expectedPoints}</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Total Awarded</div>
                <div className="landing-metric-value mono">{totalPointsAwarded}</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Delta</div>
                <div className={`landing-metric-value mono ${deltaPoints === 0 ? 'text-green' : 'text-danger'}`}>
                  {deltaPoints}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Moments & Variance</div>
              <select
                className="select-field"
                value={selectedMomentsEntry}
                onChange={(e) => setSelectedMomentsEntry(e.target.value)}
              >
                {entries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="landing-metrics-grid">
              <div className="landing-metric-card">
                <div className="landing-metric-label">Expectation E[X]</div>
                <div className="landing-metric-value mono">{moments.expectedScorePerVoter.toFixed(3)}</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Variance Var(X)</div>
                <div className="landing-metric-value mono">{moments.singleBallotVariance.toFixed(3)}</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Std Dev sigma</div>
                <div className="landing-metric-value mono">{moments.standardDeviation.toFixed(3)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sub-View 3: Raid Telemetry */}
      {activeConsoleTab === 'telemetry' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Raid Risk & Entropy</div>
            <select
              className="select-field"
              value={selectedRaidEntry}
              onChange={(e) => setSelectedRaidEntry(e.target.value)}
            >
              {entries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          <div className="landing-metrics-grid">
            <div className="landing-metric-card">
              <div className="landing-metric-label">Risk Level</div>
              <div className="landing-metric-value mono text-green">{targetRaidTelemetry.severity}</div>
            </div>
            <div className="landing-metric-card">
              <div className="landing-metric-label">Entropy Score</div>
              <div className="landing-metric-value mono">{targetRaidTelemetry.rankEntropy.toFixed(3)}</div>
            </div>
            <div className="landing-metric-card">
              <div className="landing-metric-label">Top-Heavy Ratio</div>
              <div className="landing-metric-value mono">{(targetRaidTelemetry.breakdown.rank1ToTotalRatio * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 4: Network & API */}
      {activeConsoleTab === 'network' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">API Endpoint</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="input-field"
              style={{ flex: 1 }}
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSaveApiUrl}>
              Save
            </button>
          </div>
          {apiStatusMessage && (
            <div style={{ marginTop: 8, color: 'var(--accent-green)', fontSize: '12px' }}>
              {apiStatusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
