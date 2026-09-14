import React from 'react';
import { NavTabId } from '../../components/Navbar.tsx';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { useScrollDirection } from '../../hooks/useScrollDirection.ts';
import { Footer } from '../../components/Footer.tsx';

interface TermsPageProps {
  onNavigateTab?: (tab: NavTabId) => void;
  onNavigateDocs?: (section: DocsSectionId) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({
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
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Legal Agreement
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Terms
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
            Terms of Service
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
            Last Updated: September 2026 | Effective: 2026-2027 Season
          </div>
        </div>

        {/* Section 1: Acceptance */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Acceptance
          </h2>
          <p>
            By accessing, registering an account via Discord OAuth2, submitting creative material, or participating in voting rounds on this platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must discontinue use of the platform immediately.
          </p>
        </section>

        {/* Section 2: Affiliation */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Affiliation
          </h2>
          <p>
            The Community Film Project is an independent, non-commercial, fan-made initiative. <strong>We are in no way affiliated with, endorsed by, sponsored by, or associated with Mojang Studios, Microsoft Corporation, or their subsidiaries.</strong> All Minecraft trademarks, names, and game assets belong exclusively to their respective owners.
          </p>
        </section>

        {/* Section 3: Eligibility */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Eligibility
          </h2>
          <p>
            Users must possess a valid, authentic Discord account in good standing. Each human participant is permitted exactly one voting account. The creation of secondary, puppet, or automated accounts to influence voting rounds is strictly prohibited and constitutes a material breach of these terms.
          </p>
        </section>

        {/* Section 4: Licensing */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Licensing
          </h2>
          <p>
            When you submit original story pitches, scripts, 3D voxel models, rigs, animations, audio recordings, or sound stems to the platform:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li>You retain ownership and authorial credit over your individual original contribution.</li>
            <li>You grant the project a non-exclusive, worldwide, royalty-free, perpetual license to use, adapt, edit, render, composite, and distribute the contribution as part of the community film, animatics, trailers, and promotional material.</li>
            <li>You represent and warrant that your submission is your own original creation and does not infringe upon third-party copyrights, patents, or proprietary rights.</li>
          </ul>
        </section>

        {/* Section 5: Conduct */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Conduct
          </h2>
          <p>
            All users must maintain constructive, collaborative conduct. Prohibited activities include:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li>Attempting to manipulate ballot tallies via coordinated botting, API scraping, or vote-brigading.</li>
            <li>Uploading malicious files, unauthorized scripts, or harmful payload attachments.</li>
            <li>Submitting plagiarized assets or passing off uncredited third-party work as original.</li>
            <li>Harassing, threatening, or defaming other community creators or project supervisors.</li>
          </ul>
        </section>

        {/* Section 6: Discipline */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Discipline
          </h2>
          <p>
            Enforcement follows a transparent three-tier model: Strike 1 (Formal warning), Strike 2 (48-hour suspension of ballot privileges), Strike 3 (Permanent termination of access and Discord identity blacklisting). Administrative staff reserve the right to immediately invalidate Sybil clusters and ban malicious actors.
          </p>
        </section>

        {/* Section 7: Liability */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Liability
          </h2>
          <p>
            The platform and its associated services are provided on an "as-is" and "as-available" basis without warranties of any kind. Project maintainers and supervisors are not liable for direct, indirect, incidental, or consequential damages resulting from platform downtime, asset loss, or service changes.
          </p>
        </section>

        {/* Section 8: Termination */}
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Termination
          </h2>
          <p>
            Project supervisors reserve the right to suspend or terminate service access for any user who violates these terms or engages in conduct disruptive to the collaborative filmmaking process.
          </p>
        </section>
      </div>

      {/* Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={onNavigateDocs} />
    </div>
  );
};
