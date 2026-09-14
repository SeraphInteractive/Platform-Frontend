import React, { useState, useEffect, useRef } from 'react';
import { NavTabId } from './Navbar.tsx';
import { DocsSectionId } from '../views/Docs/DocsPage.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { sounds } from '../utils/soundEffects.ts';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  hint?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTabId) => void;
  onNavigateDocs?: (section: DocsSectionId) => void;
  onOpenCreatePitch: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onNavigateDocs,
  onOpenCreatePitch,
}) => {
  const { toggleTheme, settings, setSoundEffects } = useSettings();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      sounds.playPop();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-home', category: 'Navigation', title: 'Go to Home', hint: 'Landing Page', onSelect: () => onNavigateTab('landing') },
    { id: 'nav-overview', category: 'Navigation', title: 'Go to Overview', hint: 'Live Metrics', onSelect: () => onNavigateTab('overview') },
    { id: 'nav-ballot', category: 'Navigation', title: 'Go to Ballot Box', hint: 'Cast 3-2-1 Vote', onSelect: () => onNavigateTab('ballot') },
    { id: 'nav-pitches', category: 'Navigation', title: 'Browse Proposals', hint: 'All Pitches', onSelect: () => onNavigateTab('pitches') },
    { id: 'nav-leaderboard', category: 'Navigation', title: 'View Leaderboard', hint: 'Rankings', onSelect: () => onNavigateTab('leaderboard') },
    { id: 'nav-docs', category: 'Navigation', title: 'Open Documentation', hint: 'Tech Specs', onSelect: () => onNavigateTab('docs') },
    { id: 'nav-settings', category: 'Navigation', title: 'Settings', hint: 'Preferences', onSelect: () => onNavigateTab('settings') },
    
    // Actions
    { id: 'act-pitch', category: 'Actions', title: 'Submit Proposal', hint: 'New Pitch', onSelect: onOpenCreatePitch },
    { id: 'act-theme', category: 'Actions', title: 'Toggle Theme', hint: settings.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark', onSelect: toggleTheme },
    { id: 'act-sound', category: 'Actions', title: 'Toggle Sound Effects', hint: settings.soundEffects ? 'Mute' : 'Unmute', onSelect: () => setSoundEffects(!settings.soundEffects) },

    // Docs Sections
    { id: 'doc-overview', category: 'Documentation', title: 'Docs: Architecture Overview', hint: 'Decentralized Cinema', onSelect: () => { onNavigateDocs ? onNavigateDocs('overview') : onNavigateTab('docs'); } },
    { id: 'doc-backend', category: 'Documentation', title: 'Docs: Backend Specification', hint: 'AdonisJS & Postgres', onSelect: () => { onNavigateDocs ? onNavigateDocs('backend') : onNavigateTab('docs'); } },
    { id: 'doc-math', category: 'Documentation', title: 'Docs: Mathematics & 6N Law', hint: 'Borda & Runoff', onSelect: () => { onNavigateDocs ? onNavigateDocs('mathematics') : onNavigateTab('docs'); } },
    { id: 'doc-sec', category: 'Documentation', title: 'Docs: Security & Anti-Raid', hint: 'Entropy Analysis', onSelect: () => { onNavigateDocs ? onNavigateDocs('security') : onNavigateTab('docs'); } },
    { id: 'doc-grab', category: 'Documentation', title: 'Docs: GrabBox Dispatcher', hint: 'Modular 3D Shots', onSelect: () => { onNavigateDocs ? onNavigateDocs('grabbox') : onNavigateTab('docs'); } },
    { id: 'doc-pipe', category: 'Documentation', title: 'Docs: Storage Pipeline', hint: 'Presigned S3/R2', onSelect: () => { onNavigateDocs ? onNavigateDocs('pipeline') : onNavigateTab('docs'); } },
    { id: 'doc-super', category: 'Documentation', title: 'Docs: Role Supervision', hint: 'Desk Review', onSelect: () => { onNavigateDocs ? onNavigateDocs('supervision') : onNavigateTab('docs'); } },
    { id: 'doc-disc', category: 'Documentation', title: 'Docs: Discipline System', hint: 'Warning Thresholds', onSelect: () => { onNavigateDocs ? onNavigateDocs('discipline') : onNavigateTab('docs'); } },
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.hint && cmd.hint.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      sounds.playReset();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      sounds.playClick();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      sounds.playClick();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        sounds.playSlot();
        filtered[selectedIndex].onSelect();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--bg-card)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px var(--border-subtle)',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-muted)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="input-field"
            placeholder="Type a command, doc section, or page..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              padding: 0,
              boxShadow: 'none',
            }}
          />
          <kbd
            className="mono"
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-light)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No commands matching query.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    sounds.playSlot();
                    cmd.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="badge badge-engine"
                      style={{ fontSize: '10px', padding: '2px 6px' }}
                    >
                      {cmd.category}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: 'var(--text-main)' }}>
                      {cmd.title}
                    </span>
                  </div>

                  {cmd.hint && (
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {cmd.hint}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info strip */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>Use Arrow keys to navigate, Enter to select</span>
          <span className="mono">Quick Switcher</span>
        </div>
      </div>
    </div>
  );
};
