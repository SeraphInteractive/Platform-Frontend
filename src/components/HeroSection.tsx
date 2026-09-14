import React from 'react';
import { VotingRound } from '../hooks/useVotingApi.ts';

interface HeroSectionProps {
  activeRound?: VotingRound;
  totalBallots: number;
  onOpenCreatePitch?: () => void;
  onNavigateBallot?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeRound,
  totalBallots,
  onOpenCreatePitch,
  onNavigateBallot,
}) => {
  return (
    <section className="hero-section">
      {/* Title and subtitle */}
      <div className="hero-left">
        <span className="hero-subtitle">
          Active Round: {activeRound?.title || 'Community Pitches'}
        </span>
        <h1 className="hero-title">Overview</h1>
      </div>

      {/* Layered glowing green card stack with working filter buttons */}
      <div className="hero-card-stack" style={{ position: 'relative' }}>
        {/* Background translucent layers */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: 170,
            width: 320,
            height: 90,
            background: 'rgba(74, 222, 128, 0.25)',
            borderRadius: '20px',
            transform: 'rotate(4deg)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -3,
            right: 180,
            width: 340,
            height: 96,
            background: 'rgba(74, 222, 128, 0.45)',
            borderRadius: '20px',
            transform: 'rotate(2deg)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Foreground main insight card */}
        <div className="insight-card" style={{ position: 'relative', zIndex: 3 }}>
          <div className="insight-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Insights</span>
          </div>
          <div className="insight-text">
            Active round has {totalBallots} verified ballots with 100% mathematical 6N point conservation.
          </div>
        </div>

        {/* Filter controls */}
        <div className="hero-filters" style={{ position: 'relative', zIndex: 3 }}>
          <button
            type="button"
            className="filter-pill"
            onClick={onNavigateBallot}
            title="Go to Ballot Box"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Cast Vote</span>
          </button>

          <button
            type="button"
            className="filter-pill"
            onClick={onOpenCreatePitch}
            title="Submit a new pitch"
            style={{ background: 'var(--accent-dark)', color: '#ffffff', borderColor: 'var(--accent-dark)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Pitch</span>
          </button>
        </div>
      </div>
    </section>
  );
};
