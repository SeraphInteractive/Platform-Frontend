import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { SettingsDropdown } from './SettingsDropdown.tsx';
import { SettingsSubTab } from '../views/Settings/SettingsPage.tsx';

export type NavTabId = 'overview' | 'ballot' | 'pitches' | 'leaderboard' | 'diagnostics' | 'settings';

interface NavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onNavigateSettings: (subTab?: SettingsSubTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreatePitch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onNavigateSettings,
  searchQuery,
  onSearchChange,
  onOpenCreatePitch,
}) => {
  const { user, loginWithDiscord, loginAsDevUser } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <header className="top-navbar">
      {/* Brand logo and navigation tabs */}
      <div className="nav-left">
        <div
          className="brand-logo-mark"
          onClick={() => onTabChange('overview')}
          title="MCS Voting Platform"
        >
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

          {/* Diagnostics only visible to admin / developer */}
          {isAdmin && (
            <button
              className={`nav-link-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => onTabChange('diagnostics')}
            >
              Diagnostics
            </button>
          )}

          {activeTab === 'settings' && (
            <button className="nav-link-btn active">
              Settings
            </button>
          )}
        </nav>
      </div>

      {/* Right actions: search input, create pitch button, settings & user profile */}
      <div className="nav-right">
        <div className="search-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search pitches by title or keyword"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (activeTab !== 'pitches' && e.target.value) {
                onTabChange('pitches');
              }
            }}
          />
        </div>

        {/* Submit pitch action button */}
        <button
          className="btn-dark"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
          onClick={onOpenCreatePitch}
          title="Submit a new script pitch"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Submit Pitch</span>
        </button>

        {/* Settings gear button and user profile with dropdown */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`icon-btn ${showSettings ? 'active' : ''}`}
            title="Settings & Profile"
            onClick={() => setShowSettings(!showSettings)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {user ? (
            <div
              className="user-pill"
              onClick={() => setShowSettings(!showSettings)}
              title="Open profile & settings"
            >
              <img
                src={user.discordAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.discordUsername}
                className="user-avatar-img"
              />
              <div className="user-details">
                <span className="user-display-name">{user.discordUsername}</span>
                <span className="user-display-role">{user.role.toUpperCase()}</span>
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

          {/* Settings & Profile Dropdown */}
          <SettingsDropdown
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onNavigateSettings={(subTab) => {
              setShowSettings(false);
              onNavigateSettings(subTab);
            }}
            onNavigateTab={(tab) => {
              setShowSettings(false);
              onTabChange(tab);
            }}
          />
        </div>
      </div>
    </header>
  );
};
