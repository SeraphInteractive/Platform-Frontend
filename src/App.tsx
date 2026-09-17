import React, { useState, useEffect, useRef, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider, useSettings } from './context/SettingsContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, NavTabId } from './components/Navbar.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { CreatePitchModal } from './components/CreatePitchModal.tsx';
import { CreateRoundModal } from './components/CreateRoundModal.tsx';
import { BlazeTransitionOverlay, type BlazeTransitionRef } from './components/BlazeTransitionOverlay.tsx';
import { SkeletonCard } from './components/Skeleton.tsx';
import { LandingPage } from './views/Landing/LandingPage.tsx';
import { VotePage } from './views/VoterApp/VotePage.tsx';
import { PublicLeaderboard } from './views/VoterApp/PublicLeaderboard.tsx';
import { type SettingsSubTab } from './views/Settings/SettingsPage.tsx';
import { type DocsSectionId } from './views/Docs/DocsPage.tsx';

// Code-split secondary views with React.lazy
const DevWorkbench = React.lazy(() =>
  import('./views/DevWorkbench/DevWorkbench.tsx').then((m) => ({ default: m.DevWorkbench }))
);
const DocsPage = React.lazy(() =>
  import('./views/Docs/DocsPage.tsx').then((m) => ({ default: m.DocsPage }))
);
const GrabBoxPage = React.lazy(() =>
  import('./views/GrabBox/GrabBoxPage.tsx').then((m) => ({ default: m.GrabBoxPage }))
);
const ProgressPage = React.lazy(() =>
  import('./views/Progress/ProgressPage.tsx').then((m) => ({ default: m.ProgressPage }))
);
const SettingsPage = React.lazy(() =>
  import('./views/Settings/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage }))
);
const PrivacyPage = React.lazy(() =>
  import('./views/Legal/PrivacyPage.tsx').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = React.lazy(() =>
  import('./views/Legal/TermsPage.tsx').then((m) => ({ default: m.TermsPage }))
);
const GuidelinesPage = React.lazy(() =>
  import('./views/Legal/GuidelinesPage.tsx').then((m) => ({ default: m.GuidelinesPage }))
);
import {
  useActiveRound,
  useVotingRounds,
  useRoundEntries,
  useMyBallot,
  useLiveLeaderboard,
  useCastBallot,
  type VotingRound,
} from './hooks/useVotingApi.ts';

// TanStack Query client with real-time polling defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const MainDashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTabId>('landing');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('account_info');
  const [docsSection, setDocsSection] = useState<DocsSectionId>('overview');
  const [isCreatePitchOpen, setIsCreatePitchOpen] = useState(false);
  const [isCreateRoundOpen, setIsCreateRoundOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const { data: rounds = [] } = useVotingRounds();
  const { activeRound } = useActiveRound();
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const currentRoundId = selectedRoundId || activeRound?.id || '';
  const currentRound = rounds.find((r: VotingRound) => r.id === currentRoundId) || activeRound || undefined;

  const { data: entries = [] } = useRoundEntries(currentRoundId);
  const { data: myBallot } = useMyBallot(currentRoundId);
  const { data: boardData } = useLiveLeaderboard(currentRoundId, entries);

  // Shared ballot selection state
  const [rank1, setRank1] = useState<string>('');
  const [rank2, setRank2] = useState<string>('');
  const [rank3, setRank3] = useState<string>('');
  const [ballotSuccessMessage, setBallotSuccessMessage] = useState<string | null>(null);

  // Auto-populate ballot if user has a recorded ballot in this round
  useEffect(() => {
    if (myBallot) {
      setRank1(myBallot.rank1);
      setRank2(myBallot.rank2);
      setRank3(myBallot.rank3);
    } else {
      setRank1('');
      setRank2('');
      setRank3('');
    }
  }, [myBallot, currentRoundId]);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const castBallotMutation = useCastBallot(currentRoundId);

  // Rank assignment handler with bidirectional swapping and rearrange support
  const handleSelectRank = (rank: 1 | 2 | 3, entryId: string) => {
    const sourceSlot: 1 | 2 | 3 | null =
      rank1 === entryId ? 1 : rank2 === entryId ? 2 : rank3 === entryId ? 3 : null;

    if (sourceSlot === rank) return;

    const currentTargetOccupant = rank === 1 ? rank1 : rank === 2 ? rank2 : rank3;

    if (sourceSlot) {
      // Swapping between slots: target gets entryId, source gets current target occupant
      if (rank === 1) setRank1(entryId);
      else if (rank === 2) setRank2(entryId);
      else if (rank === 3) setRank3(entryId);

      if (sourceSlot === 1) setRank1(currentTargetOccupant);
      else if (sourceSlot === 2) setRank2(currentTargetOccupant);
      else if (sourceSlot === 3) setRank3(currentTargetOccupant);
    } else {
      // Direct assignment from pool into slot
      if (rank === 1) setRank1(entryId);
      else if (rank === 2) setRank2(entryId);
      else if (rank === 3) setRank3(entryId);
    }
  };

  const handleClearSlot = (rank: 1 | 2 | 3) => {
    if (rank === 1) setRank1('');
    if (rank === 2) setRank2('');
    if (rank === 3) setRank3('');
  };

  const handleSubmitBallot = async () => {
    if (!rank1 || !rank2 || !rank3) return;

    try {
      await castBallotMutation.mutateAsync({
        rank1,
        rank2,
        rank3,
      });
      setBallotSuccessMessage('Your vote was successfully recorded in the live pool.');
      setTimeout(() => setBallotSuccessMessage(null), 5000);
    } catch (err: unknown) {
      alert(`Failed to cast vote: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const blazeRef = useRef<BlazeTransitionRef | null>(null);
  const { settings } = useSettings();

  const handleTabChange = (newTab: NavTabId) => {
    if (newTab === activeTab) return;
    if (settings.reducedMotion) {
      setActiveTab(newTab);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    blazeRef.current?.startTransition(() => {
      setActiveTab(newTab);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

  const isHomePage = activeTab === 'landing';
  const isBallotPage = activeTab === 'ballot';

  return (
    <div className={`app-root-layout ${isHomePage ? 'layout-homepage' : 'layout-with-sidebar'}`}>
      {/* Dynamic Navbar: top floating pill on Home, left vertical icon rail on all other views */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavigateSettings={(subTab) => {
          if (subTab) setSettingsSubTab(subTab);
          handleTabChange('settings');
        }}
        onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`dashboard-container ${isHomePage ? 'container-homepage' : 'container-sidebar'}`}>
        <div key={activeTab} className={`page-view-wrapper ${isBallotPage ? 'page-non-scroll' : 'page-scrollable'}`}>
          {activeTab === 'landing' && (
            <LandingPage
              activeRound={currentRound}
              entries={entries}
              totalBallots={boardData?.totalBallots || 0}
              totalPointsAwarded={boardData?.totalPointsAwarded || 0}
              expectedPoints={boardData?.expectedPoints || 0}
              isConserved={boardData?.isConserved ?? true}
              onNavigateTab={handleTabChange}
              onNavigateDocs={(section) => {
                setDocsSection(section);
                handleTabChange('docs');
              }}
              onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
              onSelectEntryForVote={(id) => {
                if (!rank1) setRank1(id);
                else if (!rank2) setRank2(id);
                else if (!rank3) setRank3(id);
                else setRank1(id);
                handleTabChange('ballot');
              }}
            />
          )}

          {activeTab === 'ballot' && (
            <div className="tab-content-area" style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
              {ballotSuccessMessage && (
                <div className="callout callout-success" style={{ marginBottom: 12, flexShrink: 0 }}>
                  {ballotSuccessMessage}
                </div>
              )}

              {/* Vote Page with slot machine roller and drag-and-drop slots */}
              <VotePage
                activeRound={currentRound}
                entries={entries}
                rank1={rank1}
                rank2={rank2}
                rank3={rank3}
                myBallot={myBallot}
                isSubmitting={castBallotMutation.isPending}
                onSelectRank={handleSelectRank}
                onClearSlot={handleClearSlot}
                onSubmitBallot={handleSubmitBallot}
                onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
                voterId={user?.id || user?.discordId || 'community_voter'}
              />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="tab-content-area">
              <PublicLeaderboard
                entries={entries}
                leaderboard={boardData?.leaderboard}
                totalBallots={boardData?.totalBallots}
                expectedPoints={boardData?.expectedPoints}
                onSelectEntryForVote={(id) => {
                  if (!rank1) setRank1(id);
                  else if (!rank2) setRank2(id);
                  else if (!rank3) setRank3(id);
                  else setRank1(id);
                  handleTabChange('ballot');
                }}
                onNavigateBallot={() => handleTabChange('ballot')}
              />
            </div>
          )}

          <Suspense
            fallback={
              <div className="tab-content-area" style={{ padding: 24 }}>
                <SkeletonCard height={360} />
              </div>
            }
          >
            {activeTab === 'docs' && (
              <div className="tab-content-area">
                <DocsPage
                  initialSection={docsSection}
                  onNavigateTab={handleTabChange}
                  onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
                />
              </div>
            )}

            {activeTab === 'grabbox' && (
              <div className="tab-content-area">
                <GrabBoxPage onNavigateTab={handleTabChange} />
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="tab-content-area">
                <ProgressPage
                  onNavigateTab={handleTabChange}
                  onOpenCreateRound={() => setIsCreateRoundOpen(true)}
                />
              </div>
            )}

            {activeTab === 'diagnostics' && (
              <div className="tab-content-area">
                <DevWorkbench
                  onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
                  onOpenCreateRound={() => setIsCreateRoundOpen(true)}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                initialSubTab={settingsSubTab}
                onNavigateTab={handleTabChange}
                onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
              />
            )}

            {activeTab === 'privacy' && (
              <div className="tab-content-area">
                <PrivacyPage
                  onNavigateTab={handleTabChange}
                  onNavigateDocs={(section) => {
                    setDocsSection(section);
                    handleTabChange('docs');
                  }}
                />
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="tab-content-area">
                <TermsPage
                  onNavigateTab={handleTabChange}
                  onNavigateDocs={(section) => {
                    setDocsSection(section);
                    handleTabChange('docs');
                  }}
                />
              </div>
            )}

            {activeTab === 'guidelines' && (
              <div className="tab-content-area">
                <GuidelinesPage
                  onNavigateTab={handleTabChange}
                  onNavigateDocs={(section) => {
                    setDocsSection(section);
                    handleTabChange('docs');
                  }}
                />
              </div>
            )}
          </Suspense>
        </div>
      </main>

      {/* Cinematic Blaze Transition Overlay */}
      <BlazeTransitionOverlay ref={blazeRef} reducedMotion={settings.reducedMotion} />

      {/* Quick Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={handleTabChange}
        onNavigateDocs={(section) => {
          setDocsSection(section);
          handleTabChange('docs');
        }}
        onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
        onOpenCreateRound={() => setIsCreateRoundOpen(true)}
      />

      {/* Submit Proposal Modal */}
      <CreatePitchModal
        isOpen={isCreatePitchOpen}
        roundId={currentRoundId}
        onClose={() => setIsCreatePitchOpen(false)}
        onCreated={() => {
          setIsCreatePitchOpen(false);
          handleTabChange('ballot');
        }}
      />

      {/* Create Round Modal (Admin Only) */}
      <CreateRoundModal
        isOpen={isCreateRoundOpen}
        onClose={() => setIsCreateRoundOpen(false)}
        onCreated={(newRoundId) => {
          setIsCreateRoundOpen(false);
          setSelectedRoundId(newRoundId);
          handleTabChange('ballot');
        }}
      />

      {/* Clean Light Footer only on Homepage */}
      {isHomePage && (
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '16px 32px',
            color: 'var(--text-light)',
            fontSize: '11px',
            background: 'var(--bg-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <span className="mono">@projectstairway</span>
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Build v1.0.0-rc4 (2026.09.13)
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <MainDashboardLayout />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
