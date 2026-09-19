import React, { useState, useMemo } from 'react';
import { useAuth, getDiscordAvatar } from '../../context/AuthContext.tsx';
import { useScrollDirection } from '../../hooks/useScrollDirection.ts';
import { usePipelineProgress } from '../../hooks/usePipelineProgress.ts';
import { NavTabId } from '../../components/Navbar.tsx';

export interface WinnerPlacement {
  rank: 1 | 2 | 3;
  title: string;
  creator: string;
  points: number;
}

export interface OrganicUpdate {
  id: string;
  updateNumber: number;
  title: string;
  date: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  tag: string;
  story: string;
  mediaUrl?: string;
  roundResults?: {
    roundTitle: string;
    totalBallots: number;
    totalPoints: number;
    placements: WinnerPlacement[];
  };
}

const STORAGE_KEY = 'mcs_organic_progress_updates_v2';

if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('mcs_organic_progress_updates_v1');
  } catch {}
}

function getStoredUpdates(): OrganicUpdate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface ProgressPageProps {
  onNavigateTab?: (tab: NavTabId) => void;
  onOpenCreateRound?: () => void;
}

const DEFAULT_CATEGORY_FILTERS = ['ALL', 'Writing', 'Pre-Vis', 'Production', 'Post-Production', 'Voting Results'];

export const ProgressPage: React.FC<ProgressPageProps> = () => {
  const { user } = useAuth();
  const isHeaderVisible = useScrollDirection();
  const pipeline = usePipelineProgress();

  const [updates, setUpdates] = useState<OrganicUpdate[]>(() => getStoredUpdates());
  const [activeTag, setActiveTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Flattened all 17 sub-stages across all 4 phases
  const allSubStages = useMemo(() => {
    const list: Array<{
      phaseIndex: number;
      subIndex: number;
      globalIndex: number;
      phaseNumber: number;
      phaseName: string;
      phaseColor: string;
      id: string;
      name: string;
      shortName: string;
      department: string;
      supervisor: string;
      description: string;
      deliverable?: string;
      pctPosition: number;
    }> = [];

    let gIdx = 0;
    const total = 17;
    pipeline.stages.forEach((stage, pIdx) => {
      stage.subStages.forEach((sub, sIdx) => {
        list.push({
          phaseIndex: pIdx,
          subIndex: sIdx,
          globalIndex: gIdx,
          phaseNumber: stage.phaseNumber,
          phaseName: stage.name,
          phaseColor: stage.color,
          id: sub.id,
          name: sub.name,
          shortName: sub.shortName,
          department: sub.department,
          supervisor: sub.supervisor,
          description: sub.description,
          deliverable: sub.deliverable,
          pctPosition: (gIdx / (total - 1)) * 100,
        });
        gIdx++;
      });
    });
    return list;
  }, [pipeline.stages]);

  const activeGlobalIndex = useMemo(() => {
    let count = 0;
    for (let p = 0; p < pipeline.currentBigStageIndex; p++) {
      count += pipeline.stages[p].subStages.length;
    }
    return count + pipeline.currentSubStageIndex;
  }, [pipeline.currentBigStageIndex, pipeline.currentSubStageIndex, pipeline.stages]);

  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number>(activeGlobalIndex);
  const [hoveredMilestoneIndex, setHoveredMilestoneIndex] = useState<number | null>(null);

  const activeMilestone = allSubStages[selectedMilestoneIndex] || allSubStages[activeGlobalIndex] || allSubStages[0];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<OrganicUpdate | null>(null);

  // Form inputs
  const [formNumber, setFormNumber] = useState<number>(updates.length + 1);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthorName, setFormAuthorName] = useState(user?.discordUsername || 'Director');
  const [formAuthorRole, setFormAuthorRole] = useState('Supervisor');
  const [formTag, setFormTag] = useState('Production');
  const [formStory, setFormStory] = useState('');
  const [formMediaUrl, setFormMediaUrl] = useState('');

  // Results inputs
  const [hasResults, setHasResults] = useState(false);
  const [resRoundTitle, setResRoundTitle] = useState('');
  const [resBallots, setResBallots] = useState('');
  const [resPoints, setResPoints] = useState('');
  const [r1Title, setR1Title] = useState('');
  const [r1Creator, setR1Creator] = useState('');
  const [r1Points, setR1Points] = useState('');
  const [r2Title, setR2Title] = useState('');
  const [r2Creator, setR2Creator] = useState('');
  const [r2Points, setR2Points] = useState('');
  const [r3Title, setR3Title] = useState('');
  const [r3Creator, setR3Creator] = useState('');
  const [r3Points, setR3Points] = useState('');

  const saveUpdates = (newUpdates: OrganicUpdate[]) => {
    setUpdates(newUpdates);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUpdates));
    } catch {}
  };

  const openCreateModal = () => {
    setEditingUpdate(null);
    const maxNum = updates.reduce((max, u) => Math.max(max, u.updateNumber), 0);
    setFormNumber(maxNum + 1);
    setFormTitle('');
    setFormAuthorName(user?.discordUsername || 'Supervisor');
    setFormAuthorRole(user?.role === 'admin' ? 'Lead' : 'Supervisor');
    setFormTag('Production');
    setFormStory('');
    setFormMediaUrl('');
    setHasResults(false);
    setResRoundTitle('');
    setResBallots('');
    setResPoints('');
    setR1Title('');
    setR1Creator('');
    setR1Points('');
    setR2Title('');
    setR2Creator('');
    setR2Points('');
    setR3Title('');
    setR3Creator('');
    setR3Points('');
    setIsModalOpen(true);
  };

  const openEditModal = (upd: OrganicUpdate) => {
    setEditingUpdate(upd);
    setFormNumber(upd.updateNumber);
    setFormTitle(upd.title);
    setFormAuthorName(upd.authorName);
    setFormAuthorRole(upd.authorRole);
    setFormTag(upd.tag);
    setFormStory(upd.story);
    setFormMediaUrl(upd.mediaUrl || '');

    if (upd.roundResults) {
      setHasResults(true);
      setResRoundTitle(upd.roundResults.roundTitle);
      setResBallots(String(upd.roundResults.totalBallots));
      setResPoints(String(upd.roundResults.totalPoints));
      const p1 = upd.roundResults.placements.find((p) => p.rank === 1);
      const p2 = upd.roundResults.placements.find((p) => p.rank === 2);
      const p3 = upd.roundResults.placements.find((p) => p.rank === 3);
      setR1Title(p1?.title || '');
      setR1Creator(p1?.creator || '');
      setR1Points(p1 ? String(p1.points) : '');
      setR2Title(p2?.title || '');
      setR2Creator(p2?.creator || '');
      setR2Points(p2 ? String(p2.points) : '');
      setR3Title(p3?.title || '');
      setR3Creator(p3?.creator || '');
      setR3Points(p3 ? String(p3.points) : '');
    } else {
      setHasResults(false);
      setResRoundTitle('');
      setResBallots('');
      setResPoints('');
      setR1Title('');
      setR1Creator('');
      setR1Points('');
      setR2Title('');
      setR2Creator('');
      setR2Points('');
      setR3Title('');
      setR3Creator('');
      setR3Points('');
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this update from ledger?')) {
      const filtered = updates.filter((u) => u.id !== id);
      saveUpdates(filtered);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStory.trim()) {
      alert('Title and Story are required.');
      return;
    }

    let resultsData: OrganicUpdate['roundResults'] | undefined = undefined;
    if (hasResults && resRoundTitle.trim()) {
      const placements: WinnerPlacement[] = [];
      if (r1Title.trim()) placements.push({ rank: 1, title: r1Title.trim(), creator: r1Creator.trim() || 'Community Creator', points: Number(r1Points) || 0 });
      if (r2Title.trim()) placements.push({ rank: 2, title: r2Title.trim(), creator: r2Creator.trim() || 'Community Creator', points: Number(r2Points) || 0 });
      if (r3Title.trim()) placements.push({ rank: 3, title: r3Title.trim(), creator: r3Creator.trim() || 'Community Creator', points: Number(r3Points) || 0 });
      resultsData = {
        roundTitle: resRoundTitle.trim(),
        totalBallots: Number(resBallots) || 0,
        totalPoints: Number(resPoints) || 0,
        placements,
      };
    }

    const newRecord: OrganicUpdate = {
      id: editingUpdate ? editingUpdate.id : `upd-${Date.now()}`,
      updateNumber: Number(formNumber) || updates.length + 1,
      title: formTitle.trim(),
      date: editingUpdate ? editingUpdate.date : new Date().toISOString().split('T')[0],
      authorName: formAuthorName.trim() || 'Supervisor',
      authorRole: formAuthorRole.trim() || 'Lead',
      authorAvatar: user ? getDiscordAvatar(user) : editingUpdate?.authorAvatar || 'https://cdn.discordapp.com/embed/avatars/1.png',
      tag: formTag.trim() || 'General',
      story: formStory.trim(),
      mediaUrl: formMediaUrl.trim() || undefined,
      roundResults: resultsData,
    };

    let updated: OrganicUpdate[];
    if (editingUpdate) {
      updated = updates.map((u) => (u.id === editingUpdate.id ? newRecord : u));
    } else {
      updated = [newRecord, ...updates];
    }
    updated.sort((a, b) => b.updateNumber - a.updateNumber);

    saveUpdates(updated);
    setIsModalOpen(false);
  };

  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      const matchTag =
        activeTag === 'ALL' ||
        u.tag.toLowerCase() === activeTag.toLowerCase() ||
        (activeTag === 'Voting Results' && !!u.roundResults);
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        u.title.toLowerCase().includes(q) ||
        u.story.toLowerCase().includes(q) ||
        u.authorName.toLowerCase().includes(q) ||
        u.tag.toLowerCase().includes(q) ||
        String(u.updateNumber).includes(q);
      return matchTag && matchQuery;
    });
  }, [updates, activeTag, searchQuery]);

  const allTags = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORY_FILTERS);
    updates.forEach((u) => {
      if (u.tag) set.add(u.tag);
    });
    return Array.from(set);
  }, [updates]);

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 64 }}>
      {/* 1. Header Banner */}
      <div
        className={`card scroll-header-banner ${isHeaderVisible ? 'banner-visible' : 'banner-hidden'}`}
        style={{
          padding: '22px 30px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
          Progress
        </h1>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: '10px',
              background: `${pipeline.currentBigStage.color}18`,
              border: `1px solid ${pipeline.currentBigStage.color}40`,
              color: pipeline.currentBigStage.color,
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            Phase {pipeline.currentBigStage.phaseNumber}: {pipeline.currentBigStage.shortName}
          </div>

          <div
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            {pipeline.percentage}% Complete
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              fontSize: '12px',
              borderRadius: '10px',
              fontWeight: 800,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Post Update</span>
          </button>
        </div>
      </div>

      {/* 2. Pipeline Roadmap */}
      <section
        className="card"
        style={{
          padding: '30px 32px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Pipeline
          </div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Updated {pipeline.lastUpdated}
          </span>
        </div>

        {/* 4 Phase Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {pipeline.stages.map((stage, pIdx) => {
            const isPhaseActive = stage.phaseNumber === pipeline.currentBigStage.phaseNumber;
            const isPhaseDone = stage.phaseNumber < pipeline.currentBigStage.phaseNumber;
            const isSelected = activeMilestone.phaseIndex === pIdx;

            return (
              <div
                key={stage.id}
                onClick={() => {
                  const firstStep = allSubStages.find((s) => s.phaseIndex === pIdx);
                  if (firstStep) setSelectedMilestoneIndex(firstStep.globalIndex);
                }}
                style={{
                  cursor: 'pointer',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: isPhaseActive
                    ? `${stage.color}15`
                    : isSelected
                    ? 'var(--bg-card-hover)'
                    : 'var(--bg-card-muted)',
                  border: isPhaseActive
                    ? `1px solid ${stage.color}60`
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stage.color, opacity: isPhaseActive || isPhaseDone ? 1 : 0.4 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: stage.color, textTransform: 'uppercase' }}>
                    Phase {stage.phaseNumber}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '5px',
                      fontWeight: 800,
                      background: isPhaseActive ? stage.color : isPhaseDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      color: isPhaseActive ? '#ffffff' : isPhaseDone ? '#34d399' : 'var(--text-muted)',
                    }}
                  >
                    {isPhaseActive ? 'Active' : isPhaseDone ? 'Done' : 'Upcoming'}
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                  {stage.name}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {stage.supervisors[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* 17-Milestone Slider Rail */}
        <div style={{ position: 'relative', margin: '20px 6px 6px 6px', padding: '20px 4px 10px 4px' }}>
          {/* Active Pin */}
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(2, Math.min(98, pipeline.percentage))}%`,
              top: -6,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 20,
              pointerEvents: 'none',
              transition: 'left 0.4s ease',
            }}
          >
            <div
              className="mono"
              style={{
                background: '#10b981',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              {pipeline.percentage}% ACTIVE
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid #10b981' }} />
          </div>

          {/* Rail Track */}
          <div
            style={{
              position: 'relative',
              height: 8,
              background: 'var(--bg-card-muted)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${Math.max(0, Math.min(100, pipeline.percentage))}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 40%, #eab308 75%, #a855f7 100%)',
                borderRadius: 4,
                zIndex: 2,
                transition: 'width 0.4s ease',
              }}
            />

            {allSubStages.map((sub) => {
              const isSubDone = sub.globalIndex < activeGlobalIndex;
              const isSubActive = sub.globalIndex === activeGlobalIndex;
              const isInspected = selectedMilestoneIndex === sub.globalIndex;
              const isHovered = hoveredMilestoneIndex === sub.globalIndex;
              const stepNumber = sub.globalIndex + 1;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onMouseEnter={() => setHoveredMilestoneIndex(sub.globalIndex)}
                  onMouseLeave={() => setHoveredMilestoneIndex(null)}
                  onClick={() => setSelectedMilestoneIndex(sub.globalIndex)}
                  title={`${stepNumber}. ${sub.name}`}
                  style={{
                    position: 'absolute',
                    left: `${sub.pctPosition}%`,
                    top: '50%',
                    transform: `translate(-50%, -50%) ${isHovered || isInspected ? 'scale(1.2)' : 'scale(1)'}`,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isSubActive
                      ? '#10b981'
                      : isSubDone
                      ? 'rgba(16, 185, 129, 0.25)'
                      : isInspected
                      ? 'var(--bg-card-hover)'
                      : 'var(--bg-card)',
                    color: isSubActive
                      ? '#ffffff'
                      : isSubDone
                      ? '#34d399'
                      : isInspected
                      ? 'var(--text-main)'
                      : 'var(--text-muted)',
                    border: isSubActive
                      ? '2px solid #ffffff'
                      : isInspected
                      ? `2px solid ${sub.phaseColor}`
                      : isSubDone
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isSubDone ? '11px' : '10px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    zIndex: isSubActive ? 15 : 10,
                    transition: 'all 0.15s ease',
                    padding: 0,
                  }}
                >
                  {isSubDone ? '✓' : stepNumber}
                </button>
              );
            })}
          </div>

          {/* Hover Tooltip */}
          {hoveredMilestoneIndex !== null && hoveredMilestoneIndex !== selectedMilestoneIndex && (() => {
            const step = allSubStages[hoveredMilestoneIndex];
            if (!step) return null;
            return (
              <div
                style={{
                  position: 'absolute',
                  bottom: 34,
                  left: `${step.pctPosition}%`,
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-card)',
                  border: `1px solid ${step.phaseColor}55`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                  zIndex: 60,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: step.phaseColor }}>
                  Phase {step.phaseNumber} • Step {step.globalIndex + 1}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {step.name}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Selected Milestone Box */}
        <div
          style={{
            background: 'var(--bg-card-muted)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge mono" style={{ fontSize: '10px', padding: '2px 7px', background: `${activeMilestone.phaseColor}20`, color: activeMilestone.phaseColor }}>
                Step {activeMilestone.globalIndex + 1} of 17 • Phase {activeMilestone.phaseNumber}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                {activeMilestone.name}
              </span>
              {activeMilestone.deliverable && (
                <span className="badge" style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
                  {activeMilestone.deliverable}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {activeMilestone.department} • Supervisor: {activeMilestone.supervisor}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={activeMilestone.globalIndex === 0}
              onClick={() => setSelectedMilestoneIndex(Math.max(0, activeMilestone.globalIndex - 1))}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              ← Prev
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={activeMilestone.globalIndex === allSubStages.length - 1}
              onClick={() => setSelectedMilestoneIndex(Math.min(allSubStages.length - 1, activeMilestone.globalIndex + 1))}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* 3. Ledger Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Ledger
            </h2>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-card-muted)', padding: '2px 7px', borderRadius: '5px' }}>
              {filteredUpdates.length}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {allTags.map((tag) => {
              const isSelected = activeTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '7px' }}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: 240, display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: 32, paddingRight: 10, fontSize: '12px', height: 34, borderRadius: '7px' }}
            />
          </div>
        </div>

        {/* Updates List / Empty State */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredUpdates.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              {updates.length === 0 ? 'No production updates recorded yet in ledger.' : 'No updates matching search.'}
            </div>
          ) : (
            filteredUpdates.map((upd) => (
              <article
                key={upd.id}
                className="card"
                style={{
                  padding: '24px 28px',
                  background: 'var(--bg-card)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '3px 8px', borderRadius: '5px' }}>
                      #{String(upd.updateNumber).padStart(2, '0')}
                    </span>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '10px' }}>
                      {upd.tag}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{upd.authorName}</strong> ({upd.authorRole}) • {upd.date}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '2px 7px', fontSize: '10px' }} onClick={() => openEditModal(upd)}>
                        Edit
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '2px 7px', fontSize: '10px', color: 'var(--color-danger)' }} onClick={() => handleDelete(upd.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  {upd.title}
                </h3>

                <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-main)', opacity: 0.95, whiteSpace: 'pre-line' }}>
                  {upd.story}
                </div>

                {upd.mediaUrl && (
                  <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#000000', maxHeight: 380 }}>
                    <img src={upd.mediaUrl} alt={upd.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}

                {upd.roundResults && (
                  <div style={{ background: 'var(--bg-card-muted)', borderRadius: '10px', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)' }}>
                        {upd.roundResults.roundTitle} (Results)
                      </div>
                      <span className="mono" style={{ fontSize: '11px', color: '#34d399', fontWeight: 800 }}>
                        {upd.roundResults.totalPoints} pts
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {upd.roundResults.placements.map((p) => (
                        <div key={p.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px' }}>
                            <span className="mono" style={{ fontWeight: 900, color: p.rank === 1 ? '#f59e0b' : p.rank === 2 ? '#94a3b8' : '#d97706' }}>
                              #{p.rank}
                            </span>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{p.title}</span>
                            <span style={{ color: 'var(--text-muted)' }}>by {p.creator}</span>
                          </div>
                          <span className="mono" style={{ fontWeight: 800, color: '#34d399', fontSize: '12px' }}>
                            {p.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      {/* 4. Post / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '24px',
            }}
          >
            <div className="card-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ fontSize: '18px', fontWeight: 900 }}>
                {editingUpdate ? 'Edit Update' : 'Post Update'}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)} style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>#</label>
                  <input type="number" value={formNumber} onChange={(e) => setFormNumber(Number(e.target.value))} className="input" required />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title</label>
                  <input type="text" placeholder="Headline" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Author</label>
                  <input type="text" value={formAuthorName} onChange={(e) => setFormAuthorName(e.target.value)} className="input" required />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Role</label>
                  <input type="text" value={formAuthorRole} onChange={(e) => setFormAuthorRole(e.target.value)} className="input" required />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tag</label>
                  <input type="text" value={formTag} onChange={(e) => setFormTag(e.target.value)} className="input" required />
                </div>
              </div>

              <div>
                <label className="label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Story</label>
                <textarea rows={4} placeholder="Describe recent production updates..." value={formStory} onChange={(e) => setFormStory(e.target.value)} className="textarea" required />
              </div>

              <div>
                <label className="label" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Media Image URL (Optional)</label>
                <input type="text" placeholder="/images/scaffold/artstation_cover.jpg" value={formMediaUrl} onChange={(e) => setFormMediaUrl(e.target.value)} className="input" />
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                  <input type="checkbox" checked={hasResults} onChange={(e) => setHasResults(e.target.checked)} />
                  <span>Attach Voting Round Winners</span>
                </label>

                {hasResults && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, padding: 12, background: 'var(--bg-card-muted)', borderRadius: 8 }}>
                    <input type="text" placeholder="Round Title" value={resRoundTitle} onChange={(e) => setResRoundTitle(e.target.value)} className="input" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input type="number" placeholder="Ballots" value={resBallots} onChange={(e) => setResBallots(e.target.value)} className="input" />
                      <input type="number" placeholder="Points" value={resPoints} onChange={(e) => setResPoints(e.target.value)} className="input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 6 }}>
                      <input type="text" placeholder="1st Title" value={r1Title} onChange={(e) => setR1Title(e.target.value)} className="input" />
                      <input type="text" placeholder="1st Creator" value={r1Creator} onChange={(e) => setR1Creator(e.target.value)} className="input" />
                      <input type="number" placeholder="Pts" value={r1Points} onChange={(e) => setR1Points(e.target.value)} className="input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 6 }}>
                      <input type="text" placeholder="2nd Title" value={r2Title} onChange={(e) => setR2Title(e.target.value)} className="input" />
                      <input type="text" placeholder="2nd Creator" value={r2Creator} onChange={(e) => setR2Creator(e.target.value)} className="input" />
                      <input type="number" placeholder="Pts" value={r2Points} onChange={(e) => setR2Points(e.target.value)} className="input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 6 }}>
                      <input type="text" placeholder="3rd Title" value={r3Title} onChange={(e) => setR3Title(e.target.value)} className="input" />
                      <input type="text" placeholder="3rd Creator" value={r3Creator} onChange={(e) => setR3Creator(e.target.value)} className="input" />
                      <input type="number" placeholder="Pts" value={r3Points} onChange={(e) => setR3Points(e.target.value)} className="input" />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingUpdate ? 'Save' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
