import Phaser from 'phaser';
import { ASSETS, STATE } from './config.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); this.state = STATE.BOOT; }
  preload() {
    this.add.text(216, 360, 'LOADING A LITTLE ADVENTURE', { fontFamily: 'monospace', fontSize: '16px', color: '#493029' }).setOrigin(0.5);
    const bar = this.add.rectangle(86, 398, 0, 5, 0xa75c42).setOrigin(0);
    this.load.on('progress', value => { bar.width = 260 * value; });
    this.load.on('loaderror', file => {
      document.getElementById('status').textContent = `Could not load ${file.key}. Please reload.`;
      this.add.text(216, 450, 'Asset loading failed. Please reload.', { fontSize: '14px', color: '#622b24' }).setOrigin(0.5);
      this.failed = true;
    });
    this.load.json('assetFrames', `${import.meta.env.BASE_URL}assets/frames.json`);
    for (const key of Object.keys(ASSETS)) this.load.image(key, `${import.meta.env.BASE_URL}assets/${key}.webp`);
  }
  create() {
    if (this.failed) return;
    const manifest = this.cache.json.get('assetFrames');
    for (const [key, { frames }] of Object.entries(manifest)) {
      for (const [name, rect] of Object.entries(frames)) this.textures.get(key).add(name, 0, ...rect);
    }
    this.anims.create({ key: 'flight', frames: ['idle', 'flap', 'glide'].map(frame => ({ key: 'character', frame })), frameRate: 9, repeat: -1 });
    this.scene.start('Game');
  }
}
