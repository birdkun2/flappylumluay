import test from 'node:test';
import assert from 'node:assert/strict';
import { AdvancedBlessings } from '../src/game/roguelite/advancedBlessings.js';
import { createRunStats, UpgradeSystem } from '../src/game/roguelite/upgradeSystem.js';
import { UPGRADES } from '../src/game/roguelite/upgrades.js';
import { R } from '../src/game/roguelite/rogueliteConfig.js';
test('four rhythmic flaps trigger a bounded bonus; irregular timing does not',()=>{
 const a=new AdvancedBlessings();a.flap(true);
 for(let i=0;i<3;i++){a.tick(.4);a.flap(true);}
 assert.equal(a.rhythmRemaining,R.rhythmDuration);a.tick(2);assert.equal(a.rhythmRemaining,0);
 const bad=new AdvancedBlessings();for(const dt of [.2,.8,.3,.7]){bad.tick(dt);bad.flap(true);}assert.equal(bad.rhythmRemaining,0);
});
test('near misses use actual collision rectangles and only reward completed clean passes',()=>{
 const a=new AdvancedBlessings(),stats=createRunStats();stats.whiskers=true;
 const p={x:140,gap:350,gapSize:180};
 assert.ok(a.near({x:140,y:286},p,1));assert.equal(a.near({x:140,y:350},p,1),false);
 assert.equal(a.near({x:300,y:286},p,1),false);
 for(let i=0;i<4;i++)a.pass({nearMiss:true},stats);assert.equal(stats.shields,0);
 a.pass({nearMiss:true,damaged:true},stats);assert.equal(a.nearPasses,4);
 a.pass({nearMiss:true},stats);assert.equal(stats.shields,1);assert.equal(a.nearPasses,0);
});
test('new upgrades apply once, bargain narrows future gaps and excludes last level',()=>{
 const u=new UpgradeSystem();for(const id of ['lastMeow','whiskers','rhythm','instinct','bargain']){u.offers=[UPGRADES.find(x=>x.id===id)];assert.ok(u.choose(id));}
 assert.equal(u.stats.extraLife,1);assert.equal(u.stats.gapBonus,-10);assert.equal(u.stats.fortune,1);
 assert.ok(u.stats.whiskers&&u.stats.rhythm&&u.stats.instinct);
 const bargain=UPGRADES.find(x=>x.id==='bargain');u.stats.remainingLevels=0;assert.equal(bargain.eligible(u.stats),false);
 assert.equal(new UpgradeSystem().stats.extraLife,0);
});
