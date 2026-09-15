import React from 'react';
import { NavTabId } from '../../components/Navbar.tsx';

interface GrabBoxPageProps {
  onNavigateTab: (tab: NavTabId) => void;
}

export const GrabBoxPage: React.FC<GrabBoxPageProps> = ({ onNavigateTab }) => {
  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: '36px 32px', textAlign: 'center', background: 'var(--bg-card)' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
          GrabBox
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          GrabBox is currently under construction. Once voting concludes, animators and creators will be able to claim shots and upload scene files here.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('ballot')}>
            Vote
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('progress')}>
            Progress
          </button>
        </div>
      </div>
    </div>
  );
};
