import Phaser from 'phaser';
import { CONFIG as C, STATE, BACKGROUND_FRAME } from './config.js';
import { drawObstacle } from './obstacles.js';
import { speedForScore, nextGap, overlapsObstacle, creditPass } from './rules.js';
import { createProgress, MODE } from './progress.js';
import ModeMenu from './ModeMenu.js';
import { soundEffects } from './soundEffects.js';

const ink = '#513128';
export default class GameScene extends Phaser.Scene {
  constructor(key = 'Game') { super(key); }
  text(x, y, value, size = 18, color = ink) {
    return this.add.text(x, y, value, { fontFamily: '"Courier New", monospace', fontSize: `${size}px`, fontStyle: 'bold', color, align: 'center' }).setOrigin(0.5);
  }
  announce(value) { document.getElementById('status').textContent = value; }
  create(data = {}) {
    this.state = STATE.TITLE;
    this.score = 0; this.velocity = 0; this.pairs = []; this.spawnClock = 0; this.lastGap = 350;
    try { this.storage = window.localStorage; } catch { this.storage = null; }
    this.progress = data.progress ?? createProgress(this.storage);
    this.best = this.progress.normalBest;
    this.mode = null;
    this.menu = new ModeMenu(this, this.progress);
    this.sfx = soundEffects;
    // Uniform scaling preserves the original landscape proportions. Alternate
    // mirrored copies join each edge to its identical edge for a seamless loop.
    const bgScale = C.GROUND_Y / BACKGROUND_FRAME[3];
    this.bgWidth = BACKGROUND_FRAME[2] * bgScale;
    this.backgrounds = [0, 1].map(i => this.add.image(i * this.bgWidth, 0, 'background', 'landscape').setOrigin(0).setScale(bgScale).setFlipX(i === 1));
    this.ground = this.add.graphics().setDepth(8);
    this.ground.fillStyle(0x604032).fillRect(0, C.GROUND_Y, C.WIDTH, 56);
    this.ground.fillStyle(0xf5d184).fillRect(0, C.GROUND_Y, C.WIDTH, 5);
    this.ground.fillStyle(0xb67d45).fillRect(0, C.GROUND_Y + 5, C.WIDTH, 8);
    for (let x = 0; x < C.WIDTH; x += 24) {
      this.ground.fillStyle(0x825038).fillRect(x, C.GROUND_Y + 23, 12, 5);
      this.ground.fillStyle(0x3e2b2b).fillRect(x + 10, C.GROUND_Y + 41, 7, 5);
    }
    this.player = this.add.sprite(C.PLAYER_X, C.PLAYER_Y, 'character', 'idle').setScale(C.PLAYER_SCALE).setDepth(7);
    this.player.play('flight');
    this.scoreText = this.text(C.WIDTH / 2, 82, '0', 56, '#fff7df').setStroke('#633e2e', 7).setDepth(12).setVisible(false);
    this.title = this.add.container(0, 0).setDepth(10);
    const plaque = this.add.rectangle(216, 217, 372, 256, 0x513128).setStrokeStyle(3, 0xf9dfa7);
    const logo = this.add.image(216, 215, 'logo').setDisplaySize(360, 240);
    this.title.add([plaque, logo, this.text(216, 62, 'A LITTLE CAT. A GOLDEN ADVENTURE.', 12), this.text(216, 373, 'HOW FAR WILL YOU FLY?', 14)]);
    this.player.setPosition(216, 446);
    const mobile = window.matchMedia('(pointer: coarse)').matches;
    const button = this.add.rectangle(216, 546, 276, 59, 0x613b30).setStrokeStyle(3, 0xf4d397);
    this.title.add([button, this.text(216, 546, mobile ? 'TAP TO START' : 'CLICK / SPACE TO START', 18, '#fff0cd'), this.text(216, 603, 'One tap, one flap. Find your rhythm.', 13, '#fff0cd').setStroke(ink, 3), this.text(216, 651, `PERSONAL BEST  ${this.best}`, 14, '#fff0cd').setStroke(ink, 3)]);
    this.footer = this.text(216, 742, 'F L A P P Y   L U M L U A Y', 11, '#edcb92').setDepth(20);
    this.input.on('pointerdown', pointer => { if (pointer.button === 0) this.handleInput(); });
    this.input.keyboard.on('keydown-SPACE', event => {
      if (event.target?.tagName === 'BUTTON') return;
      event.preventDefault();
      if (!event.repeat) this.handleInput();
    });
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.state === STATE.MODE_SELECT) this.showTitle();
      else if (this.state !== STATE.TITLE) this.showModes();
    });
    this.game.events.on('blur', this.onBlur, this);
    this.events.once('shutdown', () => {
      this.game.events.off('blur', this.onBlur, this);
      this.menu.destroy();
      this.input.removeAllListeners(); this.input.keyboard.removeAllListeners();
    });
    this.announce('Flappy Lumluay. Click, tap, or press Space to start.');
    this.menu.titleSound();
    if (data.openModes) this.showModes();
  }
  onBlur() {
    if (this.state === STATE.PLAYING && !this.paused) {
      this.paused = true;
      this.pauseText = this.text(216, 310, 'PAUSED\nTap / Space to resume', 22, '#fff7df').setStroke(ink, 5).setDepth(25);
    }
  }
  handleInput() {
    if (this.state === STATE.TITLE) this.showModes();
    else if (this.state === STATE.PLAYING) {
      if (this.paused) { this.paused = false; this.pauseText?.destroy(); }
      this.flap();
    } else if (this.state === STATE.GAME_OVER && this.time.now >= this.restartAt) this.startRun();
  }
  showModes() {
    this.tweens.killAll();
    this.paused = false; this.pauseText?.destroy();
    this.panel?.destroy(); this.panel = null;
    for (const pair of this.pairs) pair.view.destroy();
    this.pairs = [];
    this.state = STATE.MODE_SELECT; this.mode = null;
    this.title.setVisible(false); this.player.setVisible(false); this.scoreText.setVisible(false);
    this.menu.show();
    if (this.progress.claimCelebration()) { this.menu.celebrate(); this.events.emit('roguelite-unlocked'); }
    this.announce('Choose Normal Mode or Roguelite Mode. Roguelite unlocks at a Normal best of 50.');
  }
  showTitle() {
    this.menu.clear(); this.state = STATE.TITLE; this.mode = null;
    this.menu.titleSound();
    this.title.setVisible(true);
    this.title.list.at(-1).setText(`PERSONAL BEST  ${this.progress.normalBest}`);
    this.player.setVisible(true).setPosition(216, 446).setAngle(0).play('flight');
    this.announce('Flappy Lumluay. Tap or press Space to choose a mode.');
  }
  selectMode(mode) {
    if (!this.progress.canSelect(mode)) return;
    this.mode = mode;
    if (mode === MODE.NORMAL) this.startRun();
    else {
      this.scene.start('Roguelite', { progress: this.progress });
    }
  }
  startRun() {
    if (this.mode !== MODE.NORMAL) return;
    this.menu.navigation();
    this.runBest = this.progress.normalBest;
    this.state = STATE.READY;
    this.tweens.killAll();
    this.title.setVisible(false); this.panel?.destroy(); this.panel = null;
    for (const pair of this.pairs) pair.view.destroy();
    this.pairs = []; this.score = 0; this.lastGap = 350;
    this.spawnClock = C.SPAWN_INTERVAL - 1000;
    this.scoreText.setText('0').setScale(1).setVisible(true);
    this.player.setVisible(true).setPosition(C.PLAYER_X, C.PLAYER_Y).setAngle(0).setAlpha(1);
    this.paused = false; this.pauseText?.destroy();
    this.state = STATE.PLAYING;
    this.flap();
    this.announce('Go! Tap, click, or press Space to flap.');
  }
  flap() { this.velocity = C.FLAP_VELOCITY; this.player.play('flight', true); this.sfx.meow(); }
  spawnPair() {
    const gap = nextGap(this.lastGap); this.lastGap = gap;
    const view = this.add.container(C.WIDTH + 60, 0).setDepth(4);
    const topY = gap - C.OBSTACLE_GAP / 2;
    const bottomY = gap + C.OBSTACLE_GAP / 2;
    drawObstacle(this, view, 'top', 0, topY);
    drawObstacle(this, view, 'bottom', bottomY, C.GROUND_Y);
    this.pairs.push({ x: view.x, gap, passed: false, view });
  }
  addScore() {
    this.score += 1; this.scoreText.setText(String(this.score));
    this.progress.recordNormal(this.score);
    this.tweens.add({ targets: this.scoreText, scale: 1.16, duration: 95, yoyo: true });
    this.events.emit('score', this.score); // Optional audio hook; v1 is intentionally quiet.
  }
  die() {
    if (this.state !== STATE.PLAYING) return;
    this.sfx.pow();
    this.state = STATE.GAME_OVER; this.restartAt = this.time.now + C.RESTART_DELAY;
    this.player.stop().setFrame('hit'); this.velocity = Math.max(50, this.velocity);
    this.cameras.main.shake(140, 0.006);
    const newBest = this.score > this.runBest;
    this.progress.recordNormal(this.score);
    this.best = this.progress.normalBest;
    this.panel = this.add.container(216, 348).setDepth(30).setAlpha(0);
    this.panel.add([
      this.add.rectangle(4, 8, 344, 284, 0x392528, 0.3),
      this.add.rectangle(0, 0, 344, 284, 0xffedce).setStrokeStyle(4, 0x714533),
      this.text(0, -101, newBest ? 'A NEW PERSONAL BEST!' : 'ANOTHER LITTLE ADVENTURE?', 12, '#a15e3e'),
      this.text(0, -62, 'GAME OVER', 32),
      this.text(-78, -12, 'SCORE', 13), this.text(78, -12, 'BEST', 13),
      this.text(-78, 24, String(this.score), 37), this.text(78, 24, String(this.best), 37),
      this.add.rectangle(0, 91, 272, 48, 0x684333).setStrokeStyle(2, 0xc28b54),
      this.text(0, 91, 'RESTART', 22, '#fff0ce'),
    ]);
    this.tweens.add({ targets: this.panel, y: 368, alpha: 1, duration: 300, delay: 220, ease: 'Cubic.Out' });
    this.announce(`Game over. Score ${this.score}. Best ${this.best}. Tap, click, or press Space to restart.`);
    if (this.progress.claimCelebration()) {
      this.menu.celebrate();
      this.events.emit('roguelite-unlocked');
    }
  }
  update(time, delta) {
    const dt = Math.min(delta, 32) / 1000;
    if (this.paused) return;
    if (this.state !== STATE.GAME_OVER) {
      for (const bg of this.backgrounds) {
        bg.x -= C.BACKGROUND_SPEED * dt;
        if (bg.x <= -this.bgWidth) bg.x += this.bgWidth * 2;
      }
    }
    if (this.state === STATE.TITLE) { this.player.y = 446 + Math.sin(time / 380) * 9; return; }
    if (this.state !== STATE.PLAYING && this.state !== STATE.GAME_OVER) return;
    this.velocity = Math.min(C.MAX_FALL_SPEED, this.velocity + C.GRAVITY * dt);
    this.player.y += this.velocity * dt;
    const ceiling = this.player.getBounds().height / 2;
    if (this.player.y < ceiling) { this.player.y = ceiling; this.velocity = Math.max(0, this.velocity); }
    const targetAngle = this.state === STATE.GAME_OVER ? 70 : Phaser.Math.Clamp(this.velocity / 9, -22, 65);
    this.player.angle = Phaser.Math.Linear(this.player.angle, targetAngle, Math.min(1, dt * 9));
    if (this.player.y + C.HITBOX_HEIGHT / 2 >= C.GROUND_Y) {
      this.player.y = C.GROUND_Y - C.HITBOX_HEIGHT / 2; this.velocity = 0; this.die();
    }
    if (this.state !== STATE.PLAYING) return;
    if (this.velocity > 70) this.player.stop().setFrame('fall');
    this.spawnClock += dt * 1000;
    if (this.spawnClock >= C.SPAWN_INTERVAL) { this.spawnClock -= C.SPAWN_INTERVAL; this.spawnPair(); }
    const speed = speedForScore(this.score);
    for (const pair of this.pairs) {
      pair.x -= speed * dt; pair.view.x = pair.x;
      if (overlapsObstacle(this.player, pair)) { this.die(); return; }
      if (creditPass(pair, this.player.x)) this.addScore();
    }
    this.pairs = this.pairs.filter(pair => { if (pair.x < -70) { pair.view.destroy(); return false; } return true; });
  }
}
