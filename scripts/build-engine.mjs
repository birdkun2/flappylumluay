import { build } from 'vite';

// Phaser's source uses typeof FEATURE_NAME as build switches (not runtime
// feature detection). Keep both original renderers and disable unused plugins.
const flags = { CANVAS_RENDERER: true, WEBGL_RENDERER: true, FEATURE_SOUND: false,
  PLUGIN_CAMERA3D: false, PLUGIN_FBINSTANT: false, WEBGL_DEBUG: false };
await build({
  configFile: false, publicDir: false,
  define: { global: 'globalThis' },
  plugins: [{
    name: 'phaser-feature-flags', enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').includes('/node_modules/phaser/src/')) return;
      return code.replace(/\btypeof (CANVAS_RENDERER|WEBGL_RENDERER|FEATURE_SOUND|PLUGIN_CAMERA3D|PLUGIN_FBINSTANT|WEBGL_DEBUG)\b/g,
        (_, name) => String(flags[name]));
    },
  }],
  build: {
    outDir: '.generated/engine', emptyOutDir: true, minify: true,
    lib: { entry: 'src/game/phaser-entry.js', formats: ['es'], fileName: () => 'phaser.js' },
  },
});
