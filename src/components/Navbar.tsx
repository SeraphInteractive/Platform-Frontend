import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';

export type NavTabId = 'overview' | 'ballot' | 'pitches' | 'leaderboard' | 'diagnostics';

interface NavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}) => {
  const { user, loginWithDiscord, loginAsDevUser, logout } = useAuth();

  return (
    <header className="top-navbar">
      {/* Brand logo and nav links */}
      <div className="nav-left">
        <div className="brand-logo-mark" onClick={() => onTabChange('overview')} title="MCS Voting Engine">
          <div className="brand-glyph" />
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-link-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => onTabChange('overview')}
          >
            Overview
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'ballot' ? 'active' : ''}`}
            onClick={() => onTabChange('ballot')}
          >
            Ballot Box
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'pitches' ? 'active' : ''}`}
            onClick={() => onTabChange('pitches')}
          >
            Pitches
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onTabChange('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => onTabChange('diagnostics')}
          >
            Diagnostics
          </button>
        </nav>
      </div>

      {/* Right actions: search input, icons, user profile */}
      <div className="nav-right">
        <div className="search-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Type Pitch Name or ID"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Notification icon button */}
        <button className="icon-btn" title="Notifications">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Settings gear icon button */}
        <button className="icon-btn" title="Settings" onClick={() => onTabChange('diagnostics')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* User avatar and name pill */}
        {user ? (
          <div className="user-pill" onClick={logout} title="Click to sign out">
            <img
              src={user.discordAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user.discordUsername}
              className="user-avatar-img"
            />
            <div className="user-details">
              <span className="user-display-name">{user.discordUsername}</span>
              <span className="user-display-role">{user.role}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-dark" onClick={loginWithDiscord}>
              Discord Login
            </button>
            <button className="btn-subtle" onClick={() => loginAsDevUser('admin')}>
              Dev Login
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
