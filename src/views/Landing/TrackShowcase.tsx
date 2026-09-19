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
  description: string;
  highlights: string[];
}

const TRACKS: TrackData[] = [
  {
    id: 'story',
    title: 'Story & Narrative',
    badge: 'Narrative',
    tag: 'Ranked Choice',
    imageSrc: '/images/scaffold/swamp_night.jpg',
    docSection: 'tracks',
    description:
      'Propose storyline treatments, dialogue drafts, and character arcs. Community ballots determine key plot milestones through mathematical consensus.',
    highlights: ['Plot Treatments', 'Scene Dialogues', 'Consensus Voting'],
  },
  {
    id: 'art',
    title: 'Art Style & Visuals',
    badge: 'Visuals',
    tag: 'Community Direction',
    imageSrc: '/images/scaffold/three_biomes.jpg',
    docSection: 'tracks',
    description:
      'Shape the visual aesthetic, color scripts, and lighting profiles. Establish the cinematic look across lush swamps, birch forests, and deep caverns.',
    highlights: ['Color Scripts', 'Atmospheric Lighting', 'Visual Direction'],
  },
  {
    id: 'builds',
    title: 'Builds & World Sets',
    badge: 'World',
    tag: '3D Schematics',
    imageSrc: '/images/scaffold/birch_forest.jpg',
    docSection: 'tracks',
    description:
      'Construct voxel sets, landmark locations, and environmental terrain. Submit WorldEdit 3D schematics and world saves for cinematic camera staging.',
    highlights: ['Voxel Set Construction', '3D Schematics', 'Set Staging'],
  },
  {
    id: 'voice',
    title: 'Voice Casting & Audio',
    badge: 'Audio',
    tag: 'Voice Stems',
    imageSrc: '/images/scaffold/swamp_boat.jpg',
    docSection: 'supervision',
    description:
      'Audition for character roles, design sound effects (SFX), and compose orchestral themes. Department leads review and assemble stems into master tracks.',
    highlights: ['Character Auditions', 'Foley & SFX Design', 'Music Stems'],
  },
  {
    id: 'animation',
    title: 'Animation & Scene Staging',
    badge: 'Scene',
    tag: 'GrabBox Queue',
    imageSrc: '/images/scaffold/mangrove_canopy.jpg',
    docSection: 'grabbox',
    description:
      'Claim storyboarded shots from the GrabBox queue, animate 2D/3D character performances, and submit render passes for supervisor review.',
    highlights: ['GrabBox Queue', 'Keyframe Animation', 'Shot Reviews'],
  },
];

interface TrackShowcaseProps {
  onNavigateDocs?: (section: DocsSectionId) => void;
  onOpenCreatePitch?: () => void;
}

export const TrackShowcase: React.FC<TrackShowcaseProps> = ({
  onNavigateDocs,
}) => {
  return (
    <>
      {TRACKS.map((t, index) => {
        const isEven = index % 2 === 0;
        const revealClass = isEven ? 'panel-reveal-left' : 'panel-reveal-right';
        const cardClass = `landing-showcase-card ${isEven ? '' : 'reverse'} ${revealClass}`;

        return (
          <section
            key={t.id}
            className={cardClass}
            style={{ cursor: onNavigateDocs ? 'pointer' : 'default' }}
            onClick={() => onNavigateDocs?.(t.docSection)}
          >
            {isEven ? (
              <>
                <div className="landing-art-container">
                  <img
                    src={t.imageSrc}
                    alt={t.title}
                    className="landing-art-img"
                  />
                </div>
                <div className="landing-showcase-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-engine">{t.badge}</span>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {t.tag}
                    </span>
                  </div>
                  <div className="landing-cta-headline">{t.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {t.description}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {t.highlights.map((h) => (
                      <span
                        key={h}
                        style={{
                          background: 'var(--bg-card-muted)',
                          color: 'var(--text-main)',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="landing-showcase-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-engine">{t.badge}</span>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {t.tag}
                    </span>
                  </div>
                  <div className="landing-cta-headline">{t.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {t.description}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {t.highlights.map((h) => (
                      <span
                        key={h}
                        style={{
                          background: 'var(--bg-card-muted)',
                          color: 'var(--text-main)',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="landing-art-container">
                  <img
                    src={t.imageSrc}
                    alt={t.title}
                    className="landing-art-img"
                  />
                </div>
              </>
            )}
          </section>
        );
      })}
    </>
  );
};
