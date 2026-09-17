import { CONFIG as C } from '../config.js';
﻿export class RogueUI {
  constructor(scene) { this.scene = scene; this.menu = scene.menu; }
  home(message = '') {
    const s = this.scene, meta = s.progress.rogueMeta;
    this.menu.clear(); this.menu.root.classList.add('is-menu');
    const panel = document.createElement('section'); panel.className = 'mode-panel rogue-shop';
    panel.innerHTML = `<p class="menu-eyebrow">ROGUELITE / PREPARE YOUR RUN</p><h1>Fly. Earn.<br><em>Grow stronger.</em></h1><p class="shop-wallet">${meta.coins} POINTS · BEST ${s.progress.rogueliteBest}</p><p class="menu-intro">Start at LV 1. Level up every 20 score.<br>One blessing per level, up to LV ${meta.maxLevel}.<br>1 score = 1 shop point, saved immediately.</p>`;
    const play = this.menu.button('START RUN', () => s.startRun(), 'mode-card shop-play');
    panel.append(play);
    const heading = document.createElement('p'); heading.className = 'menu-eyebrow'; heading.textContent = 'SHOP / PERMANENT PURCHASES'; panel.append(heading);
    for (const [id, name, detail, capped] of [
      ['level', `MAX LEVEL ${meta.maxLevel} → ${meta.maxLevel + 1}`, 'Raise the level cap by 1.', false],
      ['reroll', `REROLL ${meta.rerolls} / 10`, '+1 reroll per run. Refills every run.', meta.rerolls >= 10],
      ['skip', `SKIP ${meta.skips} / 10`, '+1 skip per run. Refills every run.', meta.skips >= 10],
    ]) {
      const button = this.menu.button('', () => {
        if (meta.buy(id)) this.home('Purchased. Available in your next run.');
      }, 'mode-card shop-item');
      button.disabled = !meta.canBuy(id);
      button.innerHTML = `<span class="card-label">${name}<b>${capped ? 'MAX' : meta.price(id) + ' PTS'}</b></span><span>${detail}</span>`;
      panel.append(button);
    }
    const status = document.createElement('p'); status.className = 'shop-status'; status.setAttribute('role', 'status'); status.textContent = message;
    panel.append(status, this.menu.button('Back to modes', () => s.showModes(), 'menu-back'));
    this.menu.root.append(panel); play.focus({ preventScroll: true });
  }
  hud() {
    this.menu.navigation();
    this.info = document.createElement('div'); this.info.className = 'rogue-hud';
    this.warning = document.createElement('div'); this.warning.className = 'speed-warning';
    this.warning.setAttribute('role', 'status');
    this.menu.root.append(this.info, this.warning);
    this.blessings = document.createElement('div'); this.blessings.className = 'active-blessings';
    this.menu.root.append(this.blessings);
  }
  update() {
    const s = this.scene, pending = s.speedShift.pending;
    const stats = s.upgrades.stats, effects = s.effects;
    const labels = [];
    if (stats.extraLife) labels.push('LAST MEOW: READY');
    if (stats.whiskers) labels.push('WHISKERS: ' + s.advanced.nearPasses + '/5');
    if (stats.rhythm) labels.push(s.advanced.rhythmRemaining > 0 ? 'RHYTHM: FLOWING' : 'RHYTHM: KEEP THE BEAT');
    if (stats.fortune) labels.push('BARGAIN: NEXT LEVEL BOOSTED');
    if (stats.soft) labels.push(effects.softActive ? 'SOFT PAWS: GLIDING' : effects.softCooldown > 0 ? `PAWS: ${Math.ceil(effects.softCooldown)}s` : 'PAWS: HOLD TAP / SPACE');
    if (stats.gold) labels.push(`GOLD THREAD: ${effects.goldStreak}/3`);
    if (stats.liquid) labels.push(s.player.scaleX < .999 * C.PLAYER_SCALE * stats.hitbox ? 'LIQUID CAT: ACTIVE' : 'LIQUID CAT: READY');
    this.blessings.textContent = labels.join(' / '); this.blessings.hidden = labels.length === 0;
    this.info.textContent = `LV ${s.runProgress.level}/${s.runProgress.maxLevel}${s.runProgress.level === s.runProgress.maxLevel ? ' MAX' : ` / ${s.score % 20}/20`} / ${s.patternLabel || 'ROGUELITE'} / SHIELD ${s.upgrades.stats.shields}`;
    const slow = s.speedShift.slowRemaining;
    this.warning.hidden = !pending && slow <= 0;
    if (slow > 0) this.warning.textContent = `SPEED -100! / RESTORE IN ${Math.ceil(slow)}`;
    else if (pending) this.warning.textContent = `SPEED UP! ${Math.ceil(pending.remaining)}`;
  }
  choose(offers) {
    this.menu.clear(); this.menu.root.classList.add('is-menu');
    const panel = document.createElement('section'); panel.className = 'mode-panel blessing-panel';
    panel.innerHTML = `<p class="menu-eyebrow">LEVEL UP / LV ${this.scene.runProgress.level} / ${this.scene.runProgress.maxLevel}</p><h1>Choose a<br><em>blessing.</em></h1><p class="menu-intro">One gift this level. Skipping forfeits it.</p>`;
    for (const u of offers) {
      const button = this.menu.button('', () => this.scene.chooseUpgrade(u.id), `mode-card blessing-card rarity-${u.rarity}`);
      const count = this.scene.upgrades.stacks[u.id] ?? 0;
      button.innerHTML = `<span class="card-label">${u.rarity.toUpperCase()} <span>${u.maxStacks === Infinity ? `${count} OWNED / UNLIMITED` : u.maxStacks ? `${count} / ${u.maxStacks} OWNED` : 'TEMPORARY GIFT'}</span></span><strong>${u.name}</strong><span>${u.description}</span>`;
      panel.append(button);
    }
    const actions = document.createElement('div'); actions.className = 'blessing-actions';
    const reroll = this.menu.button(`REROLL (${this.scene.runProgress.rerolls})`, () => this.scene.rerollBlessing(), 'blessing-action');
    const skip = this.menu.button(`SKIP (${this.scene.runProgress.skips})`, () => this.scene.skipBlessing(), 'blessing-action');
    reroll.disabled = this.scene.runProgress.rerolls === 0; skip.disabled = this.scene.runProgress.skips === 0;
    actions.append(reroll, skip); panel.append(actions);
    panel.append(this.menu.button('Leave run / Back to shop', () => this.scene.showHome(), 'menu-back'));
    this.menu.root.append(panel); panel.querySelector('button').focus({ preventScroll: true });
  }
  countdown(seconds) {
    if (!this.countdownPanel?.isConnected) {
      this.countdownPanel = document.createElement('div');
      this.countdownPanel.className = 'blessing-countdown';
      this.countdownPanel.setAttribute('role', 'status');
      this.countdownPanel.innerHTML = '<span>GET READY</span><strong></strong><small>Tap / Space to flap when play resumes</small>';
      this.menu.root.append(this.countdownPanel);
    }
    const value = String(Math.ceil(seconds));
    const number = this.countdownPanel.querySelector('strong');
    if (number.textContent !== value) number.textContent = value;
  }
  clearCountdown() { this.countdownPanel?.remove(); this.countdownPanel = null; }
  gameOver() {
    const s = this.scene;
    this.menu.clear(); this.menu.root.classList.add('is-menu');
    const panel = document.createElement('section'); panel.className = 'mode-panel rogue-over';
    panel.innerHTML = `<p class="menu-eyebrow">ROGUELITE / RUN COMPLETE</p><h1>A brave<br><em>little flight.</em></h1><div class="run-scores"><span>SCORE<strong>${s.score}</strong></span><span>ROGUELITE BEST<strong>${s.progress.rogueliteBest}</strong></span></div><p class="menu-eyebrow">${s.runSummary.length} BLESSINGS COLLECTED</p><p class="run-blessings"></p>`;
    panel.querySelector('.run-blessings').textContent = s.runSummary.length ? s.runSummary.join(' / ') : 'Your first blessing awaits at score 20.';
    const earnings = document.createElement('p'); earnings.className = 'menu-intro';
    earnings.textContent = `LV ${s.runProgress.level}/${s.runProgress.maxLevel} / +${s.runProgress.creditedScore} points earned / Wallet: ${s.progress.rogueMeta.coins}`;
    panel.append(earnings);
    const restart = this.menu.button('FLY AGAIN', () => { if (s.time.now >= s.restartAt) s.startRun(); }, 'mode-card restart-rogue');
    panel.append(restart, this.menu.button('SHOP / Roguelite home', () => s.showHome(), 'menu-back'), this.menu.button('Back to modes', () => s.showModes(), 'menu-back'));
    this.menu.root.append(panel); restart.focus({ preventScroll: true });
  }
}
