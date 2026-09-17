import { CONFIG as C } from '../config.js';
import { obstacleParts } from '../obstacles.js';
import { R } from './rogueliteConfig.js';
export class AdvancedBlessings {
  constructor() { this.elapsed = 0; this.lastFlap = null; this.intervals = []; this.rhythmRemaining = 0; this.nearPasses = 0; }
  tick(dt) { this.elapsed += dt; this.rhythmRemaining = Math.max(0, this.rhythmRemaining - dt); }
  flap(enabled) {
    if (!enabled) return;
    if (this.lastFlap !== null) {
      const interval = this.elapsed - this.lastFlap;
      if (interval < .15 || interval > .9) this.intervals = [];
      else this.intervals.push(interval);
      this.intervals = this.intervals.slice(-3);
      if (this.intervals.length === 3 && Math.max(...this.intervals) <= Math.min(...this.intervals) * (1 + R.rhythmTolerance)) {
        this.rhythmRemaining = R.rhythmDuration; this.intervals = [];
      }
    }
    this.lastFlap = this.elapsed;
  }
  near(player, pair, scale) {
    const parts = [...obstacleParts('top', 0, pair.gap - pair.gapSize / 2), ...obstacleParts('bottom', pair.gap + pair.gapSize / 2, C.GROUND_Y)];
    return parts.some(p => {
      if (p.height <= 0 || Math.abs(player.x - pair.x) >= (p.width - 2 * p.inset + C.HITBOX_WIDTH * scale) / 2) return false;
      const below = player.y - C.HITBOX_HEIGHT * scale / 2 - (p.y + p.height);
      const above = p.y - (player.y + C.HITBOX_HEIGHT * scale / 2);
      return (below >= 0 && below <= R.whiskerDistance) || (above >= 0 && above <= R.whiskerDistance);
    });
  }
  pass(pair, stats) {
    if (!stats.whiskers || !pair?.nearMiss || pair.damaged) return;
    this.nearPasses++;
    if (this.nearPasses >= R.whiskerPasses) { stats.shields = 1; this.nearPasses = 0; }
  }
}
