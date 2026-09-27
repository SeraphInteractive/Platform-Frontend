export interface PipelineStep {
  id: string;
  title: string;
  description: string;
}

export interface PipelinePhase {
  phase: number;
  title: string;
  steps: PipelineStep[];
}

export const PIPELINE_PHASES: PipelinePhase[] = [
  {
    phase: 0,
    title: "Phase 0: Pre-Production",
    steps: [
      { id: "0.1", title: "Story Pitching", description: "Community submits entries for briefs, loglines, and pitches." },
      { id: "0.2", title: "Story Vote", description: "Community votes on the winning story concept." },
      { id: "0.3", title: "Script", description: "Standard screenplay draft development after story vote results return." },
      { id: "0.4", title: "Script Lock", description: "Final review and creative sign-off on the completed screenplay." }
    ]
  },
  {
    phase: 1,
    title: "Phase 1: Animatic",
    steps: [
      { id: "1.1", title: "Art Style", description: "Community votes on the visual art style." },
      { id: "1.2", title: "Models and Rigs", description: "Vote on primary character rigs and baseline models." },
      { id: "1.3", title: "3D Storyboarding", description: "Character framing, poses, and cinematography." },
      { id: "1.4", title: "Scratch Audio", description: "Temporary voice lines and sound effects." },
      { id: "1.5", title: "Animatic Lock", description: "Assembly of master shot list." }
    ]
  },
  {
    phase: 2,
    title: "Phase 2: LookDev",
    steps: [
      { id: "2.1", title: "3D Modelling", description: "Worldbuilding." },
      { id: "2.2", title: "Rigging and Deformation", description: "Lightweight proxy rigs for animators." },
      { id: "2.3", title: "Populate the Surfacing and Material library", description: "Internal, but no write permissions on the external port." },
      { id: "2.4", title: "Assets registry", description: "Finalize all assets." }
    ]
  },
  {
    phase: 3,
    title: "Phase 3: Layout",
    steps: [
      { id: "3.1", title: "Rough layout", description: "Prep for animation." },
      { id: "3.2", title: "Set dressing", description: "Foliage, terrain, props, yada yada." },
      { id: "3.3", title: "Final Layout", description: "Baking camera paths and framing." }
    ]
  },
  {
    phase: 4,
    title: "Phase 4: Animation and Effects",
    steps: [
      { id: "4.1", title: "Grabbox", description: "Enable Grabbox for the contributor tier." },
      { id: "4.2", title: "Character Animation", description: "Finish blocking, splining, and polish passes." },
      { id: "4.3", title: "Backgrounds", description: "Crowd sims and cycles." },
      { id: "4.4", title: "Character FX", description: "Cloth sim, hair sim, yada yada." },
      { id: "4.5", title: "Visual FX", description: "Fire sim, smoke sim, water sim, enchantment sims, destruction sims." },
      { id: "4.6", title: "Matte Painting", description: "Paint worldbuilding assets." }
    ]
  },
  {
    phase: 5,
    title: "Phase 5: Lighting and Post",
    steps: [
      { id: "5.1", title: "Lighting", description: "Uh lighting?" },
      { id: "5.2", title: "Rendering", description: "OpenEXR and PNG sequences." },
      { id: "5.3", title: "Compositing", description: "Layering passes and colour corrections." }
    ]
  },
  {
    phase: 6,
    title: "Phase 6: Sound",
    steps: [
      { id: "6.1", title: "Voice Acting", description: "Final recording sessions." },
      { id: "6.2", title: "Sound design and Foley", description: "SFX development and soundscapes finalization." },
      { id: "6.3", title: "Music", description: "Final music score" },
      { id: "6.4", title: "Mixdown", description: "Audio mixdown into surround sound system master audio." }
    ]
  }
];

export interface FlatPipelineStep extends PipelineStep {
  phaseTitle: string;
  phaseNumber: number;
  globalIndex: number;
}

export const FLAT_PIPELINE_STEPS: FlatPipelineStep[] = PIPELINE_PHASES.flatMap((p) =>
  p.steps.map((s) => ({
    ...s,
    phaseTitle: p.title,
    phaseNumber: p.phase,
    globalIndex: 0
  }))
).map((step, idx) => ({ ...step, globalIndex: idx }));

export function getSavedPipelineStepIndex(): number {
  if (typeof window === "undefined") return 0;
  try {
    const val = localStorage.getItem("stairway_pipeline_step_idx");
    if (val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < FLAT_PIPELINE_STEPS.length) {
        return parsed;
      }
    }
  } catch {}
  return 0;
}

export function savePipelineStepIndex(index: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("stairway_pipeline_step_idx", String(index));
    window.dispatchEvent(new CustomEvent("stairway_pipeline_updated", { detail: index }));
  } catch {}
}
