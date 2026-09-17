import { CONFIG as C } from '../config.js';
import { UPGRADES, SUPPLIES } from './upgrades.js';
export const RARITY_WEIGHTS = { common: 65, rare: 27, epic: 7, legendary: 1 };
export function createRunStats() {
  return { gravity: C.GRAVITY, flap: C.FLAP_VELOCITY, maxFall: C.MAX_FALL_SPEED, hitbox: 1, rotation: 1,
    extraLife: 0, whiskers: false, rhythm: false, instinct: false, fortune: 0, remainingLevels: Infinity, speedReduction: 0, gapBonus: 0, cooldownBonus: 0, shields: 0, recovery: false, guardian: false, lucky: false,
    flow: false, feather: false, soft: false, gold: false, liquid: false, wideCharges: 0, calmCharge: 0, flapCharges: 0 };
}
export class UpgradeSystem {
  constructor(random = Math.random) { this.random = random; this.stats = createRunStats(); this.stacks = {}; this.collected = []; this.offers = []; }
  offer(excluded = [], weights = RARITY_WEIGHTS) {
    const available = UPGRADES.filter(u => (this.stacks[u.id] ?? 0) < u.maxStacks && (!u.eligible || u.eligible(this.stats)));
    const fresh = available.filter(u => !excluded.includes(u.id));
    const pool = fresh.length >= 3 ? fresh : available;
    const choices = [];
    while (pool.length && choices.length < 3) {
      const rarities = Object.keys(weights).filter(r => pool.some(u => u.rarity === r));
      let roll = this.random() * rarities.reduce((n, r) => n + weights[r], 0);
      const rarity = rarities.find(r => (roll -= weights[r]) < 0) ?? rarities.at(-1);
      const candidates = pool.filter(u => u.rarity === rarity);
      const selected = candidates[Math.floor(this.random() * candidates.length)];
      choices.push(selected); pool.splice(pool.indexOf(selected), 1);
    }
    for (const supply of SUPPLIES) if (choices.length < 3) choices.push(supply);
    this.offers = choices; return choices;
  }
  choose(id) {
    const upgrade = this.offers.find(u => u.id === id);
    if (!upgrade) return false;
    this.offers = []; upgrade.apply(this.stats);
    this.stacks[id] = (this.stacks[id] ?? 0) + 1;
    this.collected.push(upgrade.name); return true;
  }
}
