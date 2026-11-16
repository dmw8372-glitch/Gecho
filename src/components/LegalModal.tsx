import React, { useState } from 'react';
import { FileText, ShieldCheck, X } from 'lucide-react';

export type LegalTab = 'copyright' | 'privacy';

interface LegalModalProps {
  initialTab: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ initialTab, onClose }) => {
  const [tab, setTab] = useState<LegalTab>(initialTab);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#283324]/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[86dvh] w-full max-w-[540px] flex-col rounded-[26px] border-[3px] border-[#342f2a] bg-[#fbf9f1] p-5 shadow-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="법적 고지 창 닫기"
          className="game-btn absolute -top-3.5 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#fdd64c] text-[#342f2a]"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        <h2 id="legal-modal-title" className="font-display text-center text-2xl text-[#342f2a] sm:text-3xl">
          저작권 안내 및 개인정보 처리방침
        </h2>
        <p className="mt-1 text-center text-xs font-bold text-[#6e675d] sm:text-sm">
          비영리 팬 메이드(Fan-made) 웹 프로젝트 운영 고지
        </p>

        {/* Tab Switcher */}
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab('copyright')}
            className={`game-btn font-hand flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[15px] font-bold whitespace-nowrap transition-colors sm:gap-1.5 sm:px-3 sm:text-lg ${
              tab === 'copyright' ? 'bg-[#b4dc9c] text-[#342f2a]' : 'bg-[#f1eee2] text-[#6e675d]'
            }`}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.3} />
            <span>저작권 · 면책 고지</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`game-btn font-hand flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[15px] font-bold whitespace-nowrap transition-colors sm:gap-1.5 sm:px-3 sm:text-lg ${
              tab === 'privacy' ? 'bg-[#fdd64c] text-[#342f2a]' : 'bg-[#f1eee2] text-[#6e675d]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.3} />
            <span>개인정보 처리방침</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="font-sans mt-4 flex-1 space-y-3.5 overflow-y-auto rounded-2xl border-2 border-[#d9d3c3] bg-white/90 p-4 text-[13px] leading-relaxed text-[#454038] sm:text-sm">
          {tab === 'copyright' ? (
            <>
              <section>
                <h3 className="font-bold text-[#342f2a]">1. 비영리 팬 메이드 프로젝트 고지</h3>
                <p className="mt-1">
                  본 웹 애플리케이션(「제초 자격증 시험」)은 《치이카와(먼작귀 / ちいかわ)》 세계관에서
                  영감을 받아 제작된 <strong>비영리 2차 창작 팬 게임(Fan-made Project)</strong>입니다.
                  원작자(나가노 / ナガノ) 및 공식 저작권·라이선스 권리자와 어떠한 공식적 제휴, 후원,
                  승인 관계도 없음을 명확히 밝힙니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#342f2a]">2. AI 재창작 리소스 및 지식재산권 귀속</h3>
                <p className="mt-1">
                  본 게임에 사용된 캐릭터·식물·자격증·아이콘 등의 시각 리소스는 팬 게임 구현 목적을 위해
                  <strong> 생성형 AI를 활용한 재창작 및 후가공을 거쳐 새로 제작된 2차 리소스</strong>입니다.
                  원작 캐릭터의 고유한 창작성 및 모든 원천 지식재산권은 전적으로 원저작권자에게 귀속됩니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#342f2a]">3. 상업적 이용 및 수익 창출 금지</h3>
                <p className="mt-1">
                  본 프로젝트는 광고 게재, 유료 아이템 판매, 후원금 모집, 굿즈 제작·유통 등{' '}
                  <strong>어떠한 형태의 영리 활동 및 수익 창출에도 사용되지 않으며</strong>, 향후에도 오직
                  순수 팬 활동 및 비상업적 체험 목적 외의 상업적 용도로 이용하지 않습니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#342f2a]">4. 권리자 요청 시 즉시 조치</h3>
                <p className="mt-1">
                  원저작권자 또는 정당한 권리자의 게시 중단·수정·삭제 요청이 접수될 경우, 확인 즉시 지체
                  없이 관련 리소스 또는 서비스 전체를 비공개·삭제 조치하겠습니다.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-bold text-[#342f2a]">1. 수집·이용하는 정보 항목 및 목적</h3>
                <p className="mt-1">
                  본 서비스는 회원가입, 이메일, 전화번호 등 실명 기반 개인식별정보를 수집하지 않으며, 게임
                  기능 제공을 위해 최소한의 정보만을 처리합니다.
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  <li>
                    <strong>30초 랭킹 도전 기록</strong>: 이용자가 직접 입력한 닉네임(표시명), 획득 점수,
                    최대 콤보, 실수 횟수, 선택 초상화 식별자, 기록 일시가 순위표 표시 및 동일 닉네임 최고
                    기록 갱신 처리를 위해 저장됩니다.
                  </li>
                  <li>
                    <strong>브라우저 로컬 저장소(localStorage)</strong>: 재도전 시 닉네임 입력 편의를 위해
                    최근 사용한 닉네임이 이용자 기기 내 브라우저에만 저장되며, 브라우저 설정으로 언제든
                    삭제할 수 있습니다.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-[#342f2a]">2. 카메라 촬영 및 이미지 처리 원칙</h3>
                <p className="mt-1">
                  자격증 결과 화면의 사진 촬영·불러오기 기능 사용 시 카메라 영상 및 선택된 사진은{' '}
                  <strong>이용자 단말기(브라우저 메모리) 내부에서만 로컬 합성</strong>되며, 외부 서버나
                  데이터베이스로 전송·업로드·보관되지 않습니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#342f2a]">3. 보관 및 제3자 제공 금지</h3>
                <p className="mt-1">
                  랭킹표 데이터는 Google Firebase Firestore를 통해 안전하게 보관되며, 이용자의 동의 없이
                  영리 목적 또는 제3자에게 판매·제공·공유되지 않습니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#342f2a]">4. 이용자 유의사항 및 권리 행사</h3>
                <p className="mt-1">
                  랭킹표는 모든 이용자에게 공개되므로 닉네임 입력 시 본명·연락처·주소 등 개인정보가
                  포함되지 않도록 주의해 주시기 바랍니다. 본 방침은 비영리 팬 서비스 운영 기준에 따라
                  적용됩니다.
                </p>
              </section>
            </>
          )}
        </div>

        <p className="mt-2.5 text-center text-[11px] font-medium text-[#7b756a]">
          Non-commercial Fan Game · AI-recreated Fan Assets · Zero Commercial Use
        </p>
      </div>
    </div>
  );
};
