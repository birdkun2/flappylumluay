import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../src/game/config.js';
import { nextGap, speedForScore, overlapsObstacle, creditPass, readBest, saveBest } from '../src/game/rules.js';
import { obstacleParts } from '../src/game/obstacles.js';

test('all legal pillar heights preserve decorations and keep the full gap clear', () => {
  const heights = {};
  for (let gap = C.GAP_MIN; gap <= C.GAP_MAX; gap++) {
    for (const [kind, start, end] of [['top', 0, gap - C.OBSTACLE_GAP / 2], ['bottom', gap + C.OBSTACLE_GAP / 2, C.GROUND_Y]]) {
      const [cap, shaft, tip] = obstacleParts(kind, start, end);
      assert.equal(cap.y, start);
      assert.ok(Math.abs(tip.y + tip.height - end) < 1e-9);
      assert.ok(shaft.height > 0, 'even the shortest legal pillar has room for its shaft');
      assert.ok(Math.abs(cap.y + cap.height - shaft.y) < 1e-9);
      assert.ok(Math.abs(shaft.y + shaft.height - tip.y) < 1e-9);
      heights[kind] ??= [cap.height, tip.height];
      assert.deepEqual([cap.height, tip.height], heights[kind]);
    }
  }
});

test('narrow shafts do not inherit invisible full-pillar collision width', () => {
  const pair = { x: 140, gap: 350 };
  assert.equal(overlapsObstacle({ x: 140, y: 100 }, pair), true);
  assert.equal(overlapsObstacle({ x: 185, y: 100 }, pair), false);
  assert.equal(overlapsObstacle({ x: 185, y: 220 }, pair), true);
});

test('gaps stay within safe bounds and reachable vertical changes', () => {
  for (const previous of [C.GAP_MIN, 350, C.GAP_MAX]) for (const r of [0, 0.5, 1]) {
    const gap = nextGap(previous, () => r);
    assert.ok(gap >= C.GAP_MIN && gap <= C.GAP_MAX);
    assert.ok(Math.abs(gap - previous) <= C.MAX_GAP_CHANGE);
  }
});
test('each completely passed pair earns exactly one point', () => {
  const pair = { x: 140, passed: false };
  assert.equal(creditPass(pair, 140), 0);
  pair.x = 70;
  assert.equal(creditPass(pair, 140), 1);
  assert.equal(creditPass(pair, 140), 0);
});
test('collision respects gap, horizontal separation, and forgiving edges', () => {
  const pair = { x: 140, gap: 350 };
  assert.equal(overlapsObstacle({ x: 140, y: 350 }, pair), false);
  assert.equal(overlapsObstacle({ x: 140, y: 230 }, pair), true);
  assert.equal(overlapsObstacle({ x: 140, y: 470 }, pair), true);
  assert.equal(overlapsObstacle({ x: 40, y: 230 }, pair), false);
});
test('difficulty increases gently and stops at maximum', () => {
  assert.equal(speedForScore(9), C.OBSTACLE_SPEED);
  assert.equal(speedForScore(10), C.OBSTACLE_SPEED + C.DIFFICULTY_INCREMENT);
  assert.equal(speedForScore(10000), C.MAX_SPEED);
});
test('best score survives storage failures and rejects corrupt values', () => {
  assert.equal(readBest(null), 0); assert.doesNotThrow(() => saveBest(null, 8));
  for (const value of ['NaN', '-1', 'Infinity', '2.5']) assert.equal(readBest({ getItem: () => value }), 0);
  let value = '3'; const storage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  saveBest(storage, 8); assert.equal(readBest(storage), 8);
});
