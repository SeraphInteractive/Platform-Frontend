import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { VotingEntry, VotingRound } from '../../hooks/useVotingApi.ts';
import { NavTabId } from '../../components/Navbar.tsx';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { Footer } from '../../components/Footer.tsx';

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
  onNavigateTab,
  onNavigateDocs,
  onOpenCreatePitch,
}) => {
  const { user, loginWithDiscord } = useAuth();

  return (
    <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* 1. Welcoming Hero Banner */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Project Minecraft
          </h1>

          <div className="landing-hero-actions">
            <button
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '15px', fontWeight: 700 }}
              onClick={() => onNavigateTab('ballot')}
            >
              Explore
            </button>
            {user ? (
              <button
                className="btn btn-secondary"
                style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
                onClick={onOpenCreatePitch}
              >
                + Submit Pitch
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
                onClick={loginWithDiscord}
              >
                Join with Discord
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Call To Action Showcase */}
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

      {/* 3. Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={onNavigateDocs} />
    </div>
  );
};
