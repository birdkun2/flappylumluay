import { R, clamp } from './rogueliteConfig.js';
const corridorSteps = direction => Array.from({ length: R.corridorLength }, (_, i) => i === 0 ? 0 : direction * R.corridorStep);
export const CONNECTED_PATTERNS = ['longCorridor', 'corridorUp', 'corridorDown', 'corridorWave'];
export const ROGUELITE_PATTERNS = Object.freeze({
  tunnel: { label: 'TUNNEL', steps: [0, 0, 0, 0] },
  staircaseUp: { label: 'STAIRCASE UP', steps: [-30, -30, -30, -30] },
  staircaseDown: { label: 'STAIRCASE DOWN', steps: [30, 30, 30, 30] },
  wave: { label: 'WAVE', steps: [-36, 36, -36, 36, -36, 36] },
  tightCorridor: { label: 'TIGHT CORRIDOR', steps: [0, 12, -12], hard: true, spacing: R.tightSpacing },
  longCorridor: { label: 'LONG CORRIDOR', steps: Array(R.corridorLength).fill(0), hard: true, gap: -8, connected: true },
  corridorUp: { label: 'ASCENDING CORRIDOR', steps: corridorSteps(-1), hard: true, gap: -8, connected: true },
  corridorDown: { label: 'DESCENDING CORRIDOR', steps: corridorSteps(1), hard: true, gap: -8, connected: true },
  corridorWave: { label: 'WAVE CORRIDOR', steps: Array.from({ length: R.corridorLength }, (_, i) =>
    i === 0 ? 0 : (Math.floor((i - 1) / R.corridorWaveRun) % 2 === 0 ? -1 : 1) * R.corridorStep), hard: true, gap: -8, connected: true },
  needle: { label: 'NEEDLE', steps: [0, -18, 18], hard: true, gap: -12 },
  recovery: { label: 'RECOVERY', steps: [0, 0], gap: 20 },
});
export class PatternSystem {
  constructor(random = Math.random) {
    this.random = random; this.center = 350; this.queue = []; this.serial = 0;
    this.sinceRecovery = 0; this.lastHard = false; this.age = 0; this.safeFor = 0;
  }
  tick(dt) { this.age += dt; this.safeFor = Math.max(0, this.safeFor - dt); }
  afterShift() { this.safeFor = R.afterShiftGrace; }
  next(score, stats) {
    const stage = Math.min(R.maxStage, Math.floor(score / R.progressionInterval));
    if (!this.queue.length) {
      let id;
      const recoveryChance = stats.lucky ? .65 : .25;
      if (this.sinceRecovery >= 3 || (this.lastHard && (stats.recovery || this.random() < recoveryChance))) id = 'recovery';
      else {
        const pool = ['tunnel', 'staircaseUp', 'staircaseDown', 'wave'];
        if (!this.lastHard && this.safeFor === 0 && this.serial > 0) {
          pool.push('tightCorridor', 'needle', 'longCorridor', 'longCorridor');
          if (stage >= 3) pool.push('needle');
        }
        id = pool[Math.floor(this.random() * pool.length)];
      }
      let entrance = this.center;
      if (id === 'longCorridor') {
        // Fit the complete profile so screen boundaries do not flatten it.
        const options = CONNECTED_PATTERNS.map(pattern => {
          let offset = 0;
          const offsets = ROGUELITE_PATTERNS[pattern].steps.map(step => (offset += step));
          const start = clamp(this.center, R.gapMin - Math.min(...offsets), R.gapMax - Math.max(...offsets));
          return { pattern, start };
        }).filter(option => Math.abs(option.start - this.center) <= R.maxGapStep);
        const choice = options[Math.floor(this.random() * options.length)];
        id = choice.pattern; entrance = choice.start;
      }
      const definition = ROGUELITE_PATTERNS[id];
      this.serial++; this.age = 0;
      const recoveryBonus = id === 'recovery' && this.lastHard && stats.recovery ? 10 : 0;
      this.lastHard = !!definition.hard;
      this.sinceRecovery = id === 'recovery' ? 0 : this.sinceRecovery + 1;
      this.queue = definition.steps.map((step, index) => ({
        step: index === 0 && definition.connected ? entrance - this.center : step,
        pattern: id, label: definition.label, hard: !!definition.hard, connected: !!definition.connected,
        patternEnd: index === definition.steps.length - 1, patternId: this.serial,
        // Spacing belongs to the outgoing edge: the final segment leaves a
        // normal reaction distance before the following pattern.
        spacing: definition.connected && index < definition.steps.length - 1
          ? R.corridorSpacing
          : Math.max(R.minSpacing, (definition.spacing ?? R.spacing) - stage * 2),
        gapSize: clamp(R.gapSize - stage * 2 + (definition.gap ?? 0) + recoveryBonus, R.minGap, R.maxGap),
      }));
    }
    const item = this.queue.shift();
    this.center = clamp(this.center + clamp(item.step, -R.maxGapStep, R.maxGapStep), R.gapMin, R.gapMax);
    return { ...item, gap: this.center, gapSize: clamp(item.gapSize + stats.gapBonus, R.minGap, R.maxGap) };
  }
}
