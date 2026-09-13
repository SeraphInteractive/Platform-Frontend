import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, NavTabId } from './components/Navbar.tsx';
import { CreatePitchModal } from './components/CreatePitchModal.tsx';
import { OverviewDashboard } from './views/Dashboard/OverviewDashboard.tsx';
import { PitchCatalog } from './views/VoterApp/PitchCatalog.tsx';
import { BallotBox } from './views/VoterApp/BallotBox.tsx';
import { PublicLeaderboard } from './views/VoterApp/PublicLeaderboard.tsx';
import { DevWorkbench } from './views/DevWorkbench/DevWorkbench.tsx';
import { SettingsPage, SettingsSubTab } from './views/Settings/SettingsPage.tsx';
import {
  useActiveRound,
  useRoundEntries,
  useMyBallot,
  useLiveLeaderboard,
  useCastBallot,
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
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('account_info');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatePitchOpen, setIsCreatePitchOpen] = useState(false);

  const { activeRound } = useActiveRound();
  const roundId = activeRound?.id || 'round-scene-pitch-42';

  const { data: entries = [] } = useRoundEntries(roundId);
  const { data: myBallot } = useMyBallot(roundId);
  const { data: boardData } = useLiveLeaderboard(roundId, entries);

  // Shared 3-2-1 ballot selection state
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
    }
  }, [myBallot]);

  const castBallotMutation = useCastBallot(roundId);

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
      setBallotSuccessMessage('Your 3-2-1 ballot was successfully recorded in the live pool.');
      setTimeout(() => setBallotSuccessMessage(null), 5000);
    } catch (err: unknown) {
      alert(`Failed to cast ballot: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Filter entries if search query is provided
  const filteredEntries = entries.filter((e) =>
    searchQuery
      ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar with search, submit pitch button, and role-based tabs */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigateSettings={(subTab) => {
          if (subTab) setSettingsSubTab(subTab);
          setActiveTab('settings');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="dashboard-container" style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewDashboard
            onNavigateTab={setActiveTab}
            onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
            onSelectEntryForVote={(id) => {
              if (!rank1) setRank1(id);
              else if (!rank2) setRank2(id);
              else if (!rank3) setRank3(id);
              else setRank1(id);
              setActiveTab('ballot');
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

            {/* 3-2-1 Ballot Slots */}
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

            {/* Pitch Catalog for easy ranking selection */}
            <PitchCatalog
              entries={filteredEntries}
              selectedRank1={rank1}
              selectedRank2={rank2}
              selectedRank3={rank3}
              onSelectRank={handleSelectRank}
              onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
            />
          </div>
        )}

        {activeTab === 'pitches' && (
          <div className="tab-content-area">
            <PitchCatalog
              entries={filteredEntries}
              selectedRank1={rank1}
              selectedRank2={rank2}
              selectedRank3={rank3}
              onSelectRank={(r, id) => {
                handleSelectRank(r, id);
                setActiveTab('ballot');
              }}
              onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
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

        {activeTab === 'diagnostics' && (
          <div className="tab-content-area">
            <DevWorkbench />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            initialSubTab={settingsSubTab}
            onNavigateTab={setActiveTab}
            onOpenCreatePitch={() => setIsCreatePitchOpen(true)}
          />
        )}
      </main>

      {/* Submit Pitch Modal */}
      <CreatePitchModal
        isOpen={isCreatePitchOpen}
        roundId={roundId}
        onClose={() => setIsCreatePitchOpen(false)}
        onCreated={() => {
          setIsCreatePitchOpen(false);
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
        <MainDashboardLayout />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
};
