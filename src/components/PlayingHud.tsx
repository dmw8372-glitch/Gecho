import React from 'react';
import { Pause } from 'lucide-react';
import { WeedingGrade, getTimerDisplay } from '../game/rules';

export interface FloatingFeedback {
  id: number;
  text: string;
  subText?: string;
  isPositive: boolean;
  x: number;
  y: number;
}

interface PlayingHudProps {
  score: number;
  combo: number;
  grade: WeedingGrade;
  remainingSeconds: number;
  feedbacks: FloatingFeedback[];
  onPause: () => void;
}

export const PlayingHud: React.FC<PlayingHudProps> = ({
  score,
  combo,
  grade,
  remainingSeconds,
  feedbacks,
  onPause,
}) => {
  const { displaySeconds, progress } = getTimerDisplay(remainingSeconds);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const isUrgent = displaySeconds <= 4 && displaySeconds > 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top HUD Bar matching IMG_1423–1425 */}
      <div className="flex items-start justify-between">
        {/* Top-left: Weed count + tilted Grade tag */}
        <div className="flex items-center gap-2.5">
          <div
            className="game-pill flex items-center gap-2.5 rounded-full px-4 py-1.5"
            aria-label={`뽑은 잡초 ${score}개`}
          >
            <img
              src="/assets/sprites/weed_long_lg.png"
              alt="잡초"
              referrerPolicy="no-referrer"
              className="h-7 w-auto object-contain"
            />
            <span
              data-testid="hud-score"
              className="font-hand tabular-nums text-2xl font-bold text-[#342f2a]"
            >
              {score}
            </span>
          </div>

          <div
            data-testid="hud-grade"
            className="game-pill font-hand rounded-xl px-3 py-1 text-lg font-bold text-[#342f2a]"
            style={{ transform: 'rotate(-4deg)' }}
          >
            {grade}급
          </div>

          {combo >= 2 && (
            <div className="font-display rounded-full border-2 border-[#342f2a] bg-[#fdd64c] px-2.5 py-0.5 text-sm font-bold text-[#342f2a]">
              x{combo}
            </div>
          )}
        </div>

        {/* Top-center: Circular countdown timer matching IMG_1423–1425 */}
        <div
          className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-[2.5px] border-[#342f2a] bg-[#fbf9f1] shadow-sm"
          aria-label={`남은 시간 ${displaySeconds}초`}
        >
          <svg className="h-[60px] w-[60px] -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#e5e0cf"
              strokeWidth="5.5"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={isUrgent ? '#e25b5b' : '#58a855'}
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 80ms linear, stroke 200ms ease' }}
            />
          </svg>
          <span
            data-testid="hud-timer"
            className={`font-hand tabular-nums absolute text-2xl font-bold ${
              isUrgent ? 'text-[#c94141]' : 'text-[#342f2a]'
            }`}
          >
            {displaySeconds}
          </span>
        </div>

        {/* Top-right: Pause button */}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          tabIndex={-1}
          aria-label="일시정지"
          className="game-btn pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fbf9f1] text-[#342f2a]"
        >
          <Pause className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </div>

      {/* World-projected floating +1 / -1 popups */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {feedbacks.map((fb) => (
          <div
            key={fb.id}
            className="float-pop-up absolute flex flex-col items-center"
            style={{ left: fb.x, top: fb.y }}
          >
            <span
              className={`font-display text-2xl font-bold ${
                fb.isPositive ? 'text-[#4ca649]' : 'text-[#e05263]'
              }`}
              style={{
                WebkitTextStroke: '3px #fbf9f1',
                paintOrder: 'stroke fill',
              }}
            >
              {fb.text}
            </span>
            {fb.subText && (
              <span
                className="font-hand text-base font-bold text-[#342f2a]"
                style={{
                  WebkitTextStroke: '2.5px #fbf9f1',
                  paintOrder: 'stroke fill',
                }}
              >
                {fb.subText}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
