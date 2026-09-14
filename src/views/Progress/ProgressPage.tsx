import React, { useState, useEffect, useMemo } from 'react';
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

const STORAGE_KEY = 'mcs_organic_progress_updates_v1';

const INITIAL_UPDATES: OrganicUpdate[] = [
  {
    id: 'upd-003',
    updateNumber: 3,
    title: 'Voice Stems Arrived & Cave Scene Blockout',
    date: '2026-09-14',
    authorName: 'Alex',
    authorRole: 'Production Director',
    authorAvatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
    tag: 'Animation',
    story: 'We just received the first round of community scratch voice stems for Act 1 Scene 3. The pacing feels remarkably punchy. The layout team has moved past initial animatic timing and is currently blocking camera lenses for the Deep Dark sequence. Lighting passes with the approved custom cel-shader profiles are looking incredible.',
    mediaUrl: '/images/stock_01.jpg',
  },
  {
    id: 'upd-002',
    updateNumber: 2,
    title: 'Round 1 Verdict & Shader Benchmarks',
    date: '2026-09-13',
    authorName: 'Steve',
    authorRole: 'Technical Art Lead',
    authorAvatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
    tag: 'Voting Results',
    story: 'Voting for Round 1 has officially concluded with 348 verified ballots and 2,088 total conserved points. Cel Shaded Anime took 1st place for open daylight scenes, while Dark Moody Cinematic PBR secured 2nd place for underground sequences. The engine team is already running test renders combining both styles across biome transitions.',
    mediaUrl: '/images/stock_02.jpg',
    roundResults: {
      roundTitle: 'Round 1: Art Direction & Style',
      totalBallots: 348,
      totalPoints: 2088,
      placements: [
        { rank: 1, title: 'Cel Shaded Anime', creator: 'AlexCraft', points: 412 },
        { rank: 2, title: 'Dark Moody Cinematic PBR', creator: 'ShadowArtist', points: 298 },
        { rank: 3, title: 'Stylized Painterly Clay', creator: 'ClaySculptor', points: 215 },
      ],
    },
  },
  {
    id: 'upd-001',
    updateNumber: 1,
    title: 'Studio Pipeline Kickoff & Story Outline',
    date: '2026-09-11',
    authorName: 'Alex',
    authorRole: 'Production Director',
    authorAvatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
    tag: 'Milestone',
    story: 'Welcome to the production ledger. Our goal is to build an animated short film with verified community direction at every milestone. The 3-2-1 Borda count voting architecture is online, asset pipelines in Blender are established, and script development for the three core narrative arcs is complete.',
    mediaUrl: '/textures/crying_obsidian.png',
  },
];

function getStoredUpdates(): OrganicUpdate[] {
  if (typeof window === 'undefined') return INITIAL_UPDATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_UPDATES));
      return INITIAL_UPDATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_UPDATES;
  } catch {
    return INITIAL_UPDATES;
  }
}

interface ProgressPageProps {
  onNavigateTab?: (tab: NavTabId) => void;
  onOpenCreateRound?: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = () => {
  const { user } = useAuth();
  const isHeaderVisible = useScrollDirection();
  const pipeline = usePipelineProgress();

  const [updates, setUpdates] = useState<OrganicUpdate[]>(() => getStoredUpdates());
  const [activeTag, setActiveTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Flattened all 17 sub-stages across all 4 phases for the pointed and subpointed slider
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

  // Calculate current active global index
  const activeGlobalIndex = useMemo(() => {
    let count = 0;
    for (let p = 0; p < pipeline.currentBigStageIndex; p++) {
      count += pipeline.stages[p].subStages.length;
    }
    return count + pipeline.currentSubStageIndex;
  }, [pipeline.currentBigStageIndex, pipeline.currentSubStageIndex, pipeline.stages]);

  const [inspectedGlobalIndex, setInspectedGlobalIndex] = useState<number>(activeGlobalIndex);

  useEffect(() => {
    setInspectedGlobalIndex(activeGlobalIndex);
  }, [activeGlobalIndex]);

  const displayedStep = allSubStages[inspectedGlobalIndex] || allSubStages[0];

  // Major phase anchor points along the slider track (0%, ~18.75%, ~43.75%, ~75%, 100%)
  const majorPhaseNodes = useMemo(() => [
    { phaseNumber: 1, name: 'Writing', shortName: 'Writing', color: '#94a3b8', pct: 0, firstStepIndex: 0 },
    { phaseNumber: 2, name: 'Pre-Vis', shortName: 'Pre-Vis', color: '#3b82f6', pct: (3 / 16) * 100, firstStepIndex: 3 },
    { phaseNumber: 3, name: 'Production', shortName: 'Production', color: '#eab308', pct: (7 / 16) * 100, firstStepIndex: 7 },
    { phaseNumber: 4, name: 'Post-Production', shortName: 'Post-Prod', color: '#a855f7', pct: (12 / 16) * 100, firstStepIndex: 12 },
  ], []);

  // Modal State for new / editing updates
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

  // Optional results inputs
  const [hasResults, setHasResults] = useState(false);
  const [resRoundTitle, setResRoundTitle] = useState('');
  const [resBallots, setResBallots] = useState('42');
  const [resPoints, setResPoints] = useState('252');
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
    setFormAuthorRole(user?.role === 'admin' ? 'Production Lead' : 'Supervisor');
    setFormTag('Production');
    setFormStory('');
    setFormMediaUrl('');
    setHasResults(false);
    setResRoundTitle('');
    setResBallots('42');
    setResPoints('252');
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
      setResBallots('42');
      setResPoints('252');
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
    if (window.confirm('Delete this update entry?')) {
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
      if (r1Title.trim()) {
        placements.push({ rank: 1, title: r1Title.trim(), creator: r1Creator.trim() || 'Community Creator', points: Number(r1Points) || 0 });
      }
      if (r2Title.trim()) {
        placements.push({ rank: 2, title: r2Title.trim(), creator: r2Creator.trim() || 'Community Creator', points: Number(r2Points) || 0 });
      }
      if (r3Title.trim()) {
        placements.push({ rank: 3, title: r3Title.trim(), creator: r3Creator.trim() || 'Community Creator', points: Number(r3Points) || 0 });
      }
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
    // Sort descending by update number
    updated.sort((a, b) => b.updateNumber - a.updateNumber);

    saveUpdates(updated);
    setIsModalOpen(false);
  };

  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      const matchTag = activeTag === 'ALL' || u.tag.toLowerCase() === activeTag.toLowerCase();
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
    const set = new Set<string>();
    updates.forEach((u) => set.add(u.tag));
    return ['ALL', ...Array.from(set)];
  }, [updates]);

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Header Banner */}
      <div
        className={`card scroll-header-banner ${isHeaderVisible ? 'banner-visible' : 'banner-hidden'}`}
        style={{ padding: '28px 36px', background: 'var(--bg-card)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Roadmap v20
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', margin: 0 }}>
              Progress
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              className="badge"
              style={{
                background: pipeline.currentBigStage.color,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                padding: '6px 14px',
              }}
            >
              Phase {pipeline.currentBigStage.phaseNumber}: {pipeline.currentBigStage.shortName}
            </span>
            <span className="badge badge-success mono" style={{ fontSize: '12px', padding: '6px 14px' }}>
              {pipeline.percentage}% Complete
            </span>
            <button className="btn btn-primary btn-sm" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '12px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Post Update</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pointed and Subpointed Timeline Slider */}
      <div className="card" style={{ padding: '36px 40px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Timeline
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2, letterSpacing: '-0.02em' }}>
              Pipeline
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Updated {pipeline.lastUpdated}
            </span>
          </div>
        </div>

        {/* Phase Color Segment Span Labels above Track */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '3fr 4fr 5fr 5fr',
            gap: 8,
            marginBottom: 32,
            padding: '0 4px',
          }}
        >
          {pipeline.stages.map((stage) => {
            const isPhaseActive = stage.phaseNumber === pipeline.currentBigStage.phaseNumber;
            const isPhaseDone = stage.phaseNumber < pipeline.currentBigStage.phaseNumber;

            return (
              <div
                key={stage.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  borderTop: `4px solid ${stage.color}`,
                  paddingTop: 8,
                  opacity: isPhaseActive || isPhaseDone ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: stage.color, textTransform: 'uppercase' }}>
                    Phase {stage.phaseNumber}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '9px',
                      padding: '1px 6px',
                      background: isPhaseActive ? stage.color : isPhaseDone ? '#10b981' : 'var(--bg-card-muted)',
                      color: isPhaseActive || isPhaseDone ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    {isPhaseActive ? 'Active' : isPhaseDone ? 'Done' : 'Upcoming'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {stage.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {stage.supervisors[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pointed and Subpointed Continuous Slider Track */}
        <div style={{ position: 'relative', margin: '40px 16px 44px 16px', height: 48, display: 'flex', alignItems: 'center' }}>
          {/* Background Rail Bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 10,
              background: 'var(--bg-card-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 5,
              zIndex: 1,
            }}
          />

          {/* Filled Progress Bar from 0% */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: `${Math.max(0, Math.min(100, pipeline.percentage))}%`,
              height: 10,
              background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #eab308 80%, #a855f7 100%)',
              borderRadius: 5,
              zIndex: 2,
              transition: 'width 0.4s ease',
            }}
          />

          {/* 17 Subpoints (Milestone Ticks) along the track */}
          {allSubStages.map((sub) => {
            const isSubDone = sub.globalIndex < activeGlobalIndex;
            const isSubActive = sub.globalIndex === activeGlobalIndex;
            const isInspected = sub.globalIndex === inspectedGlobalIndex;

            return (
              <div
                key={sub.id}
                onClick={() => setInspectedGlobalIndex(sub.globalIndex)}
                title={`Step ${sub.globalIndex + 1}: ${sub.name}`}
                style={{
                  position: 'absolute',
                  left: `${sub.pctPosition}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isSubActive ? 18 : isInspected ? 16 : 12,
                  height: isSubActive ? 18 : isInspected ? 16 : 12,
                  borderRadius: '50%',
                  background: isSubActive
                    ? '#ffffff'
                    : isSubDone
                    ? '#10b981'
                    : 'var(--bg-card)',
                  border: isSubActive
                    ? '3px solid #10b981'
                    : isInspected
                    ? `3px solid ${sub.phaseColor}`
                    : isSubDone
                    ? '2px solid #10b981'
                    : '2px solid var(--border-strong)',
                  boxShadow: isSubActive
                    ? '0 0 12px rgba(16, 185, 129, 0.8)'
                    : isInspected
                    ? `0 0 8px ${sub.phaseColor}`
                    : 'none',
                  zIndex: isSubActive ? 10 : isInspected ? 9 : 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            );
          })}

          {/* Major Phase Anchor Nodes */}
          {majorPhaseNodes.map((node) => {
            const isNodePassed = node.firstStepIndex <= activeGlobalIndex;
            const isNodeActive = node.phaseNumber === pipeline.currentBigStage.phaseNumber;

            return (
              <div
                key={node.phaseNumber}
                onClick={() => setInspectedGlobalIndex(node.firstStepIndex)}
                style={{
                  position: 'absolute',
                  left: `${node.pct}%`,
                  top: -24,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 8,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isNodeActive
                      ? node.color
                      : isNodePassed
                      ? '#10b981'
                      : 'var(--bg-card)',
                    border: isNodeActive
                      ? '2px solid #ffffff'
                      : isNodePassed
                      ? '2px solid #10b981'
                      : `2px solid ${node.color}`,
                    color: isNodeActive || isNodePassed ? '#ffffff' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    boxShadow: isNodeActive ? `0 0 10px ${node.color}` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {node.phaseNumber}
                </div>
              </div>
            );
          })}

          {/* Pointed Indicator Pin sitting at pipeline.percentage% (at 0% by default) */}
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(0, Math.min(100, pipeline.percentage))}%`,
              bottom: 24,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 12,
              pointerEvents: 'none',
              transition: 'left 0.4s ease',
            }}
          >
            {/* Pointer Badge */}
            <div
              style={{
                background: '#10b981',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 900,
                padding: '3px 8px',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}
            >
              {pipeline.percentage}% ACTIVE
            </div>
            {/* Downward Pointing Needle */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #10b981',
              }}
            />
          </div>
        </div>

        {/* Big Typography Active / Inspected Milestone Showcase */}
        <div
          style={{
            background: 'var(--bg-card-muted)',
            border: `1px solid ${displayedStep.phaseColor}`,
            borderLeft: `6px solid ${displayedStep.phaseColor}`,
            borderRadius: '16px',
            padding: '24px 28px',
            display: 'grid',
            gridTemplateColumns: '120px 1fr auto',
            alignItems: 'center',
            gap: 24,
            marginBottom: 20,
          }}
        >
          {/* Big Progress Number */}
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', paddingRight: 16 }}>
            <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--accent-green)', lineHeight: 1 }}>
              {pipeline.percentage}%
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>
              Progress
            </div>
          </div>

          {/* Milestone Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: displayedStep.phaseColor, textTransform: 'uppercase' }}>
                Phase {displayedStep.phaseNumber}: {displayedStep.phaseName}
              </span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step {displayedStep.globalIndex + 1} of 17
              </span>
            </div>

            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              {displayedStep.name}
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 2 }}>
              {displayedStep.department} | Supervisor: <strong style={{ color: 'var(--text-main)' }}>{displayedStep.supervisor}</strong>
            </div>

            <div style={{ fontSize: '15px', color: 'var(--text-main)', marginTop: 8, lineHeight: 1.5 }}>
              {displayedStep.description}
            </div>
          </div>

          {/* Deliverables and Status Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {displayedStep.deliverable && (
              <span className="badge badge-engine" style={{ fontSize: '11px', padding: '5px 12px' }}>
                {displayedStep.deliverable}
              </span>
            )}
            <span
              className="badge"
              style={{
                fontSize: '11px',
                padding: '5px 12px',
                background: displayedStep.globalIndex === activeGlobalIndex
                  ? '#10b981'
                  : displayedStep.globalIndex < activeGlobalIndex
                  ? 'var(--bg-card)'
                  : 'var(--bg-card)',
                color: displayedStep.globalIndex <= activeGlobalIndex ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {displayedStep.globalIndex === activeGlobalIndex
                ? 'Active Step'
                : displayedStep.globalIndex < activeGlobalIndex
                ? 'Completed'
                : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Supervisor Status Note */}
        {pipeline.statusNote && (
          <div
            style={{
              padding: '14px 20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid var(--accent-green)',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Supervisor Status Note
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.5 }}>
              {pipeline.statusNote}
            </div>
          </div>
        )}
      </div>

      {/* 4-Phase Roadmap Breakdown (Clean Large Typography - No Buttons) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Roadmap
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2, letterSpacing: '-0.02em' }}>
            Phases
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {pipeline.stages.map((stage) => {
            const isStageActive = stage.phaseNumber === pipeline.currentBigStage.phaseNumber;
            const isStageDone = stage.phaseNumber < pipeline.currentBigStage.phaseNumber;

            return (
              <div
                key={stage.id}
                className="white-card"
                style={{
                  padding: '24px 26px',
                  borderRadius: '16px',
                  borderTop: `6px solid ${stage.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: '12px', fontWeight: 900, color: stage.color, textTransform: 'uppercase' }}>
                    Phase {stage.phaseNumber}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      background: isStageActive ? stage.color : isStageDone ? '#10b981' : 'var(--bg-card-muted)',
                      color: isStageActive || isStageDone ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    {isStageActive ? 'Active' : isStageDone ? 'Completed' : 'Upcoming'}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {stage.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Supervisors: {stage.supervisors.join(', ')}
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {stage.info}
                </div>

                {/* Sub-Stages List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Milestones
                  </div>
                  {stage.subStages.map((sub, sIdx) => {
                    const isSubCurrent = isStageActive && sIdx === pipeline.currentSubStageIndex;
                    const isSubPassed = isStageDone || (isStageActive && sIdx < pipeline.currentSubStageIndex);

                    return (
                      <div
                        key={sub.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: isSubCurrent ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ fontWeight: isSubCurrent ? 800 : 500, color: isSubCurrent ? '#10b981' : 'var(--text-main)' }}>
                          {sub.shortName}
                        </span>
                        <span
                          className="mono"
                          style={{
                            fontSize: '10px',
                            color: isSubCurrent ? '#10b981' : isSubPassed ? 'var(--text-muted)' : 'var(--text-light)',
                            fontWeight: 700,
                          }}
                        >
                          {isSubCurrent ? 'ACTIVE' : isSubPassed ? 'DONE' : 'PENDING'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Production Ledger Section Header */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Updates
        </div>
        <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2, letterSpacing: '-0.02em' }}>
          Ledger
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`btn btn-sm ${activeTag === tag ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '5px 12px' }}
            >
              {tag}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search updates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{ maxWidth: 260, fontSize: '12px', padding: '6px 12px' }}
        />
      </div>

      {/* Numbered Organic Updates Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredUpdates.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No updates found matching your search.
          </div>
        ) : (
          filteredUpdates.map((upd) => (
            <article
              key={upd.id}
              className="card"
              style={{
                padding: '32px 36px',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {/* Header Row: Update Number, Tag, Author & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      background: 'rgba(34, 197, 94, 0.12)',
                      color: 'var(--accent-green)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    Update #{String(upd.updateNumber).padStart(2, '0')}
                  </span>

                  <span className="badge badge-engine">
                    {upd.tag}
                  </span>
                </div>

                {/* Supervisor Author Bio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={upd.authorAvatar || 'https://cdn.discordapp.com/embed/avatars/1.png'}
                      alt={upd.authorName}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border-strong)', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {upd.authorName}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {upd.authorRole} • {upd.date}
                      </div>
                    </div>
                  </div>

                  {/* Actions for supervisors */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                      onClick={() => openEditModal(upd)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '10px', color: 'var(--color-danger)' }}
                      onClick={() => handleDelete(upd.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em', margin: 0 }}>
                {upd.title}
              </h2>

              {/* Story Narrative */}
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-main)' }}>
                {upd.story}
              </div>

              {/* Attached Media Preview */}
              {upd.mediaUrl && (
                <div
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: '#000000',
                    maxHeight: 400,
                  }}
                >
                  <img
                    src={upd.mediaUrl}
                    alt={upd.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              {/* Attached Round Voting Results */}
              {upd.roundResults && (
                <div
                  style={{
                    background: 'var(--bg-card-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginTop: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase' }}>
                        Consensus Standings
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                        {upd.roundResults.roundTitle}
                      </div>
                    </div>
                    <span className="badge badge-success">
                      {upd.roundResults.totalPoints} Conserved Points
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {upd.roundResults.placements.map((p) => (
                      <div
                        key={p.rank}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="mono"
                            style={{
                              fontSize: '12px',
                              fontWeight: 900,
                              color: p.rank === 1 ? 'var(--accent-gold)' : p.rank === 2 ? 'var(--accent-silver)' : 'var(--accent-bronze)',
                            }}
                          >
                            #{p.rank}
                          </span>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            {p.title}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            by {p.creator}
                          </span>
                        </div>
                        <span className="mono" style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '13px' }}>
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

      {/* Post / Edit Update Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title">{editingUpdate ? 'Edit Update' : 'Post Numbered Update'}</div>
                <div className="card-desc">Share progress, behind-the-scenes notes, and voting results.</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div>
                  <label className="label">Update #</label>
                  <input
                    type="number"
                    value={formNumber}
                    onChange={(e) => setFormNumber(Number(e.target.value))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Headline Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Cave Renders & Audio Stems"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Author Name</label>
                  <input
                    type="text"
                    value={formAuthorName}
                    onChange={(e) => setFormAuthorName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Author Role</label>
                  <input
                    type="text"
                    value={formAuthorRole}
                    onChange={(e) => setFormAuthorRole(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Tag</label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Devlog Narrative</label>
                <textarea
                  rows={5}
                  placeholder="Describe recent breakthroughs, test renders, sound mixes, and studio notes..."
                  value={formStory}
                  onChange={(e) => setFormStory(e.target.value)}
                  className="textarea"
                  required
                />
              </div>

              <div>
                <label className="label">Media Image / Render URL (Optional)</label>
                <input
                  type="text"
                  placeholder="/images/stock_01.jpg"
                  value={formMediaUrl}
                  onChange={(e) => setFormMediaUrl(e.target.value)}
                  className="input"
                />
              </div>

              {/* Checkbox to attach Voting Results */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={hasResults}
                    onChange={(e) => setHasResults(e.target.checked)}
                  />
                  <span>Attach Voting Round Winners</span>
                </label>

                {hasResults && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, padding: 14, background: 'var(--bg-card-muted)', borderRadius: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="label">Round Title</label>
                        <input
                          type="text"
                          placeholder="Round 1: Art Direction"
                          value={resRoundTitle}
                          onChange={(e) => setResRoundTitle(e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Ballots</label>
                        <input
                          type="number"
                          value={resBallots}
                          onChange={(e) => setResBallots(e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Points</label>
                        <input
                          type="number"
                          value={resPoints}
                          onChange={(e) => setResPoints(e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="1st Place Title"
                        value={r1Title}
                        onChange={(e) => setR1Title(e.target.value)}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="1st Creator"
                        value={r1Creator}
                        onChange={(e) => setR1Creator(e.target.value)}
                        className="input"
                      />
                      <input
                        type="number"
                        placeholder="Pts"
                        value={r1Points}
                        onChange={(e) => setR1Points(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="2nd Place Title"
                        value={r2Title}
                        onChange={(e) => setR2Title(e.target.value)}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="2nd Creator"
                        value={r2Creator}
                        onChange={(e) => setR2Creator(e.target.value)}
                        className="input"
                      />
                      <input
                        type="number"
                        placeholder="Pts"
                        value={r2Points}
                        onChange={(e) => setR2Points(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="3rd Place Title"
                        value={r3Title}
                        onChange={(e) => setR3Title(e.target.value)}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="3rd Creator"
                        value={r3Creator}
                        onChange={(e) => setR3Creator(e.target.value)}
                        className="input"
                      />
                      <input
                        type="number"
                        placeholder="Pts"
                        value={r3Points}
                        onChange={(e) => setR3Points(e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUpdate ? 'Save Changes' : 'Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
