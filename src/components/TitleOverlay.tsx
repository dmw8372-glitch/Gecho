import React from 'react';
import { BookOpen, Trophy } from 'lucide-react';
import type { LegalTab } from './LegalModal';
import { SoundButton } from './SoundButton';

interface TitleOverlayProps {
  muted: boolean;
  onToggleMute: () => void;
  onOpenStudy: () => void;
  onOpenRanking: () => void;
  onStartExam: () => void;
  onOpenLegal: (tab: LegalTab) => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  muted,
  onToggleMute,
  onOpenStudy,
  onOpenRanking,
  onStartExam,
  onOpenLegal,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between px-3.5 pt-[max(0.85rem,env(safe-area-inset-top))] pb-[max(0.65rem,env(safe-area-inset-bottom))] sm:px-7 sm:pt-6 sm:pb-4">
      {/* Top bar: clean top-right puffy sound button */}
      <div className="flex items-start justify-end">
        <SoundButton muted={muted} onToggle={onToggleMute} />
      </div>

      {/* Upper-center storybook anime title card */}
      <div className="mb-auto mt-2 flex flex-col items-center sm:mt-4">
        <div className="relative inline-flex items-center justify-center px-6 sm:px-9">
          {/* Twinkling anime title sparkles */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="cert-sparkle pointer-events-none absolute -top-1 left-0 h-5 w-5 sm:h-6 sm:w-6"
            style={{ animationDelay: '0s' }}
          >
            <path
              d="M12 0 C13 8.5 15.5 11 24 12 C15.5 13 13 15.5 12 24 C11 15.5 8.5 13 0 12 C8.5 11 11 8.5 12 0 Z"
              fill="#ffe066"
              stroke="#3c332c"
              strokeWidth="1.7"
            />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="cert-sparkle pointer-events-none absolute right-0 bottom-1 h-4 w-4 sm:h-5 sm:w-5"
            style={{ animationDelay: '0.7s' }}
          >
            <path
              d="M12 0 C13 8.5 15.5 11 24 12 C15.5 13 13 15.5 12 24 C11 15.5 8.5 13 0 12 C8.5 11 11 8.5 12 0 Z"
              fill="#ffb6cb"
              stroke="#3c332c"
              strokeWidth="1.7"
            />
          </svg>

          <h1 className="font-display relative flex flex-wrap items-center justify-center gap-x-3 text-center text-[clamp(2.2rem,7.4vw,4.45rem)] leading-tight tracking-wide select-none sm:gap-x-4">
            <span className="relative inline-block px-1.5 sm:px-2">
              {/* Golden butter highlight behind "제초" */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1 h-4 rounded-full bg-[#ffe066] opacity-95 sm:bottom-2 sm:h-6"
                style={{ transform: 'rotate(-2deg)' }}
              />
              <span
                className="relative text-[#53a854]"
                style={{
                  WebkitTextStroke: '3.5px #fffdf6',
                  paintOrder: 'stroke fill',
                  textShadow: '0 4px 0 rgba(60, 51, 44, 0.22)',
                }}
              >
                제초
              </span>
            </span>
            <span
              className="text-[#3c332c]"
              style={{
                WebkitTextStroke: '3.5px #fffdf6',
                paintOrder: 'stroke fill',
                textShadow: '0 4px 0 rgba(60, 51, 44, 0.18)',
              }}
            >
              자격증 시험
            </span>
          </h1>
        </div>
      </div>

      {/* Bottom grouped Chiikawa anime action cluster + subtle legal micro-footer */}
      <div className="flex flex-col items-center">
        <div className="pointer-events-auto mb-3 flex flex-col items-center gap-2.5 sm:mb-4 sm:flex-row sm:items-end sm:gap-3.5">
          {/* Primary Hero CTA (centered on desktop via order, top of bottom stack on mobile so bear ears stay open) */}
          <div className="relative order-1 sm:order-2">
            {/* Cute Chiikawa round bear ears peeking atop the hero button */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-3 left-7 h-6 w-6 rounded-full border-[3px] border-[#3c332c] bg-[#ffe066] sm:-top-3.5 sm:left-8 sm:h-7 sm:w-7"
            >
              <span className="absolute inset-1 rounded-full bg-[#ffbfd2]/90" />
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-3 right-7 h-6 w-6 rounded-full border-[3px] border-[#3c332c] bg-[#ffe066] sm:-top-3.5 sm:right-8 sm:h-7 sm:w-7"
            >
              <span className="absolute inset-1 rounded-full bg-[#ffbfd2]/90" />
            </span>

            <button
              type="button"
              data-start="true"
              onClick={onStartExam}
              className="chiikawa-hero-btn font-display relative flex items-center justify-center gap-2 rounded-full bg-[#ffe066] px-7 py-3 text-xl tracking-wide text-[#3c332c] whitespace-nowrap sm:gap-3 sm:px-9 sm:py-3.5 sm:text-2xl"
            >
              {/* Rosy Chiikawa cheek blushes on left & right inside pill */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 h-2.5 w-4 -translate-y-1/2 rounded-full bg-[#ff9eb8]/55 sm:left-4 sm:h-3 sm:w-4.5"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 h-2.5 w-4 -translate-y-1/2 rounded-full bg-[#ff9eb8]/55 sm:right-4 sm:h-3 sm:w-4.5"
              />

              {/* Tiny hand-drawn sprout icon */}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="relative h-5 w-5 shrink-0 sm:h-6 sm:w-6"
              >
                <path
                  d="M12 20 V11 C12 7 8.5 5 5 5.5 C5.2 9.5 8 12 12 12 C16 12 18.8 9.5 19 5.5 C15.5 5 12 7 12 11"
                  fill="#8fd15c"
                  stroke="#3c332c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="relative">시험 보러 가기</span>

              <span
                aria-hidden="true"
                className="chiikawa-arrow-nudge relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#3c332c] bg-[#fffdf6] text-sm leading-none sm:h-7 sm:w-7 sm:text-base"
              >
                →
              </span>
            </button>
          </div>

          {/* Secondary buttons: side-by-side below hero on mobile, flanking left & right on desktop */}
          <div className="order-2 flex items-center gap-2.5 sm:contents">
            <button
              type="button"
              onClick={onOpenStudy}
              className="game-btn font-hand flex items-center gap-1.5 rounded-full bg-[#c9ebb2] px-4 py-2 text-lg font-bold text-[#3c332c] whitespace-nowrap sm:order-1 sm:gap-2 sm:px-5 sm:py-3 sm:text-xl"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#3c332c] bg-[#fffdf6] sm:h-7 sm:w-7">
                <BookOpen className="h-3.5 w-3.5 text-[#4f9f4b] sm:h-4 sm:w-4" strokeWidth={2.6} />
              </span>
              <span>제초 공부</span>
            </button>

            <button
              type="button"
              onClick={onOpenRanking}
              className="game-btn font-hand flex items-center gap-1.5 rounded-full bg-[#d9eefb] px-4 py-2 text-lg font-bold text-[#3c332c] whitespace-nowrap sm:order-3 sm:gap-2 sm:px-5 sm:py-3 sm:text-xl"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#3c332c] bg-[#fffdf6] sm:h-7 sm:w-7">
                <Trophy className="h-3.5 w-3.5 text-[#e09a1e] sm:h-4 sm:w-4" strokeWidth={2.6} />
              </span>
              <span>랭킹표</span>
            </button>
          </div>
        </div>

        <footer
          aria-label="저작권 및 개인정보 고지"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center font-sans text-[10px] leading-tight text-[#52584d]/55 sm:text-[11px]"
        >
          <span>비영리 팬 게임 · 치이카와 AI 재창작 리소스 · 상업적 이용 금지</span>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            onClick={() => onOpenLegal('copyright')}
            className="cursor-pointer underline decoration-[#52584d]/35 underline-offset-2 transition-colors hover:text-[#342f2a]/85"
          >
            저작권 안내
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="cursor-pointer underline decoration-[#52584d]/35 underline-offset-2 transition-colors hover:text-[#342f2a]/85"
          >
            개인정보 처리방침
          </button>
        </footer>
      </div>
    </div>
  );
};
