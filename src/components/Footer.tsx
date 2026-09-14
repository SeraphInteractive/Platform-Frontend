import React from 'react';
import { NavTabId } from './Navbar.tsx';
import { DocsSectionId } from '../views/Docs/DocsPage.tsx';

interface FooterProps {
  onNavigateTab?: (tab: NavTabId) => void;
  onNavigateDocs?: (section: DocsSectionId) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateTab,
  onNavigateDocs,
}) => {
  const handleDocs = (section: DocsSectionId) => {
    if (onNavigateDocs) {
      onNavigateDocs(section);
    } else if (onNavigateTab) {
      onNavigateTab('docs');
    }
  };

  const handleTab = (tab: NavTabId) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  return (
    <footer
      style={{
        width: '100%',
        marginTop: 48,
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        padding: '48px 24px 32px 24px',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 36,
          marginBottom: 40,
        }}
      >
        {/* Column 1: Links */}
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: 14,
              letterSpacing: '-0.01em',
            }}
          >
            Links
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <button
                onClick={() => handleTab('progress')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Progress
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocs('pipeline')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Roadmap
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTab('diagnostics')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Terminal
              </button>
            </li>
          </ul>
        </div>

        {/* Column 2: Community */}
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: 14,
              letterSpacing: '-0.01em',
            }}
          >
            Community
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                YouTube
              </a>
            </li>
            <li>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Discord
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Twitter
              </a>
            </li>
            <li>
              <a
                href="https://bsky.app"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                BlueSky
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Docs */}
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: 14,
              letterSpacing: '-0.01em',
            }}
          >
            Docs
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <button
                onClick={() => handleDocs('overview')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Introduction
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocs('tracks')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Tracks
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocs('terminology')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Terminology
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocs('voting')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Voting
              </button>
            </li>
            <li>
              <button
                onClick={() => handleDocs('roles')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Roles
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Legal */}
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: 14,
              letterSpacing: '-0.01em',
            }}
          >
            Legal
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <a
                href="https://seraphinteractive.com/privacy/"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="https://seraphinteractive.com/terms/"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Terms of Service
              </a>
            </li>
            <li>
              <button
                onClick={() => handleTab('guidelines')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Guidelines
              </button>
            </li>
          </ul>
        </div>

        {/* Column 5: Partners */}
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: 14,
              letterSpacing: '-0.01em',
            }}
          >
            Partners
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <a
                href="https://seraphinteractive.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <img
                  src="/partners/seraph.svg"
                  alt="Seraph Interactive"
                  style={{ width: 16, height: 16, borderRadius: 4 }}
                />
                Seraph Interactive
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@SquaredMediaYT"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <img
                  src="/partners/squared-media.png"
                  alt="Squared Media"
                  style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }}
                />
                Squared Media
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          paddingTop: 24,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        <div>
          (C) 2026-2027 Community Film Project. All rights reserved.
        </div>
        <div style={{ textAlign: 'right' }}>
          We are in no way affiliated with Mojang. This is a fan-made community project.
        </div>
      </div>
    </footer>
  );
};
