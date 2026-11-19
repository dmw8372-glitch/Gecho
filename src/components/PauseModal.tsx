import React from 'react';
import { Home, Play, RotateCcw } from 'lucide-react';
import { CHARACTER_PORTRAITS, GameMode } from '../game/rules';

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
      <div className="relative mt-6 w-full max-w-[360px] rounded-[32px] border-[3px] border-[#3c332c] bg-[#fffdf6] px-6 pt-12 pb-6 text-center shadow-[0_12px_30px_rgba(40,51,36,0.22)]">
        {/* Cute peeking Chiikawa perched atop the pause card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2"
        >
          <img
            src={CHARACTER_PORTRAITS.chiikawa.sprite}
            alt=""
            referrerPolicy="no-referrer"
            className="h-20 w-auto object-contain drop-shadow-[0_3px_2px_rgba(60,51,44,0.18)]"
          />
        </div>

        <p className="font-hand text-sm font-bold text-[#6e6459]">
          {mode === 'ranking' ? `30초 랭킹전 · ${playerName || '도전자'}` : '15초 자격증 시험'}
        </p>

        <h2 id="pause-modal-title" className="font-display mt-0.5 text-3xl text-[#3c332c]">
          잠깐 쉬어가기
        </h2>

        <div className="mt-2.5 flex items-center justify-center gap-3 text-lg font-bold text-[#524a42]">
          <span className="tabular-nums">잡초 {score}개</span>
          <span aria-hidden="true" className="text-[#c5baa8]">·</span>
          <span className="tabular-nums">남은 시간 {Math.ceil(remainingSeconds)}초</span>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="chiikawa-hero-btn font-display flex items-center justify-center gap-2 rounded-full bg-[#ffe066] px-6 py-3 text-2xl text-[#3c332c]"
          >
            <Play className="h-5 w-5 fill-current" strokeWidth={2.5} />
            <span>계속하기</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="game-btn font-hand flex items-center justify-center gap-1.5 rounded-full bg-[#c9ebb2] px-4 py-2.5 text-lg font-bold text-[#3c332c] whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
              <span>다시 도전</span>
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="game-btn font-hand flex items-center justify-center gap-1.5 rounded-full bg-[#ffeef3] px-4 py-2.5 text-lg font-bold text-[#3c332c] whitespace-nowrap"
            >
              <Home className="h-4 w-4" strokeWidth={2.5} />
              <span>처음으로</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
