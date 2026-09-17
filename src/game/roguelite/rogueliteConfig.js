export const R = Object.freeze({
  calmDownReduction: 200, calmDownMinSpeed: 10,
  baseSpeed: 210, minSpeed: 110, maxSpeed: 9999,
  gapSize: 186, minGap: 164, maxGap: 230,
  spacing: 260, minSpacing: 230, tightSpacing: 234,
  corridorSpacing: 42, corridorLength: 12,
  corridorStep: 12, corridorWaveRun: 3,
  gapMin: 230, gapMax: 475, maxGapStep: 40,
  shiftInterval: [10, 20], shiftWarning: 2, shiftFraction: [0.15, 0.25],
  slowInterval: [18, 30], slowDrop: 100, slowDuration: 5,
  patternGrace: 2, afterShiftGrace: 4, patternLength: [3, 6],
  progressionInterval: 30, maxStage: 6,
  blessingResumeDelay: 2,
  whiskerDistance: 10, whiskerPasses: 5, rhythmTolerance: 0.2, rhythmDuration: 2, rhythmGravity: 0.85,
  softDuration: 0.8, softCooldown: 4, softFallSpeed: 110,
  goldPasses: 3, goldTolerance: 22, goldGapBonus: 24, liquidScale: 0.8,
  shieldGrace: 1.25, guardianInterval: 30, flowInterval: 5, featherInterval: 4,
});
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
