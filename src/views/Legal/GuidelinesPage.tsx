import React from 'react';
import { NavTabId } from '../../components/Navbar.tsx';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { useScrollDirection } from '../../hooks/useScrollDirection.ts';
import { Footer } from '../../components/Footer.tsx';

interface GuidelinesPageProps {
  onNavigateTab?: (tab: NavTabId) => void;
  onNavigateDocs?: (section: DocsSectionId) => void;
}

export const GuidelinesPage: React.FC<GuidelinesPageProps> = ({
  onNavigateTab,
  onNavigateDocs,
}) => {
  const isHeaderVisible = useScrollDirection();

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div
        className={`card scroll-header-banner ${isHeaderVisible ? 'banner-visible' : 'banner-hidden'}`}
        style={{ padding: '28px 36px', background: 'var(--bg-card)' }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Guidelines
          </h1>
        </div>
      </div>

      {/* Main Document Card */}
      <div
        className="card"
        style={{
          padding: '40px 48px',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '14px',
          lineHeight: 1.8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
            Community Guidelines
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
            Standards for Collaboration, Submissions, and Review | 2026-2027 Season
          </div>
        </div>

        {/* Section 1: Overview */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Overview
          </h2>
          <p>
            Project Stairway brings together writers, concept artists, builders, 3D animators, voice actors, and sound engineers to produce an animated feature. To ensure a productive and respectful environment, all participants must follow these guidelines.
          </p>
        </section>

        {/* Section 2: Conduct */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Conduct
          </h2>
          <p>
            We expect every participant to uphold the following principles:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li><strong>Mutual Respect:</strong> Treat fellow artists, voters, and supervisors with courtesy. Constructive creative criticism is encouraged; personal attacks are prohibited.</li>
            <li><strong>Inclusivity:</strong> Discriminatory, hateful, or derogatory language targeting race, nationality, gender identity, or background will result in immediate disqualification.</li>
            <li><strong>Fair Voting:</strong> Cast your ballots genuinely. Do not solicit or trade votes, coordinate artificial raiding groups, or attempt to distort consensus results.</li>
          </ul>
        </section>

        {/* Section 3: Standards */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Standards
          </h2>
          <p>
            Each creative track enforces technical and formatting standards:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li><strong>Story & Pitches:</strong> Clear narrative premise, well-defined character motivations, and concise pitch summaries under 300 words.</li>
            <li><strong>Visual Art & Builds:</strong> Clean geometry, optimized voxel models, standard 16x/32x texture maps, and glTF 2.0 asset packaging.</li>
            <li><strong>Voice Casting:</strong> Clean audio recordings without background noise or room reverb. Uncompressed WAV or high-bitrate MP3 stems at 48kHz/24-bit.</li>
            <li><strong>GrabBox Animation:</strong> Strict adherence to scene timing, camera framing blueprints, and locked frame rate (24 FPS).</li>
          </ul>
        </section>

        {/* Section 4: Originality */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Originality
          </h2>
          <p>
            All submitted work must be original or created specifically for this project. The following rules apply:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li>Plagiarism, asset ripping from commercial games, or copying third-party animations without explicit license is strictly forbidden.</li>
            <li>Submissions flagged by the automated AI scanner for high probability of generative synthetic text or art will be routed to the moderation desk for manual review.</li>
            <li>Always credit collaborators who contributed directly to your pitch or asset package.</li>
          </ul>
        </section>

        {/* Section 5: Review */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Review
          </h2>
          <p>
            Department Supervisors review submissions during each phase to ensure continuity, technical compatibility, and narrative fit. Supervisors provide constructive feedback and may request minor adjustments before a winning pitch enters the downstream pipeline.
          </p>
        </section>

        {/* Section 6: Discipline */}
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Discipline
          </h2>
          <p>
            Violations of these guidelines are handled through logged warnings, temporary participation suspensions, or permanent account revocation depending on severity. For appeals or inquiries, contact the supervisor desk on Discord.
          </p>
        </section>
      </div>

      {/* Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={onNavigateDocs} />
    </div>
  );
};
