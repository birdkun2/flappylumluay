import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // Phaser is the one intentionally large dependency; cache it separately.
    chunkSizeWarningLimit: 1600,
    rolldownOptions: { output: { manualChunks: id => id.replaceAll('\\', '/').includes('/node_modules/phaser/') ? 'phaser' : undefined } },
  },
});
