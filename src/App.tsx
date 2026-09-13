import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar, NavTabId } from './components/Navbar.tsx';
import { OverviewDashboard } from './views/Dashboard/OverviewDashboard.tsx';
import { VoterPortal } from './views/VoterApp/VoterPortal.tsx';
import { DevWorkbench } from './views/DevWorkbench/DevWorkbench.tsx';
import { PitchCatalog } from './views/VoterApp/PitchCatalog.tsx';
import { PublicLeaderboard } from './views/VoterApp/PublicLeaderboard.tsx';
import { useActiveRound, useRoundEntries, useLiveLeaderboard } from './hooks/useVotingApi.ts';

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
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const { activeRound } = useActiveRound();
  const roundId = activeRound?.id || 'round-scene-pitch-42';
  const { data: entries = [] } = useRoundEntries(roundId);
  const { data: boardData } = useLiveLeaderboard(roundId, entries);

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
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="dashboard-container" style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewDashboard
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'ballot' && (
          <VoterPortal />
        )}

        {activeTab === 'pitches' && (
          <div className="tab-content-area">
            <PitchCatalog
              entries={filteredEntries}
              selectedRank1=""
              selectedRank2=""
              selectedRank3=""
              onSelectRank={() => setActiveTab('ballot')}
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
      </main>

      {/* Clean Light Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px 32px',
          textAlign: 'center',
          color: 'var(--text-light)',
          fontSize: '11px',
          background: 'var(--bg-card)',
        }}
      >
        <span className="mono">@platform/vote-ui</span> | Connected to @platform/internal-logic and vote-api
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
