/**
 * Video composition pipeline.
 *
 * Muxes video with audio, applies text/image overlays via FFmpeg filters,
 * normalises audio loudness, and concatenates intro/outro branding clips.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname, join } from 'path';
import type { ComposeOptions, BrandingOptions, Overlay } from './types.js';

const exec = promisify(execCb);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Run a shell command, logging output and throwing on failure.
 */
async function run(cmd: string, label: string): Promise<void> {
  console.log(`[pipeline/compose] ${label}: ${cmd}`);

  try {
    const { stdout, stderr } = await exec(cmd);
    if (stdout) console.log(`[pipeline/compose] stdout:\n${stdout}`);
    if (stderr) console.log(`[pipeline/compose] stderr:\n${stderr}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} failed: ${message}`);
  }
}

/**
 * Escape a string for the FFmpeg drawtext filter (colons, backslashes, etc.).
 */
function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'");
}

/**
 * Build a drawtext filter string for a single text overlay.
 */
function buildDrawtextFilter(overlay: Overlay): string {
  const fontSize = overlay.fontSize ?? 24;
  const [x, y] = overlay.position;
  const escapedText = escapeDrawtext(overlay.text ?? '');
  const enable = `between(t,${overlay.startTime},${overlay.startTime + overlay.duration})`;

  return (
    `drawtext=text='${escapedText}'` +
    `:fontsize=${fontSize}` +
    `:fontcolor=white` +
    `:x=${x}:y=${y}` +
    `:enable='${enable}'`
  );
}

/* ------------------------------------------------------------------ */
/*  composeVideo                                                       */
/* ------------------------------------------------------------------ */

/**
 * Compose a final video by muxing audio, burning in overlays, and
 * optionally normalising loudness.
 *
 * @param options - Composition configuration.
 * @returns The absolute path to the composed output file.
 *
 * @example
 * ```ts
 * const out = await composeVideo({
 *   videoPath: './output/lesson.mp4',
 *   audioPath: './assets/narration.mp3',
 *   outputPath: './output/final.mp4',
 *   overlays: [
 *     { type: 'text', text: 'Chapter 1', position: [50, 50],
 *       startTime: 0, duration: 3, fontSize: 36 },
 *   ],
 *   normalizeAudio: true,
 * });
 * ```
 */
export async function composeVideo(options: ComposeOptions): Promise<string> {
  const { videoPath, audioPath, outputPath, overlays, normalizeAudio } = options;

  if (!existsSync(videoPath)) {
    throw new Error(`Video file does not exist: ${videoPath}`);
  }
  if (audioPath && !existsSync(audioPath)) {
    throw new Error(`Audio file does not exist: ${audioPath}`);
  }

  const absOutput = resolve(outputPath);

  /* ---- Normalise audio if requested ---- */

  let effectiveAudioPath = audioPath;

  if (audioPath && normalizeAudio) {
    const normPath = join(
      dirname(absOutput),
      `_normalised_${Date.now()}.wav`,
    );

    const normCmd = [
      'ffmpeg -y',
      `-i "${audioPath}"`,
      `-af loudnorm=I=-16:TP=-1.5:LRA=11`,
      `"${normPath}"`,
    ].join(' ');

    await run(normCmd, 'Audio normalisation');
    effectiveAudioPath = normPath;
  }

  /* ---- Build main compose command ---- */

  const args: string[] = ['ffmpeg', '-y'];

  // Input: video
  args.push('-i', `"${videoPath}"`);

  // Input: audio (if provided)
  if (effectiveAudioPath) {
    args.push('-i', `"${effectiveAudioPath}"`);
  }

  // Video filter chain: text overlays
  const textOverlays = (overlays ?? []).filter(
    (o): o is Overlay & { type: 'text' } => o.type === 'text' && !!o.text,
  );

  if (textOverlays.length > 0) {
    const filterChain = textOverlays.map(buildDrawtextFilter).join(',');
    args.push('-vf', `"${filterChain}"`);
    // Must re-encode video when filters are applied.
    args.push('-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p');
  } else {
    // No video filters -- stream copy for speed.
    args.push('-c:v', 'copy');
  }

  // Audio codec
  if (effectiveAudioPath) {
    args.push('-c:a', 'aac', '-shortest');
  }

  // Image overlays are handled by overlay filter (complex filter graph).
  const imageOverlays = (overlays ?? []).filter(
    (o): o is Overlay & { type: 'image' } => o.type === 'image' && !!o.path,
  );

  if (imageOverlays.length > 0) {
    // When we have image overlays we need a complex filtergraph which
    // supersedes the simple -vf chain built above. Rebuild.
    args.length = 0; // reset
    args.push('ffmpeg', '-y');
    args.push('-i', `"${videoPath}"`);
    if (effectiveAudioPath) {
      args.push('-i', `"${effectiveAudioPath}"`);
    }

    // Add each image overlay as an input
    for (const img of imageOverlays) {
      if (!existsSync(img.path!)) {
        throw new Error(`Overlay image does not exist: ${img.path}`);
      }
      args.push('-i', `"${img.path}"`);
    }

    // Build complex filter graph
    const baseInputIdx = 0;
    const audioInputIdx = effectiveAudioPath ? 1 : -1;
    const firstImgIdx = effectiveAudioPath ? 2 : 1;

    let filterParts: string[] = [];
    let lastLabel = `[${baseInputIdx}:v]`;

    // Apply text overlays first
    if (textOverlays.length > 0) {
      const textFilters = textOverlays.map(buildDrawtextFilter).join(',');
      const textLabel = '[textout]';
      filterParts.push(`${lastLabel}${textFilters}${textLabel}`);
      lastLabel = textLabel;
    }

    // Apply image overlays
    for (let i = 0; i < imageOverlays.length; i++) {
      const img = imageOverlays[i];
      const inputIdx = firstImgIdx + i;
      const [x, y] = img.position;
      const enable = `between(t,${img.startTime},${img.startTime + img.duration})`;
      const outLabel = `[ovr${i}]`;

      filterParts.push(
        `${lastLabel}[${inputIdx}:v]overlay=${x}:${y}:enable='${enable}'${outLabel}`,
      );
      lastLabel = outLabel;
    }

    args.push('-filter_complex', `"${filterParts.join(';')}"`);
    args.push('-map', `"${lastLabel}"`);

    if (audioInputIdx >= 0) {
      args.push('-map', `"${audioInputIdx}:a"`);
      args.push('-c:a', 'aac', '-shortest');
    }

    args.push('-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p');
  }

  args.push(`"${absOutput}"`);

  const cmd = args.join(' ');
  await run(cmd, 'Video composition');

  /* ---- Clean up temporary normalised audio ---- */
  if (audioPath && normalizeAudio && effectiveAudioPath !== audioPath) {
    try {
      unlinkSync(effectiveAudioPath!);
    } catch {
      /* best-effort cleanup */
    }
  }

  console.log(`[pipeline/compose] Composed video written to ${absOutput}`);
  return absOutput;
}

/* ------------------------------------------------------------------ */
/*  addBranding                                                        */
/* ------------------------------------------------------------------ */

/**
 * Concatenate optional intro, main video, and optional outro clips using
 * the FFmpeg concat demuxer.
 *
 * @param options - Branding configuration.
 * @returns The absolute path to the branded output file.
 *
 * @example
 * ```ts
 * const out = await addBranding({
 *   videoPath: './output/final.mp4',
 *   introPath: './assets/intro.mp4',
 *   outroPath: './assets/outro.mp4',
 *   outputPath: './output/branded.mp4',
 * });
 * ```
 */
export async function addBranding(options: BrandingOptions): Promise<string> {
  const { videoPath, introPath, outroPath, outputPath } = options;

  if (!existsSync(videoPath)) {
    throw new Error(`Video file does not exist: ${videoPath}`);
  }
  if (introPath && !existsSync(introPath)) {
    throw new Error(`Intro file does not exist: ${introPath}`);
  }
  if (outroPath && !existsSync(outroPath)) {
    throw new Error(`Outro file does not exist: ${outroPath}`);
  }

  const absOutput = resolve(outputPath);

  // If no intro or outro, just copy the file.
  if (!introPath && !outroPath) {
    const copyCmd = `ffmpeg -y -i "${videoPath}" -c copy "${absOutput}"`;
    await run(copyCmd, 'Copy (no branding clips)');
    return absOutput;
  }

  // Build concat list file
  const segments: string[] = [];
  if (introPath) segments.push(`file '${resolve(introPath)}'`);
  segments.push(`file '${resolve(videoPath)}'`);
  if (outroPath) segments.push(`file '${resolve(outroPath)}'`);

  const concatListPath = join(dirname(absOutput), `_concat_${Date.now()}.txt`);
  writeFileSync(concatListPath, segments.join('\n'), 'utf-8');

  const concatCmd = [
    'ffmpeg -y',
    '-f concat -safe 0',
    `-i "${concatListPath}"`,
    '-c copy',
    `"${absOutput}"`,
  ].join(' ');

  try {
    await run(concatCmd, 'Branding concat');
  } finally {
    // Clean up temp concat list
    try {
      unlinkSync(concatListPath);
    } catch {
      /* best-effort */
    }
  }

  console.log(`[pipeline/compose] Branded video written to ${absOutput}`);
  return absOutput;
}
