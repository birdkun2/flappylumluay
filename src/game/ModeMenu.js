import { MODE, UNLOCK_SCORE } from './progress.js';

// Native buttons provide keyboard focus, touch targets and disabled semantics.
export default class ModeMenu {
  constructor(scene, progress) {
    this.scene = scene;
    this.progress = progress;
    this.root = document.createElement('div');
    this.root.className = 'mode-layer';
    document.body.append(this.root);
    this.root.addEventListener('pointerdown', event => event.stopPropagation());
    this.root.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        if (this.root.querySelector('.coming-soon')) this.scene.showModes();
        else if (this.root.classList.contains('is-menu')) this.scene.showTitle();
        else this.scene.showModes();
      }
    });
  }
  clear() { this.root.replaceChildren(); this.root.classList.remove('is-menu'); }
  button(label, action, className = '') {
    const button = document.createElement('button');
    button.type = 'button'; button.className = className; button.textContent = label;
    button.addEventListener('click', action);
    return button;
  }
  show() {
    this.clear(); this.root.classList.add('is-menu');
    const p = this.progress;
    const panel = document.createElement('section');
    panel.className = 'mode-panel'; panel.setAttribute('aria-label', 'Choose your mode');
    panel.innerHTML = `<p class="menu-eyebrow">FLAPPY LUMLUAY</p><h1>Choose your<br><em>adventure.</em></h1><p class="menu-intro">One little cat. New horizons.</p>`;
    const normal = this.button('', () => this.scene.selectMode(MODE.NORMAL), 'mode-card normal-card');
    normal.innerHTML = `<span class="card-label">THE CLASSIC FLIGHT <span>PLAY</span></span><strong>Normal Mode</strong><span>One tap, one flap. Chase your best.</span><span class="card-bottom">PERSONAL BEST <b>${p.normalBest}</b><span aria-hidden="true">&#8599;</span></span>`;
    const rogue = this.button('', () => this.scene.selectMode(MODE.ROGUELITE), 'mode-card rogue-card');
    rogue.disabled = !p.unlocked;
    rogue.innerHTML = `<span class="card-label">A NEW HORIZON <span>${p.unlocked ? 'UNLOCKED' : 'LOCKED'}</span></span><strong>Roguelite Mode</strong><span>${p.unlocked ? 'Patterns, speed shifts & blessings' : `Reach ${UNLOCK_SCORE} points in one Normal run to unlock`}</span><span class="unlock-track" role="progressbar" aria-label="Normal best toward unlock" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(p.normalBest, UNLOCK_SCORE)}"><i style="width:${p.fraction * 100}%"></i></span><span class="card-bottom">${p.unlocked ? 'PLAY ROGUELITE &#8599;' : `NORMAL BEST: ${p.normalBest} / ${UNLOCK_SCORE}`}</span>`;
    panel.append(normal, rogue, this.button('\u2190 Back to title', () => this.scene.showTitle(), 'menu-back'));
    this.root.append(panel); normal.focus({ preventScroll: true });
  }
  titleSound() {
    const button = this.button('', () => { this.scene.sfx.toggle(); refresh(); }, 'sound-toggle');
    const refresh = () => {
      button.textContent = this.scene.sfx.enabled ? 'SOUND: ON' : 'SOUND: OFF';
      button.setAttribute('aria-label', 'Sound effects');
      button.setAttribute('aria-pressed', String(this.scene.sfx.enabled));
    };
    refresh(); this.root.append(button);
  }
  navigation() {
    this.clear();
    this.root.append(this.button('\u2190 Modes', () => this.scene.showModes(), 'game-modes'));
  }
  celebrate() {
    const toast = document.createElement('div'); toast.className = 'unlock-toast'; toast.setAttribute('role', 'status');
    toast.innerHTML = '<span aria-hidden="true">&#8599;</span><div><strong>ROGUELITE MODE UNLOCKED!</strong><small>50 points. A new horizon is yours.</small></div>';
    this.root.append(toast);
  }
  destroy() { this.root.remove(); }
}
