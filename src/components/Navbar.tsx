import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { VotingRound } from '../hooks/useVotingApi.ts';

interface NavbarProps {
  activeView: 'voter' | 'dev';
  onViewChange: (view: 'voter' | 'dev') => void;
  activeRound?: VotingRound;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onViewChange,
  activeRound,
}) => {
  const { user, loginWithDiscord, loginAsDevUser, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand header */}
        <div className="brand" onClick={() => onViewChange('voter')}>
          <div className="brand-icon">[VOTE]</div>
          <div>
            <div className="brand-title">@platform/vote-ui</div>
            <div className="brand-subtitle">
              {activeRound ? activeRound.title : 'Minecraft Movie Voting Platform'}
            </div>
          </div>
        </div>

        {/* View switcher between voter app and dev panel */}
        <div className="nav-pill-group">
          <button
            className={`nav-pill ${activeView === 'voter' ? 'active' : ''}`}
            onClick={() => onViewChange('voter')}
          >
            Voter Portal
          </button>
          <button
            className={`nav-pill ${activeView === 'dev' ? 'active' : ''}`}
            onClick={() => onViewChange('dev')}
          >
            Dev and Admin Diagnostics
          </button>
        </div>

        {/* User profile and auth actions */}
        <div className="nav-actions">
          {user ? (
            <div className="user-profile">
              <div className="user-avatar">
                {user.discordAvatar ? (
                  <img
                    src={user.discordAvatar}
                    alt={user.discordUsername}
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                ) : (
                  user.discordUsername.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user.discordUsername}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Logout"
                style={{ marginLeft: 4 }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-discord btn-sm" onClick={loginWithDiscord}>
                Discord Login
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => loginAsDevUser('admin')}
              >
                Dev Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
