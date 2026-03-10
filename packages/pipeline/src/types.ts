/**
 * Shared types for the @mathvision/pipeline package.
 *
 * Covers frame export, video composition, branding, slicing, and narration.
 */

/* ------------------------------------------------------------------ */
/*  Frame Export                                                       */
/* ------------------------------------------------------------------ */

export interface ExportOptions {
  /** Directory containing numbered frame PNGs (e.g. 00001.png). */
  framesDir: string;
  /** Destination path for the encoded video file. */
  outputPath: string;
  /** Frames-per-second (default 60). */
  fps?: number;
  /** Video codec (default h264). */
  codec?: 'h264' | 'vp9';
  /** Constant-rate-factor quality (default 18, lower = better). */
  crf?: number;
  /** Optional output resolution override. */
  resolution?: { width: number; height: number };
}

/* ------------------------------------------------------------------ */
/*  Overlays                                                           */
/* ------------------------------------------------------------------ */

export interface Overlay {
  type: 'image' | 'text';
  /** Path to the overlay image (required when type is 'image'). */
  path?: string;
  /** Text content (required when type is 'text'). */
  text?: string;
  /** [x, y] position in pixels from the top-left corner. */
  position: [number, number];
  /** Start time in seconds. */
  startTime: number;
  /** Duration in seconds. */
  duration: number;
  /** Font size for text overlays (default 24). */
  fontSize?: number;
}

/* ------------------------------------------------------------------ */
/*  Composition                                                        */
/* ------------------------------------------------------------------ */

export interface ComposeOptions {
  /** Path to the source video. */
  videoPath: string;
  /** Optional path to an audio track to mux in. */
  audioPath?: string;
  /** Destination path for the composed output. */
  outputPath: string;
  /** Overlays (images / text) to burn into the video. */
  overlays?: Overlay[];
  /** Normalize audio loudness to -16 LUFS (default false). */
  normalizeAudio?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Branding                                                           */
/* ------------------------------------------------------------------ */

export interface BrandingOptions {
  /** Path to the main video. */
  videoPath: string;
  /** Optional intro clip to prepend. */
  introPath?: string;
  /** Optional outro clip to append. */
  outroPath?: string;
  /** Destination path for the branded output. */
  outputPath: string;
}

/* ------------------------------------------------------------------ */
/*  Slicing                                                            */
/* ------------------------------------------------------------------ */

export interface SliceOptions {
  /** Source video path. */
  videoPath: string;
  /** Output path for the trimmed clip. */
  outputPath: string;
  /** Start time in seconds. */
  start: number;
  /** End time in seconds. */
  end: number;
}

/* ------------------------------------------------------------------ */
/*  Narration                                                          */
/* ------------------------------------------------------------------ */

export interface NarrationOptions {
  /** Text to synthesize into speech. */
  text: string;
  /** Destination path for the audio file. */
  outputPath: string;
  /** Voice identifier (provider-specific). */
  voice?: string;
  /** Speech rate multiplier (default 1.0). */
  rate?: number;
}
