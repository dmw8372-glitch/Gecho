import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXAM_DURATION_SECONDS,
  GRADE_CERTIFICATES,
  PLANT_CATALOG,
  RANKING_DURATION_SECONDS,
  YARD_BOUNDS,
  applyPlantPull,
  computeGrade,
  createInitialExamStats,
  deduplicateBestRankings,
  findOpenSpawnPosition,
  getMinimumCumulativeWeeds,
  getModeDuration,
  getTargetPlantBudget,
  getTimerDisplay,
  isBetterRankingResult,
  pickRandomPlant,
  sanitizePlayerName,
  sortRankingRecords,
  toPlayerRankingDocId,
} from './rules';

test('computeGrade matches 60+ threshold for 1급', () => {
  assert.equal(computeGrade(0), 5);
  assert.equal(computeGrade(7), 5);
  assert.equal(computeGrade(8), 4);
  assert.equal(computeGrade(19), 4);
  assert.equal(computeGrade(20), 3);
  assert.equal(computeGrade(37), 3);
  assert.equal(computeGrade(38), 2);
  assert.equal(computeGrade(59), 2);
  assert.equal(computeGrade(60), 1);
  assert.equal(computeGrade(85), 1);
});

test('applyPlantPull increments score, combo, maxCombo and detects grade-up on weed pull', () => {
  let stats = createInitialExamStats();
  for (let i = 0; i < 7; i++) {
    const res = applyPlantPull(stats, true);
    stats = res.next;
    assert.equal(res.gradeChanged, false);
  }
  assert.equal(stats.score, 7);
  assert.equal(stats.combo, 7);

  const gradeUp = applyPlantPull(stats, true);
  assert.equal(gradeUp.next.score, 8);
  assert.equal(gradeUp.previousGrade, 5);
  assert.equal(gradeUp.nextGrade, 4);
  assert.equal(gradeUp.gradeChanged, true);
  assert.equal(gradeUp.next.maxCombo, 8);
  assert.equal(gradeUp.next.pulledWeeds, 8);
});

test('applyPlantPull resets combo, increments mistakes, and floors score at 0 for protected plants', () => {
  let stats = createInitialExamStats();
  stats = applyPlantPull(stats, true).next;
  stats = applyPlantPull(stats, true).next;
  assert.equal(stats.combo, 2);

  const mistake = applyPlantPull(stats, false);
  assert.equal(mistake.delta, -1);
  assert.equal(mistake.next.score, 1);
  assert.equal(mistake.next.combo, 0);
  assert.equal(mistake.next.maxCombo, 2);
  assert.equal(mistake.next.mistakes, 1);

  const secondMistake = applyPlantPull(mistake.next, false);
  assert.equal(secondMistake.next.score, 0);
  const floorTest = applyPlantPull(secondMistake.next, false);
  assert.equal(floorTest.next.score, 0);
  assert.equal(floorTest.next.mistakes, 3);
});

test('PLANT_CATALOG contains exactly the 9 updated weeds and protected plants with valid sprite paths', () => {
  assert.equal(PLANT_CATALOG.length, 9);
  const weeds = PLANT_CATALOG.filter((p) => p.isWeed);
  const protectedPlants = PLANT_CATALOG.filter((p) => !p.isWeed);
  assert.equal(weeds.length, 3);
  assert.equal(protectedPlants.length, 6);
  for (const item of PLANT_CATALOG) {
    assert.ok(item.sprite.startsWith('/assets/sprites/'));
    assert.ok(item.worldWidth > 0 && item.worldHeight > 0);
  }
});

test('pickRandomPlant respects weed vs protected probability', () => {
  const weed = pickRandomPlant(0.75, () => 0.1);
  assert.equal(weed.isWeed, true);

  const protectedItem = pickRandomPlant(0.75, () => 0.9);
  assert.equal(protectedItem.isWeed, false);
});

test('findOpenSpawnPosition avoids collisions and stays within yard bounds', () => {
  const existing = [
    { x: 0, z: 0 },
    { x: 2, z: 1 },
  ];
  let seed = 1337;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const pos = findOpenSpawnPosition(existing, YARD_BOUNDS, 1.4, rng);
  assert.ok(pos !== null);
  assert.ok(pos.x >= YARD_BOUNDS.minX && pos.x <= YARD_BOUNDS.maxX);
  assert.ok(pos.z >= YARD_BOUNDS.minZ && pos.z <= YARD_BOUNDS.maxZ);
  for (const item of existing) {
    const dist = Math.hypot(item.x - pos.x, item.z - pos.z);
    assert.ok(dist >= 0.52);
  }
});

test('getTimerDisplay, getModeDuration, and weed budgets exceed 1급 requirement', () => {
  assert.equal(getModeDuration('exam'), EXAM_DURATION_SECONDS);
  assert.equal(getModeDuration('ranking'), RANKING_DURATION_SECONDS);

  assert.deepEqual(getTimerDisplay(EXAM_DURATION_SECONDS), { displaySeconds: 15, progress: 1 });
  assert.deepEqual(getTimerDisplay(0.01), { displaySeconds: 1, progress: 0.01 / 15 });
  assert.deepEqual(getTimerDisplay(0), { displaySeconds: 0, progress: 0 });
  assert.deepEqual(getTimerDisplay(30, RANKING_DURATION_SECONDS), { displaySeconds: 30, progress: 1 });

  const startBudget = getTargetPlantBudget(0, EXAM_DURATION_SECONDS);
  const rankingEndBudget = getTargetPlantBudget(30, RANKING_DURATION_SECONDS);
  assert.equal(startBudget.targetCount, 10);
  assert.equal(startBudget.minActiveWeeds, 5);
  assert.equal(startBudget.maxProtectedActive, 5);
  assert.equal(startBudget.weedProbability, 0.5);
  assert.equal(rankingEndBudget.targetCount, 14);

  const examTotalWeeds = getMinimumCumulativeWeeds(EXAM_DURATION_SECONDS, EXAM_DURATION_SECONDS);
  const rankingTotalWeeds = getMinimumCumulativeWeeds(RANKING_DURATION_SECONDS, RANKING_DURATION_SECONDS);
  assert.ok(examTotalWeeds >= GRADE_CERTIFICATES[1].minScore + 10);
  assert.ok(rankingTotalWeeds >= 130);
});

test('sanitizePlayerName and sortRankingRecords behave deterministically', () => {
  assert.equal(sanitizePlayerName('   치이카와   왕  '), '치이카와 왕');
  assert.equal(sanitizePlayerName('가나다라마바사아자차카타파하'), '가나다라마바사아자차카타');

  const sorted = sortRankingRecords([
    {
      id: 'a',
      playerName: '유저A',
      score: 18,
      pulledWeeds: 20,
      maxCombo: 7,
      mistakes: 2,
      durationSeconds: 30,
      portraitId: 'chiikawa',
      createdAtMs: 2000,
    },
    {
      id: 'b',
      playerName: '유저B',
      score: 25,
      pulledWeeds: 25,
      maxCombo: 12,
      mistakes: 0,
      durationSeconds: 30,
      portraitId: 'hachiware',
      createdAtMs: 3000,
    },
    {
      id: 'c',
      playerName: '유저C',
      score: 18,
      pulledWeeds: 20,
      maxCombo: 9,
      mistakes: 1,
      durationSeconds: 30,
      portraitId: 'usagi',
      createdAtMs: 1000,
    },
  ]);

  assert.deepEqual(
    sorted.map((r) => r.id),
    ['b', 'c', 'a'],
  );

  // Deterministic ASCII doc ID and same-name highest-record deduplication
  const docId1 = toPlayerRankingDocId('치이카와');
  const docId2 = toPlayerRankingDocId('  치이카와  ');
  assert.equal(docId1, docId2);
  assert.match(docId1, /^[a-zA-Z0-9_-]+$/);
  assert.notEqual(docId1, toPlayerRankingDocId('하치와레'));

  assert.equal(
    isBetterRankingResult({ score: 35, pulledWeeds: 35, mistakes: 0 }, { score: 25, pulledWeeds: 25, mistakes: 0 }),
    true,
  );
  assert.equal(
    isBetterRankingResult({ score: 20, pulledWeeds: 20, mistakes: 0 }, { score: 25, pulledWeeds: 25, mistakes: 0 }),
    false,
  );

  const deduped = deduplicateBestRankings([
    {
      id: 'low',
      playerName: '치이카와',
      score: 18,
      pulledWeeds: 19,
      maxCombo: 6,
      mistakes: 1,
      durationSeconds: 30,
      portraitId: 'chiikawa',
      createdAtMs: 1000,
    },
    {
      id: 'high',
      playerName: '치이카와',
      score: 36,
      pulledWeeds: 36,
      maxCombo: 20,
      mistakes: 0,
      durationSeconds: 30,
      portraitId: 'hachiware',
      createdAtMs: 2000,
    },
    {
      id: 'other',
      playerName: '우사기',
      score: 28,
      pulledWeeds: 28,
      maxCombo: 11,
      mistakes: 0,
      durationSeconds: 30,
      portraitId: 'usagi',
      createdAtMs: 1500,
    },
  ]);

  assert.deepEqual(
    deduped.map((r) => ({ id: r.id, score: r.score })),
    [
      { id: 'high', score: 36 },
      { id: 'other', score: 28 },
    ],
  );
});
