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
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#283324]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-modal-title"
    >
      <div className="relative w-full max-w-[780px] rounded-[26px] border-[3px] border-[#342f2a] bg-[#83bc7b] p-3 shadow-xl sm:p-4">
        {/* Top-right yellow X close button matching IMG_1422 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="제초 공부 닫기"
          className="game-btn absolute -top-4 -right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#fdd64c] text-[#342f2a]"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        {/* Open cream notebook pages */}
        <div className="grid grid-cols-1 overflow-hidden rounded-[18px] border-[2.5px] border-[#342f2a] bg-[#fbf9f1] md:grid-cols-2">
          {/* Left Page: 잡초 +1 */}
          <section className="flex flex-col border-b-[2px] border-[#d8d3c3] p-5 md:border-r-[2.5px] md:border-b-0 sm:p-6">
            <div className="mb-4 flex items-center justify-center gap-2.5">
              <h2 id="study-modal-title" className="font-hand text-3xl font-bold text-[#342f2a]">
                잡초
              </h2>
              <span className="font-display inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#342f2a] bg-[#fdd64c] text-base font-bold text-[#342f2a]">
                +1
              </span>
            </div>

            <div className="grid flex-1 grid-cols-2 items-center gap-x-4 gap-y-3">
              {STUDY_WEED_ITEMS.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex flex-col items-center justify-center ${
                    idx === 2 ? 'col-span-2' : ''
                  }`}
                >
                  <img
                    src={item.sprite}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="h-24 w-auto object-contain sm:h-28"
                  />
                  <span className="font-hand mt-1 text-xl font-bold text-[#342f2a]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Right Page: 지켜주기 -1 */}
          <section className="flex flex-col p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-center gap-2.5">
              <h2 className="font-hand text-3xl font-bold text-[#342f2a]">지켜주기</h2>
              <span className="font-display inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#342f2a] bg-[#f7b2c4] text-base font-bold text-[#342f2a]">
                -1
              </span>
            </div>

            <div className="grid flex-1 grid-cols-3 items-center gap-x-2 gap-y-4">
              {STUDY_PROTECTED_ITEMS.map((item) => (
                <div key={item.label} className="flex flex-col items-center justify-center">
                  <img
                    src={item.sprite}
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="h-20 w-auto object-contain sm:h-24"
                  />
                  <span className="font-hand mt-1 text-lg font-bold text-[#342f2a] sm:text-xl">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showStartCta && onStartExam && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="game-btn font-hand rounded-2xl bg-[#b4dc9c] px-5 py-2.5 text-xl font-bold text-[#342f2a] whitespace-nowrap"
          >
            돌아가기
          </button>
          <button
            type="button"
            data-start="true"
            onClick={onStartExam}
            className="game-btn font-hand rounded-2xl bg-[#fdd64c] px-6 py-2.5 text-xl font-bold text-[#342f2a] whitespace-nowrap"
          >
            시험 보러 가기 →
          </button>
        </div>
      )}
    </div>
  );
};
