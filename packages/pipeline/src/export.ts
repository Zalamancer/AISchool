/**
 * Motion Canvas frame export to video via FFmpeg.
 *
 * Takes a directory of numbered PNG frames and encodes them into a
 * video file using either H.264 or VP9.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { ExportOptions } from './types.js';

const exec = promisify(execCb);

/**
 * Build the ffmpeg argument list for the chosen codec.
 */
function buildFfmpegArgs(opts: Required<ExportOptions>): string[] {
  const { framesDir, outputPath, fps, codec, crf, resolution } = opts;

  const inputPattern = `${framesDir}/%05d.png`;

  const args: string[] = [
    'ffmpeg',
    '-y', // overwrite without asking
    '-framerate',
    String(fps),
    '-i',
    inputPattern,
  ];

  if (codec === 'vp9') {
    args.push('-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0');
  } else {
    // h264 (default)
    args.push('-c:v', 'libx264', '-crf', String(crf), '-pix_fmt', 'yuv420p');
  }

  if (resolution) {
    args.push('-vf', `scale=${resolution.width}:${resolution.height}`);
  }

  args.push(outputPath);

  return args;
}

/**
 * Export a directory of numbered PNG frames to a video file.
 *
 * @param options - Export configuration (frames dir, output path, codec, etc.)
 * @returns The absolute path to the encoded video file.
 *
 * @example
 * ```ts
 * const out = await exportScene({
 *   framesDir: './output/frames',
 *   outputPath: './output/lesson.mp4',
 *   fps: 60,
 *   codec: 'h264',
 *   crf: 18,
 * });
 * console.log('Video written to', out);
 * ```
 */
export async function exportScene(options: ExportOptions): Promise<string> {
  const opts: Required<ExportOptions> = {
    fps: 60,
    codec: 'h264',
    crf: 18,
    resolution: undefined as unknown as ExportOptions['resolution'] extends undefined
      ? never
      : NonNullable<ExportOptions['resolution']>,
    ...options,
  } as Required<ExportOptions>;

  /* ---- Validate inputs ---- */

  if (!existsSync(opts.framesDir)) {
    throw new Error(`Frames directory does not exist: ${opts.framesDir}`);
  }

  const outputPath = resolve(opts.outputPath);

  /* ---- Build & run command ---- */

  const args = buildFfmpegArgs({ ...opts, outputPath });
  const cmd = args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ');

  console.log(`[pipeline/export] Running: ${cmd}`);

  try {
    const { stdout, stderr } = await exec(cmd);

    if (stdout) {
      console.log(`[pipeline/export] stdout:\n${stdout}`);
    }
    if (stderr) {
      // ffmpeg writes progress info to stderr; only log it, don't throw.
      console.log(`[pipeline/export] stderr:\n${stderr}`);
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(`FFmpeg export failed: ${message}`);
  }

  console.log(`[pipeline/export] Video exported to ${outputPath}`);
  return outputPath;
}
