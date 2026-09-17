import { CONFIG as C } from '../config.js';
import { R } from './rogueliteConfig.js';
export class BlessingEffects {
  constructor() { this.softRemaining = 0; this.softCooldown = 0; this.softLatched = false; this.softActive = false; this.goldStreak = 0; }
  tickSoft(dt, held, velocity, enabled) {
    this.softCooldown = Math.max(0, this.softCooldown - dt);
    if (!held) this.softLatched = false;
    if (enabled && held && velocity > 0 && !this.softLatched && this.softCooldown === 0 && this.softRemaining === 0) {
      this.softRemaining = R.softDuration; this.softLatched = true;
    }
    this.softActive = enabled && held && velocity > 0 && this.softRemaining > 0;
    const result = this.softActive ? Math.min(velocity, R.softFallSpeed) : velocity;
    if (this.softRemaining > 0) {
      this.softRemaining = held ? Math.max(0, this.softRemaining - dt) : 0;
      if (this.softRemaining === 0) this.softCooldown = R.softCooldown;
    }
    return result;
  }
  bodyScale(stats, pairs, playerX) {
    const near = stats.liquid && pairs.some(p => p.connected && Math.abs(p.x - playerX) <= (C.OBSTACLE_WIDTH + C.HITBOX_WIDTH * stats.hitbox) / 2);
    return stats.hitbox * (near ? R.liquidScale : 1);
  }
  pass(centered, enabled) {
    if (!enabled) return false;
    this.goldStreak = centered ? this.goldStreak + 1 : 0;
    if (this.goldStreak < R.goldPasses) return false;
    this.goldStreak = 0; return true;
  }
}
