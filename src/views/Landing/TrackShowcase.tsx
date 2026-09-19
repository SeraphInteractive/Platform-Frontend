import React from 'react';

export type TrackId = 'story' | 'art' | 'builds' | 'voice' | 'animation';

interface TrackData {
  id: TrackId;
  title: string;
  badge: string;
  tag: string;
  imageSrc: string;
  description: string;
}

const TRACKS: TrackData[] = [
  {
    id: 'story',
    title: 'Story & Narrative',
    badge: 'Narrative',
    tag: 'Ranked Choice',
    imageSrc: '/images/scaffold/swamp_night.jpg',
    description:
      'Propose storyline treatments, dialogue drafts, and character arcs. Community ballots determine key plot milestones through mathematical consensus.',
  },
  {
    id: 'art',
    title: 'Art Style & Visuals',
    badge: 'Visuals',
    tag: 'Community Direction',
    imageSrc: '/images/scaffold/three_biomes.jpg',
    description:
      'Shape the visual aesthetic, color scripts, and lighting profiles. Establish the cinematic look across lush swamps, birch forests, and deep caverns.',
  },
  {
    id: 'builds',
    title: 'Builds & World Sets',
    badge: 'World',
    tag: '3D Schematics',
    imageSrc: '/images/scaffold/birch_forest.jpg',
    description:
      'Construct voxel sets, landmark locations, and environmental terrain. Submit WorldEdit 3D schematics and world saves for cinematic camera staging.',
  },
  {
    id: 'voice',
    title: 'Voice Casting & Audio',
    badge: 'Audio',
    tag: 'Voice Stems',
    imageSrc: '/images/scaffold/swamp_boat.jpg',
    description:
      'Audition for character roles, design sound effects (SFX), and compose orchestral themes. Department leads review and assemble stems into master tracks.',
  },
  {
    id: 'animation',
    title: 'Animation & Scene Staging',
    badge: 'Scene',
    tag: 'GrabBox Queue',
    imageSrc: '/images/scaffold/mangrove_canopy.jpg',
    description:
      'Claim storyboarded shots from the GrabBox queue, animate 2D/3D character performances, and submit render passes for supervisor review.',
  },
];

export const TrackShowcase: React.FC = () => {
  return (
    <>
      {TRACKS.map((t, index) => {
        const isEven = index % 2 === 0;
        const revealClass = isEven ? 'panel-reveal-left' : 'panel-reveal-right';
        const cardClass = `landing-showcase-card ${isEven ? '' : 'reverse'} ${revealClass}`;

        return (
          <section key={t.id} className={cardClass}>
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
