import {defineConfig} from 'vite';
import mc from '@motion-canvas/vite-plugin';
import ff from '@motion-canvas/ffmpeg';

// Handle CJS default export interop
const motionCanvas = (mc as any).default ?? mc;
const ffmpeg = (ff as any).default ?? ff;

export default defineConfig({
  plugins: [motionCanvas(), ffmpeg()],
});
