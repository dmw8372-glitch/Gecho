import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from '../firebase';
import {
  ExamStats,
  PortraitChoice,
  RANKING_DURATION_SECONDS,
  RankingRecord,
  sanitizePlayerName,
  sortRankingRecords,
} from './rules';

const RANKINGS_COLLECTION = 'rankings';
const LOCAL_CACHE_KEY = 'chiikawa_weeding_rankings_v1';

function readLocalCache(): RankingRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCache(records: RankingRecord[]) {
  try {
    window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(sortRankingRecords(records).slice(0, 30)));
  } catch {
    // Ignore storage quota errors
  }
}

function createEntryId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `rk_${ts}_${rand}`;
}

export async function fetchTopRankings(maxResults = 20): Promise<{
  records: RankingRecord[];
  source: 'firestore' | 'local';
}> {
  try {
    const q = query(
      collection(db, RANKINGS_COLLECTION),
      where('score', '>=', 0),
      where('score', '<=', 300),
      orderBy('score', 'desc'),
      limit(Math.min(50, Math.max(10, maxResults + 10))),
    );
    const snap = await getDocs(q);
    const loaded: RankingRecord[] = snap.docs
      .map((d) => {
        const data = d.data();
        const createdAtMs =
          data.createdAt && typeof data.createdAt.toMillis === 'function'
            ? data.createdAt.toMillis()
            : Date.now();
        return {
          id: d.id,
          playerName: String(data.playerName || '이름없음'),
          score: Number(data.score ?? 0),
          pulledWeeds: Number(data.pulledWeeds ?? 0),
          maxCombo: Number(data.maxCombo ?? 0),
          mistakes: Number(data.mistakes ?? 0),
          durationSeconds: Number(data.durationSeconds ?? RANKING_DURATION_SECONDS),
          portraitId: (data.portraitId as PortraitChoice) || 'chiikawa',
          createdAtMs,
        };
      })
      .filter((r) => r.durationSeconds === RANKING_DURATION_SECONDS);

    const sorted = sortRankingRecords(loaded).slice(0, maxResults);
    writeLocalCache(sorted);
    return { records: sorted, source: 'firestore' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.LIST, RANKINGS_COLLECTION);
    }
    return { records: sortRankingRecords(readLocalCache()).slice(0, maxResults), source: 'local' };
  }
}

export async function submitRankingEntry(params: {
  playerName: string;
  stats: ExamStats;
  portraitId: PortraitChoice;
}): Promise<RankingRecord> {
  const cleanName = sanitizePlayerName(params.playerName) || '도전자';
  const clampInt = (n: number) => Math.max(0, Math.min(300, Math.round(n)));

  const entryId = createEntryId();
  const safeScore = clampInt(params.stats.score);
  const safePulled = clampInt(params.stats.pulledWeeds);
  const safeMaxCombo = clampInt(params.stats.maxCombo);
  const safeMistakes = clampInt(params.stats.mistakes);

  const localRecord: RankingRecord = {
    id: entryId,
    playerName: cleanName,
    score: safeScore,
    pulledWeeds: safePulled,
    maxCombo: safeMaxCombo,
    mistakes: safeMistakes,
    durationSeconds: RANKING_DURATION_SECONDS,
    portraitId: params.portraitId,
    createdAtMs: Date.now(),
  };

  const payload: Record<string, unknown> = {
    playerName: cleanName,
    score: safeScore,
    pulledWeeds: safePulled,
    maxCombo: safeMaxCombo,
    mistakes: safeMistakes,
    durationSeconds: RANKING_DURATION_SECONDS,
    portraitId: params.portraitId,
    createdAt: serverTimestamp(),
  };

  if (auth.currentUser?.uid) {
    payload.uid = auth.currentUser.uid;
  }

  try {
    await setDoc(doc(db, RANKINGS_COLLECTION, entryId), payload);
    writeLocalCache([localRecord, ...readLocalCache()]);
    return localRecord;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.CREATE, `${RANKINGS_COLLECTION}/${entryId}`);
    }
    writeLocalCache([localRecord, ...readLocalCache()]);
    return localRecord;
  }
}
