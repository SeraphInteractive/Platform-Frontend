import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { VoterPortal } from './views/VoterApp/VoterPortal.tsx';
import { DevWorkbench } from './views/DevWorkbench/DevWorkbench.tsx';
import { useActiveRound } from './hooks/useVotingApi.ts';

// Query client instance with 5s default stale time
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const MainLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<'voter' | 'dev'>('voter');
  const { activeRound } = useActiveRound();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
        activeRound={activeRound}
      />

      <main style={{ flex: 1, paddingBottom: 40 }}>
        {activeView === 'voter' ? <VoterPortal /> : <DevWorkbench />}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '16px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
          background: 'var(--bg-surface)',
        }}
      >
        <span className="mono">@platform/vote-ui</span> | Powered by TanStack Query and @platform/internal-logic
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainLayout />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
};
