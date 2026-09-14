import { useState, useEffect, useCallback } from 'react';

export interface RoadmapDepartment {
  name: string;
  supervisor: string;
  color: string;
  roles: string[];
}

export interface RoadmapDeliverable {
  name: string;
  type: 'script' | 'blueprint' | 'animatic' | 'asset' | 'shots' | 'locked_picture' | 'film';
  status: 'pending' | 'in_progress' | 'completed';
}

export interface PipelineSubStage {
  id: string;
  name: string;
  shortName: string;
  department: string;
  supervisor: string;
  description: string;
  deliverable?: string;
}

export interface PipelineBigStage {
  id: string;
  phaseNumber: number;
  name: string;
  shortName: string;
  supervisors: string[];
  info: string;
  color: string;
  bgTint: string;
  borderColor: string;
  departments: RoadmapDepartment[];
  subStages: PipelineSubStage[];
  inputs: string[];
  deliverables: RoadmapDeliverable[];
}

export const PIPELINE_STAGES: PipelineBigStage[] = [
  {
    id: 'phase-1-writing',
    phaseNumber: 1,
    name: 'Writing',
    shortName: 'Writing',
    supervisors: ['Story Supervisor'],
    info: 'Phase 1 is dedicated to story development, narrative structure, and finalizing the production script from community feedback.',
    color: '#94a3b8',
    bgTint: 'rgba(148, 163, 184, 0.08)',
    borderColor: '#94a3b8',
    inputs: ['Community Feedback'],
    deliverables: [
      { name: 'Script (Final)', type: 'script', status: 'pending' },
    ],
    departments: [
      {
        name: 'Writing',
        supervisor: 'Story Supervisor',
        color: '#94a3b8',
        roles: ['Writers', 'Script Editors'],
      },
    ],
    subStages: [
      {
        id: 'p1-community-intake',
        name: 'Community Feedback & Pitches',
        shortName: 'Pitches',
        department: 'Writing',
        supervisor: 'Story Supervisor',
        description: 'Reviewing approved community story proposals, dialogue ideas, and narrative arcs.',
        deliverable: 'Pitch Selection',
      },
      {
        id: 'p1-writers-room',
        name: 'Writers & Narrative Outline',
        shortName: 'Outline',
        department: 'Writing',
        supervisor: 'Story Supervisor',
        description: 'Structuring act beats, scene treatments, character motivation, and scene-by-scene script.',
        deliverable: 'Draft Script',
      },
      {
        id: 'p1-script-final',
        name: 'Script (Final)',
        shortName: 'Final Script',
        department: 'Writing',
        supervisor: 'Story Supervisor',
        description: 'Story supervisor sign-off on the final table-read script ready for pre-vis handoff.',
        deliverable: 'Script (Final)',
      },
    ],
  },
  {
    id: 'phase-2-previs',
    phaseNumber: 2,
    name: 'Pre-Vis',
    shortName: 'Pre-Vis',
    supervisors: ['Story Supervisor', 'Art Supervisor', 'Animation Supervisor', 'Post-Production Supervisor'],
    info: "Phase 2 is dedicated to Pre-Vis. The Post-Production Supervisor edits animatic's 1st draft. After auditions, voice actors provide their lines for the 2nd draft, 2D animators will refine story, tone, and layout with storyboards and voice lines into a final animatic.",
    color: '#3b82f6',
    bgTint: 'rgba(59, 130, 246, 0.08)',
    borderColor: '#3b82f6',
    inputs: ['Script (Final)'],
    deliverables: [
      { name: 'Asset Blueprints', type: 'blueprint', status: 'pending' },
      { name: 'Animatic (1st Draft)', type: 'animatic', status: 'pending' },
      { name: 'Dialogue Stems', type: 'asset', status: 'pending' },
      { name: 'Animatic (2nd Draft)', type: 'animatic', status: 'pending' },
      { name: 'Animatic (Final)', type: 'animatic', status: 'pending' },
    ],
    departments: [
      {
        name: 'Visual Dev & Storyboarding',
        supervisor: 'Art Supervisor & Story Supervisor',
        color: '#60a5fa',
        roles: ['Concept Artists', 'Storyboarders'],
      },
      {
        name: 'Sound Department',
        supervisor: 'Post-Production Supervisor',
        color: '#f97316',
        roles: ['Voice Actor Director', 'Voice Actors'],
      },
      {
        name: '2D Animation & Timing',
        supervisor: 'Animation Supervisor',
        color: '#06b6d4',
        roles: ['2D Animators', 'Post-Production Editor'],
      },
    ],
    subStages: [
      {
        id: 'p2-vis-dev-blueprints',
        name: 'Concept Artists & Asset Blueprints',
        shortName: 'Asset Blueprints',
        department: 'Visual Dev & Storyboarding',
        supervisor: 'Art Supervisor',
        description: 'Generating character turnarounds, color scripts, and architectural asset blueprints.',
        deliverable: 'Asset Blueprints',
      },
      {
        id: 'p2-storyboards-draft1',
        name: 'Storyboarders & Animatic (1st Draft)',
        shortName: 'Animatic 1st Draft',
        department: 'Visual Dev & Storyboarding',
        supervisor: 'Story Supervisor',
        description: 'Drafting beatboards, camera angles, and initial Post-Production Supervisor rough cut.',
        deliverable: 'Animatic (1st Draft)',
      },
      {
        id: 'p2-voice-dialogue-draft2',
        name: 'Voice Auditions & Dialogue (2nd Draft)',
        shortName: 'Dialogue & 2nd Draft',
        department: 'Sound Department',
        supervisor: 'Post-Production Supervisor',
        description: 'Voice actor director auditions, recording dialogue lines, and assembling animatic 2nd draft.',
        deliverable: 'Animatic (2nd Draft)',
      },
      {
        id: 'p2-2d-animatic-final',
        name: '2D Animators & Animatic (Final)',
        shortName: 'Animatic (Final)',
        department: '2D Animation',
        supervisor: 'Animation Supervisor',
        description: 'Refining story tone, visual timing, and layout with storyboards and voice lines into final animatic.',
        deliverable: 'Animatic (Final)',
      },
    ],
  },
  {
    id: 'phase-3-production',
    phaseNumber: 3,
    name: 'Production',
    shortName: 'Production',
    supervisors: ['Art Supervisor', 'Animation Supervisor'],
    info: 'Phase 3 is dedicated to Production. The applicable departments finish the shots so they can be given to post-production.',
    color: '#eab308',
    bgTint: 'rgba(234, 179, 8, 0.08)',
    borderColor: '#eab308',
    inputs: ['Asset Blueprints', 'Animatic (Final)'],
    deliverables: [
      { name: 'Rigged Assets', type: 'asset', status: 'pending' },
      { name: 'Rendered Shots', type: 'shots', status: 'pending' },
    ],
    departments: [
      {
        name: 'Art Department (Assets)',
        supervisor: 'Art Supervisor',
        color: '#fbbf24',
        roles: ['Builders', 'Modelers', 'Texture/Shading Artists', 'Riggers'],
      },
      {
        name: 'Animation Pipeline (Shots)',
        supervisor: 'Animation Supervisor',
        color: '#2dd4bf',
        roles: ['Layout/Blockout Artists', 'Animators', 'FX Artists', 'Lighters'],
      },
    ],
    subStages: [
      {
        id: 'p3-builders-modeling',
        name: 'Builders & 3D Modelers',
        shortName: '3D Modeling',
        department: 'Art Department (Assets)',
        supervisor: 'Art Supervisor',
        description: 'Building world sets, voxel terrain environments, and character/item prop meshes.',
        deliverable: '3D Models & Sets',
      },
      {
        id: 'p3-texture-riggers',
        name: 'Texture/Shading & Riggers',
        shortName: 'Rigged Assets',
        department: 'Art Department (Assets)',
        supervisor: 'Art Supervisor',
        description: 'Applying PBR shaders, cel-shading profiles, face flexes, and limb IK deformation rigs.',
        deliverable: 'Rigged Assets',
      },
      {
        id: 'p3-layout-blockout',
        name: 'Layout & Blockout Artists',
        shortName: 'Layout Staging',
        department: 'Animation Pipeline',
        supervisor: 'Animation Supervisor',
        description: 'Staging 3D rigged assets in world sets matching final animatic camera lenses and timing.',
        deliverable: '3D Blockouts',
      },
      {
        id: 'p3-character-animation-fx',
        name: 'Animators & FX Artists',
        shortName: 'Animation & FX',
        department: 'Animation Pipeline',
        supervisor: 'Animation Supervisor',
        description: 'Primary keyframe character acting, secondary cloth/hair dynamics, and particle simulations.',
        deliverable: 'Animated Shots',
      },
      {
        id: 'p3-lighters-rendered-shots',
        name: 'Lighters & Rendered Shots',
        shortName: 'Rendered Shots',
        department: 'Animation Pipeline',
        supervisor: 'Animation Supervisor',
        description: 'Volumetric atmosphere passes, shadow buffers, rim lighting, and farm GPU frame rendering.',
        deliverable: 'Rendered Shots',
      },
    ],
  },
  {
    id: 'phase-4-post-production',
    phaseNumber: 4,
    name: 'Post-Production',
    shortName: 'Post-Prod',
    supervisors: ['Post-Production Supervisor', 'Audio Supervisor'],
    info: 'Phase 4 is dedicated to the final vfx, the audio mix, and the color render. The post-supervisor will merge them for final renders.',
    color: '#a855f7',
    bgTint: 'rgba(168, 85, 247, 0.08)',
    borderColor: '#a855f7',
    inputs: ['Rendered Shots', 'Animatic (Final)'],
    deliverables: [
      { name: 'Locked Picture', type: 'locked_picture', status: 'pending' },
      { name: 'Master Audio Mix', type: 'asset', status: 'pending' },
      { name: 'Finished Film', type: 'film', status: 'pending' },
    ],
    departments: [
      {
        name: 'Editorial & VFX',
        supervisor: 'Post-Production Supervisor',
        color: '#c084fc',
        roles: ['VFX Artists', 'Post-Production Supervisor', 'Colorist'],
      },
      {
        name: 'Sound Department',
        supervisor: 'Audio Supervisor',
        color: '#fb923c',
        roles: ['Sound Designers (SFX)', 'Mixing Engineer (SFX)', 'Music Producers / Composers', 'Music Supervisor'],
      },
    ],
    subStages: [
      {
        id: 'p4-vfx-editorial',
        name: 'VFX Artists & Post Supervisor',
        shortName: 'VFX & Assembly',
        department: 'Editorial & VFX',
        supervisor: 'Post-Production Supervisor',
        description: 'Compositing multi-pass renders, motion blur, magic glows, and locked picture assembly.',
        deliverable: 'Locked Picture',
      },
      {
        id: 'p4-sound-design-sfx',
        name: 'Sound Designers & SFX Mixing',
        shortName: 'SFX & Foley',
        department: 'Sound Department',
        supervisor: 'Audio Supervisor',
        description: 'Block sound design, creature foley, explosive impact mixing, and audio mastering.',
        deliverable: 'SFX Stems',
      },
      {
        id: 'p4-music-score',
        name: 'Music Producers & Music Supervisor',
        shortName: 'Original Score',
        department: 'Sound Department',
        supervisor: 'Audio Supervisor',
        description: 'Orchestral composition, dynamic thematic cues, and musical stem balancing.',
        deliverable: 'Score Stems',
      },
      {
        id: 'p4-colorist-grading',
        name: 'Colorist & Picture Grading',
        shortName: 'Color Grading',
        department: 'Editorial & VFX',
        supervisor: 'Post-Production Supervisor',
        description: 'Final cinematic color grading, tone mapping, vignette, and film grain mastering.',
        deliverable: 'Graded Master',
      },
      {
        id: 'p4-audio-supervisor-finished-film',
        name: 'Audio Supervisor & Finished Film',
        shortName: 'Finished Film',
        department: 'Editorial & VFX',
        supervisor: 'Post-Production Supervisor',
        description: 'Final audio stem arrangement, 5.1 surround sound mastering, and final film output.',
        deliverable: 'Finished Film',
      },
    ],
  },
];

export interface PipelineState {
  currentBigStageIndex: number;
  currentSubStageIndex: number;
  customPercentage: number | null;
  statusNote: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'mcs_minecraft_community_movie_roadmap_v20';

// Default initial state: Phase 1 (Stage 0, Sub-Stage 0) starting at 0%
const DEFAULT_STATE: PipelineState = {
  currentBigStageIndex: 0,
  currentSubStageIndex: 0,
  customPercentage: 0,
  statusNote: 'Phase 1 Writing initiated from community pitches and feedback.',
  lastUpdated: '2026-09-15',
};

function getStoredState(): PipelineState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.currentBigStageIndex === 'number' &&
      typeof parsed.currentSubStageIndex === 'number'
    ) {
      return {
        currentBigStageIndex: Math.max(0, Math.min(PIPELINE_STAGES.length - 1, parsed.currentBigStageIndex)),
        currentSubStageIndex: Math.max(0, parsed.currentSubStageIndex),
        customPercentage: typeof parsed.customPercentage === 'number' ? parsed.customPercentage : null,
        statusNote: parsed.statusNote || DEFAULT_STATE.statusNote,
        lastUpdated: parsed.lastUpdated || DEFAULT_STATE.lastUpdated,
      };
    }
  } catch {}
  return DEFAULT_STATE;
}

export function usePipelineProgress() {
  const [state, setState] = useState<PipelineState>(getStoredState);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const persistState = useCallback((newState: PipelineState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  }, []);

  const setStage = useCallback((bigIndex: number, subIndex: number = 0) => {
    const safeBig = Math.max(0, Math.min(PIPELINE_STAGES.length - 1, bigIndex));
    const maxSub = PIPELINE_STAGES[safeBig].subStages.length - 1;
    const safeSub = Math.max(0, Math.min(maxSub, subIndex));

    const newState: PipelineState = {
      ...state,
      currentBigStageIndex: safeBig,
      currentSubStageIndex: safeSub,
      customPercentage: null, // revert to auto calculation
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    persistState(newState);
  }, [state, persistState]);

  const setPercentage = useCallback((pct: number | null) => {
    const newState: PipelineState = {
      ...state,
      customPercentage: pct !== null ? Math.max(0, Math.min(100, Math.round(pct))) : null,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    persistState(newState);
  }, [state, persistState]);

  const setStatusNote = useCallback((note: string) => {
    const newState: PipelineState = {
      ...state,
      statusNote: note.trim(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    persistState(newState);
  }, [state, persistState]);

  const resetToZero = useCallback(() => {
    persistState(DEFAULT_STATE);
  }, [persistState]);

  // Total sub-stages across all 4 phases
  const totalSubStages = PIPELINE_STAGES.reduce((acc, stage) => acc + stage.subStages.length, 0);

  let completedSubStages = 0;
  for (let b = 0; b < state.currentBigStageIndex; b++) {
    completedSubStages += PIPELINE_STAGES[b].subStages.length;
  }
  completedSubStages += state.currentSubStageIndex;

  // If at (0, 0) and not custom, percentage is 0
  const autoPercentage = state.currentBigStageIndex === 0 && state.currentSubStageIndex === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((completedSubStages / (totalSubStages - 1)) * 100)));

  const percentage = state.customPercentage !== null ? state.customPercentage : autoPercentage;

  const currentBigStage = PIPELINE_STAGES[state.currentBigStageIndex] || PIPELINE_STAGES[0];
  const currentSubStage = currentBigStage.subStages[state.currentSubStageIndex] || currentBigStage.subStages[0];

  return {
    stages: PIPELINE_STAGES,
    currentBigStageIndex: state.currentBigStageIndex,
    currentSubStageIndex: state.currentSubStageIndex,
    currentBigStage,
    currentSubStage,
    percentage,
    customPercentage: state.customPercentage,
    statusNote: state.statusNote,
    completedSubStages,
    totalSubStages,
    lastUpdated: state.lastUpdated,
    setStage,
    setPercentage,
    setStatusNote,
    resetToZero,
  };
}

