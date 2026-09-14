import React from 'react';
import { NavTabId } from '../../components/Navbar.tsx';

interface GrabBoxPageProps {
  onNavigateTab: (tab: NavTabId) => void;
}

export const GrabBoxPage: React.FC<GrabBoxPageProps> = ({ onNavigateTab }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '28px 36px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Asset Dispatcher
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              GrabBox
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-warning">
              IN DEVELOPMENT
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('ballot')}>
              Vote
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('progress')}>
              Progress
            </button>
          </div>
        </div>
      </div>

      {/* Handwritten / Parchment Developer Notice Card */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1c1826 0%, #151220 100%)',
          border: '2px dashed rgba(168, 85, 247, 0.4)',
          borderRadius: '16px',
          padding: '48px 40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(168, 85, 247, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative pin/tack */}
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f43f5e 40%, #881337 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 10px rgba(244, 63, 94, 0.4)',
            marginBottom: -8,
          }}
        />

        {/* Handwritten Styled Note Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '32px 36px',
            maxWidth: 640,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="minecraft-font"
            style={{
              fontSize: '22px',
              color: '#facc15',
              letterSpacing: '1px',
              textShadow: '2px 2px 0px #000',
              marginBottom: 16,
            }}
          >
            COMING SOON
          </div>

          <div
            style={{
              fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'var(--text-main)',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '20px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              textAlign: 'left',
            }}
          >
            <div style={{ color: '#a855f7', fontWeight: 700, marginBottom: 8 }}>
              [NOTICE: STAGE INDEV]
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              The GrabBox 3D shot package dispatcher is currently under active construction.
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '13px' }}>
              Planned capabilities:
              <br />
              * glTF scene checkout and camera rigging
              <br />
              * Decentralized shot reservations
              <br />
              * Direct render upload pipelines
            </div>
            <div style={{ color: '#eab308', marginTop: 16, fontSize: '12px', fontStyle: 'italic' }}>
              Check back following the conclusion of story arc voting.
            </div>
          </div>
        </div>

        {/* Quick action back to active areas */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => onNavigateTab('ballot')}>
            Cast Vote
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigateTab('progress')}>
            View Progress
          </button>
        </div>
      </div>
    </div>
  );
};
