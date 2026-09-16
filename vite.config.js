import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  publicDir: '.generated/public',
  resolve: { alias: [{ find: /^phaser$/, replacement: fileURLToPath(new URL('./.generated/engine/phaser.js', import.meta.url)) }] },
  build: {
    // Phaser is the one intentionally large dependency; cache it separately.
    chunkSizeWarningLimit: 1600,
    rolldownOptions: { output: { manualChunks: id => id.includes('/engine/phaser.js') ? 'phaser' : undefined } },
  },
});
