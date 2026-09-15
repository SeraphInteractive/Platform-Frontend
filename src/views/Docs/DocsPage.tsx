import React, { useState, useEffect } from 'react';
import { NavTabId } from '../../components/Navbar.tsx';
import { useScrollDirection } from '../../hooks/useScrollDirection.ts';
import { Footer } from '../../components/Footer.tsx';

export type DocsSectionId =
  | 'overview'
  | 'tracks'
  | 'terminology'
  | 'voting'
  | 'roles'
  | 'pipeline'
  | 'grabbox'
  | 'security'
  | 'references'
  | 'teams'
  | 'legal'
  | 'architecture'
  | 'mathematics'
  | 'supervision'
  | 'discipline';

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

  const resolveTargetId = (id: DocsSectionId): string => {
    switch (id) {
      case 'teams': return 'tracks';
      case 'architecture': return 'overview';
      case 'mathematics': return 'voting';
      case 'supervision': return 'roles';
      case 'discipline': return 'security';
      default: return id;
    }
  };

  const scrollToSection = (id: DocsSectionId) => {
    setActiveSection(id);
    const targetId = resolveTargetId(id);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
      const timer = setTimeout(() => {
        const targetId = resolveTargetId(initialSection);
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  const tocItems: { id: DocsSectionId; title: string }[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'tracks', title: 'Tracks' },
    { id: 'terminology', title: 'Terminology' },
    { id: 'voting', title: 'Voting' },
    { id: 'roles', title: 'Roles' },
    { id: 'pipeline', title: 'Pipeline' },
    { id: 'grabbox', title: 'GrabBox' },
    { id: 'security', title: 'Security' },
    { id: 'references', title: 'References' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header Banner */}
      <div
        className={`card scroll-header-banner ${isHeaderVisible ? 'banner-visible' : 'banner-hidden'}`}
        style={{ padding: '28px 36px', background: 'var(--bg-card)' }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Documentation
          </h1>
        </div>
      </div>

      {/* Wikipedia Style Article Container */}
      <div
        className="card"
        style={{
          padding: '40px 48px',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '14px',
          lineHeight: 1.75,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* Wikipedia Header & Source */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
            Consensus Platform Specification
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
            From Platform Reference, the community technical encyclopedia
          </div>
        </div>

        {/* Lead Section + Infobox Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start', marginBottom: 28 }}>
          {/* Lead Text */}
          <div>
            <p style={{ margin: '0 0 14px 0' }}>
              <strong>The Platform Voting and Production Architecture</strong> is a deterministic consensus system and distributed pipeline engineered for community-directed animated filmmaking. The platform implements a constrained 3-2-1 Borda count tallying protocol enforcing a strict mathematical 6N point conservation invariant, paired with Shannon entropy anti-raid telemetry, multi-vector AI content detection, and presigned object storage dispatchers to transform public consensus into verified 3D animation assets.
            </p>
            <p style={{ margin: '0 0 14px 0' }}>
              The entire film lifecycle is structured across four sequential production phases: Phase 1 (Writing), Phase 2 (Pre-Vis), Phase 3 (Production), and Phase 4 (Post-Production), comprising 17 distinct sub-stages across five creative tracks and seven departments. Each stage operates under algorithmic verification and supervisor review to guarantee high creative velocity without central bottlenecking.
            </p>
            <p style={{ margin: 0 }}>
              Platform algorithms are packaged into a zero-dependency internal logic engine (<code>@platform/internal-logic</code>), consumed uniformly by backend microservices and client interfaces to guarantee execution parity.
            </p>
          </div>

          {/* Wikipedia Infobox */}
          <aside
            style={{
              background: 'var(--bg-card-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '12px',
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                textAlign: 'center',
                paddingBottom: 10,
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 10,
                color: 'var(--text-main)',
              }}
            >
              Platform Core
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Type</span>
                <span style={{ fontWeight: 700 }}>Consensus Protocol</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tallying</span>
                <span style={{ fontWeight: 700 }}>3-2-1 Borda Count</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Conservation</span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-green)' }}>6N Points</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tracks</span>
                <span style={{ fontWeight: 700 }}>5 Creative Tracks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Roadmap</span>
                <span style={{ fontWeight: 700 }}>Draft v20 (4 Phases)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sub-Stages</span>
                <span style={{ fontWeight: 700 }}>17 Discrete Steps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Runtime</span>
                <span style={{ fontWeight: 700 }}>Node.js 24 / TypeScript</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Database</span>
                <span style={{ fontWeight: 700 }}>PostgreSQL 16</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Security</span>
                <span style={{ fontWeight: 700 }}>Entropy & AI Radar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Auth</span>
                <span style={{ fontWeight: 700 }}>Discord OAuth2</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Wikipedia Table of Contents */}
        <div
          style={{
            background: 'var(--bg-card-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '14px 20px',
            width: 'fit-content',
            minWidth: 280,
            marginBottom: 36,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 800 }}>Contents</span>
            <button
              onClick={() => setShowToc(!showToc)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                fontSize: '11px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              [{showToc ? 'hide' : 'show'}]
            </button>
          </div>

          {showToc && (
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: '13px', lineHeight: 1.8, color: 'var(--accent-blue)' }}>
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.id);
                    }}
                    style={{
                      color: activeSection === item.id ? 'var(--accent-green)' : 'inherit',
                      fontWeight: activeSection === item.id ? 700 : 400,
                      textDecoration: 'none',
                    }}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Section 1: Overview */}
        <section id="overview" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Overview
          </h2>
          <p>
            Conventional animation production follows hierarchical, studio-dominated workflows where creative decisions are concentrated in executive committees. The Platform paradigm redistributes this authority across a structured community ecosystem through algorithmic consensus, transparent peer review, and task dispatching.
          </p>
          <p>
            The ecosystem operates on three structural pillars:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li><strong>Consensus Engine:</strong> Mathematical voting rounds that prevent ballot stacking, filter out automated raids, and compute regularized leaderboards.</li>
            <li><strong>Production Pipeline:</strong> A four-phase roadmap (Draft v20) coordinating story pitches, script development, animatics, 3D asset builds, animation shots, visual effects, and audio mastering.</li>
            <li><strong>GrabBox Dispatcher:</strong> A modular asset ingestion and task distribution engine allocating 3D scene packages to community artists with deterministic lease locks.</li>
          </ul>
        </section>

        {/* Section 2: Tracks */}
        <section id="tracks" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Tracks
          </h2>
          <p>
            Creative submissions and voting rounds are organized across five specialized production tracks:
          </p>
          <table className="clean-table" style={{ margin: '16px 0', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Track</th>
                <th style={{ width: 180 }}>Supervisor</th>
                <th>Scope & Deliverables</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Story Track</td>
                <td>Story Supervisor</td>
                <td>Screenplay pitches, narrative premises, scene beats, and character dialogue books.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Art Direction Track</td>
                <td>Art Supervisor</td>
                <td>Visual aesthetic targets, color keys, post-processing shaders, and texture lookdev.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Builds Track</td>
                <td>Art Supervisor</td>
                <td>Three-dimensional Minecraft voxel environments, structure schematics, and geometry setups.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Voice Casting Track</td>
                <td>Audio Supervisor</td>
                <td>Character audition stems, scratch dialogue takes, and character voice actor selection.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Animation Track</td>
                <td>Animation Supervisor</td>
                <td>3D GrabBox shot distribution, camera blocking, character keyframe animation, and rendering.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 3: Terminology */}
        <section id="terminology" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Terminology
          </h2>
          <p>
            The platform relies on standardized terminology across technical documentation, codebases, and supervisor devlogs:
          </p>
          <table className="clean-table" style={{ margin: '16px 0', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: 180 }}>Term</th>
                <th>Definition</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>3-2-1 Borda Count</td>
                <td>Positional voting system where each ballot allocates 3 points to Rank 1, 2 points to Rank 2, and 1 point to Rank 3 across three distinct options.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>6N Invariant</td>
                <td>Mathematical conservation law stating that the sum of all proposal scores in a round with N valid ballots must equal exactly 6N points.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Bayesian Shrinkage</td>
                <td>Empirical Bayes regularization pulling low-volume candidate scores toward the global mean to prevent cold-start rank distortion.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Shannon Entropy</td>
                <td>Information entropy metric measuring ballot diversity across ranks to flag coordinated voting raids and bot clusters.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>GrabBox</td>
                <td>Decentralized shot checkout engine providing scene archives, audio stems, and camera vectors with lease-locked delivery timers.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Animatic</td>
                <td>Preliminary storyboard sequence timed to dialogue drafts, serving as the timing and layout blueprint for 3D animators.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Locked Picture</td>
                <td>The final visual edit of the film where shot timing and cuts are frozen prior to color grading and master audio mixing.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Audio Stems</td>
                <td>Isolated sound tracks (Dialogue, Foley, SFX, Score, Ambience) submitted for multi-track balancing by the Audio Supervisor.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 4: Voting */}
        <section id="voting" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Voting
          </h2>
          <p>
            Tallying uses a constrained 3-2-1 positional Borda count. Each ballot requires strict assignment of exactly three distinct candidates to ordinal ranks 1, 2, and 3.
          </p>
          <p>
            Given candidate set C = &#123;c_1, c_2, ..., c_M&#125; and N valid ballots, let r_(i,k) denote the indicator variable that ballot k assigns candidate c_i to rank r in &#123;1, 2, 3&#125;. The aggregate raw score S_i for candidate c_i is defined by:
          </p>
          <div
            className="mono"
            style={{
              background: 'var(--bg-card-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '12px 18px',
              margin: '14px 0',
              fontSize: '13px',
              color: 'var(--accent-blue)',
            }}
          >
            S_i = \sum_(k=1)^N ( 3 * r_(i,k)^[1] + 2 * r_(i,k)^[2] + 1 * r_(i,k)^[3] )
          </div>
          <p>
            Because each ballot distributes exactly 3 + 2 + 1 = 6 points, the sum of all candidate scores is strictly conserved:
          </p>
          <div
            className="mono"
            style={{
              background: 'var(--bg-card-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '12px 18px',
              margin: '14px 0',
              fontSize: '13px',
              color: 'var(--accent-green)',
            }}
          >
            Total Points = \sum_(i=1)^M S_i = 6N  (Conservation Invariant)
          </div>
          <p>
            To prevent cold-start distortion where low-volume options with solitary high ranks outscore broad consensus choices, empirical Bayesian shrinkage is computed with prior confidence parameter C = 5.0 and global mean m = 6N / M:
          </p>
          <div
            className="mono"
            style={{
              background: 'var(--bg-card-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '12px 18px',
              margin: '14px 0',
              fontSize: '13px',
              color: 'var(--accent-gold)',
            }}
          >
            S_(i, regularized) = ( S_i + C * m ) / ( 1 + C / \max(1, count_i) )
          </div>
          <p>
            When two top candidates exhibit score margins smaller than the standard error of negative rank covariance, the system flags the round for Tiered Runoff evaluation.
          </p>
        </section>

        {/* Section 5: Roles */}
        <section id="roles" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Roles
          </h2>
          <p>
            Production governance is organized into four hierarchical tiers:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li><strong>Executive Leadership:</strong> Project Director and Platform Administrators oversee global deadlines, database integrity, and production milestone clearances.</li>
            <li><strong>Department Supervisors:</strong> Specialized domain leads responsible for task sign-off:
              <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                <li>Story Supervisor: Pitches, Outlines, Script Finals.</li>
                <li>Art Supervisor: Visual Dev, Concept Art, Texture/Shading, Character Rigging.</li>
                <li>Animation Supervisor: Storyboarding, Animatics, 3D Layout, Character Animation.</li>
                <li>Post-Production Supervisor: Editorial, Visual Effects, Color Grading, Locked Picture.</li>
                <li>Audio Supervisor: Voice Casting, Sound Design, Foley, Music Composition, Master Mix.</li>
              </ul>
            </li>
            <li><strong>Beta Testers:</strong> Internal staff testers and tiered community testers validating new platform builds, voting mechanics, and API wrappers before public deployment.</li>
            <li><strong>Contributors:</strong> Community artists, writers, modelers, animators, and voice actors participating in active rounds and GrabBox shot fulfillment.</li>
          </ul>
        </section>

        {/* Section 6: Pipeline */}
        <section id="pipeline" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Pipeline
          </h2>
          <p>
            The complete film lifecycle is codified in the <strong>Roadmap Draft v20</strong> architecture, structured across four phases and 17 sub-stages:
          </p>
          <table className="clean-table" style={{ margin: '16px 0', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Phase</th>
                <th style={{ width: 160 }}>Stage</th>
                <th style={{ width: 160 }}>Supervisor</th>
                <th>Deliverable</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 1</td>
                <td>Pitches & Outlines</td>
                <td>Story Supervisor</td>
                <td>Approved Narrative Arc & Scene Beats</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 1</td>
                <td>Script Final</td>
                <td>Story Supervisor</td>
                <td>Locked Screenplay & Dialogue Book</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 2</td>
                <td>Visual Dev & Concepts</td>
                <td>Art Supervisor</td>
                <td>Environment & Character Color Keys</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 2</td>
                <td>Storyboards</td>
                <td>Animation Supervisor</td>
                <td>Storyboard Panels & Shot Framing</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 2</td>
                <td>Voice Auditions</td>
                <td>Audio Supervisor</td>
                <td>Cast Character Audio Stems</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 2</td>
                <td>Animatic Final</td>
                <td>Animation Supervisor</td>
                <td>Locked Timing Animatic Reel</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 3</td>
                <td>Art Assets & Models</td>
                <td>Art Supervisor</td>
                <td>glTF 3D Geometry & Material Shaders</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 3</td>
                <td>Rigging</td>
                <td>Art Supervisor</td>
                <td>Deformation Rigs & Facial Setups</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 3</td>
                <td>Layout & Blocking</td>
                <td>Animation Supervisor</td>
                <td>3D Camera Movement & Spatial Staging</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 3</td>
                <td>Character Animation</td>
                <td>Animation Supervisor</td>
                <td>Keyframe Animation Takes</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 3</td>
                <td>Lighting & Render</td>
                <td>Animation Supervisor</td>
                <td>Multi-Pass Render Sequences (EXR/PNG)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 4</td>
                <td>Visual Effects (VFX)</td>
                <td>Post-Production Lead</td>
                <td>Particle & Simulation Composites</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 4</td>
                <td>Locked Picture</td>
                <td>Post-Production Lead</td>
                <td>Conformed Edit Master</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 4</td>
                <td>Color Grade</td>
                <td>Post-Production Lead</td>
                <td>Graded Color Space Deliverable</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 4</td>
                <td>Sound Design & Foley</td>
                <td>Audio Supervisor</td>
                <td>SFX Track Stems</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 4</td>
                <td>Music Score</td>
                <td>Audio Supervisor</td>
                <td>Orchestral & Synth Soundtrack Stems</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Phase 4</td>
                <td>Master Mix</td>
                <td>Audio Supervisor</td>
                <td>Finished Film Audio Master (5.1/Stereo)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 7: GrabBox */}
        <section id="grabbox" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            GrabBox
          </h2>
          <p>
            The <strong>GrabBox</strong> engine facilitates decentralized shot allocation. 3D animation tasks are published to the public board with difficulty ratings and lease durations:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li><strong>Tier 1 (Easy):</strong> 24-hour lease window for simple background animations or prop setups.</li>
            <li><strong>Tier 2 (Medium):</strong> 48-hour lease window for standard single-character acting shots.</li>
            <li><strong>Tier 3 (Hard):</strong> 72-hour lease window for multi-character interaction or fast action sequences.</li>
            <li><strong>Tier 4 (Legendary):</strong> 120-hour lease window for complex climax scenes with dynamic camera shifts and simulations.</li>
          </ul>
          <p>
            When an artist claims a task, the platform locks the shot to prevent duplicate effort. Deliverables are uploaded via presigned S3/R2 direct-to-storage URLs with SHA-256 integrity checksums. If the lease timer expires without a valid submission, the shot automatically returns to the open GrabBox pool.
          </p>
        </section>

        {/* Section 8: Security */}
        <section id="security" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Security
          </h2>
          <p>
            Platform security incorporates automated anomaly detection, AI content moderation, and progressive disciplinary policies:
          </p>
          <table className="clean-table" style={{ margin: '16px 0', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: 180 }}>Defense Vector</th>
                <th style={{ width: 200 }}>Algorithm / Engine</th>
                <th>Enforcement Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Raid Telemetry</td>
                <td className="mono">Shannon Entropy + Velocity Z</td>
                <td>Flags inorganic voting clusters (Entropy &lt; 0.85, |Z| &gt; 2.58) for desk audit.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>AI Content Scanner</td>
                <td className="mono">Multi-Vector Perplexity Model</td>
                <td>Inspects pitch texts and images; scores &gt; 70% probability route to moderation queue.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Scam Detection</td>
                <td className="mono">Perceptual Image Hashing</td>
                <td>Matches submitted attachments against known phishing databases.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Discipline Model</td>
                <td className="mono">Three-Strike Escalation</td>
                <td>Strike 1: Logged warning. Strike 2: 48h voting suspension. Strike 3: Permanent ban.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 9: References */}
        <section id="references" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 12px 0' }}>
            References
          </h2>
          <ol style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
            <li id="ref-1">
              Borda, J. C. (1781). <a href="https://en.wikipedia.org/wiki/Borda_count" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}><em>Memoire sur les elections au scrutin</em></a>. Histoire de l'Academie Royale des Sciences, Paris.
            </li>
            <li id="ref-2">
              Shannon, C. E. (1948). <a href="https://doi.org/10.1002/j.1538-7305.1948.tb01338.x" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>"A Mathematical Theory of Communication"</a>. <em>Bell System Technical Journal</em>, 27(3), 379-423.
            </li>
            <li id="ref-3">
              Gelman, A., Carlin, J. B., Stern, H. S., Dunson, D. B., Vehtari, A., & Rubin, D. B. (2013). <a href="http://www.stat.columbia.edu/~gelman/book/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}><em>Bayesian Data Analysis</em> (3rd ed.)</a>. CRC Press.
            </li>
            <li id="ref-4">
              Arrow, K. J. (1951). <a href="https://cowles.yale.edu/publications/monographs/12" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}><em>Social Choice and Individual Values</em></a>. John Wiley & Sons.
            </li>
          </ol>
        </section>
      </div>

      {/* Reusable Community Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={scrollToSection} />
    </div>
  );
};
