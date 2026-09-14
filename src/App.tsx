import React, { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider, useSettings } from './context/SettingsContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, NavTabId } from './components/Navbar.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { CreatePitchModal } from './components/CreatePitchModal.tsx';
import { CreateRoundModal } from './components/CreateRoundModal.tsx';
import { BlazeTransitionOverlay, type BlazeTransitionRef } from './components/BlazeTransitionOverlay.tsx';
import { LandingPage } from './views/Landing/LandingPage.tsx';
import { OverviewDashboard } from './views/Dashboard/OverviewDashboard.tsx';
import { PitchCatalog } from './views/VoterApp/PitchCatalog.tsx';
import { BallotBox } from './views/VoterApp/BallotBox.tsx';
import { PublicLeaderboard } from './views/VoterApp/PublicLeaderboard.tsx';
import { DevWorkbench } from './views/DevWorkbench/DevWorkbench.tsx';
import { SettingsPage, SettingsSubTab } from './views/Settings/SettingsPage.tsx';
import { DocsPage, DocsSectionId } from './views/Docs/DocsPage.tsx';
import {
  useActiveRound,
  useVotingRounds,
  useRoundEntries,
  useMyBallot,
  useLiveLeaderboard,
  useCastBallot,
  type VotingRound,
} from './hooks/useVotingApi.ts';
import { sounds } from './utils/soundEffects.ts';

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

  const currentRoundId = selectedRoundId || activeRound?.id || 'round-01';
  const currentRound = rounds.find((r: VotingRound) => r.id === currentRoundId) || activeRound;

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

  // Rank assignment handler ensuring uniqueness across the 3 slots
  const handleSelectRank = (rank: 1 | 2 | 3, entryId: string) => {
    if (rank === 1) {
      if (rank2 === entryId) setRank2('');
      if (rank3 === entryId) setRank3('');
      setRank1(entryId);
    } else if (rank === 2) {
      if (rank1 === entryId) setRank1('');
      if (rank3 === entryId) setRank3('');
      setRank2(entryId);
    } else if (rank === 3) {
      if (rank1 === entryId) setRank1('');
      if (rank2 === entryId) setRank2('');
      setRank3(entryId);
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
      sounds.playLevelUp();
      setBallotSuccessMessage('Your ballot was successfully recorded in the live pool.');
      setTimeout(() => setBallotSuccessMessage(null), 5000);
    } catch (err: unknown) {
      sounds.playReset();
      alert(`Failed to cast ballot: ${err instanceof Error ? err.message : String(err)}`);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar with role-based tabs, theme toggle, and profile */}
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
      <main className="dashboard-container" style={{ flex: 1 }}>
        <div key={activeTab} className="page-view-wrapper">
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

          {activeTab === 'overview' && (
            <OverviewDashboard
              onNavigateTab={handleTabChange}
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
            <div className="tab-content-area">
              {ballotSuccessMessage && (
                <div className="callout callout-success" style={{ marginBottom: 16 }}>
                  {ballotSuccessMessage}
                </div>
              )}

              {/* Ballot Slots */}
              <BallotBox
                entries={entries}
                rank1={rank1}
                rank2={rank2}
                rank3={rank3}
                myBallot={myBallot}
                isSubmitting={castBallotMutation.isPending}
                onClearSlot={handleClearSlot}
                onSubmitBallot={handleSubmitBallot}
                voterId={user?.id || user?.discordId || 'community_voter'}
              />

              {/* Proposal Catalog for easy ranking selection */}
              <PitchCatalog
                entries={entries}
                activeRound={currentRound}
                rounds={rounds}
                selectedRoundId={currentRoundId}
                onSelectRound={setSelectedRoundId}
                selectedRank1={rank1}
                selectedRank2={rank2}
                selectedRank3={rank3}
                onSelectRank={handleSelectRank}
                onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
                onOpenCreateRound={() => setIsCreateRoundOpen(true)}
              />
            </div>
          )}

          {activeTab === 'pitches' && (
            <div className="tab-content-area">
              <PitchCatalog
                entries={entries}
                activeRound={currentRound}
                rounds={rounds}
                selectedRoundId={currentRoundId}
                onSelectRound={setSelectedRoundId}
                selectedRank1={rank1}
                selectedRank2={rank2}
                selectedRank3={rank3}
                onSelectRank={(r, id) => {
                  handleSelectRank(r, id);
                  handleTabChange('ballot');
                }}
                onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
                onOpenCreateRound={() => setIsCreateRoundOpen(true)}
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
              />
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="tab-content-area">
              <DocsPage
                initialSection={docsSection}
                onNavigateTab={handleTabChange}
                onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
              />
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="tab-content-area">
              <DevWorkbench />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              initialSubTab={settingsSubTab}
              onNavigateTab={handleTabChange}
              onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
            />
          )}
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
      />

      {/* Submit Proposal Modal */}
      <CreatePitchModal
        isOpen={isCreatePitchOpen}
        roundId={currentRoundId}
        onClose={() => setIsCreatePitchOpen(false)}
        onCreated={() => {
          setIsCreatePitchOpen(false);
          setActiveTab('pitches');
        }}
      />

      {/* Create Round Modal (Admin Only) */}
      <CreateRoundModal
        isOpen={isCreateRoundOpen}
        onClose={() => setIsCreateRoundOpen(false)}
        onCreated={(newRoundId) => {
          setIsCreateRoundOpen(false);
          setSelectedRoundId(newRoundId);
          setActiveTab('pitches');
        }}
      />

      {/* Clean Light Footer */}
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
        }}
      >
        <div>
          <span className="mono">@platform/vote-ui</span> | Connected to @platform/internal-logic and vote-api
        </div>
        <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          Build v1.0.0-rc4 (2026.09.13)
        </div>
      </footer>
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
