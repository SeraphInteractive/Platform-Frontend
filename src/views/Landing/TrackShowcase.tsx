import React from 'react';
import { DocsSectionId } from '../Docs/DocsPage.tsx';

export type TrackId = 'story' | 'art' | 'builds' | 'voice' | 'animation';

interface TrackData {
  id: TrackId;
  title: string;
  badge: string;
  tag: string;
  imageSrc: string;
  docSection: DocsSectionId;
}

const TRACKS: TrackData[] = [
  {
    id: 'story',
    title: 'Story',
    badge: 'Narrative',
    tag: 'Ranked Choice',
    imageSrc: '/images/scaffold/swamp_night.jpg',
    docSection: 'mathematics',
  },
  {
    id: 'art',
    title: 'Art Style',
    badge: 'Visuals',
    tag: 'Community Direction',
    imageSrc: '/images/scaffold/three_biomes.jpg',
    docSection: 'pipeline',
  },
  {
    id: 'builds',
    title: 'Builds & Sets',
    badge: 'World',
    tag: '3D Schematics',
    imageSrc: '/images/scaffold/birch_forest.jpg',
    docSection: 'pipeline',
  },
  {
    id: 'voice',
    title: 'Voice Casting',
    badge: 'Audio',
    tag: 'Voice Stems',
    imageSrc: '/images/scaffold/swamp_boat.jpg',
    docSection: 'supervision',
  },
  {
    id: 'animation',
    title: 'Animation',
    badge: 'Scene',
    tag: 'GrabBox Queue',
    imageSrc: '/images/scaffold/mangrove_canopy.jpg',
    docSection: 'grabbox',
  },
];

interface TrackShowcaseProps {
  onNavigateDocs?: (section: DocsSectionId) => void;
  onOpenCreatePitch?: () => void;
}

export const TrackShowcase: React.FC<TrackShowcaseProps> = ({ onNavigateDocs }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--bg-card)',
        padding: '24px 28px',
        borderRadius: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', margin: 0 }}>
          Tracks
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        {TRACKS.map((t) => (
          <div
            key={t.id}
            onClick={() => onNavigateDocs?.(t.docSection)}
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'var(--bg-card-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--bg-card-muted)';
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: 130, overflow: 'hidden' }}>
              <img
                src={t.imageSrc}
                alt={t.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'rgba(6, 9, 19, 0.82)',
                  backdropFilter: 'blur(6px)',
                  color: '#f8fafc',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  letterSpacing: '0.02em',
                }}
              >
                {t.badge}
              </span>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t.title}
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {t.tag}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
