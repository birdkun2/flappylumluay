import test from 'node:test';
import assert from 'node:assert/strict';
import { createRogueMeta, RogueRunProgress } from '../src/game/roguelite/metaProgress.js';
import { UpgradeSystem } from '../src/game/roguelite/upgradeSystem.js';
const storage = () => { const m = new Map(); return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)}; };
test('level starts at 1, rewards every 20 points, stops at 10, earnings continue without duplication',()=>{
 const m=createRogueMeta(null),r=new RogueRunProgress(m);let blessings=0;
 assert.equal(r.level,1);
 for(let score=1;score<=240;score++) if(r.score(score,m)) blessings++;
 assert.equal(blessings,9);assert.equal(r.level,10);assert.equal(m.coins,240);
 assert.equal(r.score(240,m),false);assert.equal(m.coins,240);
});
test('shop prices, charge caps, insufficient funds and reload persist correctly',()=>{
 const save=storage(),m=createRogueMeta(save);
 assert.equal(m.buy('level'),false);m.earn(5000);assert.equal(m.price('level'),50);
 m.buy('level');assert.equal(m.maxLevel,11);assert.equal(m.price('level'),100);m.buy('level');assert.equal(m.price('level'),150);
 for(let i=0;i<10;i++){assert.ok(m.buy('reroll'));assert.ok(m.buy('skip'));}
 assert.equal(m.buy('reroll'),false);assert.equal(m.buy('skip'),false);assert.equal(m.buy('unknown'),false);
 const loaded=createRogueMeta(save);assert.equal(loaded.coins,3350);assert.equal(loaded.maxLevel,12);assert.equal(loaded.rerolls,10);assert.equal(loaded.skips,10);
});
test('run charges consume once, refill on new runs and increased cap awards extra levels',()=>{
 const m=createRogueMeta(null);m.earn(200);m.buy('level');m.buy('reroll');m.buy('skip');
 const r=new RogueRunProgress(m);assert.ok(r.use('rerolls'));assert.equal(r.use('rerolls'),false);assert.ok(r.use('skips'));assert.equal(r.use('skips'),false);
 let count=0;for(let i=1;i<=220;i++)if(r.score(i,m))count++;
 assert.equal(count,10);assert.equal(r.level,11);
 const next=new RogueRunProgress(m);assert.equal(next.rerolls,1);assert.equal(next.skips,1);assert.equal(next.level,1);
});
test('reroll replaces offers without applying any upgrade',()=>{
 const u=new UpgradeSystem();const old=u.offer().map(x=>x.id);const fresh=u.offer(old);
 assert.equal(fresh.length,3);assert.ok(fresh.every(x=>!old.includes(x.id)));assert.equal(u.collected.length,0);
});
