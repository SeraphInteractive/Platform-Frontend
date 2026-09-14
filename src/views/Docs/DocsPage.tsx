import React, { useState, useEffect } from 'react';
import { NavTabId } from '../../components/Navbar.tsx';

export type DocsSectionId =
  | 'overview'
  | 'backend'
  | 'mathematics'
  | 'security'
  | 'grabbox'
  | 'pipeline'
  | 'supervision'
  | 'discipline';

interface DocsPageProps {
  initialSection?: DocsSectionId;
  onNavigateTab: (tab: NavTabId) => void;
  onOpenCreatePitch: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({
  initialSection = 'overview',
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<DocsSectionId>(initialSection);

  const scrollToSection = (id: DocsSectionId) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
      const timer = setTimeout(() => {
        const element = document.getElementById(initialSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  useEffect(() => {
    const sectionIds: DocsSectionId[] = [
      'overview',
      'backend',
      'mathematics',
      'security',
      'grabbox',
      'pipeline',
      'supervision',
      'discipline',
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as DocsSectionId);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="container" style={{ maxWidth: 1400 }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '32px 36px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: 6 }}>
              Engineering Specifications
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Documentation
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('overview')}>
              Overview
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('ballot')}>
              Ballot Box
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sticky Sidebar Navigation */}
        <aside
          style={{
            position: 'sticky',
            top: 24,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', padding: '4px 12px 8px', textTransform: 'uppercase' }}>
            Sections
          </div>

          {[
            { id: 'overview', label: 'Architecture' },
            { id: 'backend', label: 'Backend' },
            { id: 'mathematics', label: 'Mathematics' },
            { id: 'security', label: 'Security' },
            { id: 'grabbox', label: 'GrabBox' },
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'supervision', label: 'Supervision' },
            { id: 'discipline', label: 'Discipline' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id as DocsSectionId)}
              style={{
                textAlign: 'left',
                padding: '9px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeSection === item.id ? 'var(--bg-card-muted)' : 'transparent',
                color: activeSection === item.id ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: activeSection === item.id ? 800 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderLeft: activeSection === item.id ? '3px solid var(--accent-green)' : '3px solid transparent',
              }}
            >
              {item.label}
            </button>
          ))}
        </aside>

        {/* Documentation Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Section 1: Overview & Architecture */}
          <section id="overview" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: 6 }}>
              Distributed System
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              Architecture
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              The Community Minecraft Movie is organized into five specialized tracks: Story, Art Style, Builds, Voice Casting, and Animation. Anyone in the community can contribute ideas, vote on the best concepts, and help build the movie step by step.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              Under the hood, the platform is engineered across 5 decoupled repositories. Calculation logic is isolated in a zero-dependency TypeScript engine with 100% test coverage, consumed by both the AdonisJS 6 backend and React frontend. Edge traffic is routed through Caddy 2 reverse proxies with real-time SSE streaming.
            </p>

            <div className="landing-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Logic Engine</div>
                <div className="landing-metric-value mono" style={{ fontSize: '15px' }}>@platform/logic</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">API Gateway</div>
                <div className="landing-metric-value mono" style={{ fontSize: '15px' }}>AdonisJS 6</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Database</div>
                <div className="landing-metric-value mono" style={{ fontSize: '15px' }}>PostgreSQL 16</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Edge Proxy</div>
                <div className="landing-metric-value mono" style={{ fontSize: '15px' }}>Caddy 2</div>
              </div>
            </div>

            <div className="white-card" style={{ background: 'var(--bg-card-muted)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
                Five Production Tracks
              </div>
              <ul style={{ paddingLeft: 18, color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.8 }}>
                <li><strong>Story</strong>: Community pitches 1-paragraph summaries, overarching themes, and scene dialogues.</li>
                <li><strong>Art Style</strong>: Leadership reference sets evaluated by community consensus to determine visual rendering targets.</li>
                <li><strong>Builds & Sets</strong>: World environment designs and community build contests.</li>
                <li><strong>Voice Casting</strong>: Up to 5 voice choices per character. Enforces invariant that no single voice actor holds multiple roles.</li>
                <li><strong>Animation & Shots</strong>: Individual Blender 3D shot tasks managed through the GrabBox system.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Backend & Infrastructure */}
          <section id="backend" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: 6 }}>
              API & Storage
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              Backend
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              The server handles voting, user accounts, and file uploads securely in real time. When you cast a ballot or claim an animation shot, updates appear instantly across the community without page reloads.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              The API runs Node.js 24 with AdonisJS 6. Database transactions are managed by Lucid ORM on PostgreSQL 16 with serializable isolation on ballot submission. Real-time updates use unbuffered Server-Sent Events (SSE) through Caddy reverse proxies, while Redis 7 provides in-memory rate limiting and leaderboard caching.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Real-Time Streaming</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Server-Sent Events (SSE) broadcast live leaderboard shifts and telemetry events through unbuffered Caddy reverse proxy pipes.
                </div>
              </div>

              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Session & Auth</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Discord OAuth2 authentication with cryptographic bearer tokens and multi-tier role verification on every mutation endpoint.
                </div>
              </div>
            </div>

            <div className="code-block" style={{ background: '#0b1120', borderRadius: '12px', padding: '18px', color: '#e2e8f0', fontSize: '12px', overflowX: 'auto' }}>
              <pre className="mono">
{`// Database Schema Entity Relations
VotingRound (1) <----> (N) VotingEntry
VotingRound (1) <----> (N) Ballot
VotingRound (1) <----> (N) Shot
User (1) <----> (N) Ballot
User (1) <----> (N) Shot (Claimed)
User (1) <----> (N) Submission`}
              </pre>
            </div>
          </section>

          {/* Section 3: Mathematics & Statistical Engine */}
          <section id="mathematics" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: 6 }}>
              Voting Engine
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              Mathematics
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              Voting is simple: you pick your 1st, 2nd, and 3rd favorite ideas. Your top choice gets 3 points, second gets 2, and third gets 1. If no idea wins a clear majority of more than 50%, the contest reduces to the top 2 for a final runoff vote.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              Scoring is governed by a 3-2-1 Borda variant strictly conserving 6N total points across N ballots. Empirical Bayesian shrinkage regularizes sparse candidate votes toward the round mean. Paired covariance matrices detect ballot competition, while standard error Z-scores (|Z| &lt; 1.96) flag statistical ties for tiered runoff.
            </p>

            <div className="white-card" style={{ padding: '20px', marginBottom: 20 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
                Conservation Invariant
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 12 }}>
                For any round with N verified ballots, the total points awarded across all entries strictly equals 6N:
              </div>
              <div className="mono" style={{ background: 'var(--bg-app)', padding: '12px 18px', borderRadius: '8px', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '14px' }}>
                Total Points = Sum(Scores) = 6 * N
              </div>
            </div>

            <div className="white-card" style={{ padding: '20px', marginBottom: 20, background: 'var(--bg-card-muted)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
                Majority & Top 2 Runoff Rule
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                If in a 3+ way round no single candidate secures greater than 50% majority consensus, or if the Z-score rank separation standard error reveals a statistical tie (|Z| &lt; 1.96), the system automatically reduces the field to the Top 2 candidates and triggers a decisive head-to-head runoff re-vote.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Bayesian Shrinkage</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Prevents cold-start skew where a single 1st-place vote outranks high-volume candidates by regularizing towards global mean.
                </div>
              </div>

              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Negative Covariance</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Measures substitution effects and head-to-head competition across ballots using vectorized paired covariance matrices.
                </div>
              </div>

              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Z-Score Separation</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Evaluates score wobbles between adjacent ranks. When lead gap is below critical standard error, flags tiered runoff.
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Security & Anti-Raid Protocol */}
          <section id="security" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', marginBottom: 6 }}>
              Integrity
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              Security
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              The system protects votes against spam, bots, and coordinated raid campaigns. Every community vote is weighed fairly and authentic consensus is preserved.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              The Batman Protocol continuously computes Shannon rank entropy across incoming ballots alongside skew ratios (Rank 1 vs Ranks 2+3). Rapid vote velocity spikes trigger Z-score outlier alerts, categorizing incoming traffic into ORGANIC, ELEVATED_SKEW, or CRITICAL_RAID for moderation review.
            </p>

            <div className="landing-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Skew Ratio</div>
                <div className="landing-metric-value mono">Rank 1 / Ranks (2+3)</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Entropy Metric</div>
                <div className="landing-metric-value mono">Shannon H(P)</div>
              </div>
              <div className="landing-metric-card">
                <div className="landing-metric-label">Velocity Z-Score</div>
                <div className="landing-metric-value mono">d(Ballots)/dt</div>
              </div>
            </div>

            <div className="white-card" style={{ padding: '18px', background: 'var(--bg-card-muted)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Raid Severity Levels</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                <strong>ORGANIC</strong>: Natural spread across all 3 ranks with high Shannon entropy.<br />
                <strong>ELEVATED_SKEW</strong>: Disproportionate 1st-place concentration exceeding threshold.<br />
                <strong>CRITICAL_RAID</strong>: Coordinated surge with extreme top-heavy velocity; flagged for moderator audit.
              </div>
            </div>
          </section>

          {/* Section 5: GrabBox & Shot Claiming Engine */}
          <section id="grabbox" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 6 }}>
              Production Logistics
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              GrabBox
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              When a scene wins the community vote, it turns into animation shots. Animators can claim 1 shot at a time, work on it in Blender, and submit it before the deadline so everyone gets a chance to participate.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              The GrabBox engine enforces an invariant of 1 active claimed shot per user to prevent hoarding. Deadlines scale by difficulty (Easy 5d, Medium 7d, Hard 10d, Complex 14d) with 24-48h senior priority locks. A background ExpiryDaemon executes every 15 minutes to automatically reclaim abandoned shots.
            </p>

            <div className="white-card" style={{ marginBottom: 20, padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 10 }}>Tier Deadlines & Windows</div>
              <div className="table-wrap">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Difficulty Tier</th>
                      <th>Duration</th>
                      <th>Senior Priority Window</th>
                      <th>Eligible Roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Easy</strong></td>
                      <td className="mono">5 Days</td>
                      <td>None</td>
                      <td>All Contributors</td>
                    </tr>
                    <tr>
                      <td><strong>Medium</strong></td>
                      <td className="mono">7 Days</td>
                      <td>None</td>
                      <td>All Contributors</td>
                    </tr>
                    <tr>
                      <td><strong>Hard</strong></td>
                      <td className="mono">10 Days</td>
                      <td className="mono text-blue">24 Hours</td>
                      <td>Senior Contributors first</td>
                    </tr>
                    <tr>
                      <td><strong>Complex</strong></td>
                      <td className="mono">14 Days</td>
                      <td className="mono text-blue">48 Hours</td>
                      <td>Senior Contributors first</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>1 Active Claim Invariant</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  A contributor may only hold 1 active claimed shot at a time, preventing hoarding and stalled deliverables.
                </div>
              </div>

              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Automated Expiry Daemon</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Runs every 15 minutes to reclaim abandoned claims past deadline, resetting shots to available pool.
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Pipeline & Storage */}
          <section id="pipeline" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: 6 }}>
              Asset Ingestion
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              Pipeline
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              Animators submit their work directly from their web browser. You upload your Blender project files along with a video preview, so supervisors can review animations immediately.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              The ingestion pipeline uses Cloudflare R2 / AWS S3 object storage with presigned PUT URLs generated by the API on demand. Deliverables require both an H.264 MP4 video preview for in-browser playback and a .blend source archive for final production compositing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Video Previews (.mp4)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  H.264 video renders for immediate browser playback and supervisor desk review.
                </div>
              </div>

              <div className="white-card" style={{ padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Project Assets (.blend)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Full Blender project files containing geometry, rigs, animations, and materials.
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Supervision & Roles */}
          <section id="supervision" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: 6 }}>
              Hierarchy
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              Supervision
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              Our team structure lets new community members participate right away while experienced animators take on harder shots. Supervisors review submissions, provide feedback, and promote contributors.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              The platform enforces a 5-tier role hierarchy (Voter &lt; Contributor &lt; Senior Contributor &lt; Supervisor &lt; Admin). The supervisor review desk manages state machine transitions (approved vs revision_requested) and broadcasts automated webhook embeds to Discord.
            </p>

            <div className="white-card" style={{ padding: '20px', marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: '13px', lineHeight: 2, color: 'var(--text-main)' }}>
                1. <strong>Voter</strong>: Browse proposals, participate in voting rounds.<br />
                2. <strong>Contributor</strong>: Submit proposals, claim Easy/Medium shots.<br />
                3. <strong>Senior Contributor</strong>: Claim Hard/Complex shots during priority windows.<br />
                4. <strong>Supervisor</strong>: Review submissions, request revisions, promote contributors.<br />
                5. <strong>Admin</strong>: Create rounds, manage global settings, override states.
              </div>
            </div>

            <div className="white-card" style={{ padding: '18px', background: 'var(--bg-card-muted)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: 6 }}>Dual Discord Webhooks</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong>Public Webhook</strong>: Announcements for new voting rounds and fresh GrabBox drops.<br />
                <strong>Supervisor Webhook</strong>: Alerts for submission reviews and senior promotions.
              </div>
            </div>
          </section>

          {/* Section 8: Discipline System */}
          <section id="discipline" className="card" style={{ padding: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase', marginBottom: 6 }}>
              Enforcement
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: 16 }}>
              Discipline
            </h2>

            <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.8, marginBottom: 14, fontWeight: 500 }}>
              To keep our community safe and fun for everyone, we use a fair warning system. Respectful participation keeps your account in good standing with full voting and claiming access.
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8, marginBottom: 20 }}>
              Discipline follows an audited 3-warning progression model: Warning 1 issues an advisory notice, Warning 2 introduces a 7-day cooldown on proposal creation, and Warning 3 triggers automatic account suspension and restriction from active rounds.
            </p>

            <div className="table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Warning Count</th>
                    <th>Standing</th>
                    <th>Sanction</th>
                    <th>Privileges</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="mono">0</td>
                    <td><span className="badge badge-success">Good</span></td>
                    <td>None</td>
                    <td>Full access</td>
                  </tr>
                  <tr>
                    <td className="mono">1</td>
                    <td><span className="badge badge-warning">Advisory</span></td>
                    <td>Formal notice recorded</td>
                    <td>Full access</td>
                  </tr>
                  <tr>
                    <td className="mono">2</td>
                    <td><span className="badge badge-warning">Probation</span></td>
                    <td>7-day cooldown on proposal creation</td>
                    <td>Voting permitted</td>
                  </tr>
                  <tr>
                    <td className="mono">3+</td>
                    <td><span className="badge badge-danger">Barred</span></td>
                    <td>Account suspended</td>
                    <td>All actions restricted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
