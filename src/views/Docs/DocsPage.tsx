import React, { useState, useEffect } from 'react';
import { NavTabId } from '../../components/Navbar.tsx';
import { useScrollDirection } from '../../hooks/useScrollDirection.ts';
import { Footer } from '../../components/Footer.tsx';

export type DocsSectionId =
  | 'overview'
  | 'voting'
  | 'tracks'
  | 'pipeline'
  | 'grabbox'
  | 'roles'
  | 'guidelines'
  | 'teams'
  | 'terminology'
  | 'architecture'
  | 'references'
  | 'mathematics'
  | 'supervision'
  | 'security'
  | 'discipline'
  | 'legal';

interface DocsPageProps {
  initialSection?: DocsSectionId;
  onNavigateTab?: (tab: NavTabId) => void;
  onOpenCreatePitch?: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({
  initialSection = 'overview',
  onNavigateTab,
}) => {
  const isHeaderVisible = useScrollDirection();
  const [activeSection, setActiveSection] = useState<DocsSectionId>(initialSection);
  const [showToc, setShowToc] = useState(true);

  const resolveTargetId = (id: string): string => {
    switch (id) {
      case 'teams':
      case 'terminology':
        return 'tracks';
      case 'architecture':
      case 'references':
        return 'overview';
      case 'mathematics':
        return 'voting';
      case 'supervision':
        return 'roles';
      case 'security':
      case 'discipline':
      case 'legal':
        return 'guidelines';
      default:
        return id;
    }
  };

  const scrollToSection = (id: string) => {
    const targetId = resolveTargetId(id);
    setActiveSection(targetId as DocsSectionId);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (initialSection) {
      const targetId = resolveTargetId(initialSection);
      setActiveSection(targetId as DocsSectionId);
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  const tocItems: { id: DocsSectionId; title: string }[] = [
    { id: 'overview', title: '1. Overview' },
    { id: 'voting', title: '2. How Voting Works' },
    { id: 'tracks', title: '3. Creative Tracks' },
    { id: 'pipeline', title: '4. Production Pipeline' },
    { id: 'grabbox', title: '5. GrabBox Tasks' },
    { id: 'roles', title: '6. Roles & Teams' },
    { id: 'guidelines', title: '7. Guidelines & Safety' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 64 }}>
      {/* Top Header Banner */}
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
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Documentation
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Everything you need to know about voting, pitches, pipeline, and creating shots.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab?.('ballot')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Explore Proposals
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigateTab?.('progress')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            View Pipeline
          </button>
        </div>
      </div>

      {/* Main Documentation Body */}
      <div
        className="card"
        style={{
          padding: '36px 40px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          color: 'var(--text-main)',
          fontSize: '14px',
          lineHeight: 1.7,
        }}
      >
        {/* Table of Contents */}
        <div
          style={{
            background: 'var(--bg-card-muted)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '16px 20px',
            marginBottom: 36,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showToc ? 10 : 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Quick Navigation
            </span>
            <button
              onClick={() => setShowToc(!showToc)}
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
            >
              [{showToc ? 'Hide' : 'Show'}]
            </button>
          </div>

          {showToc && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id);
                  }}
                  style={{
                    color: activeSection === item.id ? '#34d399' : 'var(--text-main)',
                    fontWeight: activeSection === item.id ? 800 : 500,
                    textDecoration: 'none',
                    fontSize: '13px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    background: activeSection === item.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {item.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Section 1: Overview */}
        <section id="overview" style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8, marginBottom: 14 }}>
            1. Overview
          </h2>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>Project Stairway</strong> is a community-directed Minecraft animated movie. Instead of decisions being made behind closed doors, anyone in the community can pitch story ideas, vote on the best concepts, build sets, voice characters, and animate shots.
          </p>
          <p style={{ margin: '0 0 16px 0' }}>
            The project operates through three core parts:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, margin: '16px 0' }}>
            <div style={{ background: 'var(--bg-card-muted)', padding: '16px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#34d399', marginBottom: 4 }}>🗳️ Community Voting</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Ranked voting rounds where the community chooses favorite plotlines, visual looks, and voice auditions.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '16px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#60a5fa', marginBottom: 4 }}>🎬 4-Phase Pipeline</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                A structured 17-step roadmap from initial script draft to final render and sound mix.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '16px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#f59e0b', marginBottom: 4 }}>📦 GrabBox Tasks</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Open scene tasks where animators and builders claim shots, work on them, and submit their deliverables.
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: How Voting Works */}
        <section id="voting" style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8, marginBottom: 14 }}>
            2. How Voting Works
          </h2>
          <p style={{ margin: '0 0 12px 0' }}>
            Voting uses a simple <strong>3-2-1 Ranked Ballot</strong>. When a voting round is live, you select your top 3 favorite submissions:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '14px 0 20px 0' }}>
            <div style={{ background: 'var(--bg-card-muted)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '20px' }}>🥇</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b' }}>1st Place</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awarded <strong>3 Points</strong></div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '20px' }}>🥈</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8' }}>2nd Place</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awarded <strong>2 Points</strong></div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(217, 119, 6, 0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '20px' }}>🥉</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#d97706' }}>3rd Place</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awarded <strong>1 Point</strong></div>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px 20px', marginBottom: 14 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
              💡 Exact Points Conservation (6 Points per Ballot)
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-main)', opacity: 0.9 }}>
              Every valid ballot assigns exactly 3 + 2 + 1 = <strong>6 points</strong> into the voting pool. For example, if 100 people vote in a round, exactly 600 total points are distributed among the proposals. This guarantees fair results and ensures no vote is lost or inflated.
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Automated fairness checks also ensure proposals with broad community appeal are ranked accurately and protect the leaderboard from vote manipulation.
          </p>
        </section>

        {/* Section 3: Creative Tracks */}
        <section id="tracks" style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8, marginBottom: 14 }}>
            3. Creative Tracks
          </h2>
          <p style={{ margin: '0 0 14px 0' }}>
            The film is organized into 5 production tracks. You can submit pitches and vote in any track:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>📜 Story & Narrative</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Plot outlines, scene dialogue, character motivations, and world lore.</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>Story Lead</span>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>🎨 Art Style & Visuals</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Color palettes, visual aesthetics, lighting tests, and concept art.</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>Art Lead</span>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>🧱 Builds & World Sets</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Minecraft builds, structures, and environment blockouts used as 3D sets.</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>Art Lead</span>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>🎙️ Voice Casting & Audio</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Character voice auditions, lines, sound design (SFX), and musical score.</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' }}>Audio Lead</span>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 18px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>🎬 Animation & Staging</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>3D character animation, scene timing, camera framing, and rendering.</div>
              </div>
              <span className="badge" style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>Animation Lead</span>
            </div>
          </div>
        </section>

        {/* Section 4: Production Pipeline */}
        <section id="pipeline" style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8, marginBottom: 14 }}>
            4. Production Pipeline
          </h2>
          <p style={{ margin: '0 0 14px 0' }}>
            The production progresses sequentially through 4 main phases:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: '12px', borderTop: '3px solid #94a3b8' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Phase 1</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0' }}>Writing</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Community feedback, story treatments, and table-read final screenplay.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: '12px', borderTop: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Phase 2</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0' }}>Pre-Vis</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Asset blueprints, storyboards, voice recordings, and 2D animatics.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: '12px', borderTop: '3px solid #eab308' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#eab308', textTransform: 'uppercase' }}>Phase 3</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0' }}>Production</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                3D models, character rigging, layout blocking, animation, and GPU frame rendering.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: '12px', borderTop: '3px solid #a855f7' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#a855f7', textTransform: 'uppercase' }}>Phase 4</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0' }}>Post-Production</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Visual effects (VFX), sound effects, original soundtrack, color grading, and final movie master.
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: GrabBox Tasks */}
        <section id="grabbox" style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8, marginBottom: 14 }}>
            5. GrabBox Tasks
          </h2>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>GrabBox</strong> is our open task board where animators and artists can claim specific shots and contribute directly to the film:
          </p>

          <ol style={{ paddingLeft: 20, fontSize: '13px', lineHeight: 1.8, margin: '0 0 16px 0' }}>
            <li><strong>Find an Open Shot:</strong> Browse available scene tasks filtered by difficulty (Easy, Medium, Hard, Climax).</li>
            <li><strong>Claim & Download:</strong> Claiming a task gives you a lease timer (24h to 120h) and provides project files, camera angles, and voice stems.</li>
            <li><strong>Submit Deliverable:</strong> Upload your finished render or blend file before the timer expires. Supervisors review your work, and once approved, it gets baked into the film!</li>
          </ol>
        </section>

        {/* Section 6: Roles & Teams */}
        <section id="roles" style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8, marginBottom: 14 }}>
            6. Roles & Teams
          </h2>
          <ul style={{ paddingLeft: 20, fontSize: '13px', lineHeight: 1.8, margin: 0 }}>
            <li><strong>Directors & Leads:</strong> Oversee production timelines, technical integrity, and milestone sign-offs.</li>
            <li><strong>Department Supervisors:</strong> Story, Art, Animation, Audio, and Post-Production leads who review community pitches and approve deliverables.</li>
            <li><strong>Contributors:</strong> Community animators, builders, writers, modelers, voice actors, and musicians creating content.</li>
            <li><strong>Community Voters:</strong> Everyone who votes on pitches and helps shape the story.</li>
          </ul>
        </section>

        {/* Section 7: Guidelines & Safety */}
        <section id="guidelines">
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8, marginBottom: 14 }}>
            7. Guidelines & Safety
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 16px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>Original Work</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Only submit assets and ideas that you created or have rights to share.</div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 16px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>Respectful Collaboration</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Keep feedback constructive, welcoming, and focused on making a great movie together.</div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '14px 16px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>No Voting Manipulation</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automated bots, multi-accounting, and vote brigading are detected and disqualified.</div>
            </div>
          </div>
        </section>
      </div>

      {/* Reusable Community Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={scrollToSection} />
    </div>
  );
};
