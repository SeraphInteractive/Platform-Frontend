import React, { useState } from 'react';
import { useAuth, getDiscordAvatar } from '../context/AuthContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { SettingsDropdown } from './SettingsDropdown.tsx';
import { SettingsSubTab } from '../views/Settings/SettingsPage.tsx';
import { useScrollDirection } from '../hooks/useScrollDirection.ts';

export type NavTabId = 'landing' | 'overview' | 'ballot' | 'pitches' | 'leaderboard' | 'docs' | 'diagnostics' | 'settings';

interface NavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onNavigateSettings: (subTab?: SettingsSubTab) => void;
  onOpenCreatePitch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onNavigateSettings,
  onOpenCreatePitch,
}) => {
  const { user, loginWithDiscord } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const [showAccountOverview, setShowAccountOverview] = useState(false);
  const [pfpError, setPfpError] = useState(false);
  const isScrollVisible = useScrollDirection();

  const isNavVisible = isScrollVisible || showAccountOverview;

  return (
    <header className={`top-navbar-fixed-container ${isNavVisible ? 'nav-visible' : 'nav-hidden'}`}>
      <div className="top-navbar">
        {/* Brand logo and navigation tabs */}
        <div className="nav-left">
          <div
            className="brand-logo-mark"
            onClick={() => onTabChange('landing')}
            title="Home"
          >
            <div className="brand-glyph" />
          </div>

          <nav className="nav-menu">
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
              Proposals
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => onTabChange('leaderboard')}
            >
              Leaderboard
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => onTabChange('overview')}
            >
              Dashboard
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => onTabChange('docs')}
            >
              Docs
            </button>

            {(user?.role === 'admin' || user?.role === 'moderator') && (
              <button
                className={`nav-link-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
                onClick={() => onTabChange('diagnostics')}
              >
                Console
              </button>
            )}
          </nav>
        </div>

        {/* Right actions: theme toggle, submit pitch, user profile */}
        <div className="nav-right">
          {/* Theme Toggle Button */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {settings.theme === 'dark' ? (
                <>
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              )}
            </svg>
          </button>

          {/* Submit proposal action button */}
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontWeight: 700 }}
            onClick={onOpenCreatePitch}
            title="Submit a new proposal"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Submit Proposal</span>
          </button>

          {/* Discord PFP avatar with Account Overview popover (includes Settings and Logout) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {user ? (
              <button
                className={`user-pfp-btn ${showAccountOverview ? 'active' : ''}`}
                onClick={() => setShowAccountOverview(!showAccountOverview)}
                title="Account Overview"
              >
                {!pfpError ? (
                  <img
                    src={getDiscordAvatar(user)}
                    alt={user.discordUsername}
                    className="user-pfp-img"
                    onError={() => setPfpError(true)}
                  />
                ) : (
                  <div className="user-pfp-fallback">
                    {user.discordUsername ? user.discordUsername.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                )}
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={loginWithDiscord}
              >
                Sign in with Discord
              </button>
            )}

            {/* Account Overview Popover */}
            <SettingsDropdown
              isOpen={showAccountOverview}
              onClose={() => setShowAccountOverview(false)}
              onNavigateSettings={() => {
                setShowAccountOverview(false);
                onNavigateSettings('account_info');
              }}
              onNavigateTab={(tab) => {
                setShowAccountOverview(false);
                onTabChange(tab);
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
