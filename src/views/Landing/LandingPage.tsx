import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { VotingEntry, VotingRound } from '../../hooks/useVotingApi.ts';
import { NavTabId } from '../../components/Navbar.tsx';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { TrackShowcase } from './TrackShowcase.tsx';
import { PipelineVisualizer } from './PipelineVisualizer.tsx';

interface LandingPageProps {
  activeRound?: VotingRound;
  entries: VotingEntry[];
  totalBallots: number;
  totalPointsAwarded: number;
  expectedPoints: number;
  isConserved: boolean;
  onNavigateTab: (tab: NavTabId) => void;
  onNavigateDocs?: (section: DocsSectionId) => void;
  onOpenCreatePitch: () => void;
  onSelectEntryForVote?: (entryId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  activeRound,
  entries,
  totalBallots,
  onNavigateTab,
  onNavigateDocs,
  onOpenCreatePitch,
  onSelectEntryForVote,
}) => {
  const { user, loginWithDiscord } = useAuth();

  const handleDocClick = (section: DocsSectionId) => {
    if (onNavigateDocs) {
      onNavigateDocs(section);
    } else {
      onNavigateTab('docs');
    }
  };

  return (
    <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* 1. Welcoming Hero Banner */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            The Community Minecraft Movie
          </h1>

          <div className="landing-hero-actions">
            <button
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '15px', fontWeight: 700 }}
              onClick={() => onNavigateTab('pitches')}
            >
              Explore
            </button>
          </div>
        </div>
      </section>

      {/* 2. 5 Production Tracks Showcase */}
      <TrackShowcase
        onNavigateDocs={handleDocClick}
        onOpenCreatePitch={onOpenCreatePitch}
      />

      {/* 3. Production Pipeline Lifecycle */}
      <PipelineVisualizer
        onNavigateDocs={handleDocClick}
      />

      {/* 6. Community Highlights Strip */}
      <section className="landing-metrics-grid">
        <div className="landing-metric-card">
          <div className="landing-metric-label">Round</div>
          <div className="landing-metric-value text-blue">{activeRound?.title || 'Round 01'}</div>
        </div>

        <div className="landing-metric-card">
          <div className="landing-metric-label">Pitches</div>
          <div className="landing-metric-value mono">{entries.length}</div>
        </div>

        <div className="landing-metric-card">
          <div className="landing-metric-label">Votes</div>
          <div className="landing-metric-value mono text-green">{totalBallots}</div>
        </div>

        <div className="landing-metric-card">
          <div className="landing-metric-label">Status</div>
          <div className="landing-metric-value text-green">Open</div>
        </div>
      </section>

      {/* 7. Community Proposals Grid */}
      <section className="tab-content-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="tab-title">Proposals</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('pitches')}
            >
              View All ({entries.length})
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenCreatePitch}
            >
              + Submit Pitch
            </button>
          </div>
        </div>

        <div className="landing-proposals-grid">
          {entries.length === 0 ? (
            <div style={{ padding: '32px 16px', color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>
              No proposals submitted yet for this round.
            </div>
          ) : (
            entries.slice(0, 4).map((entry) => (
              <div key={entry.id} className="landing-proposal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-engine">
                    {entry.category || 'Pitch'}
                  </span>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    {entry.id}
                  </span>
                </div>

                <div className="landing-proposal-title">{entry.title}</div>

                <div className="landing-proposal-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'var(--bg-card-muted)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {(entry.submitterUsername || 'C')[0]}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {entry.submitterUsername || 'Creator'}
                    </span>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                    onClick={() => {
                      if (onSelectEntryForVote) onSelectEntryForVote(entry.id);
                      onNavigateTab('ballot');
                    }}
                  >
                    Vote
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 8. Call To Action Showcase */}
      <section className="landing-showcase-card reverse">
        <div className="landing-showcase-body">
          <div className="landing-cta-headline">Join</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Pitch your ideas, vote on community scenes, and animate winning shots.
          </div>

          <div style={{ marginTop: 8 }}>
            {user ? (
              <button
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '15px' }}
                onClick={onOpenCreatePitch}
              >
                + Submit Pitch
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '15px' }}
                onClick={loginWithDiscord}
              >
                Join with Discord
              </button>
            )}
          </div>
        </div>

        <div className="landing-art-container">
          <img src="/images/stock_03.jpg" alt="Minecraft scene" className="landing-art-img" />
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-links">
          <button className="landing-footer-link" onClick={() => onNavigateTab('overview')}>Overview</button>
          <button className="landing-footer-link" onClick={() => onNavigateTab('ballot')}>Ballot Box</button>
          <button className="landing-footer-link" onClick={() => onNavigateTab('pitches')}>Pitches</button>
          <button className="landing-footer-link" onClick={() => onNavigateTab('leaderboard')}>Leaderboard</button>
          <button className="landing-footer-link" onClick={() => handleDocClick('overview')}>Docs</button>
          <button className="landing-footer-link" onClick={() => onNavigateTab('settings')}>Settings</button>
        </div>
        <div className="landing-footer-build mono">
          Build v1.0.0-rc4
        </div>
      </footer>
    </div>
  );
};
