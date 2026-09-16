import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useSettings, AppDensity } from '../../context/SettingsContext.tsx';
import { useActiveRound, useMyBallot, useRoundEntries } from '../../hooks/useVotingApi.ts';
import { NavTabId } from '../../components/Navbar.tsx';

export type SettingsSubTab =
  | 'account_info'
  | 'account_standing'
  | 'account_security'
  | 'app_theme'
  | 'app_density'
  | 'a11y_text_size'
  | 'a11y_compactness'
  | 'a11y_contrast'
  | 'media_entries'
  | 'media_images'
  | 'media_videos'
  | 'act_ballot'
  | 'act_notifications'
  | 'rules_lifecycle'
  | 'rules_architecture'
  | 'legal_guidelines'
  | 'legal_terms'
  | 'dev_roles';

interface SettingsPageProps {
  initialSubTab?: SettingsSubTab;
  onNavigateTab: (tab: NavTabId) => void;
  onOpenCreatePitch: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  initialSubTab = 'account_info',
  onNavigateTab,
  onOpenCreatePitch,
}) => {
  const { user, warnings = 0, isBarred = false, logout } = useAuth();
  const {
    settings,
    setTheme,
    setFontSize,
    setCompactness,
    setHighContrast,
    setReducedMotion,
    setPushNotifications,
    resetDefaults,
    lastSavedAt,
  } = useSettings();

  const { activeRound } = useActiveRound();
  const roundId = activeRound?.id || 'round-scene-pitch-42';

  const { data: myBallot } = useMyBallot(roundId);
  const { data: entries = [] } = useRoundEntries(roundId);

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);
  const [saveFlash, setSaveFlash] = useState<boolean>(false);
  const [notifMessage, setNotifMessage] = useState<string>('');

  const scrollToSection = (subTab: SettingsSubTab) => {
    setActiveSubTab(subTab);
    const element = document.getElementById(subTab);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
      const timer = setTimeout(() => {
        const element = document.getElementById(initialSubTab);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (lastSavedAt) {
      setSaveFlash(true);
      const timer = setTimeout(() => setSaveFlash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastSavedAt]);

  useEffect(() => {
    const sectionIds: SettingsSubTab[] = [
      'account_info',
      'account_standing',
      'account_security',
      'app_theme',
      'app_density',
      'a11y_text_size',
      'a11y_compactness',
      'a11y_contrast',
      'media_entries',
      'media_images',
      'media_videos',
      'act_ballot',
      'act_notifications',
      'rules_lifecycle',
      'rules_architecture',
      'legal_guidelines',
      'legal_terms',
      'dev_roles',
    ];

    const observer = new IntersectionObserver(
      (observerEntries) => {
        for (const entry of observerEntries) {
          if (entry.isIntersecting) {
            setActiveSubTab(entry.target.id as SettingsSubTab);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const myPitches = entries.filter((entry) => {
    if (!user) return false;
    return entry.submitterUsername === user.discordUsername || entry.submitterId === user.id;
  });

  const getPitchTitle = (id?: string) => {
    if (!id) return 'Unselected';
    const found = entries.find((e) => e.id === id);
    return found ? found.title : id;
  };

  const handlePushToggle = async (enabled: boolean) => {
    const granted = await setPushNotifications(enabled);
    if (enabled) {
      setNotifMessage(granted ? 'Active' : 'Denied');
    } else {
      setNotifMessage('Disabled');
    }
  };

  const handleLogout = () => {
    logout();
    onNavigateTab('landing');
  };

  return (
    <div className="tab-content-area">
      {/* Page Header */}
      <div className="card-header" style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tab-title">Settings</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '24px',
              background: saveFlash ? 'var(--color-success-bg, rgba(16, 185, 129, 0.12))' : 'var(--bg-card-muted)',
              color: saveFlash ? 'var(--color-success)' : 'var(--text-muted)',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: saveFlash ? 'var(--color-success)' : 'var(--accent-green)',
              }}
            />
            <span>{saveFlash ? 'Saved' : 'Auto-save'}</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={resetDefaults}
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2-Column Desktop Architecture Layout */}
      <div className="settings-page-layout">
        {/* Navigation Sidebar */}
        <aside className="settings-nav-card">
          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">Profile</div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'account_info' ? 'active' : ''}`}
                onClick={() => scrollToSection('account_info')}
              >
                Account
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'account_standing' ? 'active' : ''}`}
                onClick={() => scrollToSection('account_standing')}
              >
                Standing
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'account_security' ? 'active' : ''}`}
                onClick={() => scrollToSection('account_security')}
              >
                Security
              </button>
            </div>
          </div>

          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">Appearance</div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'app_theme' ? 'active' : ''}`}
                onClick={() => scrollToSection('app_theme')}
              >
                Theme
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'app_density' ? 'active' : ''}`}
                onClick={() => scrollToSection('app_density')}
              >
                Density
              </button>
            </div>
          </div>

          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">Accessibility</div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'a11y_text_size' ? 'active' : ''}`}
                onClick={() => scrollToSection('a11y_text_size')}
              >
                Text Size
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'a11y_contrast' ? 'active' : ''}`}
                onClick={() => scrollToSection('a11y_contrast')}
              >
                Contrast
              </button>
            </div>
          </div>

          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">Activity</div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'media_entries' ? 'active' : ''}`}
                onClick={() => scrollToSection('media_entries')}
              >
                Proposals
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'act_ballot' ? 'active' : ''}`}
                onClick={() => scrollToSection('act_ballot')}
              >
                Ballot
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'act_notifications' ? 'active' : ''}`}
                onClick={() => scrollToSection('act_notifications')}
              >
                Alerts
              </button>
            </div>
          </div>

          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">System</div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'rules_lifecycle' ? 'active' : ''}`}
                onClick={() => scrollToSection('rules_lifecycle')}
              >
                Rules
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'legal_terms' ? 'active' : ''}`}
                onClick={() => scrollToSection('legal_terms')}
              >
                Terms
              </button>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="settings-sidebar-group">
              <div className="settings-sidebar-header">Admin</div>
              <div className="settings-subsection-list">
                <button
                  className={`settings-subsection-item ${activeSubTab === 'dev_roles' ? 'active' : ''}`}
                  onClick={() => scrollToSection('dev_roles')}
                >
                  Tools
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-light)', textAlign: 'center' }}>
            <span className="mono">Build v1.0.0-rc4</span>
          </div>
        </aside>

        {/* Continuous Scrollable Content Column */}
        <div className="settings-scroll-container">
          {/* Subsection 1: Account Info */}
          <section id="account_info" className="settings-section-card">
            <div className="card-title">Account</div>

            {user ? (
              <div className="settings-panel-box" style={{ background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                    }}
                  >
                    {user.discordUsername ? user.discordUsername.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {user.discordUsername}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={`badge ${user.role === 'admin' ? 'badge-engine' : 'badge-success'}`}>
                        {user.role.toUpperCase()}
                      </span>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ID: {user.discordId || user.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="callout callout-info" style={{ margin: 0 }}>
                Guest session. Sign in with Discord.
              </div>
            )}

            {user && (
              <div>
                <button className="btn btn-danger" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            )}
          </section>

          {/* Subsection 2: Account Standing */}
          <section id="account_standing" className="settings-section-card">
            <div className="card-title">Standing</div>

            <div className="warning-meter">
              <div className={`warning-slot ${warnings >= 1 ? 'active-warn-1' : ''}`}>
                <span style={{ fontSize: '11px', fontWeight: 800 }}>Warning 1</span>
                <span style={{ fontSize: '12px' }}>{warnings >= 1 ? 'Violation' : 'Clear'}</span>
              </div>
              <div className={`warning-slot ${warnings >= 2 ? 'active-warn-2' : ''}`}>
                <span style={{ fontSize: '11px', fontWeight: 800 }}>Warning 2</span>
                <span style={{ fontSize: '12px' }}>{warnings >= 2 ? 'Notice' : 'Clear'}</span>
              </div>
              <div className={`warning-slot ${warnings >= 3 ? 'active-warn-3' : ''}`}>
                <span style={{ fontSize: '11px', fontWeight: 800 }}>Warning 3</span>
                <span style={{ fontSize: '12px' }}>{warnings >= 3 ? 'Barred' : 'Clear'}</span>
              </div>
            </div>
          </section>

          {/* Subsection 3: Authentication & Security */}
          <section id="account_security" className="settings-section-card">
            <div className="card-title">Security</div>

            <div className="settings-panel-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Provider</span>
                <span className="badge badge-success">Discord OAuth 2.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <span style={{ fontWeight: 700 }}>Session</span>
                <span className="badge badge-success">Encrypted</span>
              </div>
            </div>
          </section>

          {/* Subsection 4: Theme Mode */}
          <section id="app_theme" className="settings-section-card">
            <div className="card-title">Theme</div>

            <div className="settings-row">
              <span className="settings-row-label">Dark Theme</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={settings.theme === 'dark'}
                  onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </section>

          {/* Subsection 5: Display Density */}
          <section id="app_density" className="settings-section-card">
            <div className="card-title">Density</div>

            <div className="text-size-presets">
              {[
                { id: 'cozy', label: 'Cozy' },
                { id: 'normal', label: 'Default' },
                { id: 'compact', label: 'Compact' },
                { id: 'ultra-compact', label: 'Ultra-Compact' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`text-size-preset-btn ${settings.compactness === item.id ? 'active' : ''}`}
                  onClick={() => setCompactness(item.id as AppDensity)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {/* Subsection 6: Accessibility - Text Size */}
          <section id="a11y_text_size" className="settings-section-card">
            <div className="card-title">Typography</div>

            <div className="text-size-presets">
              {[12, 13, 16, 18, 20, 24].map((sz) => (
                <button
                  key={sz}
                  className={`text-size-preset-btn ${settings.fontSize === sz ? 'active' : ''}`}
                  onClick={() => setFontSize(sz)}
                >
                  {sz === 13 ? '13px (Default)' : `${sz}px`}
                </button>
              ))}
            </div>
          </section>

          {/* Subsection 7: Contrast & Motion */}
          <section id="a11y_contrast" className="settings-section-card">
            <div className="card-title">Accessibility</div>

            <div className="settings-row">
              <span className="settings-row-label">High Contrast Borders</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Reduced Motion</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </section>

          {/* Subsection 8: Proposals */}
          <section id="media_entries" className="settings-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">My Proposals</div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onOpenCreatePitch}
                disabled={isBarred}
              >
                + Submit
              </button>
            </div>

            <div className="settings-panel-box">
              {myPitches.length > 0 ? (
                myPitches.map((pitch) => (
                  <div key={pitch.id} className="mini-pitch-item">
                    <span style={{ fontWeight: 700 }}>{pitch.title}</span>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {pitch.id}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  None
                </div>
              )}
            </div>
          </section>

          {/* Subsection 9: Recorded Ballot */}
          <section id="act_ballot" className="settings-section-card">
            <div className="card-title">Recorded Ballot</div>

            <div className="settings-panel-box">
              {myBallot ? (
                <>
                  <div className="mini-ballot-item">
                    <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>1st Choice (3 pts)</span>
                    <span style={{ fontWeight: 700 }}>{getPitchTitle(myBallot.rank1)}</span>
                  </div>
                  <div className="mini-ballot-item">
                    <span style={{ fontWeight: 700, color: 'var(--accent-silver)' }}>2nd Choice (2 pts)</span>
                    <span style={{ fontWeight: 700 }}>{getPitchTitle(myBallot.rank2)}</span>
                  </div>
                  <div className="mini-ballot-item">
                    <span style={{ fontWeight: 700, color: 'var(--accent-bronze)' }}>3rd Choice (1 pt)</span>
                    <span style={{ fontWeight: 700 }}>{getPitchTitle(myBallot.rank3)}</span>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigateTab('ballot')}
                    style={{ marginTop: 8, width: 'fit-content' }}
                  >
                    Edit Ballot
                  </button>
                </>
              ) : (
                <div style={{ padding: '12px 0', textAlign: 'center' }}>
                  <button className="btn btn-primary" onClick={() => onNavigateTab('ballot')}>
                    Cast Ballot
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Subsection 10: Notifications */}
          <section id="act_notifications" className="settings-section-card">
            <div className="card-title">Notifications</div>

            <div className="settings-row">
              <span className="settings-row-label">
                Browser Alerts {notifMessage && `(${notifMessage})`}
              </span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handlePushToggle(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </section>

          {/* Subsection 11: Voting Rules */}
          <section id="rules_lifecycle" className="settings-section-card">
            <div className="card-title">Rules</div>

            <div className="settings-panel-box" style={{ gap: 10 }}>
              <div><strong>1. Allocation:</strong> 3 choices allocate 3, 2, and 1 points.</div>
              <div><strong>2. Anti-Stacking:</strong> Choices must be unique.</div>
              <div><strong>3. Invariant:</strong> Pool points strictly equal 6N.</div>
            </div>
          </section>

          {/* Subsection 12: Terms */}
          <section id="legal_terms" className="settings-section-card">
            <div className="card-title">Terms</div>

            <div className="settings-panel-box" style={{ gap: 10 }}>
              <div><strong>Community Standards:</strong> Respectful participation required.</div>
              <div><strong>Discipline:</strong> 3 warnings result in exclusion.</div>
            </div>
          </section>

          {/* Subsection 13: Admin */}
          {user?.role === 'admin' && (
            <section id="dev_roles" className="settings-section-card">
              <div className="card-title">Admin</div>

              <div className="settings-panel-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Role</span>
                  <span className="badge badge-engine">ADMINISTRATOR</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onNavigateTab('diagnostics')}
                  >
                    Diagnostics
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
