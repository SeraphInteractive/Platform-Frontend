import React from 'react';
import { NavTabId } from '../../components/Navbar.tsx';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { useScrollDirection } from '../../hooks/useScrollDirection.ts';
import { Footer } from '../../components/Footer.tsx';

interface PrivacyPageProps {
  onNavigateTab?: (tab: NavTabId) => void;
  onNavigateDocs?: (section: DocsSectionId) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({
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
            Privacy
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
            Privacy Policy
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
            Last Updated: September 2026 | Effective Date: September 2026
          </div>
        </div>

        {/* Section 1: Overview */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Overview
          </h2>
          <p>
            Project Stairway operates as a decentralized, non-commercial collaborative media initiative. We are committed to protecting the privacy of all contributors, voters, animators, and community visitors. This Privacy Policy details the categories of data we collect, how that information is utilized to operate consensus voting rounds and asset pipelines, and your rights regarding data retention and deletion.
          </p>
          <p>
            We do not sell, rent, monetize, or trade personal data to third-party commercial data brokers under any circumstances.
          </p>
        </section>

        {/* Section 2: Collection */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Collection
          </h2>
          <p>
            We adhere to data minimization principles. We only collect information strictly required to authenticate user sessions, enforce one-person-one-vote invariants, and attribute creative contributions:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li><strong>Authentication Identifiers:</strong> When logging in via Discord OAuth2, we receive your public Discord user ID, username, global display name, and avatar hash. We do not access your email address, private messages, server rosters, or payment methods.</li>
            <li><strong>Ballots & Votes:</strong> The choices, rankings (Rank 1, Rank 2, Rank 3), and timestamps associated with your participation in voting rounds.</li>
            <li><strong>Creative Submissions:</strong> Uploaded pitch descriptions, audio voice stems, glTF 3D models, textures, animations, and GrabBox render files.</li>
            <li><strong>Telemetry & Anomaly Logs:</strong> Anonymized submission velocity, entropy scores, and browser user-agent strings used exclusively for anti-raid defense and Sybil cluster mitigation.</li>
          </ul>
        </section>

        {/* Section 3: Usage */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Usage
          </h2>
          <p>
            The information collected is processed exclusively for the following purposes:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li>Aggregating consensus tallies under the 3-2-1 Borda count algorithm and verifying the 6N point conservation invariant.</li>
            <li>Tracking GrabBox task checkout timers and shot delivery fulfillment.</li>
            <li>Detecting automated vote raids, script injection, and Sybil clusters via the Batman Protocol telemetry engine.</li>
            <li>Crediting artists, voice actors, and writers accurately in community devlogs, promotional trailers, and final film credits.</li>
          </ul>
        </section>

        {/* Section 4: Storage */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Storage
          </h2>
          <p>
            Authentication tokens and user settings (theme preference, developer mode) are stored locally in your browser via <code>localStorage</code>. Relational records and ballot tallies are stored in secure, encrypted PostgreSQL databases with serializable isolation. Creative assets (render packages, audio clips, 3D scenes) are hosted on Cloudflare R2 / S3 object storage with presigned URLs and SHA-256 checksum verification.
          </p>
        </section>

        {/* Section 5: Security */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Security
          </h2>
          <p>
            All network communication requires TLS 1.3 transport encryption. Administrative endpoints require cryptographically signed Bearer tokens and role-based access checks. Database backups are encrypted at rest with AES-256. In the event of a suspected security anomaly or credential compromise, affected sessions are invalidated across all active nodes.
          </p>
        </section>

        {/* Section 6: Rights */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Rights
          </h2>
          <p>
            Community members have the following data rights:
          </p>
          <ul style={{ paddingLeft: 22, margin: '10px 0 14px 0' }}>
            <li><strong>Access:</strong> You may request a complete export of your recorded pitches, ballots, and GrabBox deliverables.</li>
            <li><strong>Rectification:</strong> You may update your public display attribution or creator bio through platform settings.</li>
            <li><strong>Erasure:</strong> You may request deletion of your account and unlinking of your Discord identity. Completed public voting rounds retain anonymized mathematical tallies to preserve historic consensus integrity.</li>
          </ul>
        </section>

        {/* Section 7: Contact */}
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, margin: '0 0 14px 0' }}>
            Contact
          </h2>
          <p>
            For privacy inquiries, data deletion requests, or security audits, contact the platform governance team via the official community Discord server or open a confidential ticket with the project administrators.
          </p>
        </section>
      </div>

      {/* Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={onNavigateDocs} />
    </div>
  );
};
