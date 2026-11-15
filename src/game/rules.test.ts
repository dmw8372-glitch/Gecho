import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXAM_DURATION_SECONDS,
  PLANT_CATALOG,
  applyPlantPull,
  computeGrade,
  createInitialExamStats,
  findOpenSpawnPosition,
  getTargetPlantBudget,
  getTimerDisplay,
  pickRandomPlant,
} from './rules';

test('computeGrade matches reference screenshot score thresholds', () => {
  assert.equal(computeGrade(0), 5);
  assert.equal(computeGrade(4), 5);
  assert.equal(computeGrade(7), 4);
  assert.equal(computeGrade(13), 3);
  assert.equal(computeGrade(20), 2);
  assert.equal(computeGrade(25), 1);
  assert.equal(computeGrade(29), 1);
});

test('applyPlantPull increments score, combo, maxCombo and detects grade-up on weed pull', () => {
  let stats = createInitialExamStats();
  for (let i = 0; i < 4; i++) {
    const res = applyPlantPull(stats, true);
    stats = res.next;
    assert.equal(res.delta, 1);
    assert.equal(res.gradeChanged, false);
  }
  assert.equal(stats.score, 4);
  assert.equal(stats.combo, 4);

  // 5th weed upgrades 5급 -> 4급
  const gradeUp = applyPlantPull(stats, true);
  assert.equal(gradeUp.next.score, 5);
  assert.equal(gradeUp.previousGrade, 5);
  assert.equal(gradeUp.nextGrade, 4);
  assert.equal(gradeUp.gradeChanged, true);
});

test('applyPlantPull resets combo, increments mistakes, and floors score at 0 for protected plants', () => {
  let stats = createInitialExamStats();
  stats = applyPlantPull(stats, true).next;
  stats = applyPlantPull(stats, true).next;
  assert.equal(stats.combo, 2);

  const mistake = applyPlantPull(stats, false);
  assert.equal(mistake.next.score, 1);
  assert.equal(mistake.next.combo, 0);
  assert.equal(mistake.next.maxCombo, 2);
  assert.equal(mistake.next.mistakes, 1);

  const floorCheck = applyPlantPull(createInitialExamStats(), false);
  assert.equal(floorCheck.next.score, 0);
  assert.equal(floorCheck.next.mistakes, 1);
});

test('PLANT_CATALOG contains both weeds and protected plants with valid sprite paths', () => {
  const weeds = PLANT_CATALOG.filter((p) => p.isWeed);
  const protectedPlants = PLANT_CATALOG.filter((p) => !p.isWeed);
  assert.ok(weeds.length >= 6);
  assert.ok(protectedPlants.length >= 5);
  for (const plant of PLANT_CATALOG) {
    assert.ok(plant.sprite.startsWith('/assets/sprites/'));
    assert.ok(plant.worldWidth > 0 && plant.worldHeight > 0);
  }
});

test('pickRandomPlant respects weed vs protected probability', () => {
  const alwaysWeed = pickRandomPlant(0.7, () => 0.1);
  assert.equal(alwaysWeed.isWeed, true);

  const alwaysProtected = pickRandomPlant(0.7, () => 0.95);
  assert.equal(alwaysProtected.isWeed, false);
});

test('findOpenSpawnPosition avoids collisions and stays within yard bounds', () => {
  const existing = [
    { x: 0, z: 0 },
    { x: 2, z: 1 },
  ];
  const pos = findOpenSpawnPosition(existing, undefined, 1.45);
  assert.ok(pos !== null);
  assert.ok(pos.x >= -5.4 && pos.x <= 5.4);
  assert.ok(pos.z >= -3.5 && pos.z <= 3.4);
});

test('getTimerDisplay and getTargetPlantBudget stay bounded across 15s exam', () => {
  assert.equal(getTimerDisplay(EXAM_DURATION_SECONDS).displaySeconds, 15);
  assert.equal(getTimerDisplay(EXAM_DURATION_SECONDS).progress, 1);
  assert.equal(getTimerDisplay(0).displaySeconds, 0);
  assert.equal(getTimerDisplay(0).progress, 0);

  const startBudget = getTargetPlantBudget(0);
  const endBudget = getTargetPlantBudget(EXAM_DURATION_SECONDS);
  assert.ok(endBudget.targetCount > startBudget.targetCount);
});
