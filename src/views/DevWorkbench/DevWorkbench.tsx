import React, { useState, useEffect } from 'react';
import {
  useActiveRound,
  useVotingRounds,
  useRoundEntries,
  useLiveLeaderboard,
  useLiveTelemetry,
  useLiveBallots,
  useUpdateEntryStatus,
  useDeleteEntry,
  VotingEntry,
} from '../../hooks/useVotingApi.ts';
import { useAuth, isStaff } from '../../context/AuthContext.tsx';
import {
  calculate_moments_and_variance,
  analyze_raid_risk,
} from '@platform/internal-logic';
import { analyzeSyntheticContent, AiDetectionResult } from '../../utils/aiDetector.ts';
import { ConservationChart } from './ConservationChart.tsx';
import { MomentsVarianceChart } from './MomentsVarianceChart.tsx';
import { RaidTelemetryChart } from './RaidTelemetryChart.tsx';
import { SupervisorModerationChart } from './SupervisorModerationChart.tsx';
import { NetworkTelemetryChart } from './NetworkTelemetryChart.tsx';
import { usePipelineProgress } from '../../hooks/usePipelineProgress.ts';
import { NavTabId } from '../../components/Navbar.tsx';

interface DevWorkbenchProps {
  onOpenCreatePitch?: () => void;
  onOpenCreateRound?: () => void;
  onNavigateTab?: (tab: NavTabId) => void;
  onSelectEntryForVote?: (entryId: string) => void;
  defaultTab?: 'moderation' | 'invariants' | 'telemetry' | 'network' | 'pipeline';
}

export const DevWorkbench: React.FC<DevWorkbenchProps> = ({
  onOpenCreatePitch,
  onOpenCreateRound,
  defaultTab = 'moderation',
}) => {
  const { user } = useAuth();
  const [activeConsoleTab, setActiveConsoleTab] = useState<'moderation' | 'invariants' | 'telemetry' | 'network' | 'pipeline'>(defaultTab);
  const pipeline = usePipelineProgress();

  const [tempStatusNote, setTempStatusNote] = useState<string>(pipeline.statusNote);
  const [tempPercentage, setTempPercentage] = useState<number>(pipeline.percentage);
  const [pipelineSavedNotice, setPipelineSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setTempStatusNote(pipeline.statusNote);
    setTempPercentage(pipeline.percentage);
  }, [pipeline.statusNote, pipeline.percentage]);

  const { data: rounds = [] } = useVotingRounds();
  const { activeRound } = useActiveRound();
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const currentRoundId = selectedRoundId || activeRound?.id || 'round-01';

  const { data: entries = [] } = useRoundEntries(currentRoundId);
  const { data: leaderboardData } = useLiveLeaderboard(currentRoundId, entries);
  const { data: ballots = [] } = useLiveBallots(currentRoundId);

  const leaderboard = leaderboardData?.leaderboard || [];
  const totalBallots = leaderboardData?.totalBallots || ballots.length || 0;
  const totalPointsAwarded = leaderboardData?.totalPointsAwarded || 0;
  const expectedPoints = leaderboardData?.expectedPoints || 0;
  const isConserved = leaderboardData?.isConserved ?? true;
  const deltaPoints = totalPointsAwarded - expectedPoints;

  // Moderation state: filter, search, inspection modal, pagination
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'flagged' | 'rejected' | 'ai_flagged'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [inspectedEntry, setInspectedEntry] = useState<VotingEntry | null>(null);
  const [moderationFeedback, setModerationFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchQuery, currentRoundId]);

  // Mutations
  const updateStatusMutation = useUpdateEntryStatus(currentRoundId);
  const deleteEntryMutation = useDeleteEntry(currentRoundId);

  // Selected entry pointers for statistical inspection
  const [selectedMomentsEntry, setSelectedMomentsEntry] = useState<string>(entries[0]?.id || '');
  const [selectedRaidEntry, setSelectedRaidEntry] = useState<string>(entries[0]?.id || '');

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

  const handleUpdateStatus = async (entryId: string, status: 'approved' | 'rejected' | 'flagged' | 'pending_review') => {
    try {
      await updateStatusMutation.mutateAsync({ entryId, status });
      setModerationFeedback(`Updated ${entryId} status to ${status}.`);
      if (inspectedEntry && inspectedEntry.id === entryId) {
        setInspectedEntry({ ...inspectedEntry, status });
      }
      setTimeout(() => setModerationFeedback(null), 3000);
    } catch (err: unknown) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm(`Delete proposal ${entryId}? This action is immediate.`)) return;
    try {
      await deleteEntryMutation.mutateAsync(entryId);
      if (inspectedEntry && inspectedEntry.id === entryId) {
        setInspectedEntry(null);
      }
      setModerationFeedback(`Deleted proposal ${entryId}.`);
      setTimeout(() => setModerationFeedback(null), 3000);
    } catch (err: unknown) {
      alert(`Failed to delete proposal: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Pre-calculate AI detection for all entries
  const aiDetectionMap = new Map<string, AiDetectionResult>();
  entries.forEach((e) => {
    aiDetectionMap.set(e.id, analyzeSyntheticContent(e.title, e.description || '', e.mediaUrl));
  });

  // Filtered entries for moderation table
  const filteredEntries = entries.filter((entry) => {
    const st = entry.status || 'approved';
    const aiResult = aiDetectionMap.get(entry.id);

    if (statusFilter === 'pending' && st !== 'pending' && st !== 'pending_review') return false;
    if (statusFilter === 'approved' && st !== 'approved') return false;
    if (statusFilter === 'flagged' && st !== 'flagged') return false;
    if (statusFilter === 'rejected' && st !== 'rejected') return false;
    if (statusFilter === 'ai_flagged' && !aiResult?.isFlagged) return false;

    if (categoryFilter !== 'all' && (entry.category || 'General') !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchSubmitter = (entry.submitterUsername || '').toLowerCase().includes(q);
      const matchId = entry.id.toLowerCase().includes(q);
      if (!matchTitle && !matchSubmitter && !matchId) return false;
    }

    return true;
  });

  const inspectedAiResult = inspectedEntry
    ? aiDetectionMap.get(inspectedEntry.id) || analyzeSyntheticContent(inspectedEntry.title, inspectedEntry.description || '', inspectedEntry.mediaUrl)
    : null;

  if (!isStaff(user?.role)) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
          Restricted Console
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          Sign in with an Administrator, Moderator, or Supervisor account to access moderation and diagnostics tools.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Console Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'moderation' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('moderation')}
          >
            Pitches
          </button>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'invariants' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('invariants')}
          >
            Invariants
          </button>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'telemetry' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('telemetry')}
          >
            Telemetry
          </button>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'network' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('network')}
          >
            Network
          </button>
          <button
            className={`btn btn-sm ${activeConsoleTab === 'pipeline' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('pipeline')}
          >
            Pipeline
          </button>
        </div>

        <span className="badge badge-engine">
          {(user?.role || 'supervisor').toUpperCase()} MODE
        </span>
      </div>

      {/* Sub-View 1: Moderation & Pitches */}
      {activeConsoleTab === 'moderation' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Supervisor Queue</div>
              <div className="card-desc">Review proposals, approval status, and manage voting rounds.</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {onOpenCreateRound && (
                <button className="btn btn-secondary btn-sm" onClick={onOpenCreateRound}>
                  + New Round
                </button>
              )}
              {onOpenCreatePitch && (
                <button className="btn btn-primary btn-sm" onClick={onOpenCreatePitch}>
                  + Submit Proposal
                </button>
              )}
            </div>
          </div>

          {moderationFeedback && (
            <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 700, marginBottom: 14 }}>
              {moderationFeedback}
            </div>
          )}

          {/* Round Selector */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Target Round:</span>
            <select
              value={currentRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="select"
              style={{ maxWidth: 300 }}
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.status})
                </option>
              ))}
            </select>
          </div>

          {/* Visual Moderation Category Distribution, Queue Health & AI Radar */}
          <SupervisorModerationChart
            entries={entries}
            selectedCategory={categoryFilter}
            onSelectCategory={(cat) => setCategoryFilter(cat)}
          />

          {/* Status Filter Tabs & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'pending', 'approved', 'flagged', 'rejected', 'ai_flagged'] as const).map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    fontSize: '11px',
                    textTransform: 'capitalize',
                    padding: '4px 10px',
                    color: st === 'ai_flagged' && statusFilter !== st ? '#ef4444' : undefined,
                  }}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'pending' ? 'Pending Review' : st === 'ai_flagged' ? 'AI Flagged' : st}
                </button>
              ))}
            </div>

            <div style={{ minWidth: 200, flex: '0 1 240px' }}>
              <input
                type="text"
                className="input-field"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Interactive Moderation Table with High-Volume Pagination */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
            const validPage = Math.min(currentPage, totalPages);
            const startIndex = (validPage - 1) * pageSize;
            const paginatedEntries = filteredEntries.slice(startIndex, startIndex + pageSize);

            return (
              <>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Proposal</th>
                        <th>Category</th>
                        <th>Submitter</th>
                        <th>AI Radar</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                            No proposals match current filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedEntries.map((entry) => {
                          const st = entry.status || 'approved';
                          const isApproved = st === 'approved';
                          const isPending = st === 'pending' || st === 'pending_review';
                          const isFlagged = st === 'flagged';
                          const isRejected = st === 'rejected';
                          const aiResult = aiDetectionMap.get(entry.id);

                          return (
                            <tr key={entry.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {entry.mediaUrl && (
                                    <img
                                      src={entry.mediaUrl}
                                      alt={entry.title}
                                      style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: '1px solid var(--border-subtle)' }}
                                    />
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                                      {entry.title}
                                    </div>
                                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      {entry.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-engine">{entry.category || 'General'}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                                  {entry.submitterUsername || 'Community Creator'}
                                </span>
                              </td>
                              <td>
                                {aiResult && (
                                  <span
                                    className="mono"
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '3px 8px',
                                      borderRadius: 4,
                                      background: aiResult.isFlagged ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                                      color: aiResult.isFlagged ? '#ef4444' : '#10b981',
                                      border: `1px solid ${aiResult.isFlagged ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                    }}
                                    title={aiResult.confidenceLabel}
                                  >
                                    {aiResult.aiProbability}% AI
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    isApproved
                                      ? 'badge-success'
                                      : isFlagged || isRejected
                                      ? 'badge-danger'
                                      : 'badge-engine'
                                  }`}
                                >
                                  {st.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '10px', padding: '3px 8px' }}
                                    onClick={() => setInspectedEntry(entry)}
                                  >
                                    Inspect
                                  </button>

                                  {isPending && (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '10px', padding: '3px 8px', background: '#10b981', borderColor: '#10b981' }}
                                      onClick={() => handleUpdateStatus(entry.id, 'approved')}
                                    >
                                      Approve
                                    </button>
                                  )}

                                  {!isFlagged && (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '10px', padding: '3px 8px', color: '#ef4444' }}
                                      onClick={() => handleUpdateStatus(entry.id, 'flagged')}
                                    >
                                      Flag
                                    </button>
                                  )}

                                  {(isFlagged || isRejected) && (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '10px', padding: '3px 8px', color: '#10b981' }}
                                      onClick={() => handleUpdateStatus(entry.id, 'approved')}
                                    >
                                      Reinstate
                                    </button>
                                  )}

                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '10px', padding: '3px 8px', color: '#ef4444' }}
                                    onClick={() => handleDeleteEntry(entry.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredEntries.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredEntries.length)} of {filteredEntries.length} proposals
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per page:</span>
                        <select
                          className="select-field"
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        disabled={validPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </button>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)', padding: '0 4px' }}>
                        Page {validPage} of {totalPages}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        disabled={validPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
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

            {/* Visual 6N Conservation Live Trajectory and Tutorial Graph */}
            <ConservationChart
              totalBallots={totalBallots}
              expectedPoints={expectedPoints}
              totalPointsAwarded={totalPointsAwarded}
              isConserved={isConserved}
              leaderboard={leaderboard}
              ballots={ballots}
            />
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

            <MomentsVarianceChart
              breakdown={currentBreakdown}
              totalBallots={totalBallots}
            />
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

          {/* Visual Shannon Entropy & Velocity Z-Score Anomaly Gauge with Live Graph on top, Outlier Radar, and Tutorial below */}
          <RaidTelemetryChart
            telemetry={targetRaidTelemetry}
            velocityZScore={observedVelocityZ}
            ballots={ballots}
            entries={entries}
            leaderboard={leaderboard}
            telemetryList={telemetryList}
            onSelectEntry={(id) => setSelectedRaidEntry(id)}
          />
        </div>
      )}

      {/* Sub-View 4: Live Network Telemetry */}
      {activeConsoleTab === 'network' && (
        <NetworkTelemetryChart roundId={currentRoundId} />
      )}

      {/* Sub-View 5: Pipeline Console Manager */}
      {activeConsoleTab === 'pipeline' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Pipeline</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444' }}
                onClick={() => {
                  if (window.confirm('Reset studio pipeline to Phase 1 Initial (0%)?')) {
                    pipeline.resetToZero();
                    setPipelineSavedNotice('Pipeline reset to Phase 1 (0%).');
                    setTimeout(() => setPipelineSavedNotice(null), 3000);
                  }
                }}
              >
                Reset Pipeline
              </button>
            </div>
          </div>

          {pipelineSavedNotice && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              {pipelineSavedNotice}
            </div>
          )}

          {/* Current State Summary Cards */}
          <div className="landing-metrics-grid" style={{ marginBottom: 18 }}>
            <div className="landing-metric-card">
              <div className="landing-metric-label">Phase</div>
              <div className="landing-metric-value mono" style={{ color: pipeline.currentBigStage.color }}>
                {pipeline.currentBigStage.phaseNumber}: {pipeline.currentBigStage.shortName}
              </div>
            </div>
            <div className="landing-metric-card">
              <div className="landing-metric-label">Step</div>
              <div className="landing-metric-value mono" style={{ fontSize: '15px' }}>
                {pipeline.currentSubStage.shortName}
              </div>
            </div>
            <div className="landing-metric-card">
              <div className="landing-metric-label">Progress</div>
              <div className="landing-metric-value mono text-green">
                {pipeline.percentage}%
              </div>
            </div>
            <div className="landing-metric-card">
              <div className="landing-metric-label">Supervisor</div>
              <div className="landing-metric-value mono" style={{ fontSize: '13px' }}>
                {pipeline.currentSubStage.supervisor}
              </div>
            </div>
          </div>

          {/* 4-Phase Roadmap Selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>
              Phases
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {pipeline.stages.map((stage, bIdx) => {
                const isActive = bIdx === pipeline.currentBigStageIndex;
                const isPast = bIdx < pipeline.currentBigStageIndex;

                return (
                  <div
                    key={stage.id}
                    onClick={() => pipeline.setStage(bIdx, 0)}
                    className="white-card"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${isActive ? stage.color : 'var(--border-subtle)'}`,
                      background: isActive ? stage.bgTint : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: stage.color,
                          textTransform: 'uppercase',
                        }}
                      >
                        Phase {stage.phaseNumber}
                      </span>
                      <span
                        className="badge"
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          background: isActive ? stage.color : isPast ? '#10b981' : 'var(--bg-card-muted)',
                          color: isActive || isPast ? '#ffffff' : 'var(--text-muted)',
                        }}
                      >
                        {isActive ? 'Active' : isPast ? 'Done' : 'Pending'}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {stage.name}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {stage.supervisors.join(', ')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {stage.subStages.length} Sub-Stages
                      </span>
                      <span className="mono" style={{ fontSize: '10px', color: 'var(--text-main)', fontWeight: 700 }}>
                        {stage.deliverables[0]?.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Phase Sub-Stages Sequential Selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>
              Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pipeline.currentBigStage.subStages.map((sub, sIdx) => {
                const isCurrentSub = sIdx === pipeline.currentSubStageIndex;
                const isPastSub = sIdx < pipeline.currentSubStageIndex;

                return (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: isCurrentSub ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card-muted)',
                      border: isCurrentSub ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: isCurrentSub ? '#10b981' : isPastSub ? '#059669' : 'var(--border-subtle)',
                          color: isCurrentSub || isPastSub ? '#ffffff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {sIdx + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isCurrentSub ? '#10b981' : 'var(--text-main)' }}>
                          {sub.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                          {sub.department} | Supervisor: {sub.supervisor}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: 2 }}>
                          {sub.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {sub.deliverable && (
                        <span className="badge badge-engine" style={{ fontSize: '10px' }}>
                          {sub.deliverable}
                        </span>
                      )}
                      {isCurrentSub ? (
                        <span className="badge badge-success" style={{ fontSize: '11px', padding: '4px 10px' }}>
                          Active Step
                        </span>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => pipeline.setStage(pipeline.currentBigStageIndex, sIdx)}
                        >
                          Set Active
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Percentage & Status Note Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Percentage Controls */}
            <div className="white-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
                Progress
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tempPercentage}
                    onChange={(e) => setTempPercentage(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span className="mono" style={{ fontSize: '14px', fontWeight: 800, width: 45, textAlign: 'right' }}>
                    {tempPercentage}%
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, fontSize: '11px' }}
                    onClick={() => {
                      pipeline.setPercentage(tempPercentage);
                      setPipelineSavedNotice(`Set custom progress to ${tempPercentage}%.`);
                      setTimeout(() => setPipelineSavedNotice(null), 3000);
                    }}
                  >
                    Apply Percentage
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px' }}
                    onClick={() => {
                      pipeline.setPercentage(null);
                      setPipelineSavedNotice('Reverted to auto-calculated percentage.');
                      setTimeout(() => setPipelineSavedNotice(null), 3000);
                    }}
                  >
                    Auto Calculate
                  </button>
                </div>
              </div>
            </div>

            {/* Status Note Controls */}
            <div className="white-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
                Note
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  className="input-field"
                  rows={2}
                  style={{ fontSize: '12px', resize: 'vertical' }}
                  value={tempStatusNote}
                  onChange={(e) => setTempStatusNote(e.target.value)}
                  placeholder="Enter supervisor production note..."
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start', fontSize: '11px' }}
                  onClick={() => {
                    pipeline.setStatusNote(tempStatusNote);
                    setPipelineSavedNotice('Updated supervisor status note.');
                    setTimeout(() => setPipelineSavedNotice(null), 3000);
                  }}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>

          {/* Deliverables Roster Table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>
              Deliverables
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Deliverable</th>
                    <th>Type</th>
                    <th>Primary Recipient</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pipeline.stages.flatMap((st, bIdx) =>
                    st.deliverables.map((del, dIdx) => {
                      const isPhasePast = bIdx < pipeline.currentBigStageIndex;
                      const isPhaseCurrent = bIdx === pipeline.currentBigStageIndex;
                      const status = isPhasePast ? 'completed' : isPhaseCurrent ? 'in_progress' : 'pending';

                      return (
                        <tr key={`${st.id}-${dIdx}`}>
                          <td className="mono" style={{ fontWeight: 700, color: st.color }}>
                            Phase {st.phaseNumber}: {st.shortName}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {del.name}
                          </td>
                          <td>
                            <span className="badge badge-light" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                              {del.type}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {bIdx === 0
                              ? 'Pre-Vis / Story'
                              : bIdx === 1
                              ? 'Art & Animation'
                              : bIdx === 2
                              ? 'Post-Production / Sound'
                              : 'Final Release'}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                status === 'completed'
                                  ? 'badge-success'
                                  : status === 'in_progress'
                                  ? 'badge-engine'
                                  : 'badge-light'
                              }`}
                              style={{ fontSize: '10px' }}
                            >
                              {status === 'completed'
                                ? 'Completed'
                                : status === 'in_progress'
                                ? 'In Progress'
                                : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Roadmap Department Hierarchy */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>
              Supervisors
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {[
                { title: 'Story Supervisor', color: '#94a3b8', roles: 'Writers, Script Editors, Community Feedback' },
                { title: 'Art Supervisor', color: '#60a5fa', roles: 'Concept Artists, Blueprints, Builders, 3D Modelers, Shading' },
                { title: 'Animation Supervisor', color: '#2dd4bf', roles: '2D Animators, Layout, Character Animators, FX, Lighters' },
                { title: 'Post Supervisor', color: '#c084fc', roles: 'Editorial, VFX Artists, Colorist, Final Master Assembly' },
                { title: 'Audio Supervisor', color: '#fb923c', roles: 'Voice Actor Director, Voice Actors, Sound Designers, Music Composers' },
              ].map((sup, idx) => (
                <div
                  key={idx}
                  className="white-card"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    borderLeft: `4px solid ${sup.color}`,
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {sup.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                    {sup.roles}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pitch Inspection Modal with AI Audit Breakdown */}
      {inspectedEntry && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setInspectedEntry(null)}
        >
          <div
            className="white-card"
            style={{
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div>
                <div className="card-title" style={{ fontSize: '16px' }}>
                  Proposal Inspection
                </div>
                <div className="card-desc">
                  Detailed metadata and AI content review.
                </div>
              </div>
              <button
                className="icon-btn"
                style={{ width: 30, height: 30 }}
                onClick={() => setInspectedEntry(null)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {inspectedEntry.mediaUrl && (
              <div style={{ marginBottom: 14, borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: 200, background: '#000' }}>
                <img
                  src={inspectedEntry.mediaUrl}
                  alt={inspectedEntry.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* AI Detection Audit Banner */}
            {inspectedAiResult && (
              <div
                style={{
                  background: inspectedAiResult.isFlagged ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${inspectedAiResult.isFlagged ? '#ef4444' : '#10b981'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: inspectedAiResult.isFlagged ? '#ef4444' : '#10b981' }}>
                    AI Detection: {inspectedAiResult.confidenceLabel}
                  </span>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Entropy={inspectedAiResult.metrics.vocabularyEntropy} | Burstiness={inspectedAiResult.metrics.sentenceBurstiness}
                  </span>
                </div>

                <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div
                    style={{
                      width: `${inspectedAiResult.aiProbability}%`,
                      height: '100%',
                      background: inspectedAiResult.isFlagged ? '#ef4444' : '#10b981',
                      borderRadius: 3,
                    }}
                  />
                </div>

                {(inspectedAiResult.textSignals.length > 0 || inspectedAiResult.mediaSignals.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, fontSize: '11px', color: 'var(--text-main)' }}>
                    {inspectedAiResult.textSignals.map((sig, sIdx) => (
                      <div key={sIdx}>- {sig}</div>
                    ))}
                    {inspectedAiResult.mediaSignals.map((sig, sIdx) => (
                      <div key={sIdx}>- {sig}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TITLE</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {inspectedEntry.title}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>DESCRIPTION</div>
                <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {inspectedEntry.description || 'No description provided.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>CATEGORY</div>
                  <span className="badge badge-engine">{inspectedEntry.category || 'General'}</span>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>SUBMITTER</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {inspectedEntry.submitterUsername || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444' }}
                onClick={() => handleDeleteEntry(inspectedEntry.id)}
              >
                Delete Proposal
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {inspectedEntry.status !== 'approved' && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                    onClick={() => handleUpdateStatus(inspectedEntry.id, 'approved')}
                  >
                    Approve (Human)
                  </button>
                )}
                {inspectedEntry.status !== 'flagged' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#ef4444' }}
                    onClick={() => handleUpdateStatus(inspectedEntry.id, 'flagged')}
                  >
                    Flag as AI
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInspectedEntry(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
