import Phaser from 'phaser';
import './style.css';
import { CONFIG as C } from './game/config.js';
import BootScene from './game/BootScene.js';
import GameScene from './game/GameScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: C.WIDTH, height: C.HEIGHT,
  backgroundColor: '#a4d3f3', pixelArt: true, antialias: false, roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 1 }, scene: [BootScene, GameScene],
});
// Development-only inspection for tuning and browser smoke tests.
if (import.meta.env.DEV) window.__LUMLUAY_GAME__ = game;

// Mobile viewport / safe-area changes may settle after the window resize event.
const resizeObserver = new ResizeObserver(() => {
  if (!game.isBooted) return;
  game.scale.getParentBounds();
  game.scale.refresh();
});
resizeObserver.observe(document.getElementById('game'));
game.events.once('destroy', () => resizeObserver.disconnect());
