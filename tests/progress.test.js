import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgress, MODE } from '../src/game/progress.js';
const storage = (best = 0) => {
  const values = new Map([['flappy-lumluay-best', String(best)]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
test('preserves legacy Normal best and unlocks once the 50-point bar is reached', () => {
  const p = createProgress(storage(63));
  assert.equal(p.normalBest, 63); assert.equal(p.fraction, 1);
  assert.equal(p.canSelect(MODE.NORMAL), true);
  assert.equal(p.canSelect(MODE.ROGUELITE), true);
  assert.equal(p.canSelect('unknown'), false);
});
test('requires a single 50-point run, persists immediately and never downgrades', () => {
  const save = storage(); const p = createProgress(save);
  p.recordNormal(63); p.recordNormal(60);
  assert.equal(p.normalBest, 63); assert.equal(p.unlocked, true);
  p.recordNormal(49); assert.equal(p.unlocked, true);
  p.recordNormal(50); assert.equal(p.canSelect(MODE.ROGUELITE), true);
  assert.equal(createProgress(save).unlocked, true);
  p.recordNormal(3); p.recordNormal(NaN); p.recordNormal(Infinity); p.recordNormal(51.5);
  assert.equal(p.normalBest, 63);
  p.recordNormal(150); assert.equal(p.fraction, 1);
  assert.equal(p.canSelect(MODE.NORMAL), true);
});
test('roguelite best is tracked separately and keeps the best score across refreshes', () => {
  const save = storage(20); const p = createProgress(save);
  p.recordRoguelite(12); p.recordRoguelite(30); p.recordRoguelite(28);
  assert.equal(p.normalBest, 20);
  assert.equal(p.rogueliteBest, 30);
  assert.equal(createProgress(save).rogueliteBest, 30);
});
test('celebration survives refresh before being shown and is claimed only once', () => {
  const save = storage(49); const p = createProgress(save);
  assert.equal(p.claimCelebration(), false); p.recordNormal(50);
  const refreshed = createProgress(save);
  assert.equal(refreshed.claimCelebration(), true);
  assert.equal(refreshed.claimCelebration(), false);
  assert.equal(createProgress(save).claimCelebration(), false);
});
test('existing qualifying scores unlock and unavailable storage remains playable', () => {
  assert.equal(createProgress(storage(120)).unlocked, true);
  const p = createProgress({ getItem() { throw Error(); }, setItem() { throw Error(); } });
  p.recordNormal(50); assert.equal(p.unlocked, true);
  assert.equal(p.claimCelebration(), true); assert.equal(p.claimCelebration(), false);
});
