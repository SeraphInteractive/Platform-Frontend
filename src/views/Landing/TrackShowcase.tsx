import React, { useState } from 'react';
import { DocsSectionId } from '../Docs/DocsPage.tsx';
import { sounds } from '../../utils/soundEffects.ts';

export type TrackId = 'story' | 'art' | 'builds' | 'voice' | 'animation';

interface TrackData {
  id: TrackId;
  title: string;
  badge: string;
  command: string;
  description: string;
  imageSrc: string;
  docSection: DocsSectionId;
  highlights: { label: string; value: string }[];
  criteria: string[];
}

const TRACKS: TrackData[] = [
  {
    id: 'story',
    title: 'Story',
    badge: 'Narrative Track',
    command: '/pitch story [genre] [summary]',
    description: 'Community creators pitch 1-paragraph plot summaries, dialogue arcs, and character dilemmas. The community ranks concepts through 3-2-1 Borda voting.',
    imageSrc: '/images/stock_01.jpg',
    docSection: 'mathematics',
    highlights: [
      { label: 'Format', value: '1-Paragraph Summary' },
      { label: 'Evaluation', value: '3-2-1 Borda System' },
      { label: 'Runoff Rule', value: 'Top 2 if <50% Lead' },
    ],
    criteria: ['Original character arcs', 'Minecraft lore integration', 'Producible in 3D animation'],
  },
  {
    id: 'art',
    title: 'Art Style',
    badge: 'Visual Direction',
    command: '/vote style [preset_id]',
    description: 'Leadership creates curated visual benchmark reference sets. Community consensus decides shading, lighting, and cinematic Minecraft aesthetic targets.',
    imageSrc: '/images/stock_02.jpg',
    docSection: 'pipeline',
    highlights: [
      { label: 'Benchmarking', value: 'Curated Sets' },
      { label: 'Consensus', value: 'Community Decided' },
      { label: 'Render Target', value: 'Blender Cycles' },
    ],
    criteria: ['Volumetric fog targets', 'Texture resolution limits', 'PBR shader consistency'],
  },
  {
    id: 'builds',
    title: 'Builds & Sets',
    badge: 'World Design',
    command: '/submit build [schematic_url]',
    description: 'Community build contests generate sets, dungeons, and landscapes. Winning world files are imported directly into production master scenes.',
    imageSrc: '/images/stock_03.jpg',
    docSection: 'pipeline',
    highlights: [
      { label: 'Intake', value: 'Community Contests' },
      { label: 'Asset Format', value: '.schem / .nbt' },
      { label: 'Integration', value: 'Blender Geometry' },
    ],
    criteria: ['Structural scale consistency', 'Cinematic sightlines', 'Vanilla block palettes'],
  },
  {
    id: 'voice',
    title: 'Voice Casting',
    badge: 'Audio Track',
    command: '/audition voice [character_id]',
    description: 'Voice actors submit character auditions. The community votes on up to 5 voice choices per character, enforcing that no single voice actor holds multiple roles.',
    imageSrc: '/images/stock_01.jpg',
    docSection: 'supervision',
    highlights: [
      { label: 'Choices', value: '5 Choices Per Role' },
      { label: 'Constraint', value: '1 Role Per VA' },
      { label: 'Format', value: 'Lossless Audio' },
    ],
    criteria: ['Clean 48kHz WAV audio', 'Zero background noise', '1 character role invariant'],
  },
  {
    id: 'animation',
    title: 'Animation',
    badge: 'Shot Production',
    command: '/grab shot [shot_id]',
    description: 'Approved scenes break down into modular 3D shots in the GrabBox dispatcher. Animators claim shots with strict tier deadlines and automated reclamation.',
    imageSrc: '/images/stock_02.jpg',
    docSection: 'grabbox',
    highlights: [
      { label: 'Claim Limit', value: '1 Active Shot' },
      { label: 'Deadlines', value: '5 to 14 Days' },
      { label: 'Reclamation', value: '15m Auto-Daemon' },
    ],
    criteria: ['Rig consistency', 'H.264 desk preview', 'Direct S3 presigned asset upload'],
  },
];

interface TrackShowcaseProps {
  onNavigateDocs: (section: DocsSectionId) => void;
  onOpenCreatePitch: () => void;
}

export const TrackShowcase: React.FC<TrackShowcaseProps> = ({
  onNavigateDocs,
  onOpenCreatePitch,
}) => {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>('story');
  const currentTrack = TRACKS.find((t) => t.id === activeTrackId) || TRACKS[0]!;

  return (
    <div className="card" style={{ padding: '36px 40px', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Production Tracks
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Tracks
          </h2>
        </div>

        {/* 5 Tactile Track Selector Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TRACKS.map((t) => {
            const isActive = t.id === activeTrackId;
            return (
              <button
                key={t.id}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  sounds.playClick();
                  setActiveTrackId(t.id);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontWeight: isActive ? 800 : 600,
                  transition: 'all 0.15s ease',
                }}
              >
                {t.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Track Panel */}
      <div
        className="landing-showcase-card"
        style={{ margin: 0, background: 'var(--bg-card-muted)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="landing-art-container" style={{ position: 'relative' }}>
          <img src={currentTrack.imageSrc} alt={currentTrack.title} className="landing-art-img" />
          <span
            className="badge badge-engine"
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              fontSize: '11px',
            }}
          >
            {currentTrack.badge}
          </span>
        </div>

        <div className="landing-showcase-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)' }}>
              {currentTrack.title}
            </div>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--accent-blue)', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              {currentTrack.command}
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7, marginBottom: 16 }}>
            {currentTrack.description}
          </p>

          {/* Highlights Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {currentTrack.highlights.map((h, i) => (
              <div
                key={i}
                className="white-card"
                style={{ padding: '12px 14px', border: '1px solid var(--border-subtle)' }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                  {h.label}
                </div>
                <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                  {h.value}
                </div>
              </div>
            ))}
          </div>

          {/* Criteria Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {currentTrack.criteria.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                {c}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                sounds.playPop();
                onOpenCreatePitch();
              }}
            >
              + Submit Pitch
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                sounds.playClick();
                onNavigateDocs(currentTrack.docSection);
              }}
            >
              Track Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
