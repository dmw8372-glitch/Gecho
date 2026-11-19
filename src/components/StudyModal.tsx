import React from 'react';
import { X } from 'lucide-react';
import { STUDY_PROTECTED_ITEMS, STUDY_WEED_ITEMS } from '../game/rules';

interface StudyModalProps {
  onClose: () => void;
  onStartExam?: () => void;
  showStartCta?: boolean;
}

export const StudyModal: React.FC<StudyModalProps> = ({
  onClose,
  onStartExam,
  showStartCta = false,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#283324]/45 px-3 py-[max(0.75rem,env(safe-area-inset-top))] sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-modal-title"
    >
      <div className="relative flex w-full max-w-[780px] flex-col rounded-[28px] border-[3px] border-[#3c332c] bg-[#83bc7b] p-2 shadow-xl sm:p-3.5">
        {/* Top-right puffy yellow X close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="제초 공부 닫기"
          className="game-btn absolute -top-3.5 -right-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffe066] text-[#3c332c] sm:-top-4 sm:-right-3 sm:h-11 sm:w-11"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        {/* Open cream notebook pages sized to fit 100% on one screen without scrolling */}
        <div
          data-testid="study-notebook"
          className="grid grid-cols-1 overflow-hidden rounded-[20px] border-[2.5px] border-[#3c332c] bg-[#fffdf6] md:grid-cols-2"
        >
          {/* Left Page: 잡초 +1 */}
          <section className="flex flex-col border-b-[2px] border-[#e1dac9] px-3 py-2.5 md:border-r-[2.5px] md:border-b-0 sm:px-5 sm:py-4">
            <div className="mb-1.5 flex items-center justify-center gap-2 sm:mb-3 sm:gap-2.5">
              <h2 id="study-modal-title" className="font-hand text-xl font-bold text-[#3c332c] sm:text-3xl">
                잡초
              </h2>
              <span className="font-display inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#3c332c] bg-[#ffe066] text-xs font-bold text-[#3c332c] sm:h-8 sm:w-8 sm:text-base">
                +1
              </span>
            </div>

            <div className="grid flex-1 grid-cols-3 items-center gap-x-2 gap-y-1.5 md:grid-cols-2 md:gap-x-4 md:gap-y-2.5">
              {STUDY_WEED_ITEMS.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex flex-col items-center justify-center ${
                    idx === 2 ? 'md:col-span-2' : ''
                  }`}
                >
                  <img
                    src={item.sprite}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="h-[clamp(48px,9.5vh,92px)] w-auto object-contain md:h-[clamp(72px,13vh,108px)]"
                  />
                  <span className="font-hand mt-0.5 text-sm font-bold leading-tight text-[#3c332c] sm:mt-1 sm:text-lg">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Right Page: 지켜주기 -1 */}
          <section className="flex flex-col px-3 py-2.5 sm:px-5 sm:py-4">
            <div className="mb-1.5 flex items-center justify-center gap-2 sm:mb-3 sm:gap-2.5">
              <h2 className="font-hand text-xl font-bold text-[#3c332c] sm:text-3xl">지켜주기</h2>
              <span className="font-display inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#3c332c] bg-[#ffb6cb] text-xs font-bold text-[#3c332c] sm:h-8 sm:w-8 sm:text-base">
                -1
              </span>
            </div>

            <div className="grid flex-1 grid-cols-3 items-center gap-x-2 gap-y-2 sm:gap-y-3">
              {STUDY_PROTECTED_ITEMS.map((item) => (
                <div key={item.label} className="flex flex-col items-center justify-center">
                  <img
                    src={item.sprite}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="h-[clamp(44px,8.5vh,84px)] w-auto object-contain md:h-[clamp(62px,10.5vh,92px)]"
                  />
                  <span className="font-hand mt-0.5 text-sm font-bold leading-tight text-[#3c332c] sm:mt-1 sm:text-lg">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showStartCta && onStartExam && (
        <div className="mt-3 flex items-center justify-center gap-2.5 sm:mt-4 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="game-btn font-hand rounded-full bg-[#c9ebb2] px-5 py-2 text-base font-bold text-[#3c332c] whitespace-nowrap sm:px-6 sm:py-2.5 sm:text-xl"
          >
            돌아가기
          </button>
          <button
            type="button"
            data-start="true"
            onClick={onStartExam}
            className="chiikawa-hero-btn font-display rounded-full bg-[#ffe066] px-6 py-2 text-lg text-[#3c332c] whitespace-nowrap sm:px-8 sm:py-3 sm:text-xl"
          >
            시험 보러 가기 →
          </button>
        </div>
      )}
    </div>
  );
};
