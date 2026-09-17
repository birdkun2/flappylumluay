import Phaser from 'phaser';
import GameScene from '../GameScene.js';
import { CONFIG as C, STATE } from '../config.js';
import { MODE } from '../progress.js';
import { drawObstacle } from '../obstacles.js';
import { creditPass } from '../rules.js';
import { R, clamp } from './rogueliteConfig.js';
import { PatternSystem } from './patternSystem.js';
import { SpeedShiftSystem } from './speedShiftSystem.js';
import { UpgradeSystem } from './upgradeSystem.js';
import { rogueCollision } from './collision.js';
import { RogueUI } from './RogueUI.js';
import { BlessingEffects } from './blessingEffects.js';
import { RogueRunProgress } from './metaProgress.js';
import { AdvancedBlessings } from './advancedBlessings.js';

export default class RogueliteScene extends GameScene {
  constructor() { super('Roguelite'); }
  create(data = {}) {
    super.create(data);
    if (!this.progress.unlocked) { this.showModes(); return; }
    this.mode = MODE.ROGUELITE;
    this.ui = new RogueUI(this); this.showHome();
    this.input.on('pointerdown', pointer => { if (pointer.button === 0 && this.state === STATE.PLAYING) this.heldPointer = true; });
    this.input.on('pointerup', () => { this.heldPointer = false; });
    this.input.on('pointerupoutside', () => { this.heldPointer = false; });
    this.input.keyboard.on('keydown-SPACE', event => { if (!event.repeat && event.target?.tagName !== 'BUTTON' && this.state === STATE.PLAYING) this.heldSpace = true; });
    this.input.keyboard.on('keyup-SPACE', () => { this.heldSpace = false; });
  }
  onBlur() { this.heldPointer = false; this.heldSpace = false; super.onBlur(); }
  showModes() { this.scene.start('Game', { openModes: true, progress: this.progress }); }
  showTitle() { this.showModes(); }
  showHome() {
    this.instinctGuide?.clear();
    this.state = 'ROGUE_HOME'; this.paused = false; this.pauseText?.destroy();
    this.title.setVisible(false); this.scoreText.setVisible(false); this.player.setVisible(false);
    for (const pair of this.pairs) pair.view.destroy();
    this.pairs = []; this.ui.home();
  }
  startRun() {
    this.tweens.killAll(); this.panel?.destroy(); this.pauseText?.destroy();
    for (const pair of this.pairs) pair.view.destroy();
    this.pairs = []; this.score = 0; this.velocity = 0; this.paused = false;
    this.upgrades = new UpgradeSystem(); this.patterns = new PatternSystem(); this.speedShift = new SpeedShiftSystem();
    this.runProgress = new RogueRunProgress(this.progress.rogueMeta);
    this.effects = new BlessingEffects(); this.heldPointer = false; this.heldSpace = false; this.goldCharge = false;
    this.advanced = new AdvancedBlessings(); this.blessingWeights = undefined;
    this.instinctGuide?.destroy(); this.instinctGuide = this.add.graphics().setDepth(6);
    this.distance = R.baseSpeed; this.nextSpacing = R.spacing; this.invulnerable = 0;
    this.cleanPasses = 0; this.flowCharge = false; this.flaps = 0; this.patternLabel = ''; this.runSummary = [];
    this.title.setVisible(false); this.scoreText.setText('0').setVisible(true).setScale(1);
    this.player.setVisible(true).setPosition(C.PLAYER_X, C.PLAYER_Y).setAngle(0).setAlpha(1).setScale(C.PLAYER_SCALE);
    this.state = STATE.PLAYING; this.ui.hud(); this.ui.update(); this.flap();
    this.announce('Roguelite. Level up every 20 points for a blessing, until your maximum level.');
  }
  flap() {
    this.advanced.flap(this.upgrades.stats.rhythm);
    const stats = this.upgrades.stats; this.flaps++;
    const boost = stats.feather && this.flaps % R.featherInterval === 0 ? 1.1 : 1;
    this.velocity = stats.flap * boost * (stats.flapCharges > 0 ? 1.05 : 1);
    stats.flapCharges = Math.max(0, stats.flapCharges - 1);
    this.player.play('flight', true);
    this.sfx.meow();
  }
  spawnPair() {
    const stats = this.upgrades.stats;
    const item = this.patterns.next(this.score, stats);
    item.gapSize = clamp(item.gapSize + (this.flowCharge ? 14 : 0) + (stats.wideCharges > 0 ? 10 : 0) + (this.goldCharge ? R.goldGapBonus : 0), R.minGap, R.maxGap);
    this.goldCharge = false;
    this.flowCharge = false; stats.wideCharges = Math.max(0, stats.wideCharges - 1);
    const view = this.add.container(C.WIDTH + 60 - this.distance, 0).setDepth(4);
    drawObstacle(this, view, 'top', 0, item.gap - item.gapSize / 2);
    drawObstacle(this, view, 'bottom', item.gap + item.gapSize / 2, C.GROUND_Y);
    this.pairs.push({ ...item, x: view.x, passed: false, view });
    this.nextSpacing = item.spacing;
  }
  addScore(pair) {
    this.score++; this.scoreText.setText(String(this.score)); this.progress.recordRoguelite(this.score);
    this.events.emit('score', this.score);
    const stats = this.upgrades.stats;
    if (this.effects.pass(!!pair?.centered, stats.gold)) this.rewardGoldenGap();
    this.advanced.pass(pair, stats);
    this.cleanPasses++;
    if (stats.flow && this.cleanPasses % R.flowInterval === 0) this.flowCharge = true;
    if (stats.guardian && this.score % R.guardianInterval === 0) stats.shields = 1;
    if (this.runProgress.score(this.score, this.progress.rogueMeta)) {
      stats.remainingLevels = this.runProgress.maxLevel - this.runProgress.level;
      this.blessingWeights = stats.fortune ? { common: 35, rare: 44, epic: 20, legendary: 1 } : undefined;
      stats.fortune = 0;
      this.state = 'UPGRADE'; this.player.anims.pause();
      this.heldPointer = false; this.heldSpace = false;
      this.ui.choose(this.upgrades.offer([], this.blessingWeights)); this.announce('Choose one blessing. Gameplay is paused.');
    }
  }
  rewardGoldenGap() {
    const next = this.pairs.find(p => !p.passed && p.x > this.player.x + C.OBSTACLE_WIDTH);
    if (!next) { this.goldCharge = true; return; }
    next.gapSize = Math.min(R.maxGap, next.gapSize + R.goldGapBonus);
    next.view.removeAll(true);
    drawObstacle(this, next.view, 'top', 0, next.gap - next.gapSize / 2);
    drawObstacle(this, next.view, 'bottom', next.gap + next.gapSize / 2, C.GROUND_Y);
    this.announce('Golden Thread! The next gap is wider.');
  }
  chooseUpgrade(id) {
    if (this.state !== 'UPGRADE' || !this.upgrades.choose(id)) return;
    this.player.setScale(C.PLAYER_SCALE * this.effects.bodyScale(this.upgrades.stats, this.pairs, this.player.x));
    this.speedShift.speedReduction = this.upgrades.stats.speedReduction;
    this.speedShift.cooldown += this.upgrades.stats.calmCharge;
    this.upgrades.stats.calmCharge = 0;
    this.resumeAfterBlessing();
  }
  rerollBlessing() {
    if (this.state !== 'UPGRADE' || !this.runProgress.use('rerolls')) return;
    const previous = this.upgrades.offers.map(u => u.id);
    this.ui.choose(this.upgrades.offer(previous, this.blessingWeights));
  }
  skipBlessing() {
    if (this.state !== 'UPGRADE' || !this.runProgress.use('skips')) return;
    this.upgrades.offers = []; this.resumeAfterBlessing();
  }
  resumeAfterBlessing() {
    this.state = 'BLESSING_COUNTDOWN'; this.resumeRemaining = R.blessingResumeDelay;
    this.ui.hud(); this.ui.update(); this.ui.countdown(this.resumeRemaining);
    this.announce('Blessing received. Get ready in 2 seconds.');
  }
  hit(ground = false) {
    if (this.invulnerable > 0) {
      if (ground) this.velocity = this.upgrades.stats.flap;
      return;
    }
    this.advanced.nearPasses = 0; this.advanced.rhythmRemaining = 0;
    for (const pair of this.pairs) if (!pair.passed) pair.damaged = true;
    if (this.upgrades.stats.shields > 0) {
      this.effects.goldStreak = 0;
      for (const pair of this.pairs) if (!pair.passed) pair.centered = false;
      this.sfx.pow();
      this.upgrades.stats.shields--; this.invulnerable = R.shieldGrace; this.cleanPasses = 0;
      if (ground) this.velocity = this.upgrades.stats.flap;
      this.cameras.main.flash(120, 245, 210, 125, false);
      this.events.emit('shield-used'); return;
    }
    this.die();
  }
  die() {
    if (this.state !== STATE.PLAYING) return;
    if (this.upgrades.stats.extraLife > 0) {
      this.upgrades.stats.extraLife--;
      const touching = this.pairs.filter(p => Math.abs(p.x - this.player.x) < (C.OBSTACLE_WIDTH + C.HITBOX_WIDTH) / 2);
      const low = Math.max(50, ...touching.map(p => p.gap - p.gapSize / 2 + C.HITBOX_HEIGHT / 2 + 8));
      const high = Math.min(C.GROUND_Y - 50, ...touching.map(p => p.gap + p.gapSize / 2 - C.HITBOX_HEIGHT / 2 - 8));
      if (low <= high) this.player.y = (low + high) / 2;
      else {
        // Rare overlapping profiles without a safe intersection: open a rescue pocket.
        for (const p of touching) { p.view.destroy(); this.pairs.splice(this.pairs.indexOf(p), 1); }
        this.player.y = C.PLAYER_Y;
      }
      this.velocity = 0; this.player.setAngle(0); this.invulnerable = R.shieldGrace;
      this.effects.goldStreak = 0; this.advanced.nearPasses = 0;
      this.heldPointer = false; this.heldSpace = false;
      this.player.anims.pause(); this.resumeAfterBlessing();
      this.ui.countdownPanel.querySelector('span').textContent = 'LAST MEOW / ONE MORE CHANCE';
      this.announce('Last Meow saved you. Get ready in two seconds.'); return;
    }
    this.instinctGuide?.clear();
    this.sfx.pow();
    this.state = STATE.GAME_OVER; this.restartAt = this.time.now + C.RESTART_DELAY;
    this.player.stop().setFrame('hit').setAlpha(1);
    this.cameras.main.shake(140, .006);
    this.progress.recordRoguelite(this.score);
    this.runSummary = [...this.upgrades.collected];
    this.upgrades = new UpgradeSystem(); // Only the summary survives death.
    this.ui.gameOver(); this.announce(`Roguelite game over. Score ${this.score}. Best ${this.progress.rogueliteBest}.`);
  }
  update(time, delta) {
    if (this.state === 'BLESSING_COUNTDOWN') {
      if (document.hidden || !document.hasFocus()) return;
      this.resumeRemaining = Math.max(0, this.resumeRemaining - delta / 1000);
      if (this.resumeRemaining > 1e-8) this.ui.countdown(this.resumeRemaining);
      else {
        this.ui.clearCountdown(); this.state = STATE.PLAYING;
        this.player.anims.resume(); this.announce('Go! Tap or press Space to flap.');
      }
      // Resume physics on the next frame without changing saved momentum.
      return;
    }
    if (this.state !== STATE.PLAYING || this.paused || !this.upgrades) return;
    const dt = Math.min(delta, 32) / 1000, stats = this.upgrades.stats;
    this.advanced.tick(dt);
    this.patterns.tick(dt);
    const changed = this.speedShift.tick(dt, { safe: this.patterns.age >= R.patternGrace, cooldownBonus: stats.cooldownBonus });
    if (changed) this.patterns.afterShift();
    const speed = this.speedShift.speed;
    // Move the world first so the temporary body size matches this frame's collisions.
    for (const pair of this.pairs) { pair.previousX = pair.x; pair.x -= speed * dt; pair.view.x = pair.x; }
    const bodyScale = this.effects.bodyScale(stats, this.pairs, this.player.x);
    this.player.setScale(C.PLAYER_SCALE * bodyScale);
    const previousY = this.player.y;
    for (const bg of this.backgrounds) {
      bg.x -= C.BACKGROUND_SPEED * (1 + .35 * (speed / R.baseSpeed - 1)) * dt;
      if (bg.x <= -this.bgWidth) bg.x += this.bgWidth * 2;
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.player.setAlpha(this.invulnerable > 0 ? .55 + .35 * Math.abs(Math.sin(time / 70)) : 1);
    this.velocity = Math.min(stats.maxFall, this.velocity + stats.gravity * (this.advanced.rhythmRemaining > 0 ? R.rhythmGravity : 1) * dt);
    this.velocity = this.effects.tickSoft(dt, this.heldPointer || this.heldSpace, this.velocity, stats.soft);
    this.player.y += this.velocity * dt;
    const ceiling = this.player.getBounds().height / 2;
    if (this.player.y < ceiling) { this.player.y = ceiling; this.velocity = Math.max(0, this.velocity); }
    this.player.angle = Phaser.Math.Linear(this.player.angle, clamp(this.velocity / 9, -22, 65 * stats.rotation), Math.min(1, dt * 9));
    if (this.player.y + C.HITBOX_HEIGHT * bodyScale / 2 >= C.GROUND_Y) {
      this.player.y = C.GROUND_Y - C.HITBOX_HEIGHT * bodyScale / 2; this.hit(true);
      if (this.state !== STATE.PLAYING) return;
    }
    if (this.velocity > 70) this.player.stop().setFrame('fall');
    // Every existing pair moves equally; spatial spawning preserves separation.
    this.distance += speed * dt;
    if (this.distance >= this.nextSpacing) { this.distance -= this.nextSpacing; this.spawnPair(); }
    this.patternLabel = this.pairs.find(pair => !pair.passed)?.label ?? 'FIND YOUR RHYTHM';
    for (const pair of this.pairs) {
      if (stats.whiskers && !pair.passed && this.invulnerable === 0 && this.advanced.near(this.player, pair, bodyScale)) pair.nearMiss = true;
      if (stats.gold && pair.centered === undefined && pair.previousX >= this.player.x && pair.x < this.player.x) {
        const fraction = (pair.previousX - this.player.x) / (pair.previousX - pair.x);
        pair.centered = Math.abs(previousY + (this.player.y - previousY) * fraction - pair.gap) <= R.goldTolerance;
      }
      if (rogueCollision(this.player, pair, bodyScale)) { this.hit(); if (this.state !== STATE.PLAYING) return; }
      if (creditPass(pair, this.player.x)) {
        this.addScore(pair); if (this.state !== STATE.PLAYING) return;
      }
    }
    this.pairs = this.pairs.filter(pair => { if (pair.x < -70) { pair.view.destroy(); return false; } return true; });
    this.instinctGuide.clear();
    if (stats.instinct) {
      this.instinctGuide.lineStyle(2, 0xfff0a1, .8);
      for (const p of this.pairs.filter(p => !p.passed && p.x >= this.player.x).slice(0, 2)) {
        this.instinctGuide.lineBetween(p.x - 30, p.gap, p.x + 30, p.gap);
        this.instinctGuide.strokeCircle(p.x, p.gap, 6);
      }
    }
    this.ui.update();
  }
}
