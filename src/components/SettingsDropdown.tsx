import React, { useState } from 'react';
import { useAuth, getDiscordAvatar } from '../context/AuthContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { NavTabId } from './Navbar.tsx';

interface SettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSettings: () => void;
  onNavigateTab: (tab: NavTabId) => void;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateSettings,
  onNavigateTab,
}) => {
  const { user, warnings = 0, isBarred, logout } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const [imgErr, setImgErr] = useState(false);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    onNavigateTab('overview');
  };

  const avatarUrl = getDiscordAvatar(user);

  return (
    <div className="account-overview-popover" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="account-overview-header">
        <span className="account-overview-title">Account</span>
        <button className="icon-btn-sm" onClick={onClose} title="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {user ? (
        <>
          {/* User Profile Card */}
          <div className="account-profile-card">
            <div className="account-avatar-wrapper">
              {!imgErr ? (
                <img
                  src={avatarUrl}
                  alt={user.discordUsername}
                  className="account-avatar-img"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="account-avatar-fallback">
                  {user.discordUsername ? user.discordUsername.slice(0, 2).toUpperCase() : 'US'}
                </div>
              )}
              <div className="account-avatar-status" />
            </div>

            <div className="account-user-details">
              <div className="account-username-row">
                <span className="account-username">{user.discordUsername}</span>
                <span title="Verified Discord identity" className="account-verified-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
              </div>
              <div className="account-user-id mono">ID: {user.discordId || user.id}</div>
              <div className="account-badges-row">
                <span className={`badge ${user.role === 'admin' ? 'badge-engine' : 'badge-success'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                  {user.role.toUpperCase()}
                </span>
                <span className={`badge ${isBarred ? 'badge-danger' : warnings > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                  {isBarred ? 'BARRED' : warnings === 0 ? 'CLEAN' : `${warnings}/3 WARNS`}
                </span>
              </div>
            </div>
          </div>

          {/* Account Overview Properties */}
          <div className="account-props-box">
            <div className="account-prop-row">
              <span className="account-prop-label">Standing</span>
              <span className="account-prop-val" style={{ color: isBarred ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {isBarred ? 'Barred (3/3 Warnings)' : warnings === 0 ? 'Good Standing' : `${warnings}/3 Warnings`}
              </span>
            </div>
            <div className="account-prop-row">
              <span className="account-prop-label">Guild Role</span>
              <span className="account-prop-val">
                {user.role === 'admin' ? 'Administrator' : user.role === 'moderator' ? 'Moderator' : 'Voter'}
              </span>
            </div>
            <div className="account-prop-row">
              <span className="account-prop-label">Theme</span>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '2px 8px' }}
                onClick={toggleTheme}
              >
                {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="account-actions-row">
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                onClose();
                onNavigateSettings();
              }}
            >
              Settings
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleLogout}
              title="Log out of session"
            >
              Log Out
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: '10px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Not signed in with Discord
          </div>
        </div>
      )}
    </div>
  );
};
