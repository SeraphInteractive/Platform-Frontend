import React from 'react';
import { VotingEntry } from '../../hooks/useVotingApi.ts';

interface SubmittersRowProps {
  entries: VotingEntry[];
  onSelectEntry?: (entryId: string) => void;
}

export const SubmittersRow: React.FC<SubmittersRowProps> = ({
  entries,
  onSelectEntry,
}) => {
  // Extract up to 3 real submitters from registered entries
  const displayItems = entries.slice(0, 3);

  return (
    <div className="bottom-submitters-row">
      {displayItems.map((entry) => (
        <div
          key={entry.id}
          className="submitter-card"
          onClick={() => onSelectEntry && onSelectEntry(entry.id)}
          title={`View pitch: ${entry.title}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'var(--bg-card-muted)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {(entry.submitterUsername || 'C')[0]}
            </div>

            <div>
              <div className="submitter-name">{entry.submitterUsername || 'Community Creator'}</div>
              <div className="submitter-email" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="badge badge-engine" style={{ fontSize: '10px' }}>
              Pitch
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};
