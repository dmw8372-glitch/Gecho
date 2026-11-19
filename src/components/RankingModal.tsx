import React, { useEffect, useState } from 'react';
import { Award, Flame, RefreshCw, Trophy, X } from 'lucide-react';
import { fetchTopRankings } from '../game/rankings';
import {
  CHARACTER_PORTRAITS,
  MAX_PLAYER_NAME_LENGTH,
  RANKING_DURATION_SECONDS,
  RankingRecord,
  sanitizePlayerName,
} from '../game/rules';

interface RankingModalProps {
  initialPlayerName: string;
  highlightEntryId?: string | null;
  onStartRanking: (playerName: string) => void;
  onClose: () => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  initialPlayerName,
  highlightEntryId,
  onStartRanking,
  onClose,
}) => {
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [nameError, setNameError] = useState('');
  const [records, setRecords] = useState<RankingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadRankings = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetchTopRankings(20);
      setRecords(res.records);
    } catch {
      setLoadError('랭킹표를 불러오는 중 문제가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [highlightEntryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizePlayerName(playerName);
    if (!cleaned) {
      setNameError('랭킹에 올릴 이름을 먼저 적어주세요!');
      return;
    }
    setNameError('');
    onStartRanking(cleaned);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#283324]/50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ranking-modal-title"
    >
      <div className="relative flex max-h-[88dvh] w-full max-w-[540px] flex-col rounded-[26px] border-[3px] border-[#342f2a] bg-[#83bc7b] p-2.5 shadow-xl sm:p-3.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="랭킹표 닫기"
          className="game-btn absolute -top-3.5 -right-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#fdd64c] text-[#342f2a] sm:-top-4 sm:-right-3 sm:h-11 sm:w-11"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border-[2.5px] border-[#342f2a] bg-[#fbf9f1] p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#342f2a] bg-[#fdd64c]">
                <Trophy className="h-5 w-5 text-[#342f2a]" strokeWidth={2.4} />
              </div>
              <div>
                <h2 id="ranking-modal-title" className="font-display text-2xl leading-none text-[#342f2a] sm:text-3xl">
                  30초 제초 랭킹표
                </h2>
                <p className="mt-0.5 text-sm font-bold text-[#625b52]">
                  {RANKING_DURATION_SECONDS}초 안에 가장 많은 잡초를 뽑아보세요!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadRankings}
              disabled={loading}
              aria-label="랭킹 새로고침"
              className="game-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#342f2a]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            </button>
          </div>

          {/* Name Entry + Start 30s Challenge Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-3.5 rounded-2xl border-[2.5px] border-[#342f2a] bg-[#f1f6e8] p-3"
          >
            <label
              htmlFor="ranking-player-name"
              className="font-hand block text-base font-bold text-[#342f2a] sm:text-lg"
            >
              내 이름 적고 {RANKING_DURATION_SECONDS}초 도전 시작!
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                id="ranking-player-name"
                type="text"
                value={playerName}
                maxLength={MAX_PLAYER_NAME_LENGTH}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="이름 입력 (예: 치이카와)"
                className="font-hand min-w-0 flex-1 rounded-xl border-[2.5px] border-[#342f2a] bg-white px-3.5 py-2 text-lg font-bold text-[#342f2a] placeholder:text-[#a69f92] focus:ring-2 focus:ring-[#58a855] focus:outline-none"
              />
              <button
                type="submit"
                data-testid="ranking-start-btn"
                className="game-btn font-display shrink-0 rounded-full bg-[#ffe066] px-5 py-2 text-lg text-[#3c332c] whitespace-nowrap sm:text-xl"
              >
                30초 도전 시작 →
              </button>
            </div>
            {nameError && (
              <p className="mt-1.5 text-sm font-bold text-[#c94141]" role="alert">
                {nameError}
              </p>
            )}
          </form>

          {/* Ranking List */}
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-lg font-bold text-[#625b52]">
                순위 불러오는 중...
              </div>
            ) : loadError ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-base font-bold text-[#c94141]">
                <span>{loadError}</span>
              </div>
            ) : records.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#c9c3b2] bg-white/60 p-4 text-center">
                <Award className="h-8 w-8 text-[#83bc7b]" />
                <p className="text-lg font-bold text-[#342f2a]">아직 등록된 기록이 없어요!</p>
                <p className="text-sm font-bold text-[#625b52]">
                  위에 이름을 적고 첫 번째 1등에 도전해보세요.
                </p>
              </div>
            ) : (
              <ol className="flex flex-col gap-2" aria-label="30초 제초 랭킹 목록">
                {records.map((entry, idx) => {
                  const rank = idx + 1;
                  const isHighlighted = highlightEntryId === entry.id;
                  const charPortrait =
                    entry.portraitId !== 'camera'
                      ? CHARACTER_PORTRAITS[entry.portraitId]?.sprite
                      : null;

                  const badgeBg =
                    rank === 1
                      ? 'bg-[#fdd64c]'
                      : rank === 2
                        ? 'bg-[#e3e8ee]'
                        : rank === 3
                          ? 'bg-[#e4b98a]'
                          : 'bg-[#f4f1e6]';

                  return (
                    <li
                      key={entry.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border-[2px] border-[#342f2a] px-3 py-2 ${
                        isHighlighted ? 'bg-[#fff6cc] ring-2 ring-[#f5c542]' : 'bg-white'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`font-display tabular-nums flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#342f2a] text-base font-bold ${badgeBg}`}
                        >
                          {rank}
                        </span>

                        {charPortrait ? (
                          <img
                            src={charPortrait}
                            alt=""
                            aria-hidden="true"
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 shrink-0 object-contain"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#342f2a] bg-[#b4dc9c] text-xs font-bold">
                            나
                          </span>
                        )}

                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold text-[#342f2a]">
                            {entry.playerName}
                            {isHighlighted && (
                              <span className="ml-1.5 rounded-full bg-[#83bc7b] px-2 py-0.5 text-xs text-white">
                                내 기록
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#6b6359]">
                            <span className="inline-flex items-center gap-0.5">
                              <Flame className="h-3 w-3 text-[#ff7b3b]" />
                              최대 x{entry.maxCombo}
                            </span>
                            <span>·</span>
                            <span>실수 {entry.mistakes}</span>
                          </div>
                        </div>
                      </div>

                      <div className="font-display tabular-nums shrink-0 text-xl font-bold text-[#3d8b3b]">
                        {entry.score}점
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
