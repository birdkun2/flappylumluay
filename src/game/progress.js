import { readBest, saveBest } from './rules.js';
import { createRogueMeta } from './roguelite/metaProgress.js';

export const MODE = Object.freeze({ NORMAL: 'normal', ROGUELITE: 'roguelite' });
export const UNLOCK_SCORE = 50;
const CELEBRATED_KEY = 'flappy-lumluay-roguelite-celebrated';

export function createProgress(storage) {
  let normalBest = readBest(storage);
  let rogueliteBest = 0;
  try {
    const value = Number(storage?.getItem('flappy-lumluay-roguelite-best'));
    if (Number.isSafeInteger(value) && value > 0) rogueliteBest = value;
  } catch { /* Session fallback. */ }
  let celebrated = false;
  try { celebrated = storage?.getItem(CELEBRATED_KEY) === '1'; } catch { /* Session fallback. */ }
  return {
    rogueMeta: createRogueMeta(storage),
    get normalBest() { return normalBest; },
    get rogueliteBest() { return rogueliteBest; },
    recordRoguelite(score) {
      if (!Number.isSafeInteger(score) || score <= rogueliteBest) return;
      rogueliteBest = score;
      try { storage?.setItem('flappy-lumluay-roguelite-best', String(score)); } catch { /* Session fallback. */ }
    },
    get unlocked() { return normalBest >= UNLOCK_SCORE; },
    get fraction() { return Math.min(1, normalBest / UNLOCK_SCORE); },
    canSelect(mode) { return mode === MODE.NORMAL || (mode === MODE.ROGUELITE && this.unlocked); },
    recordNormal(score) {
      if (!Number.isSafeInteger(score) || score <= normalBest) return;
      normalBest = score;
      saveBest(storage, normalBest);
    },
    claimCelebration() {
      if (!this.unlocked || celebrated) return false;
      celebrated = true;
      try { storage?.setItem(CELEBRATED_KEY, '1'); } catch { /* Once per session if storage is unavailable. */ }
      return true;
    },
  };
}
