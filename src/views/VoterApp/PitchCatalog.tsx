import React from 'react';
import { VotingEntry } from '../../hooks/useVotingApi.ts';

interface PitchCatalogProps {
  entries: VotingEntry[];
  selectedRank1: string;
  selectedRank2: string;
  selectedRank3: string;
  onSelectRank: (rank: 1 | 2 | 3, entryId: string) => void;
}

export const PitchCatalog: React.FC<PitchCatalogProps> = ({
  entries,
  selectedRank1,
  selectedRank2,
  selectedRank3,
  onSelectRank,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Scene Pitches and Submissions</div>
          <div className="card-desc">
            Explore community script pitches and assign your 1st (3pts), 2nd (2pts), and 3rd (1pt) place picks.
          </div>
        </div>
        <span className="badge badge-engine">{entries.length} Pitches</span>
      </div>

      <div className="pitch-grid">
        {entries.map((pitch) => {
          const isRank1 = selectedRank1 === pitch.id;
          const isRank2 = selectedRank2 === pitch.id;
          const isRank3 = selectedRank3 === pitch.id;
          const isRanked = isRank1 || isRank2 || isRank3;

          return (
            <div
              key={pitch.id}
              className={`pitch-card ${isRanked ? 'ranked' : ''}`}
              style={{
                borderColor: isRank1
                  ? 'var(--accent-gold)'
                  : isRank2
                  ? 'var(--accent-silver)'
                  : isRank3
                  ? 'var(--accent-bronze)'
                  : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="pitch-title">{pitch.title}</div>
                  {isRank1 && <span className="badge slot-rank-1">1st Place</span>}
                  {isRank2 && <span className="badge slot-rank-2">2nd Place</span>}
                  {isRank3 && <span className="badge slot-rank-3">3rd Place</span>}
                </div>
                <div className="pitch-desc">{pitch.description}</div>
              </div>

              <div className="pitch-footer">
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {pitch.id}
                </span>

                {/* Quick rank assign buttons */}
                <div className="pitch-actions">
                  <button
                    className={`btn btn-sm ${isRank1 ? 'btn-primary' : 'btn-secondary'}`}
                    style={isRank1 ? { background: 'var(--accent-gold)', color: '#000' } : {}}
                    onClick={() => onSelectRank(1, pitch.id)}
                  >
                    1st (3p)
                  </button>
                  <button
                    className={`btn btn-sm ${isRank2 ? 'btn-primary' : 'btn-secondary'}`}
                    style={isRank2 ? { background: 'var(--accent-silver)', color: '#000' } : {}}
                    onClick={() => onSelectRank(2, pitch.id)}
                  >
                    2nd (2p)
                  </button>
                  <button
                    className={`btn btn-sm ${isRank3 ? 'btn-primary' : 'btn-secondary'}`}
                    style={isRank3 ? { background: 'var(--accent-bronze)', color: '#fff' } : {}}
                    onClick={() => onSelectRank(3, pitch.id)}
                  >
                    3rd (1p)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
