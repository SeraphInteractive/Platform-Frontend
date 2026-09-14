import React, { useState, useEffect } from 'react';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { sounds } from '../../utils/soundEffects.ts';

interface StageInfo {
  step: number;
  title: string;
  badge: string;
  summary: string;
  metrics: string;
  docSection: DocsSectionId;
  sampleEvent: string;
}

const STAGES: StageInfo[] = [
  {
    step: 1,
    title: 'Pitch',
    badge: 'Creator Intake',
    summary: 'Community members submit 1-paragraph story summaries, dialogue arcs, and concept scenes.',
    metrics: 'Open to all authenticated community members',
    docSection: 'overview',
    sampleEvent: 'Proposal #84 "Nether Fortress Raid" submitted by SteveBuilder',
  },
  {
    step: 2,
    title: 'Consensus',
    badge: 'Mathematical Voting',
    summary: 'Ballots assign 3-2-1 points under the strict 6N conservation invariant with anti-raid entropy filters.',
    metrics: '6N Points Conserved | Top 2 Runoff if <50%',
    docSection: 'mathematics',
    sampleEvent: 'Calculated 1,482 Borda points across 247 ballots with H=0.94 entropy',
  },
  {
    step: 3,
    title: 'GrabBox',
    badge: 'Shot Dispatcher',
    summary: 'Winning concepts decompose into modular 3D Blender shots claimed by animators with tier deadlines.',
    metrics: '1 Active Claim Invariant | 15m Expiry Daemon',
    docSection: 'grabbox',
    sampleEvent: 'Shot #104 (Tier: Medium, 7 Days) claimed by AlexCraft',
  },
  {
    step: 4,
    title: 'Render',
    badge: 'Asset Pipeline',
    summary: 'Direct presigned S3/R2 uploads of .blend files and .mp4 video previews for supervisor desk review.',
    metrics: 'H.264 Video Preview + Raw Blend Asset',
    docSection: 'pipeline',
    sampleEvent: 'Render preview approved by SupervisorDesk and merged into master cut',
  },
];

interface PipelineVisualizerProps {
  onNavigateDocs: (section: DocsSectionId) => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  onNavigateDocs,
}) => {
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const activeInfo = STAGES.find((s) => s.step === selectedStage) || STAGES[0]!;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedStage((prev) => {
          sounds.playWhoosh();
          if (prev >= 4) {
            setIsPlaying(false);
            sounds.playLevelUp();
            return 1;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleStageClick = (step: number) => {
    setIsPlaying(false);
    sounds.playClick();
    setSelectedStage(step);
  };

  const handleTogglePlay = () => {
    sounds.playSlot();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="card" style={{ padding: '36px 40px', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Production Lifecycle
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Pipeline
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn btn-sm ${isPlaying ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleTogglePlay}
          >
            {isPlaying ? 'Pause Simulation' : 'Simulate Pipeline Flow'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              sounds.playClick();
              onNavigateDocs('pipeline');
            }}
          >
            Pipeline Spec
          </button>
        </div>
      </div>

      {/* 4 Interactive Step Nodes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {STAGES.map((stage) => {
          const isSelected = stage.step === selectedStage;
          return (
            <div
              key={stage.step}
              onClick={() => handleStageClick(stage.step)}
              className="white-card"
              style={{
                padding: '20px',
                borderRadius: '16px',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: isSelected ? 'var(--accent-green)' : 'var(--border-subtle)',
                background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? '0 8px 24px rgba(34, 197, 94, 0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: isSelected ? 'var(--accent-green)' : 'var(--bg-card-muted)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '13px',
                  }}
                >
                  {stage.step}
                </span>
                <span className="badge badge-engine" style={{ fontSize: '10px' }}>
                  {stage.badge}
                </span>
              </div>

              <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)', marginBottom: 6 }}>
                {stage.title}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {stage.summary}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Telemetry Card */}
      <div
        className="white-card"
        style={{
          padding: '20px 24px',
          background: 'var(--bg-card-muted)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase' }}>
            Stage {activeInfo.step} Invariants & Rules
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginTop: 2, marginBottom: 4 }}>
            {activeInfo.metrics}
          </div>
          <div className="mono" style={{ fontSize: '12px', color: 'var(--accent-blue)' }}>
            Live Event: {activeInfo.sampleEvent}
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            sounds.playClick();
            onNavigateDocs(activeInfo.docSection);
          }}
        >
          View {activeInfo.title} Documentation
        </button>
      </div>
    </div>
  );
};
