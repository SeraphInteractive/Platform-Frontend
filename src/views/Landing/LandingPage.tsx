import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { VotingEntry, VotingRound } from '../../hooks/useVotingApi.ts';
import { NavTabId } from '../../components/Navbar.tsx';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { TrackShowcase } from './TrackShowcase.tsx';
import { Footer } from '../../components/Footer.tsx';
import { useScrollReveal } from '../../hooks/useScrollReveal.ts';

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
  useScrollReveal();

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
          <h1
            className="font-minecraft"
            style={{
              fontSize: '38px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.04em',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Project Stairway
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#e2e8f0',
              margin: 0,
              maxWidth: 540,
              lineHeight: 1.5,
            }}
          >
            Community-driven cinematic production with consensus voting.
          </p>

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

      {/* 2. Interactive Production Tracks Showcase Panels */}
      <TrackShowcase
        onNavigateDocs={onNavigateDocs || (() => {})}
        onOpenCreatePitch={onOpenCreatePitch}
      />

      {/* 3. Production Overview Card (Slide in Right) */}
      <section className="landing-showcase-card reverse panel-reveal-right">
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

      {/* 4. Community Discord Card (Slide in Left) */}
      <section className="landing-showcase-card panel-reveal-left">
        <div className="landing-art-container">
          <img
            src="/images/scaffold/swamp_night.jpg"
            alt="Project Stairway Community"
            className="landing-art-img"
          />
        </div>
        <div className="landing-showcase-body">
          <div className="landing-cta-headline">Discord Community</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Connect with contributors and follow production in real time.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <a
              href="https://discord.gg/xwetf5cg6c"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </div>
      </section>

      {/* 5. Footer (Fade in) */}
      <div className="panel-reveal-fade">
        <Footer onNavigateTab={onNavigateTab} onNavigateDocs={onNavigateDocs} />
      </div>
    </div>
  );
};

