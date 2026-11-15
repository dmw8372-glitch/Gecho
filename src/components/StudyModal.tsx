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
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#283324]/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-modal-title"
    >
      <div className="relative flex max-h-[80dvh] w-full max-w-[780px] flex-col rounded-[26px] border-[3px] border-[#342f2a] bg-[#83bc7b] p-2.5 shadow-xl sm:p-4">
        {/* Top-right yellow X close button matching IMG_1422 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="제초 공부 닫기"
          className="game-btn absolute -top-3.5 -right-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#fdd64c] text-[#342f2a] sm:-top-4 sm:-right-3 sm:h-11 sm:w-11"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        {/* Open cream notebook pages (scrolls cleanly inside narrow mobile heights) */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto rounded-[18px] border-[2.5px] border-[#342f2a] bg-[#fbf9f1] md:grid-cols-2">
          {/* Left Page: 잡초 +1 */}
          <section className="flex flex-col border-b-[2px] border-[#d8d3c3] p-4 md:border-r-[2.5px] md:border-b-0 sm:p-6">
            <div className="mb-3 flex items-center justify-center gap-2 sm:mb-4 sm:gap-2.5">
              <h2 id="study-modal-title" className="font-hand text-2xl font-bold text-[#342f2a] sm:text-3xl">
                잡초
              </h2>
              <span className="font-display inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#342f2a] bg-[#fdd64c] text-sm font-bold text-[#342f2a] sm:h-8 sm:w-8 sm:text-base">
                +1
              </span>
            </div>

            <div className="grid flex-1 grid-cols-3 items-center gap-x-2 gap-y-2 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
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
                    className="h-16 w-auto object-contain sm:h-24 md:h-28"
                  />
                  <span className="font-hand mt-1 text-base font-bold text-[#342f2a] sm:text-xl">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Right Page: 지켜주기 -1 */}
          <section className="flex flex-col p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-center gap-2 sm:mb-4 sm:gap-2.5">
              <h2 className="font-hand text-2xl font-bold text-[#342f2a] sm:text-3xl">지켜주기</h2>
              <span className="font-display inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#342f2a] bg-[#f7b2c4] text-sm font-bold text-[#342f2a] sm:h-8 sm:w-8 sm:text-base">
                -1
              </span>
            </div>

            <div className="grid flex-1 grid-cols-3 items-center gap-x-2 gap-y-3 sm:gap-y-4">
              {STUDY_PROTECTED_ITEMS.map((item) => (
                <div key={item.label} className="flex flex-col items-center justify-center">
                  <img
                    src={item.sprite}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="h-16 w-auto object-contain sm:h-20 md:h-24"
                  />
                  <span className="font-hand mt-1 text-base font-bold text-[#342f2a] sm:text-xl">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showStartCta && onStartExam && (
        <div className="mt-3.5 flex items-center justify-center gap-3 sm:mt-5">
          <button
            type="button"
            onClick={onClose}
            className="game-btn font-hand rounded-2xl bg-[#b4dc9c] px-4 py-2 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:px-5 sm:py-2.5 sm:text-xl"
          >
            돌아가기
          </button>
          <button
            type="button"
            data-start="true"
            onClick={onStartExam}
            className="game-btn font-hand rounded-2xl bg-[#fdd64c] px-5 py-2 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:px-6 sm:py-2.5 sm:text-xl"
          >
            시험 보러 가기 →
          </button>
        </div>
      )}
    </div>
  );
};
