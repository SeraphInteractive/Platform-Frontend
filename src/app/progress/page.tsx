"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PIPELINE_PHASES, FLAT_PIPELINE_STEPS, getSavedPipelineStepIndex, savePipelineStepIndex } from "@/lib/pipeline";
import { fetchPipelineProgress } from "@/lib/api";

export default function ProgressPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const { data: pipelineData } = useQuery({
    queryKey: ["pipeline-progress"],
    queryFn: fetchPipelineProgress,
    refetchInterval: 5000
  });

  useEffect(() => {
    if (pipelineData?.stepIndex !== undefined) {
      setCurrentStepIndex(pipelineData.stepIndex);
      savePipelineStepIndex(pipelineData.stepIndex);
    } else {
      setCurrentStepIndex(getSavedPipelineStepIndex());
    }

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setCurrentStepIndex(customEvent.detail);
      } else {
        setCurrentStepIndex(getSavedPipelineStepIndex());
      }
    };

    window.addEventListener("stairway_pipeline_updated", handleUpdate);
    return () => {
      window.removeEventListener("stairway_pipeline_updated", handleUpdate);
    };
  }, [pipelineData]);

  const activeStep = FLAT_PIPELINE_STEPS[currentStepIndex] || FLAT_PIPELINE_STEPS[0];
  const progressPercent = Math.round(((currentStepIndex + 1) / FLAT_PIPELINE_STEPS.length) * 100);

  return (
    <div>
      <h1>Roadmap</h1>

      {/* live pipeline progress tracker */}
      <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "16px" }}>
        <legend style={{ fontWeight: "bold" }}>Live Pipeline Status</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <strong>Current Phase:</strong> {activeStep.phaseTitle} &bull; <code>{activeStep.id}: {activeStep.title}</code>
            </div>
            <div>
              <span className="badge badge-active">{progressPercent}% COMPLETED</span>
              <span className="badge" style={{ marginLeft: "6px" }}>Step {currentStepIndex + 1} of {FLAT_PIPELINE_STEPS.length}</span>
            </div>
          </div>

          {/* master progress bar */}
          <div
            style={{
              width: "100%",
              height: "16px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-dark)",
              padding: "1px",
              position: "relative"
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor: "#276a3c",
                transition: "width 0.3s ease"
              }}
            />
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            <strong>Active Focus:</strong> {activeStep.description}
          </div>
        </div>
      </fieldset>

      {/* detailed phases breakdown with distinct phase milestones */}
      <h2>Production Pipeline Breakdown</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {PIPELINE_PHASES.map((phase) => {
          const isCurrentPhase = activeStep.phaseNumber === phase.phase;
          const isPhaseCompleted = activeStep.phaseNumber > phase.phase;
          const isPhaseQueued = activeStep.phaseNumber < phase.phase;

          const completedStepsInPhase = phase.steps.filter((s) => {
            const idx = FLAT_PIPELINE_STEPS.findIndex((x) => x.id === s.id);
            return idx < currentStepIndex;
          }).length;
          const phasePercent = Math.round((completedStepsInPhase / phase.steps.length) * 100);

          return (
            <fieldset
              key={phase.phase}
              className="grab-box"
              style={{
                backgroundColor: isCurrentPhase ? "#fcfbee" : isPhaseCompleted ? "#fafff8" : "#ffffff",
                borderColor: isCurrentPhase ? "#b8860b" : isPhaseCompleted ? "#276a3c" : "#808080",
                borderWidth: isCurrentPhase ? "2px" : "1px"
              }}
            >
              <legend style={{ fontWeight: "bold" }}>
                {isCurrentPhase ? `[PHASE MILESTONE] ${phase.title}` : phase.title}
                {isCurrentPhase && (
                  <span className="badge badge-active" style={{ marginLeft: "8px" }}>
                    ACTIVE PHASE ({completedStepsInPhase}/{phase.steps.length} Steps)
                  </span>
                )}
                {isPhaseCompleted && (
                  <span className="badge" style={{ marginLeft: "8px", backgroundColor: "#e2f0d9", color: "#276a3c" }}>
                    PHASE COMPLETED (100%)
                  </span>
                )}
                {isPhaseQueued && (
                  <span className="badge" style={{ marginLeft: "8px", color: "#777" }}>
                    QUEUED
                  </span>
                )}
              </legend>

              {/* phase sub-progress bar */}
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--border-dark)",
                  marginBottom: "8px"
                }}
              >
                <div
                  style={{
                    width: isPhaseCompleted ? "100%" : isCurrentPhase ? `${phasePercent}%` : "0%",
                    height: "100%",
                    backgroundColor: isCurrentPhase ? "#b8860b" : "#276a3c",
                    transition: "width 0.3s ease"
                  }}
                />
              </div>

              <table className="data-table" style={{ margin: "4px 0" }}>
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>Milestone</th>
                    <th style={{ width: "28%" }}>Title</th>
                    <th style={{ width: "45%" }}>Description</th>
                    <th style={{ width: "15%" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {phase.steps.map((step) => {
                    const flatIdx = FLAT_PIPELINE_STEPS.findIndex((s) => s.id === step.id);
                    const isStepActive = flatIdx === currentStepIndex;
                    const isStepDone = flatIdx < currentStepIndex;

                    return (
                      <tr
                        key={step.id}
                        style={{
                          backgroundColor: isStepActive ? "#fffde8" : isStepDone ? "#fafff8" : "inherit",
                          fontWeight: isStepActive ? "bold" : "normal"
                        }}
                      >
                        <td><code>{step.id}</code></td>
                        <td>{step.title}</td>
                        <td>{step.description}</td>
                        <td>
                          {isStepDone ? (
                            <span className="badge" style={{ backgroundColor: "#e2f0d9", color: "#276a3c" }}>
                              &check; DONE
                            </span>
                          ) : isStepActive ? (
                            <span className="badge badge-active">
                              &bull; CURRENT
                            </span>
                          ) : (
                            <span className="badge" style={{ color: "#777" }}>
                              QUEUED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

