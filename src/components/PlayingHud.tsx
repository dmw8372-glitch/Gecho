import React from 'react';
import { Pause, Trophy } from 'lucide-react';
import { GameMode, WeedingGrade, getTimerDisplay } from '../game/rules';

export interface FloatingFeedback {
  id: number;
  text: string;
  subText?: string;
  isPositive: boolean;
  x: number;
  y: number;
}

interface PlayingHudProps {
  mode: GameMode;
  playerName?: string;
  durationSeconds: number;
  score: number;
  combo: number;
  grade: WeedingGrade;
  remainingSeconds: number;
  feedbacks: FloatingFeedback[];
  onPause: () => void;
}

export const PlayingHud: React.FC<PlayingHudProps> = React.memo(({
  mode,
  playerName,
  durationSeconds,
  score,
  combo,
  grade,
  remainingSeconds,
  feedbacks,
  onPause,
}) => {
  const { displaySeconds, progress } = getTimerDisplay(remainingSeconds, durationSeconds);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const isUrgent = displaySeconds <= 5 && displaySeconds > 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 sm:p-6">
      {/* Top HUD Bar matching IMG_1423–1425, compact on mobile */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        {/* Top-left: Weed count + Grade or Ranking player pill */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
          <div
            className="game-pill flex items-center gap-1.5 rounded-full px-3 py-1 sm:gap-2.5 sm:px-4 sm:py-1.5"
            aria-label={`뽑은 잡초 ${score}개`}
          >
            <img
              src="/assets/sprites/weed_long_lg.png"
              alt="잡초"
              referrerPolicy="no-referrer"
              className="h-5 w-auto object-contain sm:h-7"
            />
            <span
              data-testid="hud-score"
              className="font-hand tabular-nums text-xl font-bold text-[#342f2a] sm:text-2xl"
            >
              {score}
            </span>
          </div>

          {mode === 'ranking' ? (
            <div
              data-testid="hud-mode-badge"
              className="game-pill font-hand flex max-w-[130px] items-center gap-1 rounded-xl bg-[#fff4c2] px-2.5 py-0.5 text-sm font-bold text-[#342f2a] sm:max-w-[180px] sm:px-3 sm:py-1 sm:text-base"
            >
              <Trophy className="h-3.5 w-3.5 shrink-0 text-[#d99114]" strokeWidth={2.5} />
              <span className="truncate">{playerName || '랭킹전'}</span>
            </div>
          ) : (
            <div
              data-testid="hud-grade"
              className="game-pill font-hand rounded-xl px-2.5 py-0.5 text-base font-bold text-[#342f2a] sm:px-3 sm:py-1 sm:text-lg"
              style={{ transform: 'rotate(-4deg)' }}
            >
              {grade}급
            </div>
          )}

          {combo >= 2 && (
            <div className="font-display rounded-full border-2 border-[#342f2a] bg-[#fdd64c] px-2 py-0.5 text-xs font-bold text-[#342f2a] sm:px-2.5 sm:text-sm">
              x{combo}
            </div>
          )}
        </div>

        {/* Top-center: Circular countdown timer matching IMG_1423–1425 */}
        <div
          className="relative flex h-[56px] w-[56px] items-center justify-center rounded-full border-[2.5px] border-[#342f2a] bg-[#fbf9f1] shadow-sm sm:h-[68px] sm:w-[68px]"
          aria-label={`남은 시간 ${displaySeconds}초`}
        >
          <svg className="h-[48px] w-[48px] -rotate-90 sm:h-[60px] sm:w-[60px]" viewBox="0 0 64 64">
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
            className={`font-hand tabular-nums absolute text-xl font-bold sm:text-2xl ${
              isUrgent ? 'text-[#c94141]' : 'text-[#342f2a]'
            }`}
          >
            {displaySeconds}
          </span>
        </div>

        {/* Top-right: Pause button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            tabIndex={-1}
            aria-label="일시정지"
            className="game-btn pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#fbf9f1] text-[#342f2a] sm:h-11 sm:w-11"
          >
            <Pause className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.6} />
          </button>
        </div>
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
});
PlayingHud.displayName = 'PlayingHud';
