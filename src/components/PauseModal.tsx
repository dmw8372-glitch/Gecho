import React from 'react';
import { Home, Play, RotateCcw } from 'lucide-react';
import { GameMode } from '../game/rules';

interface PauseModalProps {
  mode: GameMode;
  playerName?: string;
  score: number;
  remainingSeconds: number;
  onResume: () => void;
  onRestart: () => void;
  onGoHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  mode,
  playerName,
  score,
  remainingSeconds,
  onResume,
  onRestart,
  onGoHome,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#283324]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
    >
      <div className="w-full max-w-[360px] rounded-[26px] border-[3px] border-[#342f2a] bg-[#fbf9f1] p-5 text-center shadow-xl sm:p-6">
        <div className="inline-block rounded-full border-2 border-[#342f2a] bg-[#b4dc9c] px-3 py-0.5 text-sm font-bold text-[#342f2a]">
          {mode === 'ranking' ? `30초 랭킹전 · ${playerName || '도전자'}` : '15초 자격증 시험'}
        </div>

        <h2 id="pause-modal-title" className="font-display mt-2 text-3xl text-[#342f2a]">
          잠깐 쉬어가기
        </h2>

        <div className="mt-3 flex items-center justify-center gap-4 text-xl font-bold text-[#342f2a]">
          <span className="tabular-nums">잡초 {score}개</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">남은 시간 {Math.ceil(remainingSeconds)}초</span>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="game-btn font-hand flex items-center justify-center gap-2 rounded-2xl bg-[#fdd64c] px-5 py-2.5 text-2xl font-bold text-[#342f2a] sm:py-3"
          >
            <Play className="h-5 w-5" strokeWidth={2.5} />
            <span>계속하기</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="game-btn font-hand flex items-center justify-center gap-2 rounded-2xl bg-[#b4dc9c] px-5 py-2.5 text-xl font-bold text-[#342f2a]"
          >
            <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
            <span>다시 도전</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="game-btn font-hand flex items-center justify-center gap-2 rounded-2xl bg-[#fbf9f1] px-5 py-2.5 text-xl font-bold text-[#342f2a]"
          >
            <Home className="h-5 w-5" strokeWidth={2.5} />
            <span>처음으로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
