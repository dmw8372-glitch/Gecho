import React from 'react';
import { BookOpen } from 'lucide-react';
import { SoundButton } from './SoundButton';

interface TitleOverlayProps {
  muted: boolean;
  onToggleMute: () => void;
  onOpenStudy: () => void;
  onStartExam: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  muted,
  onToggleMute,
  onOpenStudy,
  onStartExam,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-5 sm:p-7">
      {/* Top bar: only top-right sound button (matching IMG_1421) */}
      <div className="flex items-start justify-end">
        <SoundButton muted={muted} onToggle={onToggleMute} />
      </div>

      {/* Upper-center title lockup matching IMG_1421 */}
      <div className="mb-auto mt-3 flex flex-col items-center sm:mt-5">
        <h1 className="font-display relative flex flex-wrap items-center justify-center gap-x-4 text-center text-[clamp(2.6rem,6vw,4.5rem)] leading-tight tracking-wide select-none">
          <span className="relative inline-block px-2">
            {/* Golden yellow oval highlight behind "제초" */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1.5 h-5 rounded-full bg-[#f5c542] opacity-90 sm:bottom-2 sm:h-6"
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

      {/* Bottom CTA row matching IMG_1421 */}
      <div className="pointer-events-auto mb-3 flex flex-wrap items-center justify-center gap-4 sm:mb-6">
        <button
          type="button"
          onClick={onOpenStudy}
          className="game-btn font-hand flex items-center gap-2.5 rounded-2xl bg-[#b4dc9c] px-6 py-3 text-xl font-bold text-[#342f2a] whitespace-nowrap sm:text-2xl"
        >
          <BookOpen className="h-5 w-5" strokeWidth={2.5} />
          <span>제초 공부</span>
        </button>

        <button
          type="button"
          data-start="true"
          onClick={onStartExam}
          className="game-btn font-hand flex items-center gap-2.5 rounded-2xl bg-[#fdd64c] px-7 py-3 text-xl font-bold text-[#342f2a] whitespace-nowrap sm:text-2xl"
        >
          <span>시험 보러 가기</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};
