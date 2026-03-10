/**
 * Long-form to short-form video slicing pipeline.
 *
 * Extracts short-form clips from a full-length video based on chapter
 * metadata and optionally prepends/appends intro and outro segments.
 */

import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const execFile = promisify(execFileCb);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChapterInfo {
  /** Unique identifier for this chapter (used in output filenames). */
  id: string;
  /** Human-readable chapter title. */
  title: string;
  /** Chapter start time in seconds. */
  startSeconds: number;
  /** Chapter end time in seconds. */
  endSeconds: number;
  /** Whether this chapter should be extracted as a short-form clip. */
  shortFormEligible: boolean;
}

export interface SliceOptions {
  /** Path to the source long-form video. */
  videoPath: string;
  /** Chapter metadata describing each section of the video. */
  chapters: ChapterInfo[];
  /** Directory where extracted clips will be written. */
  outputDir: string;
  /** Prepend an intro clip to each extracted short. */
  addIntro?: boolean;
  /** Append an outro clip to each extracted short. */
  addOutro?: boolean;
  /** Path to the intro video file (required when addIntro is true). */
  introPath?: string;
  /** Path to the outro video file (required when addOutro is true). */
  outroPath?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a number of seconds as HH:MM:SS.mmm for FFmpeg chapter metadata.
 */
function formatTimestamp(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [
    String(hrs).padStart(2, '0'),
    String(mins).padStart(2, '0'),
    secs.toFixed(3).padStart(6, '0'),
  ].join(':');
}

/**
 * Build an ffmpeg concat demuxer file and run the concat.
 *
 * @param fileParts - Ordered list of video file paths to concatenate.
 * @param outputPath - Destination for the concatenated video.
 * @param tmpDir - Directory to write the concat list file into.
 * @param tag - Unique tag used to name the temporary concat list.
 */
async function concatVideos(
  fileParts: string[],
  outputPath: string,
  tmpDir: string,
  tag: string,
): Promise<void> {
  const listPath = join(tmpDir, `concat_${tag}.txt`);
  const listContent = fileParts
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join('\n');
  await writeFile(listPath, listContent, 'utf-8');

  await execFile('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    outputPath,
  ]);
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

/**
 * Extract short-form clips from a long-form video.
 *
 * For every chapter marked `shortFormEligible`, the function cuts the
 * corresponding segment using stream-copy (no re-encoding) and optionally
 * wraps it with intro/outro clips.
 *
 * @returns Array of absolute paths to the generated clip files.
 */
export async function sliceVideo(options: SliceOptions): Promise<string[]> {
  const {
    videoPath,
    chapters,
    outputDir,
    addIntro = false,
    addOutro = false,
    introPath,
    outroPath,
  } = options;

  if (addIntro && !introPath) {
    throw new Error('addIntro is true but no introPath was provided.');
  }
  if (addOutro && !outroPath) {
    throw new Error('addOutro is true but no outroPath was provided.');
  }

  // Ensure the output directory exists.
  await mkdir(outputDir, { recursive: true });

  const eligible = chapters.filter((ch) => ch.shortFormEligible);
  const outputPaths: string[] = [];

  for (const chapter of eligible) {
    const rawClipPath = join(outputDir, `output_${chapter.id}.mp4`);

    // 1. Extract the raw clip via stream-copy.
    await execFile('ffmpeg', [
      '-y',
      '-i', videoPath,
      '-ss', String(chapter.startSeconds),
      '-to', String(chapter.endSeconds),
      '-c', 'copy',
      rawClipPath,
    ]);

    // 2. If intro/outro are requested, concatenate them around the clip.
    if (addIntro || addOutro) {
      const parts: string[] = [];
      if (addIntro && introPath) parts.push(introPath);
      parts.push(rawClipPath);
      if (addOutro && outroPath) parts.push(outroPath);

      // Only bother concatenating if there's more than just the raw clip.
      if (parts.length > 1) {
        const finalPath = join(outputDir, `final_${chapter.id}.mp4`);
        await concatVideos(parts, finalPath, outputDir, chapter.id);
        outputPaths.push(finalPath);
        continue;
      }
    }

    outputPaths.push(rawClipPath);
  }

  return outputPaths;
}

// ---------------------------------------------------------------------------
// Chapter metadata file generation
// ---------------------------------------------------------------------------

/**
 * Generate an FFmpeg-format chapters metadata file.
 *
 * The file follows the ffmetadata1 format and can be applied to a video with:
 *
 *   ffmpeg -i input.mp4 -i chapters.txt -map_metadata 1 -c copy output.mp4
 *
 * This is also compatible with YouTube chapter markers when timestamps are
 * included in the video description.
 *
 * @param chapters   - The full list of chapter metadata.
 * @param outputPath - Destination path for the metadata file.
 */
export async function generateChapterFile(
  chapters: ChapterInfo[],
  outputPath: string,
): Promise<void> {
  const sorted = [...chapters].sort(
    (a, b) => a.startSeconds - b.startSeconds,
  );

  const lines: string[] = [';FFMETADATA1'];

  for (const ch of sorted) {
    // FFmpeg chapter timestamps are in milliseconds when using the
    // ffmetadata1 format with integer TIMEBASE 1/1000.
    const startMs = Math.round(ch.startSeconds * 1000);
    const endMs = Math.round(ch.endSeconds * 1000);

    lines.push('');
    lines.push('[CHAPTER]');
    lines.push('TIMEBASE=1/1000');
    lines.push(`START=${startMs}`);
    lines.push(`END=${endMs}`);
    lines.push(`title=${ch.title}`);
  }

  // Append a trailing newline.
  lines.push('');

  await writeFile(outputPath, lines.join('\n'), 'utf-8');
}
