import test from 'node:test';
import assert from 'node:assert/strict';
import { BlessingEffects } from '../src/game/roguelite/blessingEffects.js';
import { createRunStats } from '../src/game/roguelite/upgradeSystem.js';
import { R } from '../src/game/roguelite/rogueliteConfig.js';
test('Soft Paws requires hold, caps falling only, expires and needs release plus cooldown',()=>{
 const e=new BlessingEffects();
 assert.equal(e.tickSoft(.1,false,300,true),300);
 assert.equal(e.tickSoft(.1,true,-200,true),-200);
 assert.equal(e.tickSoft(.1,true,300,true),R.softFallSpeed);
 for(let i=0;i<8;i++)e.tickSoft(.1,true,300,true);
 assert.equal(e.tickSoft(.1,true,300,true),300);
 e.tickSoft(5,true,300,true);assert.equal(e.softRemaining,0);
 e.tickSoft(.01,false,300,true);assert.equal(e.tickSoft(.01,true,300,true),R.softFallSpeed);
 assert.equal(e.tickSoft(.01,true,300,false),300);
});
test('Golden Thread rewards three consecutive centered passes and resets on misses',()=>{
 const e=new BlessingEffects();assert.equal(e.pass(true,false),false);assert.equal(e.goldStreak,0);
 e.pass(true,true);e.pass(false,true);assert.equal(e.goldStreak,0);
 assert.equal(e.pass(true,true),false);assert.equal(e.pass(true,true),false);assert.equal(e.pass(true,true),true);assert.equal(e.goldStreak,0);
});
test('Liquid Cat scales image/hitbox factor only in connected corridor and stacks with Small Body',()=>{
 const e=new BlessingEffects(),s=createRunStats();s.liquid=true;s.hitbox=.92**2;
 assert.equal(e.bodyScale(s,[{x:140,connected:true}],140),s.hitbox*R.liquidScale);
 assert.equal(e.bodyScale(s,[{x:400,connected:true}],140),s.hitbox);
 assert.equal(e.bodyScale(s,[{x:140,connected:false}],140),s.hitbox);
 s.liquid=false;assert.equal(e.bodyScale(s,[{x:140,connected:true}],140),s.hitbox);
});
