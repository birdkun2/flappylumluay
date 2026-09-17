import { R } from './rogueliteConfig.js';
﻿export const UPGRADES = [
  { id: 'calmDown', name: 'Calm Down', description: 'Speed -200 per stack for this run. Unlimited stacks; minimum speed 10.', rarity: 'common', maxStacks: Infinity, apply: s => { s.speedReduction += R.calmDownReduction; } },
  { id: 'light', name: 'Light Body', description: 'Gravity -5% per stack.', rarity: 'common', maxStacks: 3, apply: s => { s.gravity *= .95; } },
  { id: 'flap', name: 'Strong Flap', description: 'Flap strength +4% per stack.', rarity: 'common', maxStacks: 3, apply: s => { s.flap *= 1.04; } },
  { id: 'path', name: 'Wider Path', description: 'Future gaps are 8 pixels wider.', rarity: 'common', maxStacks: 2, apply: s => { s.gapBonus += 8; } },
  { id: 'calm', name: 'Calm Rhythm', description: 'Add 3 seconds between speed warnings.', rarity: 'common', maxStacks: 3, apply: s => { s.cooldownBonus += 3; } },
  { id: 'small', name: 'Small Body', description: 'Body size and collision box -8% per stack.', rarity: 'rare', maxStacks: 2, apply: s => { s.hitbox *= .92; } },
  { id: 'shield', name: 'Shield', description: 'Negate one hit, with brief protection. Holds one charge.', rarity: 'rare', maxStacks: 3, eligible: s => s.shields === 0, apply: s => { s.shields = 1; } },
  { id: 'recovery', name: 'Recovery', description: 'Hard sections lead into a wider recovery pattern.', rarity: 'rare', maxStacks: 1, apply: s => { s.recovery = true; } },
  { id: 'stable', name: 'Stable Wings', description: 'Lower terminal fall speed and gentler downward tilt.', rarity: 'rare', maxStacks: 2, apply: s => { s.maxFall *= .92; s.rotation *= .85; } },
  { id: 'guardian', name: 'Guardian Charm', description: 'Gain one shield at each future 30 points. Holds one.', rarity: 'legendary', maxStacks: 1, apply: s => { s.guardian = true; } },
  { id: 'lucky', name: 'Lucky Path', description: 'More recovery sections after hard patterns.', rarity: 'epic', maxStacks: 1, apply: s => { s.lucky = true; } },
  { id: 'flow', name: 'Flow State', description: 'Every 5 clean passes widens the next spawned gap by 14.', rarity: 'epic', maxStacks: 1, apply: s => { s.flow = true; } },
  { id: 'feather', name: 'Feather Step', description: 'Every fourth flap is 10% stronger.', rarity: 'epic', maxStacks: 1, apply: s => { s.feather = true; } },
  { id: 'soft', name: 'Soft Paws', description: 'Hold tap / Space to slow your fall for 0.8s. Release to rearm; 4s cooldown.', rarity: 'rare', maxStacks: 1, apply: s => { s.soft = true; } },
  { id: 'gold', name: 'Golden Thread', description: 'Cross the center of 3 gaps in a row to widen the next gap by 24.', rarity: 'rare', maxStacks: 1, apply: s => { s.gold = true; } },
  { id: 'lastMeow', name: 'Last Meow', description: 'Survive one fatal hit this run. Return safely with a 2s countdown.', rarity: 'legendary', maxStacks: 1, apply: s => { s.extraLife = 1; } },
  { id: 'whiskers', name: 'Lucky Whiskers', description: 'Pass 5 pillars with a near miss to gain a shield. Holds one.', rarity: 'rare', maxStacks: 1, apply: s => { s.whiskers = true; } },
  { id: 'rhythm', name: 'Rhythm Cat', description: 'Four evenly timed flaps grant 2s of lighter gravity.', rarity: 'rare', maxStacks: 1, apply: s => { s.rhythm = true; } },
  { id: 'instinct', name: "Cat's Instinct", description: 'Reveal the center line of the next two gaps.', rarity: 'common', maxStacks: 1, apply: s => { s.instinct = true; } },
  { id: 'bargain', name: 'Golden Bargain', description: 'Future gaps -10. The next level offers better Rare/Epic odds.', rarity: 'epic', maxStacks: 1, eligible: s => s.remainingLevels > 0, apply: s => { s.gapBonus -= 10; s.fortune = 1; } },
  { id: 'liquid', name: 'Liquid Cat', description: 'Body and hitbox shrink another 20% inside connected corridors.', rarity: 'epic', maxStacks: 1, apply: s => { s.liquid = true; } },
];
// Exhausted-pool choices are short-lived supplies, not uncapped stat stacks.
export const SUPPLIES = [
  { id: 'breathing', name: 'Breathing Room', description: 'The next 3 spawned gaps gain 10 pixels.', rarity: 'common', apply: s => { s.wideCharges = 3; } },
  { id: 'stillness', name: 'Still Air', description: 'Delay the next speed warning by 6 seconds.', rarity: 'common', apply: s => { s.calmCharge = 6; } },
  { id: 'tailwind', name: 'Gentle Lift', description: 'The next 5 flaps are 5% stronger.', rarity: 'common', apply: s => { s.flapCharges = 5; } },
];
