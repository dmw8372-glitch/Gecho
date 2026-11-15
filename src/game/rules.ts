export type GameScreen = 'title' | 'playing' | 'paused' | 'gameover';

export type GameMode = 'exam' | 'ranking';

export type WeedingGrade = 1 | 2 | 3 | 4 | 5;

export type CharacterId = 'chiikawa' | 'hachiware' | 'usagi';

export type PortraitChoice = CharacterId | 'camera';

export interface PlantDefinition {
  id: string;
  label: string;
  isWeed: boolean;
  sprite: string;
  worldWidth: number;
  worldHeight: number;
}

export const EXAM_DURATION_SECONDS = 15;
export const RANKING_DURATION_SECONDS = 30;
export const MAX_PLAYER_NAME_LENGTH = 12;

export const YARD_BOUNDS = {
  minX: -5.2,
  maxX: 5.2,
  minZ: -2.4,
  maxZ: 3.35,
};

// All 9 plants from the user's updated plant sheet
export const PLANT_CATALOG: PlantDefinition[] = [
  // Weeds (+1)
  {
    id: 'weed_toothed_buds_lg',
    label: '톱니잎 잡초',
    isWeed: true,
    sprite: '/assets/sprites/weed_buds_lg.png',
    worldWidth: 1.56,
    worldHeight: 1.44,
  },
  {
    id: 'weed_long_lg',
    label: '길쭉 잡초',
    isWeed: true,
    sprite: '/assets/sprites/weed_long_lg.png',
    worldWidth: 1.62,
    worldHeight: 1.08,
  },
  {
    id: 'weed_clump',
    label: '뭉치 잡초',
    isWeed: true,
    sprite: '/assets/sprites/weed_clump.png',
    worldWidth: 1.32,
    worldHeight: 1.02,
  },
  // Protected plants (-1)
  {
    id: 'flower_yellow',
    label: '노란술 꽃',
    isWeed: false,
    sprite: '/assets/sprites/flower_yellow.png',
    worldWidth: 0.94,
    worldHeight: 1.48,
  },
  {
    id: 'flower_cluster',
    label: '꽃무더기',
    isWeed: false,
    sprite: '/assets/sprites/flower_cluster.png',
    worldWidth: 1.24,
    worldHeight: 1.46,
  },
  {
    id: 'veg_cabbage',
    label: '양배추',
    isWeed: false,
    sprite: '/assets/sprites/veg_cabbage.png',
    worldWidth: 1.36,
    worldHeight: 1.12,
  },
  {
    id: 'flower_white',
    label: '하얀 꽃',
    isWeed: false,
    sprite: '/assets/sprites/flower_white.png',
    worldWidth: 0.84,
    worldHeight: 1.44,
  },
  {
    id: 'veg_carrot',
    label: '당근',
    isWeed: false,
    sprite: '/assets/sprites/plant_carrot_s2.png',
    worldWidth: 1.18,
    worldHeight: 1.42,
  },
  {
    id: 'veg_clover',
    label: '클로버',
    isWeed: false,
    sprite: '/assets/sprites/plant_clover.png',
    worldWidth: 1.28,
    worldHeight: 0.98,
  },
];

export const STUDY_WEED_ITEMS = [
  { label: '톱니잎 잡초', sprite: '/assets/sprites/weed_buds_lg.png' },
  { label: '뭉치 잡초', sprite: '/assets/sprites/weed_clump.png' },
  { label: '길쭉 잡초', sprite: '/assets/sprites/weed_long_lg.png' },
];

export const STUDY_PROTECTED_ITEMS = [
  { label: '노란술 꽃', sprite: '/assets/sprites/flower_yellow.png' },
  { label: '꽃무더기', sprite: '/assets/sprites/flower_cluster.png' },
  { label: '양배추', sprite: '/assets/sprites/veg_cabbage.png' },
  { label: '하얀 꽃', sprite: '/assets/sprites/flower_white.png' },
  { label: '당근', sprite: '/assets/sprites/plant_carrot_s2.png' },
  { label: '클로버', sprite: '/assets/sprites/plant_clover.png' },
];

export const GRADE_CERTIFICATES: Record<
  WeedingGrade,
  {
    grade: WeedingGrade;
    label: string;
    sprite: string;
    minScore: number;
    shimmerTier: 'rainbow' | 'silver' | 'bronze' | 'mint' | 'basic';
  }
> = {
  1: {
    grade: 1,
    label: '1급',
    sprite: '/assets/sprites/cert_1.png',
    minScore: 55,
    shimmerTier: 'rainbow',
  },
  2: {
    grade: 2,
    label: '2급',
    sprite: '/assets/sprites/cert_2.png',
    minScore: 38,
    shimmerTier: 'silver',
  },
  3: {
    grade: 3,
    label: '3급',
    sprite: '/assets/sprites/cert_3.png',
    minScore: 20,
    shimmerTier: 'bronze',
  },
  4: {
    grade: 4,
    label: '4급',
    sprite: '/assets/sprites/cert_4.png',
    minScore: 8,
    shimmerTier: 'mint',
  },
  5: {
    grade: 5,
    label: '5급',
    sprite: '/assets/sprites/cert_5.png',
    minScore: 0,
    shimmerTier: 'basic',
  },
};

export const CHARACTER_PORTRAITS: Record<
  CharacterId,
  { id: CharacterId; name: string; sprite: string }
> = {
  chiikawa: {
    id: 'chiikawa',
    name: '치이카와',
    sprite: '/assets/sprites/chiikawa_s2.png',
  },
  hachiware: {
    id: 'hachiware',
    name: '하치와레',
    sprite: '/assets/sprites/hachiware_s2.png',
  },
  usagi: {
    id: 'usagi',
    name: '우사기',
    sprite: '/assets/sprites/usagi_s2.png',
  },
};

export interface ExamStats {
  score: number;
  combo: number;
  maxCombo: number;
  mistakes: number;
  pulledWeeds: number;
}

export interface RankingRecord {
  id: string;
  playerName: string;
  score: number;
  pulledWeeds: number;
  maxCombo: number;
  mistakes: number;
  durationSeconds: number;
  portraitId: PortraitChoice;
  createdAtMs: number;
}

export function createInitialExamStats(): ExamStats {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    mistakes: 0,
    pulledWeeds: 0,
  };
}

export function getModeDuration(mode: GameMode): number {
  return mode === 'ranking' ? RANKING_DURATION_SECONDS : EXAM_DURATION_SECONDS;
}

export function computeGrade(score: number): WeedingGrade {
  if (score >= GRADE_CERTIFICATES[1].minScore) return 1;
  if (score >= GRADE_CERTIFICATES[2].minScore) return 2;
  if (score >= GRADE_CERTIFICATES[3].minScore) return 3;
  if (score >= GRADE_CERTIFICATES[4].minScore) return 4;
  return 5;
}

export function applyPlantPull(stats: ExamStats, isWeed: boolean): {
  next: ExamStats;
  delta: number;
  gradeChanged: boolean;
  previousGrade: WeedingGrade;
  nextGrade: WeedingGrade;
} {
  const previousGrade = computeGrade(stats.score);
  if (isWeed) {
    const nextScore = stats.score + 1;
    const nextCombo = stats.combo + 1;
    const nextMaxCombo = Math.max(stats.maxCombo, nextCombo);
    const nextGrade = computeGrade(nextScore);
    return {
      next: {
        score: nextScore,
        combo: nextCombo,
        maxCombo: nextMaxCombo,
        mistakes: stats.mistakes,
        pulledWeeds: stats.pulledWeeds + 1,
      },
      delta: 1,
      gradeChanged: nextGrade < previousGrade,
      previousGrade,
      nextGrade,
    };
  }

  const nextScore = Math.max(0, stats.score - 1);
  const nextGrade = computeGrade(nextScore);
  return {
    next: {
      score: nextScore,
      combo: 0,
      maxCombo: stats.maxCombo,
      mistakes: stats.mistakes + 1,
      pulledWeeds: stats.pulledWeeds,
    },
    delta: -1,
    gradeChanged: false,
    previousGrade,
    nextGrade,
  };
}

export function getTargetPlantBudget(
  elapsedSeconds: number,
  durationSeconds = EXAM_DURATION_SECONDS,
): {
  targetCount: number;
  minActiveWeeds: number;
  maxProtectedActive: number;
  weedProbability: number;
} {
  const safeDuration = Math.max(1, durationSeconds);
  const ratio = Math.max(0, Math.min(1, elapsedSeconds / safeDuration));
  const maxActive = durationSeconds >= RANKING_DURATION_SECONDS ? 14 : 12;
  const targetCount = Math.round(10 + ratio * (maxActive - 10));
  const half = Math.ceil(targetCount / 2);
  const minActiveWeeds = Math.floor(targetCount / 2);
  const maxProtectedActive = half;
  const weedProbability = 0.5;
  return { targetCount, minActiveWeeds, maxProtectedActive, weedProbability };
}

export function getMinimumCumulativeWeeds(
  elapsedSeconds: number,
  durationSeconds = EXAM_DURATION_SECONDS,
): number {
  const clampedElapsed = Math.max(0, Math.min(durationSeconds, elapsedSeconds));
  const weedsPerSecond = durationSeconds >= RANKING_DURATION_SECONDS ? 4.5 : 4.5;
  return 5 + Math.floor(clampedElapsed * weedsPerSecond);
}

export function pickRandomPlant(
  weedProbability: number,
  rng: () => number = Math.random,
): PlantDefinition {
  const weeds = PLANT_CATALOG.filter((p) => p.isWeed);
  const protectedPlants = PLANT_CATALOG.filter((p) => !p.isWeed);
  const pool = rng() < weedProbability ? weeds : protectedPlants;
  const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[idx];
}

export function findOpenSpawnPosition(
  existing: Array<{ x: number; z: number }>,
  bounds = YARD_BOUNDS,
  minSpacing = 1.45,
  rng: () => number = Math.random,
): { x: number; z: number } | null {
  let bestCandidate: { x: number; z: number } | null = null;
  let bestMinDistSq = -1;
  const minSpacingSq = minSpacing * minSpacing;
  const attempts = existing.length === 0 ? 1 : 28;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
    const z = bounds.minZ + rng() * (bounds.maxZ - bounds.minZ);

    let closestSq = Infinity;
    for (let i = 0; i < existing.length; i++) {
      const dx = existing[i].x - x;
      const dz = existing[i].z - z;
      const dSq = dx * dx + dz * dz;
      if (dSq < closestSq) closestSq = dSq;
    }

    if (closestSq > bestMinDistSq) {
      bestMinDistSq = closestSq;
      bestCandidate = { x, z };
    }
  }

  if (existing.length === 0) return bestCandidate;
  return bestMinDistSq >= Math.min(minSpacingSq, 0.52 * 0.52) ? bestCandidate : null;
}

export function getTimerDisplay(
  remainingSeconds: number,
  durationSeconds = EXAM_DURATION_SECONDS,
): {
  displaySeconds: number;
  progress: number;
} {
  const safeDuration = Math.max(1, durationSeconds);
  const clamped = Math.max(0, Math.min(safeDuration, remainingSeconds));
  return {
    displaySeconds: Math.ceil(clamped),
    progress: clamped / safeDuration,
  };
}

export function sanitizePlayerName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_PLAYER_NAME_LENGTH);
}

export function toPlayerRankingDocId(playerName: string): string {
  const clean = sanitizePlayerName(playerName) || '도전자';
  const bytes = new TextEncoder().encode(clean);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `name_${hex}`;
}

export function isBetterRankingResult(
  candidate: Pick<RankingRecord, 'score' | 'pulledWeeds' | 'mistakes'>,
  existing: Pick<RankingRecord, 'score' | 'pulledWeeds' | 'mistakes'>,
): boolean {
  if (candidate.score !== existing.score) return candidate.score > existing.score;
  if (candidate.pulledWeeds !== existing.pulledWeeds) {
    return candidate.pulledWeeds > existing.pulledWeeds;
  }
  return candidate.mistakes < existing.mistakes;
}

export function sortRankingRecords(records: RankingRecord[]): RankingRecord[] {
  return [...records].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.pulledWeeds !== a.pulledWeeds) return b.pulledWeeds - a.pulledWeeds;
    if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes;
    return a.createdAtMs - b.createdAtMs;
  });
}

export function deduplicateBestRankings(records: RankingRecord[]): RankingRecord[] {
  const sorted = sortRankingRecords(records);
  const seen = new Set<string>();
  const best: RankingRecord[] = [];
  for (const r of sorted) {
    const key = sanitizePlayerName(r.playerName) || r.playerName;
    if (seen.has(key)) continue;
    seen.add(key);
    best.push(r);
  }
  return best;
}
