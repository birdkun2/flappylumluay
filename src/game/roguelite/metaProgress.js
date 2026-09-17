export const SHOP = Object.freeze({ baseMaxLevel: 10, levelStep: 20, maxCharges: 10, rerollPrice: 100, skipPrice: 50 });
const KEY = 'flappy-lumluay-roguelite-shop';
const valid = n => Number.isSafeInteger(n) && n >= 0;
export function createRogueMeta(storage) {
  let data = { coins: 0, levelPurchases: 0, rerolls: 0, skips: 0 };
  try {
    const saved = JSON.parse(storage?.getItem(KEY) ?? 'null');
    for (const key of Object.keys(data)) if (valid(saved?.[key])) data[key] = saved[key];
    data.rerolls = Math.min(SHOP.maxCharges, data.rerolls); data.skips = Math.min(SHOP.maxCharges, data.skips);
  } catch { /* Preserve playability without storage. */ }
  const persist = () => { try { storage?.setItem(KEY, JSON.stringify(data)); } catch { /* Session fallback. */ } };
  return {
    get coins() { return data.coins; },
    get maxLevel() { return SHOP.baseMaxLevel + data.levelPurchases; },
    get rerolls() { return data.rerolls; }, get skips() { return data.skips; },
    price(item) { return item === 'level' ? 50 * (data.levelPurchases + 1) : item === 'reroll' ? SHOP.rerollPrice : item === 'skip' ? SHOP.skipPrice : Infinity; },
    canBuy(item) { return this.price(item) <= data.coins && (item === 'level' || (item === 'reroll' && data.rerolls < SHOP.maxCharges) || (item === 'skip' && data.skips < SHOP.maxCharges)); },
    buy(item) {
      if (!this.canBuy(item)) return false;
      data.coins -= this.price(item);
      data[item === 'level' ? 'levelPurchases' : item === 'reroll' ? 'rerolls' : 'skips']++;
      persist(); return true;
    },
    earn(points) { if (valid(points) && points > 0 && Number.isSafeInteger(data.coins + points)) { data.coins += points; persist(); } },
  };
}
export class RogueRunProgress {
  constructor(meta) { this.level = 1; this.maxLevel = meta.maxLevel; this.rerolls = meta.rerolls; this.skips = meta.skips; this.creditedScore = 0; }
  score(score, meta) {
    if (!valid(score) || score <= this.creditedScore) return false;
    meta.earn(score - this.creditedScore); this.creditedScore = score;
    const next = Math.min(this.maxLevel, 1 + Math.floor(score / SHOP.levelStep));
    const increased = next > this.level; this.level = next; return increased;
  }
  use(item) { if (!['rerolls', 'skips'].includes(item) || this[item] <= 0) return false; this[item]--; return true; }
}
