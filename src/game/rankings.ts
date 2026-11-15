import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from '../firebase';
import {
  ExamStats,
  PortraitChoice,
  RANKING_DURATION_SECONDS,
  RankingRecord,
  deduplicateBestRankings,
  isBetterRankingResult,
  sanitizePlayerName,
  toPlayerRankingDocId,
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
    window.localStorage.setItem(
      LOCAL_CACHE_KEY,
      JSON.stringify(deduplicateBestRankings(records).slice(0, 30)),
    );
  } catch {
    // Ignore storage quota errors
  }
}

function docToRankingRecord(id: string, data: Record<string, unknown>): RankingRecord {
  const ts = data.createdAt as { toMillis?: () => number } | undefined;
  const createdAtMs =
    ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now();
  return {
    id,
    playerName: String(data.playerName || '이름없음'),
    score: Number(data.score ?? 0),
    pulledWeeds: Number(data.pulledWeeds ?? 0),
    maxCombo: Number(data.maxCombo ?? 0),
    mistakes: Number(data.mistakes ?? 0),
    durationSeconds: Number(data.durationSeconds ?? RANKING_DURATION_SECONDS),
    portraitId: (data.portraitId as PortraitChoice) || 'chiikawa',
    createdAtMs,
  };
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
      limit(Math.min(80, Math.max(25, maxResults + 30))),
    );
    const snap = await getDocs(q);
    const loaded: RankingRecord[] = snap.docs
      .map((d) => docToRankingRecord(d.id, d.data() as Record<string, unknown>))
      .filter((r) => r.durationSeconds === RANKING_DURATION_SECONDS);

    const bestUnique = deduplicateBestRankings(loaded).slice(0, maxResults);
    writeLocalCache(bestUnique);
    return { records: bestUnique, source: 'firestore' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.LIST, RANKINGS_COLLECTION);
    }
    return {
      records: deduplicateBestRankings(readLocalCache()).slice(0, maxResults),
      source: 'local',
    };
  }
}

export async function submitRankingEntry(params: {
  playerName: string;
  stats: ExamStats;
  portraitId: PortraitChoice;
}): Promise<RankingRecord> {
  const cleanName = sanitizePlayerName(params.playerName) || '도전자';
  const clampInt = (n: number) => Math.max(0, Math.min(300, Math.round(n)));

  const entryId = toPlayerRankingDocId(cleanName);
  const safeScore = clampInt(params.stats.score);
  const safePulled = clampInt(params.stats.pulledWeeds);
  const safeMaxCombo = clampInt(params.stats.maxCombo);
  const safeMistakes = clampInt(params.stats.mistakes);

  const candidateRecord: RankingRecord = {
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

  const docPath = `${RANKINGS_COLLECTION}/${entryId}`;
  const docRef = doc(db, RANKINGS_COLLECTION, entryId);

  let existingSnap;
  try {
    existingSnap = await getDoc(docRef);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
    const merged = deduplicateBestRankings([candidateRecord, ...readLocalCache()]);
    writeLocalCache(merged);
    return merged.find((r) => r.playerName === cleanName) || candidateRecord;
  }

  if (existingSnap.exists()) {
    const existingRecord = docToRankingRecord(
      existingSnap.id,
      existingSnap.data() as Record<string, unknown>,
    );
    if (!isBetterRankingResult(candidateRecord, existingRecord)) {
      const merged = deduplicateBestRankings([existingRecord, ...readLocalCache()]);
      writeLocalCache(merged);
      return existingRecord;
    }

    const updatePayload: Record<string, unknown> = {
      score: safeScore,
      pulledWeeds: safePulled,
      maxCombo: safeMaxCombo,
      mistakes: safeMistakes,
      portraitId: params.portraitId,
      createdAt: serverTimestamp(),
    };
    if (auth.currentUser?.uid) {
      updatePayload.uid = auth.currentUser.uid;
    }

    try {
      await updateDoc(docRef, updatePayload);
      const merged = deduplicateBestRankings([candidateRecord, ...readLocalCache()]);
      writeLocalCache(merged);
      return candidateRecord;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
      const merged = deduplicateBestRankings([candidateRecord, ...readLocalCache()]);
      writeLocalCache(merged);
      return candidateRecord;
    }
  }

  // Creating new document for this playerName
  const createPayload: Record<string, unknown> = {
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
    createPayload.uid = auth.currentUser.uid;
  }

  try {
    await setDoc(docRef, createPayload);
    const merged = deduplicateBestRankings([candidateRecord, ...readLocalCache()]);
    writeLocalCache(merged);
    return candidateRecord;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
    const merged = deduplicateBestRankings([candidateRecord, ...readLocalCache()]);
    writeLocalCache(merged);
    return candidateRecord;
  }
}
