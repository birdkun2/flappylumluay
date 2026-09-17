import test from 'node:test';
import assert from 'node:assert/strict';
import { R } from '../src/game/roguelite/rogueliteConfig.js';
import { CONFIG as C } from '../src/game/config.js';
import { PatternSystem } from '../src/game/roguelite/patternSystem.js';
import { SpeedShiftSystem } from '../src/game/roguelite/speedShiftSystem.js';
import { UpgradeSystem, createRunStats } from '../src/game/roguelite/upgradeSystem.js';
import { UPGRADES } from '../src/game/roguelite/upgrades.js';
import { rogueCollision } from '../src/game/roguelite/collision.js';
import { createProgress } from '../src/game/progress.js';
const seeded = () => { let seed = 7351; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); };
test('Roguelite starts harder while vertical controls match Normal', () => {
  assert.ok(R.baseSpeed > C.OBSTACLE_SPEED); assert.ok(R.gapSize < C.OBSTACLE_GAP);
  const s = createRunStats(); assert.equal(s.gravity, C.GRAVITY); assert.equal(s.flap, C.FLAP_VELOCITY);
});
test('10000 seeded pattern pairs respect transition, spacing, gap and recovery bounds', () => {
  const system = new PatternSystem(seeded()), stats = createRunStats();
  let previous = 350, lastPattern = 0, priorHard = false, sinceRecovery = 0;
  const seen = new Set();
  for (let i=0;i<10000;i++) {
    const p = system.next(i, stats); seen.add(p.pattern);
    assert.ok(Math.abs(p.gap - previous) <= R.maxGapStep);
    assert.ok(p.gap >= R.gapMin && p.gap <= R.gapMax);
    assert.ok(p.gapSize >= R.minGap && p.gapSize <= R.maxGap);
    if (p.connected && !p.patternEnd) {
      assert.equal(p.spacing, R.corridorSpacing); assert.ok(p.spacing <= C.SHAFT_WIDTH);
      if (p.patternId === lastPattern) assert.ok(Math.abs(p.gap - previous) <= R.corridorStep);
    } else assert.ok(p.spacing >= R.minSpacing);
    if (p.patternId !== lastPattern) {
      assert.ok(!(priorHard && p.hard), 'hard patterns cannot repeat consecutively');
      sinceRecovery = p.pattern === 'recovery' ? 0 : sinceRecovery + 1;
      assert.ok(sinceRecovery <= 3); priorHard = p.hard; lastPattern = p.patternId;
    }
    previous = p.gap;
  }
  assert.equal(seen.size, 11);
});
test('post-shift grace blocks newly selected hard patterns', () => {
  const p = new PatternSystem(()=>.999); p.serial=1; p.afterShift();
  assert.equal(p.next(100,createRunStats()).hard,false);
});
test('permanent speed only increases after a two-second warning, then caps', () => {
  const s = new SpeedShiftSystem(()=>.9); s.cooldown=0;
  s.tick(.1,{safe:false}); assert.equal(s.pending,null);
  s.tick(.1); const original=s.speed; assert.ok(s.pending.up);
  s.tick(1.99); assert.equal(s.speed,original);
  assert.equal(s.tick(.01),true); assert.ok(s.speed>original); assert.ok(s.cooldown>=10);
  for(let i=0;i<20;i++) {
    s.cooldown=0; s.slowCooldown=100; const previous=s.speed;
    s.tick(.01); s.tick(2); assert.ok(s.speed>=previous && s.speed<=R.maxSpeed);
  }
  assert.equal(s.speed,R.maxSpeed); assert.equal(s.pending,null);
});
test('random shock drops exactly 100 immediately, restores after five seconds and cannot overlap shifts', () => {
  const s=new SpeedShiftSystem(()=>.5);
  s.cruiseSpeed=287; s.slowCooldown=0;
  const cooldown=s.cooldown;
  assert.equal(s.tick(.01),true); assert.equal(s.speed,187); assert.equal(s.pending,null);
  s.tick(4.99); assert.equal(s.speed,187); assert.equal(s.cruiseSpeed,287);
  assert.equal(s.tick(.01),true); assert.equal(s.speed,287); assert.equal(s.slowRemaining,0);
  assert.ok(s.slowCooldown>=R.slowInterval[0]); assert.equal(s.cooldown,cooldown-.01);
  s.cooldown=0; s.tick(.01); assert.ok(s.pending);
  s.slowCooldown=0; s.tick(1); assert.equal(s.slowRemaining,0);
  s.tick(1); const current=s.speed; s.tick(.01); assert.equal(s.speed,current-100);
  s.tick(5); assert.equal(s.speed,current);
  const fresh=new SpeedShiftSystem(()=>0); assert.equal(fresh.speed,R.baseSpeed);
  fresh.slowCooldown=0; fresh.tick(.01); assert.ok(fresh.speed>=R.minSpeed);
});

test('offers are unique, capped upgrades disappear, exhausted pool still supplies three choices', () => {
  const u = new UpgradeSystem(seeded());
  for(let i=0;i<150;i++) {
    const choices=u.offer(); assert.equal(choices.length,3); assert.equal(new Set(choices.map(c=>c.id)).size,3);
    for(const c of choices) if(c.maxStacks) assert.ok((u.stacks[c.id]??0)<c.maxStacks);
    assert.equal(u.choose(choices[0].id),true); assert.equal(u.choose(choices[1].id),false);
    u.stats.shields=0;
  }
  for(const entry of UPGRADES) u.stacks[entry.id]=entry.maxStacks;
  assert.equal(u.offer().length,3);
  assert.equal(u.choose('invalid'),false);
});
test('all upgrade effects apply and fresh runs reset all upgrades', () => {
  const u = new UpgradeSystem();
  for (const entry of UPGRADES) { u.offers=[entry]; assert.equal(u.choose(entry.id),true); }
  assert.equal(u.collected.length,16); assert.equal(u.stats.shields,1);
  assert.ok(u.stats.gravity<C.GRAVITY); assert.ok(u.stats.flap<C.FLAP_VELOCITY);
  assert.ok(u.stats.hitbox<1); assert.ok(u.stats.gapBonus>0); assert.ok(u.stats.guardian);
  assert.deepEqual(new UpgradeSystem().stats,createRunStats());
});
test('collision uses per-pair gap size and upgraded hitbox', () => {
  const pair={x:140,gap:350,gapSize:180};
  assert.equal(rogueCollision({x:140,y:350},pair),false);
  assert.equal(rogueCollision({x:140,y:265},pair),true);
  assert.equal(rogueCollision({x:140,y:275},pair,.5),false);
  pair.gapSize=220; assert.equal(rogueCollision({x:140,y:265},pair),false);
});
test('Roguelite saves cannot overwrite or unlock Normal progress', () => {
  const values=new Map([['flappy-lumluay-best','63']]);
  const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const p=createProgress(storage); p.recordRoguelite(150);
  assert.equal(p.normalBest,63); assert.equal(p.unlocked,false);
  assert.equal(createProgress(storage).rogueliteBest,150);
});

test('connected variants retain slope, wave turns and safe clearance', () => {
  for (let variant=0;variant<4;variant++) {
    const rolls=[.8,(variant+.1)/4]; const system=new PatternSystem(()=>rolls.shift()??0); system.serial=1;
    const pairs=Array.from({length:R.corridorLength},()=>system.next(0,createRunStats()));
    assert.equal(pairs[0].pattern,['longCorridor','corridorUp','corridorDown','corridorWave'][variant]);
    const deltas=pairs.slice(1).map((p,i)=>p.gap-pairs[i].gap);
    if(variant===0) assert.ok(deltas.every(d=>d===0));
    if(variant===1) assert.ok(deltas.every(d=>d===-R.corridorStep));
    if(variant===2) assert.ok(deltas.every(d=>d===R.corridorStep));
    if(variant===3) assert.ok(deltas.some(d=>d<0)&&deltas.some(d=>d>0));
    assert.ok(pairs.at(-1).spacing>=R.minSpacing);
    for(let i=0;i<pairs.length-2;i++) {
      const section=pairs.slice(i,i+3);
      const clearance=Math.min(...section.map(p=>p.gap+p.gapSize/2))-Math.max(...section.map(p=>p.gap-p.gapSize/2));
      assert.ok(clearance>C.HITBOX_HEIGHT+60);
    }
  }
});

test('Calm Down stacks without limit and survives speed shifts until run reset', () => {
 const u=new UpgradeSystem(), entry=UPGRADES.find(x=>x.id==='calmDown');
 const s=new SpeedShiftSystem(()=>.5);
 for(let i=0;i<30;i++){u.offers=[entry];assert.ok(u.choose(entry.id));}
 assert.equal(u.stats.speedReduction,6000);assert.equal(u.stacks.calmDown,30);
 assert.equal(entry.maxStacks,Infinity);
 s.speedReduction=200;s.cruiseSpeed=310;assert.equal(s.speed,110);
 s.cooldown=0;s.tick(.01);s.tick(2);const expected=Math.min(R.maxSpeed,310*1.2)-200;assert.equal(s.speed,expected);
 s.slowCooldown=0;s.tick(.01);assert.equal(s.speed,Math.max(R.calmDownMinSpeed,expected-R.slowDrop));s.tick(5);assert.equal(s.speed,expected);
 s.speedReduction=u.stats.speedReduction;assert.equal(s.speed,R.calmDownMinSpeed);
 assert.equal(new SpeedShiftSystem().speed,R.baseSpeed);assert.equal(new UpgradeSystem().stats.speedReduction,0);
 for(const x of UPGRADES)if(Number.isFinite(x.maxStacks))u.stacks[x.id]=x.maxStacks;
 assert.ok(u.offer().some(x=>x.id==='calmDown'));
});
test('Guardian Charm is the Legendary tier and remains selectable',()=>{
 const u=new UpgradeSystem(()=>.999);
 assert.equal(UPGRADES.find(x=>x.id==='guardian').rarity,'legendary');
 assert.ok(u.offer().some(x=>x.id==='guardian'));
});
