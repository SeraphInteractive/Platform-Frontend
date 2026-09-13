import React from 'react';

export interface SubmitterProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  verifiedBallots?: number;
}

interface SubmittersRowProps {
  submitters?: SubmitterProfile[];
  onSelectSubmitter?: (submitter: SubmitterProfile) => void;
}

export const SubmittersRow: React.FC<SubmittersRowProps> = ({
  submitters,
  onSelectSubmitter,
}) => {
  // Default submitters matching the screenshot design
  const defaultSubmitters: SubmitterProfile[] = [
    {
      id: 'sub-1',
      name: 'Eva Robinson',
      handle: '@eva.r',
      email: 'eva.r@syncdesk.co',
      verifiedBallots: 14,
    },
    {
      id: 'sub-2',
      name: 'Helena Crims',
      handle: '@helena.c',
      email: 'helena.c@veq.tech',
      verifiedBallots: 22,
    },
    {
      id: 'sub-3',
      name: 'Anna Morris',
      handle: '@anna',
      email: 'anna@domain.io',
      verifiedBallots: 9,
    },
  ];

  const items = submitters && submitters.length > 0 ? submitters.slice(0, 3) : defaultSubmitters;

  return (
    <div className="bottom-submitters-row">
      {items.map((sub) => (
        <div
          key={sub.id}
          className="submitter-card"
          onClick={() => onSelectSubmitter && onSelectSubmitter(sub)}
          title={`View submitter telemetry for ${sub.name}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--bg-card-muted)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div>
              <div className="submitter-name">{sub.name}</div>
              <div className="submitter-email">{sub.email}</div>
            </div>
          </div>

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </div>
      ))}
    </div>
  );
};
