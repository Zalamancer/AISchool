/** A chapter marker within a lesson video. */
export interface Chapter {
  id: string;
  title: string;
  /** Timestamp in seconds where this chapter begins. */
  startSeconds: number;
  /** Whether this chapter can be extracted as a short-form clip. */
  shortFormEligible: boolean;
  /** Key concepts covered in this chapter. */
  concepts: string[];
}

/** A narration cue that appears at a specific time. */
export interface NarrationSegment {
  /** Start time in seconds. */
  start: number;
  /** The narration text displayed at this timestamp. */
  text: string;
}

/** Full lesson payload consumed by the player. */
export interface LessonData {
  id: string;
  title: string;
  course: string;
  chapter: number;
  lesson: number;
  /** Total video duration in seconds. */
  durationSeconds: number;
  /** Scene identifier used by the engine. */
  scene: string;
  chapters: Chapter[];
  narration: NarrationSegment[];
  /** IDs of prerequisite lessons. */
  prerequisites: string[];
  /** ID of the next lesson. */
  next: string;
}
