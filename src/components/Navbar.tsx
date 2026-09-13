import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext.tsx';

export type NavTabId = 'overview' | 'ballot' | 'pitches' | 'leaderboard' | 'diagnostics';

interface NavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreatePitch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenCreatePitch,
}) => {
  const { user, loginWithDiscord, loginAsDevUser, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleRoleSelect = (role: UserRole) => {
    loginAsDevUser(role, role === 'admin' ? 'AdminDev' : 'CommunityVoter');
    setShowRoleMenu(false);
    if (role === 'user' && activeTab === 'diagnostics') {
      onTabChange('overview');
    }
  };

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
        </nav>
      </div>

      {/* Right actions: search input, create pitch button, user profile */}
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

        {/* Role toggle and user profile */}
        <div style={{ position: 'relative' }}>
          {user ? (
            <div
              className="user-pill"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              title="Click to switch role or log out"
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

          {/* Role selector dropdown */}
          {showRoleMenu && (
            <div
              className="white-card"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                padding: 10,
                width: 200,
                zIndex: 100,
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                Select Active Role
              </div>
              <button
                className={`nav-link-btn ${user?.role === 'user' ? 'active' : ''}`}
                style={{ textAlign: 'left', width: '100%', borderRadius: 8, padding: '6px 10px' }}
                onClick={() => handleRoleSelect('user')}
              >
                Voter (Public User)
              </button>
              <button
                className={`nav-link-btn ${user?.role === 'admin' ? 'active' : ''}`}
                style={{ textAlign: 'left', width: '100%', borderRadius: 8, padding: '6px 10px' }}
                onClick={() => handleRoleSelect('admin')}
              >
                Developer (Admin View)
              </button>
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
              <button
                className="nav-link-btn"
                style={{ textAlign: 'left', width: '100%', borderRadius: 8, padding: '6px 10px', color: 'var(--color-danger)' }}
                onClick={() => {
                  logout();
                  setShowRoleMenu(false);
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
