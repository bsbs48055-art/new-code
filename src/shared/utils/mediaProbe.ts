/**
 * Best-effort, dependency-free media inspection utilities.
 *
 * This runs entirely in the browser (no ffprobe/wasm dependency), so the
 * results are approximations:
 *  - Duration/resolution come straight from the browser's media decoder via
 *    an offscreen <video>/<img> element (accurate).
 *  - FPS is estimated by sampling `requestVideoFrameCallback` for ~1 second
 *    (accurate on browsers that support the API; falls back to `undefined`).
 *  - Bitrate is derived from `fileSize * 8 / duration` (accurate average,
 *    not an instantaneous rate).
 *  - Container/codec are guessed from the file's MIME type and the magic
 *    bytes at the start of the file, since full codec parsing would require
 *    a much heavier dependency (e.g. mediainfo.wasm).
 */

import type { MediaProbeResult } from '@shared/types/index';

const MP4_BRANDS = ['isom', 'mp42', 'mp41', 'avc1', 'M4V ', 'qt  '];

async function readMagicBytes(file: File, length = 32): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

function bytesToAscii(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');
}

/** Guesses the container format and a likely codec family from magic bytes. */
async function guessContainerAndCodec(
  file: File,
): Promise<Pick<MediaProbeResult, 'container' | 'videoCodecGuess' | 'audioCodecGuess'>> {
  const bytes = await readMagicBytes(file, 64);
  const ascii = bytesToAscii(bytes);

  if (ascii.includes('ftyp')) {
    const brand = ascii.slice(ascii.indexOf('ftyp') + 4, ascii.indexOf('ftyp') + 8);
    const isMp4Family = MP4_BRANDS.some((b) => ascii.includes(b));
    return {
      container: isMp4Family || brand.trim().length > 0 ? 'MP4/MOV (ISO Base Media)' : 'Unknown ISO container',
      videoCodecGuess: 'H.264/HEVC (typical for MP4 container)',
      audioCodecGuess: 'AAC (typical for MP4 container)',
    };
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return {
      container: 'WebM/Matroska (EBML)',
      videoCodecGuess: 'VP8/VP9/AV1 (typical for WebM)',
      audioCodecGuess: 'Opus/Vorbis (typical for WebM)',
    };
  }
  if (ascii.startsWith('RIFF') && ascii.includes('AVI ')) {
    return { container: 'AVI (RIFF)', videoCodecGuess: 'Unknown (legacy AVI)', audioCodecGuess: 'Unknown' };
  }
  return { container: file.type || 'Unknown', videoCodecGuess: undefined, audioCodecGuess: undefined };
}

/** Loads a video file into an offscreen element to read intrinsic dimensions/duration. */
function probeVideoElement(
  objectUrl: string,
): Promise<{ duration: number; width: number; height: number; videoEl: HTMLVideoElement }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = objectUrl;
    const onError = () => reject(new Error('Unable to load video metadata for probing.'));
    video.addEventListener('error', onError, { once: true });
    video.addEventListener(
      'loadedmetadata',
      () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          videoEl: video,
        });
      },
      { once: true },
    );
  });
}

/** Samples `requestVideoFrameCallback` for ~1s of playback to estimate FPS. */
async function estimateFps(video: HTMLVideoElement): Promise<number | undefined> {
  const supportsRvfc =
    'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  if (!supportsRvfc) return undefined;

  return new Promise((resolve) => {
    let frameCount = 0;
    let startMediaTime: number | null = null;
    const maxSamplingMs = 1000;
    const timeout = setTimeout(() => {
      video.pause();
      resolve(frameCount > 1 ? frameCount : undefined);
    }, maxSamplingMs + 200);

    const onFrame: VideoFrameRequestCallback = (_now, metadata) => {
      if (startMediaTime === null) startMediaTime = metadata.mediaTime;
      frameCount += 1;
      const elapsed = metadata.mediaTime - startMediaTime;
      if (elapsed < maxSamplingMs / 1000 && frameCount < 240) {
        video.requestVideoFrameCallback(onFrame);
      } else {
        clearTimeout(timeout);
        video.pause();
        resolve(elapsed > 0 ? Math.round(frameCount / elapsed) : undefined);
      }
    };

    video.currentTime = 0;
    video.play().catch(() => {
      clearTimeout(timeout);
      resolve(undefined);
    });
    video.requestVideoFrameCallback(onFrame);
  });
}

/** Probes an image file for its intrinsic pixel dimensions. */
async function probeImage(objectUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Unable to load image for probing.'));
    img.src = objectUrl;
  });
}

/**
 * Probes a media file, returning best-effort technical metadata. Never
 * throws: on any failure it returns whatever partial data was gathered.
 */
export async function probeMediaFile(file: File): Promise<MediaProbeResult> {
  const result: MediaProbeResult = {};
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  try {
    const containerInfo = await guessContainerAndCodec(file);
    Object.assign(result, containerInfo);
  } catch {
    // Non-fatal: container/codec guess is best-effort only.
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    if (isVideo) {
      const { duration, width, height, videoEl } = await probeVideoElement(objectUrl);
      result.durationSeconds = duration;
      result.width = width;
      result.height = height;
      if (duration > 0) {
        result.estimatedBitrateKbps = Math.round((file.size * 8) / duration / 1000);
      }
      result.estimatedFps = await estimateFps(videoEl);
    } else if (isImage) {
      const { width, height } = await probeImage(objectUrl);
      result.width = width;
      result.height = height;
    }
  } catch {
    // Non-fatal: the UI simply shows "—" for fields that could not be probed.
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return result;
}
