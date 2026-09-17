import { R } from './rogueliteConfig.js';
export class SpeedShiftSystem {
  constructor(random = Math.random) {
    this.speedReduction = 0; this.random = random; this.cruiseSpeed = R.baseSpeed; this.pending = null;
    this.cooldown = this.interval(); this.slowCooldown = this.slowInterval(); this.slowRemaining = 0;
  }
  get speed() {
    const speed = this.cruiseSpeed - this.speedReduction - (this.slowRemaining > 0 ? R.slowDrop : 0);
    return this.speedReduction > 0 ? Math.max(R.calmDownMinSpeed, speed) : speed;
  }
  interval(extra = 0) { return R.shiftInterval[0] + this.random() * (R.shiftInterval[1] - R.shiftInterval[0]) + extra; }
  slowInterval() { return R.slowInterval[0] + this.random() * (R.slowInterval[1] - R.slowInterval[0]); }
  tick(dt, { safe = true, cooldownBonus = 0 } = {}) {
    // A shock preserves the exact cruising speed and suspends other shifts.
    // Scene pauses also suspend this five-second gameplay clock.
    if (this.slowRemaining > 0) {
      this.slowRemaining = Math.max(0, this.slowRemaining - dt);
      if (this.slowRemaining <= 1e-8) {
        this.slowRemaining = 0; this.slowCooldown = this.slowInterval();
        return true;
      }
      return false;
    }
    if (this.pending) {
      this.pending.remaining = Math.max(0, this.pending.remaining - dt);
      if (this.pending.remaining <= 1e-8) {
        this.cruiseSpeed = this.pending.target; this.pending = null;
        this.cooldown = this.interval(cooldownBonus); return true;
      }
      return false;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.slowCooldown = Math.max(0, this.slowCooldown - dt);
    // Sudden by design: no advance warning for the temporary rhythm break.
    if (this.slowCooldown === 0) { this.slowRemaining = R.slowDuration; return true; }
    if (this.cooldown > 0 || !safe || this.cruiseSpeed >= R.maxSpeed) return false;
    const fraction = R.shiftFraction[0] + this.random() * (R.shiftFraction[1] - R.shiftFraction[0]);
    this.pending = { target: Math.min(R.maxSpeed, this.cruiseSpeed * (1 + fraction)), up: true, remaining: R.shiftWarning };
    return false;
  }
}
