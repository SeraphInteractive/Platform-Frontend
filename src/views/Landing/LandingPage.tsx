import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { VotingEntry, VotingRound } from '../../hooks/useVotingApi.ts';
import { NavTabId } from '../../components/Navbar.tsx';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { TrackShowcase } from './TrackShowcase.tsx';
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
  activeRound,
  onNavigateTab,
  onNavigateDocs,
  onOpenCreatePitch,
}) => {
  const { user, loginWithDiscord } = useAuth();

  return (
    <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Welcoming Hero Banner */}
      <section
        className="landing-hero"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          backgroundImage: `linear-gradient(180deg, rgba(6, 9, 19, 0.42) 0%, rgba(6, 9, 19, 0.88) 100%), url('/images/scaffold/artstation_cover.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 24px',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 16,
            maxWidth: 720,
          }}
        >
          {/* Active Round Status Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(6, 9, 19, 0.8)',
              backdropFilter: 'blur(8px)',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#f8fafc',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span>Active Round: {activeRound?.title || 'Community Pitches'}</span>
          </div>

          <h1
            style={{
              fontSize: '38px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Project Stairway
          </h1>

          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700, borderRadius: '8px' }}
              onClick={() => onNavigateTab('ballot')}
            >
              Explore Proposals
            </button>
            {user ? (
              <button
                className="btn btn-secondary"
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  border: 'none',
                }}
                onClick={onOpenCreatePitch}
              >
                + Submit Pitch
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  border: 'none',
                }}
                onClick={loginWithDiscord}
              >
                Join with Discord
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Interactive Production Tracks Showcase */}
      <TrackShowcase
        onNavigateDocs={onNavigateDocs || (() => {})}
        onOpenCreatePitch={onOpenCreatePitch}
      />

      {/* 4. Production Overview Card */}
      <section className="landing-showcase-card reverse">
        <div className="landing-showcase-body">
          <div className="landing-cta-headline">Production</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
            Pitch ideas, vote on scenes, and follow production milestones.
          </div>

          {/* 4-Step Minimal Milestone Flow */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4 }}>
            {[
              { num: '1', name: 'Pitch' },
              { num: '2', name: 'Vote' },
              { num: '3', name: 'Claim' },
              { num: '4', name: 'Cut' },
            ].map((s) => (
              <div
                key={s.num}
                style={{
                  background: 'var(--bg-card-muted)',
                  borderRadius: '8px',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8' }}>
                  0{s.num}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                  {s.name}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {user ? (
              <button
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
                onClick={onOpenCreatePitch}
              >
                + Submit Pitch
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
                onClick={loginWithDiscord}
              >
                Join with Discord
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '13px' }}
              onClick={() => onNavigateTab('progress')}
            >
              Production Ledger
            </button>
          </div>
        </div>

        <div className="landing-art-container">
          <img
            src="/images/scaffold/birch_forest.jpg"
            alt="Minecraft birch forest concept art"
            className="landing-art-img"
          />
        </div>
      </section>

      {/* 5. Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={onNavigateDocs} />
    </div>
  );
};
