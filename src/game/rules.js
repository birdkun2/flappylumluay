import { CONFIG as C } from './config.js';
import { obstacleParts } from './obstacles.js';

export const speedForScore = score => Math.min(C.MAX_SPEED, C.OBSTACLE_SPEED + Math.floor(score / 10) * C.DIFFICULTY_INCREMENT);
export const nextGap = (previous, random = Math.random) => {
  const low = Math.max(C.GAP_MIN, previous - C.MAX_GAP_CHANGE);
  const high = Math.min(C.GAP_MAX, previous + C.MAX_GAP_CHANGE);
  return low + random() * (high - low);
};
export function overlapsObstacle(player, pair) {
  const top = pair.gap - C.OBSTACLE_GAP / 2;
  const bottom = pair.gap + C.OBSTACLE_GAP / 2;
  const rectangles = [...obstacleParts('top', 0, top), ...obstacleParts('bottom', bottom, C.GROUND_Y)];
  return rectangles.some(({ y, height, width: artWidth, inset }) => {
    const width = artWidth - inset * 2;
    return height > 0
    && player.x + C.HITBOX_WIDTH / 2 > pair.x - width / 2
    && player.x - C.HITBOX_WIDTH / 2 < pair.x + width / 2
    && player.y + C.HITBOX_HEIGHT / 2 > y
    && player.y - C.HITBOX_HEIGHT / 2 < y + height;
  });
}
export function creditPass(pair, playerX) {
  if (!pair.passed && pair.x + C.OBSTACLE_WIDTH / 2 < playerX - C.HITBOX_WIDTH / 2) {
    pair.passed = true;
    return 1;
  }
  return 0;
}
export function readBest(storage) {
  try { const value = Number(storage.getItem('flappy-lumluay-best')); return Number.isSafeInteger(value) && value > 0 ? value : 0; }
  catch { return 0; }
}
export function saveBest(storage, score) {
  try { storage.setItem('flappy-lumluay-best', String(score)); } catch { /* Private browsing must still be playable. */ }
}
