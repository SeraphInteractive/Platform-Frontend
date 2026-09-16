import React from 'react';
import { NavTabId } from '../../components/Navbar.tsx';

interface GrabBoxPageProps {
  onNavigateTab: (tab: NavTabId) => void;
}

export const GrabBoxPage: React.FC<GrabBoxPageProps> = ({ onNavigateTab }) => {
  return (
    <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px', width: '100%' }}>
      <div
        className="card"
        style={{
          padding: '48px 36px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
          GrabBox
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', maxWidth: 440, margin: 0, lineHeight: 1.5 }}>
          Production task dispatch and shot claiming in development.
        </p>
        <div style={{ marginTop: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('ballot')}
          >
            Proposals
          </button>
        </div>
      </div>
    </div>
  );
};

