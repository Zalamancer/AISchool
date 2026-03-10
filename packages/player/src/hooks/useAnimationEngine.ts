'use client';

import {useState, useCallback, useEffect, useRef, useMemo} from 'react';
import type {
  AnimationTimeline,
  AnimationElement,
  AnimationStage,
  EnterAnimation,
  CinematicTextElement,
  EquationSequenceElement,
} from '../types/animation';

export interface HighlightPulse {
  color: string;
  pulseCount: number;
}

export interface PanelItem {
  element: CinematicTextElement | EquationSequenceElement;
  appearedAtStage: number;
  enterAnimation: EnterAnimation;
}

export interface AnimationEngineState {
  currentStage: number;
  stage: AnimationStage;
  activeElements: AnimationElement[];
  enteringElements: Map<string, EnterAnimation>;
  highlightElements: Map<string, HighlightPulse>;
  panelItems: PanelItem[];
  showGraph: boolean;
  isPlaying: boolean;
  stageProgress: number;
  totalStages: number;
}

export interface AnimationEngineControls extends AnimationEngineState {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextStage: () => void;
  prevStage: () => void;
  goToStage: (index: number) => void;
}

/** Ephemeral element types — only visible in the stage they appear, not cumulative. */
const EPHEMERAL_TYPES = new Set(['equation', 'label', 'caption']);

/** Panel element types — rendered in the side TextPanel, accumulate across stages. */
const PANEL_TYPES = new Set(['cinematic-text', 'equation-sequence']);

/** Compute which elements are visible at a given stage.
 *  Geometric elements (grid, vector, etc.) accumulate. Equations/labels show only in their stage. */
function getVisibleElementIds(
  stages: AnimationStage[],
  upToIndex: number,
  elementTypeMap: Map<string, string>,
): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i <= upToIndex; i++) {
    for (const el of stages[i].elements) {
      const elType = elementTypeMap.get(el.elementId) ?? '';
      // Panel types are rendered in TextPanel, skip for canvas
      if (PANEL_TYPES.has(elType)) continue;
      if (EPHEMERAL_TYPES.has(elType)) {
        // Only show in own stage
        if (i === upToIndex) ids.add(el.elementId);
      } else {
        ids.add(el.elementId);
      }
    }
  }
  return ids;
}

/** Get the enter animation for elements NEW in this stage. */
function getEnteringElements(
  stages: AnimationStage[],
  stageIndex: number,
  elementTypeMap: Map<string, string>,
): Map<string, EnterAnimation> {
  const prevIds = stageIndex > 0 ? getVisibleElementIds(stages, stageIndex - 1, elementTypeMap) : new Set<string>();
  const entering = new Map<string, EnterAnimation>();
  for (const el of stages[stageIndex].elements) {
    const elType = elementTypeMap.get(el.elementId);
    // Ephemeral elements always enter fresh each stage
    if (!prevIds.has(el.elementId) || EPHEMERAL_TYPES.has(elType ?? '')) {
      entering.set(el.elementId, el.enter ?? 'fade-in');
    }
  }
  return entering;
}

export function useAnimationEngine(
  timeline: AnimationTimeline,
): AnimationEngineControls {
  const [currentStage, setCurrentStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stageProgress, setStageProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const totalStages = timeline.stages.length;
  const stage = timeline.stages[currentStage];

  const elementMap = useMemo(() => {
    const map = new Map<string, AnimationElement>();
    for (const el of timeline.elements) {
      map.set(el.id, el);
    }
    return map;
  }, [timeline.elements]);

  const elementTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const el of timeline.elements) {
      map.set(el.id, el.type);
    }
    return map;
  }, [timeline.elements]);

  const visibleIds = useMemo(
    () => getVisibleElementIds(timeline.stages, currentStage, elementTypeMap),
    [timeline.stages, currentStage, elementTypeMap],
  );

  const activeElements = useMemo(
    () => [...visibleIds].map((id) => elementMap.get(id)).filter(Boolean) as AnimationElement[],
    [visibleIds, elementMap],
  );

  const enteringElements = useMemo(
    () => getEnteringElements(timeline.stages, currentStage, elementTypeMap),
    [timeline.stages, currentStage, elementTypeMap],
  );

  const highlightElements = useMemo(() => {
    const map = new Map<string, HighlightPulse>();
    for (const el of timeline.stages[currentStage].elements) {
      if (el.highlight) {
        map.set(el.elementId, {
          color: el.highlight.color ?? '#FF6B4A',
          pulseCount: el.highlight.pulseCount ?? 2,
        });
      }
    }
    return map;
  }, [timeline.stages, currentStage]);

  // Accumulate panel items (cinematic-text, equation-sequence) up to current stage
  const panelItems = useMemo(() => {
    const items: PanelItem[] = [];
    const seen = new Set<string>();
    for (let i = 0; i <= currentStage; i++) {
      for (const stageEl of timeline.stages[i].elements) {
        const element = elementMap.get(stageEl.elementId);
        if (!element || !PANEL_TYPES.has(element.type)) continue;
        if (seen.has(element.id)) continue;
        seen.add(element.id);
        items.push({
          element: element as CinematicTextElement | EquationSequenceElement,
          appearedAtStage: i,
          enterAnimation: stageEl.enter ?? 'typewriter',
        });
      }
    }
    return items;
  }, [currentStage, timeline.stages, elementMap]);

  const showGraph = timeline.stages[currentStage]?.showGraph !== false;

  const goToStage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, totalStages - 1));
      setCurrentStage(clamped);
      setStageProgress(0);
      startTimeRef.current = null;
    },
    [totalStages],
  );

  const nextStage = useCallback(() => {
    if (currentStage < totalStages - 1) {
      goToStage(currentStage + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStage, totalStages, goToStage]);

  const prevStage = useCallback(() => {
    goToStage(currentStage - 1);
  }, [currentStage, goToStage]);

  const play = useCallback(() => {
    startTimeRef.current = null;
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => setIsPlaying(false), []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      startTimeRef.current = null;
      setIsPlaying(true);
    }
  }, [isPlaying, pause]);

  // Auto-play timer via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    const durationMs = stage?.durationMs ?? 3000;

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      setStageProgress(progress);

      if (progress >= 1) {
        if (currentStage < totalStages - 1) {
          setCurrentStage((s) => s + 1);
          setStageProgress(0);
          startTimeRef.current = null;
        } else {
          setIsPlaying(false);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, currentStage, totalStages, stage?.durationMs]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStage();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlayPause, nextStage, prevStage]);

  return {
    currentStage,
    stage,
    activeElements,
    enteringElements,
    highlightElements,
    panelItems,
    showGraph,
    isPlaying,
    stageProgress,
    totalStages,
    play,
    pause,
    togglePlayPause,
    nextStage,
    prevStage,
    goToStage,
  };
}
