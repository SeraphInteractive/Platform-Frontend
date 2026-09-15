import React, { useState } from 'react';
import { useAuth, getDiscordAvatar, isStaff } from '../context/AuthContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { SettingsDropdown } from './SettingsDropdown.tsx';
import { SettingsSubTab } from '../views/Settings/SettingsPage.tsx';
import { useScrollDirection } from '../hooks/useScrollDirection.ts';

export type NavTabId = 'landing' | 'ballot' | 'leaderboard' | 'docs' | 'grabbox' | 'diagnostics' | 'settings' | 'progress' | 'privacy' | 'terms' | 'guidelines';

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
}) => {
  const { user, loginWithDiscord } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const [showAccountOverview, setShowAccountOverview] = useState(false);
  const [pfpError, setPfpError] = useState(false);
  const isScrollVisible = useScrollDirection();

  const isNavVisible = isScrollVisible || showAccountOverview;
  const isHomePage = activeTab === 'landing';

  const handleNav = (tab: NavTabId) => {
    onTabChange(tab);
  };

  // Right vertical rail with pure icons and high-fi hover popups for non-homepage views
  if (!isHomePage) {
    return (
      <aside className="right-nav-rail">
        {/* Top: Brand Logo */}
        <div className="right-nav-top">
          <div className="right-nav-item-wrapper">
            <div
              className="brand-logo-mark right-nav-logo"
              onClick={() => handleNav('landing')}
              aria-label="Home"
            >
              <div className="brand-glyph" />
            </div>
            <div className="nav-hover-tooltip minecraft-tooltip-panel">
              <div className="mc-tooltip-title" style={{ color: '#ffaa00' }}>Home</div>
            </div>
          </div>
        </div>

        {/* Center: Navigation Icons */}
        <nav className="right-nav-menu">
          {/* Vote */}
          <div className="right-nav-item-wrapper">
            <button
              className={`right-nav-icon-btn ${activeTab === 'ballot' ? 'active' : ''}`}
              onClick={() => handleNav('ballot')}
              aria-label="Vote"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </button>
            <div className="nav-hover-tooltip minecraft-tooltip-panel">
              <div className="mc-tooltip-title" style={{ color: '#55ff55' }}>Vote</div>
            </div>
          </div>

          {/* Leaderboards */}
          <div className="right-nav-item-wrapper">
            <button
              className={`right-nav-icon-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => handleNav('leaderboard')}
              aria-label="Leaderboards"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
                <path d="M7 6H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
                <path d="M17 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
              </svg>
            </button>
            <div className="nav-hover-tooltip minecraft-tooltip-panel">
              <div className="mc-tooltip-title" style={{ color: '#ffaa00' }}>Leaderboards</div>
            </div>
          </div>

          {/* GrabBox */}
          <div className="right-nav-item-wrapper">
            <button
              className={`right-nav-icon-btn ${activeTab === 'grabbox' ? 'active' : ''}`}
              onClick={() => handleNav('grabbox')}
              aria-label="GrabBox"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </button>
            <div className="nav-hover-tooltip minecraft-tooltip-panel">
              <div className="mc-tooltip-title" style={{ color: '#eab308' }}>GrabBox</div>
            </div>
          </div>

          {/* Progress */}
          <div className="right-nav-item-wrapper">
            <button
              className={`right-nav-icon-btn ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => handleNav('progress')}
              aria-label="Progress"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </button>
            <div className="nav-hover-tooltip minecraft-tooltip-panel">
              <div className="mc-tooltip-title" style={{ color: '#c084fc' }}>Progress</div>
            </div>
          </div>

          {/* Documentation */}
          <div className="right-nav-item-wrapper">
            <button
              className={`right-nav-icon-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => handleNav('docs')}
              aria-label="Documentation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </button>
            <div className="nav-hover-tooltip minecraft-tooltip-panel">
              <div className="mc-tooltip-title" style={{ color: '#60a5fa' }}>Documentation</div>
            </div>
          </div>

          {/* Dashboard (admin, moderator, or supervisor only) */}
          {isStaff(user?.role) && (
            <div className="right-nav-item-wrapper">
              <button
                className={`right-nav-icon-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
                onClick={() => handleNav('diagnostics')}
                aria-label="Dashboard"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              </button>
              <div className="nav-hover-tooltip minecraft-tooltip-panel">
                <div className="mc-tooltip-title" style={{ color: '#ff5555' }}>Dashboard</div>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom: Action Stack */}
        <div className="right-nav-bottom">


          <div className="right-nav-item-wrapper">
            <button
              className="right-nav-icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="nav-hover-tooltip minecraft-tooltip-panel">
              <div className="mc-tooltip-title" style={{ color: '#f472b6' }}>
                {settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            {user ? (
              <div className="right-nav-item-wrapper">
                <button
                  className={`user-pfp-btn ${showAccountOverview ? 'active' : ''}`}
                  onClick={() => setShowAccountOverview(!showAccountOverview)}
                  aria-label="Account Overview"
                  style={{ width: 38, height: 38 }}
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
                <div className="nav-hover-tooltip minecraft-tooltip-panel">
                  <div className="mc-tooltip-title" style={{ color: '#818cf8' }}>{user.discordUsername || 'Account'}</div>
                </div>
              </div>
            ) : (
              <div className="right-nav-item-wrapper">
                <button
                  className="right-nav-icon-btn"
                  onClick={loginWithDiscord}
                  aria-label="Sign in with Discord"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </button>
                <div className="nav-hover-tooltip minecraft-tooltip-panel">
                  <div className="mc-tooltip-title" style={{ color: '#818cf8' }}>Sign In</div>
                </div>
              </div>
            )}

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
      </aside>
    );
  }

  // Floating horizontal pill navbar for homepage
  return (
    <header className={`top-navbar-fixed-container ${isNavVisible ? 'nav-visible' : 'nav-hidden'}`}>
      <div className="top-navbar">
        <div className="nav-left">
          <div
            className="brand-logo-mark"
            onClick={() => handleNav('landing')}
            title="Home"
          >
            <div className="brand-glyph" />
          </div>

          <nav className="nav-menu">
            <button
              className="nav-link-btn"
              onClick={() => handleNav('ballot')}
            >
              Vote
            </button>
            <button
              className="nav-link-btn"
              onClick={() => handleNav('leaderboard')}
            >
              Leaderboard
            </button>
            <button
              className="nav-link-btn"
              onClick={() => handleNav('grabbox')}
            >
              GrabBox
            </button>
            <button
              className="nav-link-btn"
              onClick={() => handleNav('progress')}
            >
              Progress
            </button>
            <button
              className="nav-link-btn"
              onClick={() => handleNav('docs')}
            >
              Docs
            </button>

            {isStaff(user?.role) && (
              <button
                className="nav-link-btn"
                onClick={() => handleNav('diagnostics')}
              >
                Dashboard
              </button>
            )}
          </nav>
        </div>

        <div className="nav-right">
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
