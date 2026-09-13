import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext.tsx';
import { useActiveRound, useMyBallot, useRoundEntries } from '../../hooks/useVotingApi.ts';
import { NavTabId } from '../../components/Navbar.tsx';

export type SettingsSubTab =
  | 'account_info'
  | 'account_standing'
  | 'account_security'
  | 'app_theme'
  | 'app_density'
  | 'app_audio'
  | 'a11y_text_size'
  | 'a11y_compactness'
  | 'a11y_contrast'
  | 'media_entries'
  | 'media_images'
  | 'media_videos'
  | 'act_ballot'
  | 'act_notifications'
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
  const { user, warnings = 0, isBarred = false, addWarning, clearWarnings, loginAsDevUser, logout } = useAuth();
  const { activeRound } = useActiveRound();
  const roundId = activeRound?.id || 'round-scene-pitch-42';

  const { data: myBallot } = useMyBallot(roundId);
  const { data: entries = [] } = useRoundEntries(roundId);

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  // Smooth scroll handler
  const scrollToSection = (subTab: SettingsSubTab) => {
    setActiveSubTab(subTab);
    const element = document.getElementById(subTab);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll to initialSubTab on mount
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

  // Track active section as user scrolls (ScrollSpy)
  useEffect(() => {
    const sectionIds: SettingsSubTab[] = [
      'account_info',
      'account_standing',
      'account_security',
      'app_theme',
      'app_density',
      'app_audio',
      'a11y_text_size',
      'a11y_compactness',
      'a11y_contrast',
      'media_entries',
      'media_images',
      'media_videos',
      'act_ballot',
      'act_notifications',
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

  // Dark mode setting
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mcs_theme') === 'dark';
    }
    return false;
  });

  // Text size setting (12px to 24px)
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mcs_font_size');
      return stored ? parseInt(stored, 10) || 13 : 13;
    }
    return 13;
  });

  // UI Compactness setting ('cozy' | 'normal' | 'compact' | 'ultra-compact')
  const [compactness, setCompactness] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mcs_compactness') || 'normal';
    }
    return 'normal';
  });

  // High contrast setting
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mcs_high_contrast') === 'true';
    }
    return false;
  });

  // Reduced motion setting
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mcs_reduced_motion') === 'true';
    }
    return false;
  });

  // Push notifications setting
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mcs_push_notifications') === 'true';
    }
    return false;
  });

  // Audio cues setting
  const [soundFeedback, setSoundFeedback] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mcs_sound_feedback') === 'true';
    }
    return true;
  });

  const [notifStatus, setNotifStatus] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Sample media images associated with active user session
  const [userImages] = useState([
    {
      id: 'img-1',
      title: 'Nether Fortress Storyboard Concept',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
      timestamp: 'Active Session',
    },
    {
      id: 'img-2',
      title: 'Ancient Builder Citadel Keyframe',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
      timestamp: 'Active Session',
    },
  ]);

  // Sample media videos associated with active user session
  const [userVideos] = useState([
    {
      id: 'vid-1',
      title: 'Act 1 Opening Scene Animatic Test',
      duration: '0:45',
      format: 'MP4 1080p',
      timestamp: 'Active Session',
    },
  ]);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  // Apply text scaling globally up to 24px
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('mcs_font_size', fontSize.toString());
  }, [fontSize]);

  // Apply UI compactness
  useEffect(() => {
    document.documentElement.setAttribute('data-compactness', compactness);
    localStorage.setItem('mcs_compactness', compactness);
  }, [compactness]);

  // Apply high contrast
  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  }, [highContrast]);

  // Apply reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  // Filter entries submitted by currently logged-in user in this session
  const myPitches = entries.filter((entry) => {
    if (!user) return false;
    return entry.submitterUsername === user.discordUsername || entry.submitterId === user.id;
  });

  // Helper to get pitch title from ID
  const getPitchTitle = (id?: string) => {
    if (!id) return 'Unselected';
    const found = entries.find((e) => e.id === id);
    return found ? found.title : id;
  };

  // Push notification permission handler
  const handlePushToggle = async (enabled: boolean) => {
    if (!enabled) {
      setPushEnabled(false);
      localStorage.setItem('mcs_push_notifications', 'false');
      setNotifStatus('');
      return;
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('mcs_push_notifications', 'true');
        setNotifStatus('Active');
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPushEnabled(true);
          localStorage.setItem('mcs_push_notifications', 'true');
          setNotifStatus('Active');
          try {
            new Notification('Ranked Voting Platform', {
              body: 'Push notifications enabled. You will receive updates on ballot results.',
            });
          } catch {
            // Some mobile browsers restrict notification constructor
          }
        } else {
          setPushEnabled(false);
          localStorage.setItem('mcs_push_notifications', 'false');
          setNotifStatus('Permission denied');
        }
      } else {
        setPushEnabled(false);
        localStorage.setItem('mcs_push_notifications', 'false');
        setNotifStatus('Blocked in browser');
      }
    } else {
      setPushEnabled(true);
      localStorage.setItem('mcs_push_notifications', 'true');
      setNotifStatus('Enabled');
    }
  };

  // Explicitly persist settings to local storage
  const handleSaveSettings = () => {
    localStorage.setItem('mcs_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('mcs_font_size', fontSize.toString());
    localStorage.setItem('mcs_compactness', compactness);
    localStorage.setItem('mcs_high_contrast', highContrast ? 'true' : 'false');
    localStorage.setItem('mcs_reduced_motion', reducedMotion ? 'true' : 'false');
    localStorage.setItem('mcs_push_notifications', pushEnabled ? 'true' : 'false');
    localStorage.setItem('mcs_sound_feedback', soundFeedback ? 'true' : 'false');

    setSaveStatus('Settings saved successfully');
    setTimeout(() => {
      setSaveStatus('');
    }, 2500);
  };

  const handleRoleChange = (role: UserRole) => {
    loginAsDevUser(role, role === 'admin' ? 'SteveDev' : 'CommunityVoter');
  };

  const handleLogout = () => {
    logout();
    onNavigateTab('overview');
  };

  return (
    <div className="tab-content-area">
      {/* Page Header */}
      <div className="card-header" style={{ marginBottom: 4 }}>
        <div>
          <div className="hero-subtitle">Application Configuration</div>
          <h1 className="hero-title" style={{ fontSize: '26px' }}>Settings & Account Hub</h1>
        </div>
      </div>

      <div className="settings-page-layout">
        {/* Hierarchical Subsection Sidebar matching Reference Tree */}
        <aside className="settings-nav-card">
          {/* Group 1: Account */}
          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Account</span>
            </div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'account_info' ? 'active' : ''}`}
                onClick={() => scrollToSection('account_info')}
              >
                Account Info
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'account_standing' ? 'active' : ''}`}
                onClick={() => scrollToSection('account_standing')}
              >
                Account Standing
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'account_security' ? 'active' : ''}`}
                onClick={() => scrollToSection('account_security')}
              >
                Password & Security
              </button>
            </div>
          </div>

          {/* Group 2: Appearance */}
          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Appearance</span>
            </div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'app_theme' ? 'active' : ''}`}
                onClick={() => scrollToSection('app_theme')}
              >
                Dark Mode & Theme
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'app_density' ? 'active' : ''}`}
                onClick={() => scrollToSection('app_density')}
              >
                Theme Density
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'app_audio' ? 'active' : ''}`}
                onClick={() => scrollToSection('app_audio')}
              >
                Audio Feedback
              </button>
            </div>
          </div>

          {/* Group 3: Accessibility */}
          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              <span>Accessibility</span>
            </div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'a11y_text_size' ? 'active' : ''}`}
                onClick={() => scrollToSection('a11y_text_size')}
              >
                Text Size (Up to 24px)
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'a11y_compactness' ? 'active' : ''}`}
                onClick={() => scrollToSection('a11y_compactness')}
              >
                UI Compactness
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'a11y_contrast' ? 'active' : ''}`}
                onClick={() => scrollToSection('a11y_contrast')}
              >
                Contrast & Motion
              </button>
            </div>
          </div>

          {/* Group 4: Media */}
          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Media</span>
            </div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'media_entries' ? 'active' : ''}`}
                onClick={() => scrollToSection('media_entries')}
              >
                User Entries
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'media_images' ? 'active' : ''}`}
                onClick={() => scrollToSection('media_images')}
              >
                Uploaded Images
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'media_videos' ? 'active' : ''}`}
                onClick={() => scrollToSection('media_videos')}
              >
                Video Clips & Cuts
              </button>
            </div>
          </div>

          {/* Group 5: Activity */}
          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>Activity</span>
            </div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'act_ballot' ? 'active' : ''}`}
                onClick={() => scrollToSection('act_ballot')}
              >
                My Cast Ballot
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'act_notifications' ? 'active' : ''}`}
                onClick={() => scrollToSection('act_notifications')}
              >
                Notifications
              </button>
            </div>
          </div>

          {/* Group 6: Community & Legal */}
          <div className="settings-sidebar-group">
            <div className="settings-sidebar-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Legal & Guidelines</span>
            </div>
            <div className="settings-subsection-list">
              <button
                className={`settings-subsection-item ${activeSubTab === 'legal_guidelines' ? 'active' : ''}`}
                onClick={() => scrollToSection('legal_guidelines')}
              >
                Community Guidelines
              </button>
              <button
                className={`settings-subsection-item ${activeSubTab === 'legal_terms' ? 'active' : ''}`}
                onClick={() => scrollToSection('legal_terms')}
              >
                Terms of Service
              </button>
            </div>
          </div>

          {/* Group 7: Developer Tools (Visible if admin) */}
          {user?.role === 'admin' && (
            <div className="settings-sidebar-group">
              <div className="settings-sidebar-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span>Developer Tools</span>
              </div>
              <div className="settings-subsection-list">
                <button
                  className={`settings-subsection-item ${activeSubTab === 'dev_roles' ? 'active' : ''}`}
                  onClick={() => scrollToSection('dev_roles')}
                >
                  Role Privileges
                </button>
              </div>
            </div>
          )}

          {/* Build Version Indicator */}
          <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-light)', textAlign: 'center' }}>
            <div className="mono" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Build v1.0.0-rc4</div>
            <div style={{ fontSize: '10px', marginTop: 2 }}>Release 2026.09.13 | internal-logic</div>
          </div>
        </aside>

        {/* Continuous Scrollable Content Column */}
        <div className="settings-scroll-container">
          {/* Subsection 1: Account Info */}
          <section id="account_info" className="settings-section-card">
            <div>
              <div className="card-title">Account Information</div>
              <div className="card-desc">Inspect your authenticated Discord profile and identity parameters.</div>
            </div>

            {user ? (
              <div className="settings-panel-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={user.discordAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user.discordUsername}
                    style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--accent-green)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {user.discordUsername}
                      </span>
                      <span title="Verified Discord Username (Immutable)" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge ${user.role === 'admin' ? 'badge-engine' : 'badge-success'}`}>
                        {user.role.toUpperCase()}
                      </span>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Discord ID: {user.discordId || user.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="callout callout-info">
                You are currently browsing as a Guest. Sign in with Discord to participate in voting and scene pitches.
              </div>
            )}

            <div className="callout callout-info" style={{ margin: 0 }}>
              Discord identity attributes are authenticated through OAuth2 and remain immutable across all voting rounds.
            </div>

            {user && (
              <div style={{ paddingTop: 6 }}>
                <button className="btn btn-danger" onClick={handleLogout} style={{ gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </section>

          {/* Subsection 2: Account Standing */}
          <section id="account_standing" className="settings-section-card">
            <div>
              <div className="card-title">Account Standing & Discipline</div>
              <div className="card-desc">Review disciplinary status. Users with 3 accumulated warnings are barred from participating.</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Current Status:
                </span>
                <span className={`badge ${isBarred ? 'badge-danger' : warnings > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
                  {isBarred ? 'BARRED FROM PARTICIPATING' : warnings === 2 ? '2/3 WARNINGS (CAUTION)' : warnings === 1 ? '1/3 WARNINGS' : 'GOOD STANDING (0 WARNS)'}
                </span>
              </div>
            </div>

            {/* 3-Slot Visual Warning Meter */}
            <div className="warning-meter">
              <div className={`warning-slot ${warnings >= 1 ? 'active-warn-1' : ''}`}>
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Warning 1</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                  {warnings >= 1 ? 'Recorded Violation' : 'Clean'}
                </span>
              </div>
              <div className={`warning-slot ${warnings >= 2 ? 'active-warn-2' : ''}`}>
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Warning 2</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                  {warnings >= 2 ? 'Severe Caution' : 'Clean'}
                </span>
              </div>
              <div className={`warning-slot ${warnings >= 3 ? 'active-warn-3' : ''}`}>
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Warning 3 (Barred)</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                  {warnings >= 3 ? 'Barred from Voting' : 'Clean'}
                </span>
              </div>
            </div>

            {isBarred ? (
              <div className="callout callout-danger" style={{ margin: 0 }}>
                <strong>Account Restricted:</strong> This account has accumulated 3 warnings. You are permanently restricted from casting ballots, submitting scene pitches, and participating in active rounds.
              </div>
            ) : (
              <div className="callout callout-info" style={{ margin: 0 }}>
                Three recorded policy violations result in automatic exclusion from ballot submissions and pitch proposal catalogs.
              </div>
            )}

            {/* Disciplinary Tester Controls */}
            <div style={{ paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
              <div className="settings-section-title">Test Disciplinary Thresholds</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={addWarning}
                  disabled={isBarred}
                >
                  Simulate Warning (+1)
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={clearWarnings}
                >
                  Reset Warnings (Clear)
                </button>
              </div>
            </div>
          </section>

          {/* Subsection 3: Password & Security */}
          <section id="account_security" className="settings-section-card">
            <div>
              <div className="card-title">Password & Security</div>
              <div className="card-desc">Review your OAuth session integrity and authentication state.</div>
            </div>

            <div className="settings-panel-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Discord OAuth2 Token</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Session verified via cryptographic bearer token</div>
                </div>
                <span className="badge badge-success">Active Token</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Two-Factor Authentication (2FA)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enforced at Discord provider level</div>
                </div>
                <span className="badge badge-success">Enabled</span>
              </div>
            </div>
          </section>

          {/* Subsection 4: Dark Mode & Theme */}
          <section id="app_theme" className="settings-section-card">
            <div>
              <div className="card-title">Dark Mode & Theme Appearance</div>
              <div className="card-desc">Switch between clean light dashboard mode and high-contrast dark theme.</div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-label">Dark Mode</div>
                <div className="settings-row-desc">Switch between light and dark theme across all dashboard views</div>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div style={{ paddingTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className={`save-settings-btn ${saveStatus ? 'saved' : ''}`}
                onClick={handleSaveSettings}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{saveStatus || 'Save Theme Settings'}</span>
              </button>
              {saveStatus && (
                <span className="text-success" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Theme preference saved.
                </span>
              )}
            </div>
          </section>

          {/* Subsection 5: Theme Density */}
          <section id="app_density" className="settings-section-card">
            <div>
              <div className="card-title">Theme Density</div>
              <div className="card-desc">Adjust padding and whitespace across cards and tables.</div>
            </div>

            <div className="text-size-presets">
              {['cozy', 'normal', 'compact', 'ultra-compact'].map((mode) => (
                <button
                  key={mode}
                  className={`text-size-preset-btn ${compactness === mode ? 'active' : ''}`}
                  onClick={() => setCompactness(mode)}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ paddingTop: 6 }}>
              <button className="save-settings-btn" onClick={handleSaveSettings}>
                <span>Save Density Settings</span>
              </button>
            </div>
          </section>

          {/* Subsection 6: Audio Feedback */}
          <section id="app_audio" className="settings-section-card">
            <div>
              <div className="card-title">Audio Feedback & Sound Cues</div>
              <div className="card-desc">Toggle sound cues on allocating ballot ranks.</div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-label">Audio Feedback</div>
                <div className="settings-row-desc">Play audio confirmations when casting ballots</div>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={soundFeedback}
                  onChange={(e) => setSoundFeedback(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div style={{ paddingTop: 6 }}>
              <button className="save-settings-btn" onClick={handleSaveSettings}>
                <span>Save Audio Settings</span>
              </button>
            </div>
          </section>

          {/* Subsection 7: Accessibility - Text Size (Up to 24px) */}
          <section id="a11y_text_size" className="settings-section-card">
            <div>
              <div className="card-title">Text Scaling (Up to 24px)</div>
              <div className="card-desc">Scale text dynamically from 12px up to 24px for enhanced readability.</div>
            </div>

            <div className="text-size-slider-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Base Text Size</span>
                <span className="badge badge-engine" style={{ fontSize: '12px' }}>
                  {fontSize}px
                </span>
              </div>

              <input
                type="range"
                min="12"
                max="24"
                step="1"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="range-slider"
              />

              <div className="text-size-presets">
                {[12, 13, 16, 18, 20, 24].map((sz) => (
                  <button
                    key={sz}
                    className={`text-size-preset-btn ${fontSize === sz ? 'active' : ''}`}
                    onClick={() => setFontSize(sz)}
                  >
                    {sz === 13 ? '13px (Default)' : sz === 24 ? '24px (Max)' : `${sz}px`}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Text Preview Box */}
            <div className="settings-panel-box">
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-light)' }}>
                Live Readability Preview ({fontSize}px)
              </div>
              <div style={{ fontSize: `${fontSize}px`, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                Minecraft Movie Act 1 Community Scene Pitches
              </div>
              <p style={{ fontSize: `${Math.max(11, fontSize - 2)}px`, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                The Bastion Remnant Heist: Steve, Alex, and a rogue Piglin orchestrate an infiltration to recover a Netherite lodestone before the raid arrives.
              </p>
            </div>

            <div style={{ paddingTop: 6 }}>
              <button className="save-settings-btn" onClick={handleSaveSettings}>
                <span>Save Text Size</span>
              </button>
            </div>
          </section>

          {/* Subsection 8: Accessibility - UI Compactness */}
          <section id="a11y_compactness" className="settings-section-card">
            <div>
              <div className="card-title">UI Compactness & Spacing</div>
              <div className="card-desc">Control layout density and margins across dashboard cards.</div>
            </div>

            <div className="text-size-presets">
              {[
                { id: 'cozy', label: 'Cozy (Spacious)' },
                { id: 'normal', label: 'Normal (Default)' },
                { id: 'compact', label: 'Compact (Tight)' },
                { id: 'ultra-compact', label: 'Ultra-Compact (Dense)' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`text-size-preset-btn ${compactness === item.id ? 'active' : ''}`}
                  onClick={() => setCompactness(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="settings-panel-box">
              <div style={{ fontWeight: 700, fontSize: '13px' }}>Current Density Mode: {compactness.toUpperCase()}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Adjusts card margins, table cell padding, and grid spacing dynamically.
              </div>
            </div>

            <div style={{ paddingTop: 6 }}>
              <button className="save-settings-btn" onClick={handleSaveSettings}>
                <span>Save Compactness</span>
              </button>
            </div>
          </section>

          {/* Subsection 9: Accessibility - Contrast & Motion */}
          <section id="a11y_contrast" className="settings-section-card">
            <div>
              <div className="card-title">High Contrast & Reduced Motion</div>
              <div className="card-desc">Accessibility features for visual comfort and reduced motion sensitivity.</div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-label">High Contrast Borders</div>
                <div className="settings-row-desc">Enhances border definitions and text clarity</div>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-label">Reduced Motion</div>
                <div className="settings-row-desc">Disables transitions and UI animations</div>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div style={{ paddingTop: 6 }}>
              <button className="save-settings-btn" onClick={handleSaveSettings}>
                <span>Save Contrast & Motion</span>
              </button>
            </div>
          </section>

          {/* Subsection 10: Media - User Entries */}
          <section id="media_entries" className="settings-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="card-title">User Script Entries</div>
                <div className="card-desc">All pitch submissions created by {user?.discordUsername || 'this session user'}.</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onOpenCreatePitch}
                disabled={isBarred}
              >
                + Submit Pitch
              </button>
            </div>

            <div className="settings-panel-box">
              {myPitches.length > 0 ? (
                myPitches.map((pitch) => (
                  <div key={pitch.id} className="mini-pitch-item">
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                      {pitch.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                      {pitch.description}
                    </div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: 4 }}>
                      ID: {pitch.id} | Submitter: {user?.discordUsername}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No written pitch entries recorded for this user session yet.
                </div>
              )}
            </div>
          </section>

          {/* Subsection 11: Media - Uploaded Images */}
          <section id="media_images" className="settings-section-card">
            <div>
              <div className="card-title">Uploaded Concept Images & Storyboards</div>
              <div className="card-desc">Images and concept art attached to your session pitches.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {userImages.map((img) => (
                <div
                  key={img.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card-muted)',
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                  />
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-main)' }}>
                      {img.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {img.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Subsection 12: Media - Video Clips & Animatics */}
          <section id="media_videos" className="settings-section-card">
            <div>
              <div className="card-title">Video Clips & Animatics</div>
              <div className="card-desc">Video sequences and animatic tests linked to your proposals.</div>
            </div>

            <div className="settings-panel-box">
              {userVideos.map((vid) => (
                <div
                  key={vid.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: 'var(--bg-card-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '12px' }}>{vid.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Duration: {vid.duration} | Format: {vid.format}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>
                    Ready
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Subsection 13: My Cast Ballot */}
          <section id="act_ballot" className="settings-section-card">
            <div>
              <div className="card-title">My Cast Ballot</div>
              <div className="card-desc">Review your recorded 3-2-1 ballot choices for the active round.</div>
            </div>

            <div className="settings-panel-box">
              {myBallot ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>
                      BALLOT RECORDED (6 POINTS ALLOCATED)
                    </span>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Round: {roundId}
                    </span>
                  </div>
                  <div className="mini-ballot-item">
                    <span style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>1st Choice (3 pts)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {getPitchTitle(myBallot.rank1)}
                    </span>
                  </div>
                  <div className="mini-ballot-item">
                    <span style={{ fontWeight: 800, color: 'var(--accent-silver)' }}>2nd Choice (2 pts)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {getPitchTitle(myBallot.rank2)}
                    </span>
                  </div>
                  <div className="mini-ballot-item">
                    <span style={{ fontWeight: 800, color: 'var(--accent-bronze)' }}>3rd Choice (1 pt)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {getPitchTitle(myBallot.rank3)}
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onNavigateTab('ballot')}
                    style={{ marginTop: 6, width: 'fit-content' }}
                  >
                    Modify Ballot in Ballot Box
                  </button>
                </>
              ) : (
                <div style={{ padding: '12px 0' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 12 }}>
                    You have not recorded a ballot for the active round yet.
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => onNavigateTab('ballot')}
                  >
                    Cast 3-2-1 Ballot Now
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Subsection 14: Notifications */}
          <section id="act_notifications" className="settings-section-card">
            <div>
              <div className="card-title">Push Notification Alerts</div>
              <div className="card-desc">Configure web push notification alerts for ballot pool status and round outcomes.</div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-label">Browser Push Notifications</div>
                <div className="settings-row-desc">
                  {notifStatus ? `Alert status: ${notifStatus}` : 'Receive alerts when rounds close or results update'}
                </div>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => handlePushToggle(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div style={{ paddingTop: 6 }}>
              <button className="save-settings-btn" onClick={handleSaveSettings}>
                <span>Save Notification Settings</span>
              </button>
            </div>
          </section>

          {/* Subsection 15: Community Guidelines */}
          <section id="legal_guidelines" className="settings-section-card">
            <div>
              <div className="card-title">Community Guidelines</div>
              <div className="card-desc">Standards of participation, etiquette, anti-brigading rules, and content policies.</div>
            </div>

            <div className="settings-panel-box" style={{ lineHeight: 1.6, fontSize: '12px', color: 'var(--text-main)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>1. Respectful Collaboration and Fair Play</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>2. Anti-Brigading and Ballot Integrity</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Anti-stacking invariants are strictly enforced.
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>3. Pitch Submissions and Originality</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>4. Disciplinary Action and 3-Warning Rule</h4>
              <p style={{ color: 'var(--text-muted)' }}>
                Fusce feugiat malesuada odio. Morbi nunc odio, gravida at, cursus nec, luctus a, lorem. Maecenas tristique orci ac sem. Duis ultricies pharetra magna. Accumulation of 3 warnings results in permanent account restriction from the platform.
              </p>
            </div>
          </section>

          {/* Subsection 16: Terms of Service */}
          <section id="legal_terms" className="settings-section-card">
            <div>
              <div className="card-title">Terms of Service</div>
              <div className="card-desc">Platform terms, intellectual property disclosures, and user agreement.</div>
            </div>

            <div className="settings-panel-box" style={{ lineHeight: 1.6, fontSize: '12px', color: 'var(--text-main)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>1. Acceptance of Terms</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio, vitae scelerisque enim ligula venenatis dolor. Maecenas nisl est, ultrices nec congue eget, auctor vitae massa.
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>2. Intellectual Property and Submissions</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus.
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>3. Limitation of Liability</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Pellentesque ipsum. Cras pellentesque volutpat dui. Maecenas tristique orci ac sem. Duis ultricies pharetra magna. Donec accumsan malesuada orci. Donec sit amet eros. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: 4 }}>4. Termination and Modifications</h4>
              <p style={{ color: 'var(--text-muted)' }}>
                Proin in tellus sit amet nibh dignissim sagittis. Vivamus luctus egestas leo. Maecenas sollicitudin. Nullam rhoncus aliquam metus. Etiam egestas wisi a erat. We reserve the right to bar accounts upon receipt of 3 warnings.
              </p>
            </div>
          </section>

          {/* Subsection 17: Developer Role Privileges */}
          {user?.role === 'admin' && (
            <section id="dev_roles" className="settings-section-card">
              <div>
                <div className="card-title">Roles & Access Rights</div>
                <div className="card-desc">Inspect permission tier and switch active roles for platform testing.</div>
              </div>

              <div>
                <div className="settings-section-title">Testing Role Authorization</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    className={`btn ${(user.role as UserRole) === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleRoleChange('user')}
                  >
                    Voter (User Mode)
                  </button>
                  <button
                    className={`btn ${(user.role as UserRole) === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleRoleChange('admin')}
                  >
                    Developer (Admin Mode)
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div className="settings-section-title">Developer Diagnostic Tools</div>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigateTab('diagnostics')}
                >
                  Launch Diagnostics Workbench
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
