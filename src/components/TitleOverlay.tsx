import React from 'react';
import { BookOpen, Trophy } from 'lucide-react';
import { SoundButton } from './SoundButton';

interface TitleOverlayProps {
  muted: boolean;
  onToggleMute: () => void;
  onOpenStudy: () => void;
  onOpenRanking: () => void;
  onStartExam: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  muted,
  onToggleMute,
  onOpenStudy,
  onOpenRanking,
  onStartExam,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
      {/* Top bar: only top-right sound button (matching IMG_1421) */}
      <div className="flex items-start justify-end">
        <SoundButton muted={muted} onToggle={onToggleMute} />
      </div>

      {/* Upper-center title lockup matching IMG_1421 */}
      <div className="mb-auto mt-2 flex flex-col items-center sm:mt-5">
        <h1 className="font-display relative flex flex-wrap items-center justify-center gap-x-3 text-center text-[clamp(2.25rem,7.5vw,4.5rem)] leading-tight tracking-wide select-none sm:gap-x-4">
          <span className="relative inline-block px-1.5 sm:px-2">
            {/* Golden yellow oval highlight behind "제초" */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1 h-4 rounded-full bg-[#f5c542] opacity-90 sm:bottom-2 sm:h-6"
              style={{ transform: 'rotate(-1.5deg)' }}
            />
            <span
              className="relative text-[#53a854]"
              style={{
                WebkitTextStroke: '3px #fbf9f1',
                paintOrder: 'stroke fill',
                textShadow: '0 3px 0 rgba(52, 47, 42, 0.25)',
              }}
            >
              제초
            </span>
          </span>
          <span
            className="text-[#3e3a34]"
            style={{
              WebkitTextStroke: '3px #fbf9f1',
              paintOrder: 'stroke fill',
              textShadow: '0 3px 0 rgba(52, 47, 42, 0.2)',
            }}
          >
            자격증 시험
          </span>
        </h1>
      </div>

      {/* Bottom CTA row: 제초 공부 + 랭킹표 + 시험 보러 가기 → */}
      <div className="pointer-events-auto mb-2 flex flex-wrap items-center justify-center gap-2.5 sm:mb-6 sm:gap-4">
        <button
          type="button"
          onClick={onOpenStudy}
          className="game-btn font-hand flex items-center gap-1.5 rounded-2xl bg-[#b4dc9c] px-4 py-2.5 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:gap-2.5 sm:px-6 sm:py-3 sm:text-2xl"
        >
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
          <span>제초 공부</span>
        </button>

        <button
          type="button"
          onClick={onOpenRanking}
          className="game-btn font-hand flex items-center gap-1.5 rounded-2xl bg-[#fbf9f1] px-4 py-2.5 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:gap-2 sm:px-5 sm:py-3 sm:text-2xl"
        >
          <Trophy className="h-4 w-4 text-[#e09f1f] sm:h-5 sm:w-5" strokeWidth={2.5} />
          <span>랭킹표</span>
        </button>

        <button
          type="button"
          data-start="true"
          onClick={onStartExam}
          className="game-btn font-hand flex items-center gap-1.5 rounded-2xl bg-[#fdd64c] px-5 py-2.5 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:gap-2.5 sm:px-7 sm:py-3 sm:text-2xl"
        >
          <span>시험 보러 가기</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};
