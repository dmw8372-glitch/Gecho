import React, { useState } from 'react';
import { CHARACTER_PORTRAITS } from '../game/rules';

interface LoadingScreenProps {
  progress: number; // 0..100
  fadingOut: boolean;
}

interface TrioMember {
  id: 'usagi' | 'chiikawa' | 'hachiware';
  name: string;
  src: string;
  delay: string;
  sizeClass: string;
  offsetClass: string;
  shadowWidthClass: string;
}

const LOADING_TRIO: TrioMember[] = [
  {
    id: 'usagi',
    name: CHARACTER_PORTRAITS.usagi.name,
    src: CHARACTER_PORTRAITS.usagi.sprite,
    delay: '0s',
    sizeClass: 'h-24 w-auto sm:h-28',
    offsetClass: 'mb-1',
    shadowWidthClass: 'w-14 sm:w-16',
  },
  {
    id: 'chiikawa',
    name: CHARACTER_PORTRAITS.chiikawa.name,
    src: CHARACTER_PORTRAITS.chiikawa.sprite,
    delay: '0.2s',
    sizeClass: 'h-[108px] w-auto sm:h-[126px]',
    offsetClass: 'z-10',
    shadowWidthClass: 'w-16 sm:w-20',
  },
  {
    id: 'hachiware',
    name: CHARACTER_PORTRAITS.hachiware.name,
    src: CHARACTER_PORTRAITS.hachiware.sprite,
    delay: '0.4s',
    sizeClass: 'h-24 w-auto sm:h-28',
    offsetClass: 'mb-1',
    shadowWidthClass: 'w-14 sm:w-16',
  },
];

function getLoadingMessage(progress: number): string {
  if (progress >= 98) return '시험장 입장 준비 완료!';
  if (progress >= 65) return '잡초랑 예쁜 꽃을 심는 중...';
  if (progress >= 25) return '치이카와 친구들이 모여드는 중...';
  return '풀밭을 준비하는 중...';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, fadingOut }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const statusText = getLoadingMessage(clamped);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

  return (
    <div
      data-testid="loading-screen"
      role="status"
      aria-live="polite"
      aria-label={`게임 로딩 중 ${clamped}%`}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 select-none transition-[opacity,transform] duration-[420ms] ease-out ${
        fadingOut ? 'pointer-events-none scale-[1.03] opacity-0' : 'scale-100 opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 40%, #fffdf5 0%, #eef6e3 48%, #d6e9c4 100%)',
      }}
    >
      {/* Soft rolling storybook pastel meadow hills at the bottom */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[26vh] min-h-[120px] max-h-[220px] w-full"
      >
        <path
          d="M0 110 Q320 20 720 96 T1440 84 L1440 260 L0 260 Z"
          fill="#c6e2a7"
          opacity="0.72"
        />
        <path
          d="M0 154 Q420 76 860 148 T1440 124 L1440 260 L0 260 Z"
          fill="#b4d88c"
          opacity="0.88"
        />
      </svg>

      {/* Main focal stage */}
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        {/* Cute bouncing Chiikawa trio on a sunny cream meadow patch */}
        <div className="relative flex w-full flex-col items-center pt-4">
          {/* Warm cream sunlit halo behind the trio */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-44 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fffaf0]/85 blur-xl sm:h-48 sm:w-80"
          />

          {/* Floating hand-drawn sparkles & music note */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="cert-sparkle pointer-events-none absolute top-0 left-7 h-5 w-5 sm:left-9 sm:h-6 sm:w-6"
            style={{ animationDelay: '0.1s' }}
          >
            <path
              d="M12 0 C13 8.5 15.5 11 24 12 C15.5 13 13 15.5 12 24 C11 15.5 8.5 13 0 12 C8.5 11 11 8.5 12 0 Z"
              fill="#fdd64c"
              stroke="#342f2a"
              strokeWidth="1.7"
            />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="cert-sparkle pointer-events-none absolute top-6 right-5 h-4 w-4 sm:right-7 sm:h-5 sm:w-5"
            style={{ animationDelay: '0.8s' }}
          >
            <path
              d="M12 0 C13 8.5 15.5 11 24 12 C15.5 13 13 15.5 12 24 C11 15.5 8.5 13 0 12 C8.5 11 11 8.5 12 0 Z"
              fill="#ffffff"
              stroke="#342f2a"
              strokeWidth="1.7"
            />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 28 28"
            className="loader-note pointer-events-none absolute -top-2 right-12 h-6 w-6 sm:right-16 sm:h-7 sm:w-7"
          >
            <path
              d="M11 20.5a3.5 3.5 0 1 1-2.5-3.35V7.5l11-2.3v11.3a3.5 3.5 0 1 1-2.5-3.35V9.1l-6 1.25v10.15z"
              fill="#ff9eb8"
              stroke="#342f2a"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
          </svg>

          {/* Character trio row */}
          <div className="relative flex items-end justify-center gap-2 sm:gap-4">
            {LOADING_TRIO.map((member) => (
              <div
                key={member.id}
                className={`relative flex flex-col items-center ${member.offsetClass}`}
              >
                <div
                  className="loader-char-hop relative flex items-end justify-center"
                  style={{ animationDelay: member.delay }}
                >
                  {!failedIds[member.id] ? (
                    <img
                      src={member.src}
                      alt={`${member.name} 캐릭터`}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      decoding="async"
                      fetchPriority="high"
                      onError={() =>
                        setFailedIds((prev) => ({ ...prev, [member.id]: true }))
                      }
                      className={`${member.sizeClass} object-contain drop-shadow-[0_4px_4px_rgba(52,47,42,0.14)]`}
                    />
                  ) : (
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full border-[2.5px] border-[#342f2a] bg-[#fbf9f1] text-sm font-bold text-[#342f2a]"
                    >
                      {member.name}
                    </div>
                  )}
                </div>

                {/* Soft squashing contact shadow */}
                <div
                  aria-hidden="true"
                  className={`loader-shadow -mt-1.5 h-2.5 rounded-full bg-[#6f8354]/45 ${member.shadowWidthClass}`}
                  style={{ animationDelay: member.delay }}
                />
              </div>
            ))}
          </div>

          {/* Hand-drawn grass patch base under their feet */}
          <div className="relative -mt-2.5 flex items-center justify-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 280 34"
              className="h-7 w-[240px] sm:h-8 sm:w-[290px]"
            >
              <ellipse
                cx="140"
                cy="20"
                rx="126"
                ry="11"
                fill="#e7dfb9"
                stroke="#342f2a"
                strokeWidth="2.4"
              />
              {/* Tiny left & right decorative grass sprouts */}
              <path
                d="M28 20 C24 12 18 9 14 8 M28 20 C29 12 31 7 35 6"
                fill="none"
                stroke="#53a854"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M250 19 C252 11 258 8 263 7 M250 19 C247 11 244 7 240 7"
                fill="none"
                stroke="#53a854"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Title lockup matching TitleOverlay */}
        <h2 className="font-display mt-4 flex items-center justify-center gap-x-2 text-2xl tracking-wide sm:text-3xl">
          <span className="relative inline-block px-1">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0.5 h-3 rounded-full bg-[#f5c542] opacity-90"
              style={{ transform: 'rotate(-1.5deg)' }}
            />
            <span
              className="relative text-[#53a854]"
              style={{
                WebkitTextStroke: '2.4px #fbf9f1',
                paintOrder: 'stroke fill',
              }}
            >
              제초
            </span>
          </span>
          <span
            className="text-[#3e3a34]"
            style={{
              WebkitTextStroke: '2.4px #fbf9f1',
              paintOrder: 'stroke fill',
            }}
          >
            자격증 시험
          </span>
        </h2>

        {/* Hand-drawn meadow progress bar */}
        <div className="mt-4 w-full max-w-[268px] sm:max-w-[310px]">
          <div className="relative h-5 w-full overflow-hidden rounded-full border-[2.5px] border-[#342f2a] bg-[#fbf9f1] p-[2px] shadow-[0_3px_0_rgba(52,47,42,0.16)]">
            <div
              className="relative h-full overflow-hidden rounded-full transition-[width] duration-200 ease-out"
              style={{
                width: `${Math.max(8, clamped)}%`,
                background: 'linear-gradient(90deg, #86cb60 0%, #b4dc9c 55%, #fdd64c 100%)',
              }}
            >
              <div
                aria-hidden="true"
                className="loader-bar-sheen absolute inset-y-0 w-10 bg-white/55"
              />
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between px-1 text-sm font-bold text-[#524c43] sm:text-base">
            <span className="font-hand">{statusText}</span>
            <span className="font-hand tabular-nums text-[#478742]">{clamped}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
