/**
 * ElevenLabs TTS narration pipeline.
 *
 * Converts an array of timed narration segments into a single audio track
 * with proper silence gaps matching the original timing.
 */

import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execFile = promisify(execFileCb);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NarrationSegment {
  /** Start time in seconds within the final audio track. */
  start: number;
  /** The text to synthesise via TTS. */
  text: string;
}

export interface NarrationOptions {
  /** ElevenLabs voice ID. Defaults to "21m00Tcm4TlvDq8ikWAM" (Rachel). */
  voiceId?: string;
  /** ElevenLabs API key. Falls back to the ELEVENLABS_API_KEY env var. */
  apiKey?: string;
  /** Path for the final combined audio file. Defaults to a temp path. */
  outputPath?: string;
  /** Output sample rate in Hz. Default 48 000. */
  sampleRate?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a silent audio file of the given duration using ffmpeg.
 *
 * @param durationSeconds - Length of silence in seconds.
 * @param outputPath      - Destination file path (WAV).
 * @param sampleRate      - Audio sample rate (default 48 000).
 */
export async function generateSilence(
  durationSeconds: number,
  outputPath: string,
  sampleRate = 48_000,
): Promise<void> {
  if (durationSeconds <= 0) {
    // Create a zero-length WAV so downstream concat doesn't break.
    durationSeconds = 0;
  }

  await execFile('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `anullsrc=r=${sampleRate}:cl=mono`,
    '-t', String(durationSeconds),
    '-ar', String(sampleRate),
    '-ac', '1',
    outputPath,
  ]);
}

/**
 * Call the ElevenLabs TTS endpoint and return the raw audio bytes (mp3).
 */
async function synthesise(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `ElevenLabs TTS request failed (${response.status}): ${body}`,
    );
  }

  const arrayBuf = await response.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

/**
 * Synthesise narration for every segment and combine them into a single audio
 * file where each segment starts at its designated time offset.
 *
 * The function builds a series of "silence + speech" pairs and concatenates
 * them with ffmpeg.
 *
 * @returns Absolute path to the final combined audio file.
 */
export async function narrateSegments(
  segments: NarrationSegment[],
  options: NarrationOptions = {},
): Promise<string> {
  const {
    voiceId = '21m00Tcm4TlvDq8ikWAM',
    apiKey = process.env.ELEVENLABS_API_KEY ?? '',
    outputPath,
    sampleRate = 48_000,
  } = options;

  if (!apiKey) {
    throw new Error(
      'No ElevenLabs API key provided. Pass it via options.apiKey or set the ' +
      'ELEVENLABS_API_KEY environment variable.',
    );
  }

  if (segments.length === 0) {
    throw new Error('At least one narration segment is required.');
  }

  // Sort segments by start time so we can compute gaps sequentially.
  const sorted = [...segments].sort((a, b) => a.start - b.start);

  // Create a temporary working directory for intermediate files.
  const tmpDir = await mkdtemp(join(tmpdir(), 'narrate-'));

  /** Paths of intermediate files in playback order. */
  const parts: string[] = [];

  try {
    let cursor = 0; // Current position in the timeline (seconds).

    for (let i = 0; i < sorted.length; i++) {
      const seg = sorted[i]!;

      // 1. Insert silence from cursor to segment start (if needed).
      const gap = seg.start - cursor;
      if (gap > 0) {
        const silencePath = join(tmpDir, `silence_${i}.wav`);
        await generateSilence(gap, silencePath, sampleRate);
        parts.push(silencePath);
        cursor += gap;
      }

      // 2. Synthesise the speech.
      const speechMp3Path = join(tmpDir, `speech_${i}.mp3`);
      const audioBytes = await synthesise(seg.text, voiceId, apiKey);
      await writeFile(speechMp3Path, audioBytes);

      // 3. Normalise the speech to WAV at the target sample rate so all
      //    parts share the same format for concatenation.
      const speechWavPath = join(tmpDir, `speech_${i}.wav`);
      await execFile('ffmpeg', [
        '-y',
        '-i', speechMp3Path,
        '-ar', String(sampleRate),
        '-ac', '1',
        speechWavPath,
      ]);
      parts.push(speechWavPath);

      // 4. Probe the duration of the speech clip to advance the cursor.
      const { stdout: durationStr } = await execFile('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        speechWavPath,
      ]);
      const speechDuration = parseFloat(durationStr.trim()) || 0;
      cursor += speechDuration;
    }

    // 5. Build an ffmpeg concat demuxer list.
    const concatListPath = join(tmpDir, 'concat.txt');
    const concatContent = parts
      .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
      .join('\n');
    await writeFile(concatListPath, concatContent, 'utf-8');

    // 6. Concatenate everything into the final output.
    const finalPath =
      outputPath ?? join(tmpDir, 'narration_combined.wav');

    await execFile('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-ar', String(sampleRate),
      '-ac', '1',
      finalPath,
    ]);

    return finalPath;
  } catch (err) {
    // Clean up the temp directory on failure only if we created the output
    // inside it (i.e. no explicit outputPath was given).
    if (!outputPath) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
    throw err;
  }
}
