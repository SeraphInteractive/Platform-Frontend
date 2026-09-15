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
  useDeleteRound,
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
import { RolesManagementView } from './RolesManagementView.tsx';
import { NavTabId } from '../../components/Navbar.tsx';

interface DevWorkbenchProps {
  onOpenCreatePitch?: () => void;
  onOpenCreateRound?: () => void;
  onNavigateTab?: (tab: NavTabId) => void;
  onSelectEntryForVote?: (entryId: string) => void;
  defaultTab?: 'moderation' | 'invariants' | 'telemetry' | 'network' | 'roles';
}

export const DevWorkbench: React.FC<DevWorkbenchProps> = ({
  onOpenCreatePitch,
  onOpenCreateRound,
  defaultTab = 'moderation',
}) => {
  const { user } = useAuth();
  const [activeConsoleTab, setActiveConsoleTab] = useState<'moderation' | 'invariants' | 'telemetry' | 'network' | 'roles'>(defaultTab);

  const { data: rounds = [] } = useVotingRounds();
  const { activeRound } = useActiveRound();
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const currentRoundId = selectedRoundId || activeRound?.id || (rounds[0]?.id ?? '');

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
  const deleteRoundMutation = useDeleteRound();

  const handleDeleteRound = async (roundId: string) => {
    const roundToDelete = rounds.find((r) => r.id === roundId);
    const roundTitle = roundToDelete?.title || roundId;
    if (!window.confirm(`Are you sure you want to delete "${roundTitle}" and all its proposals?`)) {
      return;
    }
    try {
      await deleteRoundMutation.mutateAsync(roundId);
      setModerationFeedback(`Round "${roundTitle}" successfully deleted.`);
      setTimeout(() => setModerationFeedback(null), 4000);
      const remaining = rounds.filter((r) => r.id !== roundId);
      if (remaining.length > 0) {
        setSelectedRoundId(remaining[0]!.id);
      } else {
        setSelectedRoundId('');
      }
    } catch {
      setModerationFeedback('Failed to delete round.');
      setTimeout(() => setModerationFeedback(null), 4000);
    }
  };

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
  const observedVelocityZ = observedTelemetry?.velocityZScore ?? 0.0;
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
            className={`btn btn-sm ${activeConsoleTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveConsoleTab('roles')}
          >
            Roles
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
              <div className="card-title">Pitches</div>
              <div className="card-desc" style={{ fontStyle: 'italic' }}>Review candidate proposals, audit status, and manage voting rounds.</div>
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

          {/* Round Selector & Controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Target Round:</span>
            <select
              value={currentRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="select"
              style={{ maxWidth: 280 }}
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.status})
                </option>
              ))}
            </select>

            {rounds.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444', fontSize: '11px', padding: '4px 10px' }}
                onClick={() => handleDeleteRound(currentRoundId)}
                title="Delete this round and its proposals"
              >
                Delete Round
              </button>
            )}
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
              <div className="card-title">Conservation</div>
              <span className={`badge ${isConserved ? 'badge-success' : 'badge-danger'}`}>
                {isConserved ? 'Conserved' : 'Leak Detected'}
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
              <div className="card-title">Moments</div>
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
            <div className="card-title">Telemetry</div>
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

      {/* Sub-View 5: Roles & Staff Management */}
      {activeConsoleTab === 'roles' && (
        <RolesManagementView />
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
