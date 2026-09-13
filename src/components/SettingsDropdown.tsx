import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { NavTabId } from './Navbar.tsx';
import { SettingsSubTab } from '../views/Settings/SettingsPage.tsx';

interface SettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSettings: (subTab?: SettingsSubTab) => void;
  onNavigateTab: (tab: NavTabId) => void;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateSettings,
  onNavigateTab,
}) => {
  const { user, warnings = 0, isBarred, logout } = useAuth();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    onNavigateTab('overview');
  };

  const handleOpenSection = (subTab: SettingsSubTab) => {
    onClose();
    onNavigateSettings(subTab);
  };

  return (
    <div className="settings-dropdown" onClick={(e) => e.stopPropagation()}>
      {/* User profile mini header */}
      {user ? (
        <div className="settings-profile-header">
          <img
            src={user.discordAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={user.discordUsername}
            className="settings-avatar-lg"
          />
          <div className="settings-user-info">
            <div className="settings-username">
              <span>{user.discordUsername}</span>
              <span title="Verified Discord Username (Immutable)" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-engine' : 'badge-success'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                {user.role.toUpperCase()}
              </span>
              <span className={`badge ${isBarred ? 'badge-danger' : warnings > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                {isBarred ? 'BARRED (3/3)' : `${warnings}/3 WARNS`}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Guest Session</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Not signed in with Discord</div>
        </div>
      )}

      {/* Navigation links to dedicated Settings Page subsections */}
      <div className="settings-menu-list">
        <button
          className="settings-menu-item"
          onClick={() => handleOpenSection('account_info')}
        >
          <div className="settings-menu-item-left">
            <div className="settings-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="settings-menu-item-text">
              <span className="settings-menu-item-title">Account Info</span>
              <span className="settings-menu-item-desc">Discord identity profile</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          className="settings-menu-item"
          onClick={() => handleOpenSection('account_standing')}
        >
          <div className="settings-menu-item-left">
            <div className="settings-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="settings-menu-item-text">
              <span className="settings-menu-item-title">Account Standing</span>
              <span className="settings-menu-item-desc">Discipline and 3-warn status</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          className="settings-menu-item"
          onClick={() => handleOpenSection('app_theme')}
        >
          <div className="settings-menu-item-left">
            <div className="settings-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div className="settings-menu-item-text">
              <span className="settings-menu-item-title">Appearance & Theme</span>
              <span className="settings-menu-item-desc">Dark mode, density, audio</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          className="settings-menu-item"
          onClick={() => handleOpenSection('act_ballot')}
        >
          <div className="settings-menu-item-left">
            <div className="settings-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="settings-menu-item-text">
              <span className="settings-menu-item-title">User Activity</span>
              <span className="settings-menu-item-desc">Cast ballot & submitted pitches</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          className="settings-menu-item"
          onClick={() => handleOpenSection('legal_guidelines')}
        >
          <div className="settings-menu-item-left">
            <div className="settings-menu-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="settings-menu-item-text">
              <span className="settings-menu-item-title">Guidelines & Terms</span>
              <span className="settings-menu-item-desc">Rules and platform policies</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Diagnostics shortcut for developer */}
        {user?.role === 'admin' && (
          <button
            className="settings-menu-item"
            onClick={() => {
              onClose();
              onNavigateTab('diagnostics');
            }}
          >
            <div className="settings-menu-item-left">
              <div className="settings-menu-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <div className="settings-menu-item-text">
                <span className="settings-menu-item-title">Diagnostics</span>
                <span className="settings-menu-item-desc">Conservation & internal logic</span>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Logout Action */}
      {user && (
        <button className="settings-logout-btn" onClick={handleLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log Out</span>
        </button>
      )}

      {/* Build version info */}
      <div style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-light)', marginTop: 2 }}>
        <span className="mono">Build v1.0.0-rc4 (2026.09.13)</span>
      </div>
    </div>
  );
};
