import React from 'react';

interface LoadingScreenProps {
  progress: number; // 0..100
  fadingOut: boolean;
}

function getLoadingMessage(progress: number): string {
  if (progress >= 98) return '시험장 입장 준비 완료!';
  if (progress >= 65) return '잡초와 꽃을 심는 중...';
  if (progress >= 30) return '친구들 부르는 중...';
  return '풀밭을 준비하는 중...';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, fadingOut }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const statusText = getLoadingMessage(clamped);

  return (
    <div
      data-testid="loading-screen"
      role="status"
      aria-live="polite"
      aria-label={`게임 로딩 중 ${clamped}%`}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 select-none transition-[opacity,transform] duration-420 ease-out ${
        fadingOut ? 'pointer-events-none scale-[1.03] opacity-0' : 'scale-100 opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 44%, #f4f8ea 0%, #e4f0d8 54%, #d3e5c2 100%)',
      }}
    >
      {/* Cute hand-drawn animated meadow sprout emblem (pure SVG -> instant 0ms crisp render) */}
      <div className="relative flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
        {/* Soft glowing meadow circle */}
        <div
          aria-hidden="true"
          className="absolute inset-2 rounded-full border-[3px] border-[#342f2a] bg-[#fbf9f1] shadow-[0_6px_0_rgba(52,47,42,0.16)]"
        />

        {/* Twinkling 4-point sparkles */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="cert-sparkle absolute -top-1 right-2 h-6 w-6"
          style={{ animationDelay: '0s' }}
        >
          <path
            d="M12 0 C13 8.5 15.5 11 24 12 C15.5 13 13 15.5 12 24 C11 15.5 8.5 13 0 12 C8.5 11 11 8.5 12 0 Z"
            fill="#fdd64c"
            stroke="#342f2a"
            strokeWidth="1.6"
          />
        </svg>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="cert-sparkle absolute bottom-4 -left-1 h-5 w-5"
          style={{ animationDelay: '0.65s' }}
        >
          <path
            d="M12 0 C13 8.5 15.5 11 24 12 C15.5 13 13 15.5 12 24 C11 15.5 8.5 13 0 12 C8.5 11 11 8.5 12 0 Z"
            fill="#ffffff"
            stroke="#342f2a"
            strokeWidth="1.6"
          />
        </svg>

        {/* Bouncing hand-drawn weed tuft + dirt mound */}
        <svg viewBox="0 0 120 120" className="relative h-28 w-28 overflow-visible" aria-hidden="true">
          {/* Ground contact shadow */}
          <ellipse
            cx="60"
            cy="95"
            rx="28"
            ry="8"
            fill="#7a6850"
            className="loader-shadow"
          />
          {/* Small cream-earth mound */}
          <path
            d="M36 93 Q60 80 84 93 Q60 98 36 93 Z"
            fill="#d9c69e"
            stroke="#342f2a"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Bouncing grass sprout */}
          <g className="loader-sprout">
            {/* Left blade */}
            <path
              d="M57 88 C52 72, 39 58, 28 54 C38 64, 43 76, 48 88 Z"
              fill="#8fd15c"
              stroke="#342f2a"
              strokeWidth="3.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Right blade */}
            <path
              d="M63 88 C68 72, 81 58, 92 54 C82 64, 77 76, 72 88 Z"
              fill="#7cc44c"
              stroke="#342f2a"
              strokeWidth="3.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Center tall curved blade */}
            <g className="loader-leaf">
              <path
                d="M56 88 C54 66, 56 44, 64 28 C68 45, 67 66, 65 88 Z"
                fill="#a3df6e"
                stroke="#342f2a"
                strokeWidth="3.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
            {/* Cute little inner blades */}
            <path
              d="M52 88 C47 76, 43 68, 39 65 C44 74, 47 81, 50 88 Z"
              fill="#b8eb86"
              stroke="#342f2a"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <path
              d="M68 88 C73 76, 77 68, 81 65 C76 74, 73 81, 70 88 Z"
              fill="#97d863"
              stroke="#342f2a"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Title */}
      <h2 className="font-display mt-5 text-2xl tracking-wide text-[#342f2a] sm:text-3xl">
        <span className="text-[#53a854]">제초</span> 자격증 시험
      </h2>

      {/* Hand-drawn meadow progress bar */}
      <div className="mt-4 w-full max-w-[260px] sm:max-w-[300px]">
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
  );
};
