import React, { useMemo, useRef, useState } from 'react';
import { BookOpen, Download, Home, RotateCcw, Trophy } from 'lucide-react';
import {
  CHARACTER_PORTRAITS,
  CharacterId,
  ExamStats,
  GRADE_CERTIFICATES,
  GameMode,
  PortraitChoice,
  WeedingGrade,
  computeGrade,
} from '../game/rules';
import { CameraCaptureModal } from './CameraCaptureModal';
import { SoundButton } from './SoundButton';

interface CertificateModalProps {
  mode: GameMode;
  playerName?: string;
  rankingSaving?: boolean;
  rankingSavedId?: string | null;
  stats: ExamStats;
  muted: boolean;
  onToggleMute: () => void;
  onOpenStudy: () => void;
  onOpenRanking: () => void;
  onPortraitChoiceChange?: (choice: PortraitChoice) => void;
  onRetry: () => void;
  onGoHome: () => void;
}

// Pixel-measured inner white ID box & camera badge bounds per certificate image
const GRADE_ID_BOX: Record<
  WeedingGrade,
  { left: number; top: number; width: number; height: number; camLeft: number; camTop: number }
> = {
  1: { left: 61.6, top: 22.0, width: 22.3, height: 34.8, camLeft: 79.8, camTop: 51.0 },
  2: { left: 59.5, top: 22.1, width: 23.7, height: 35.0, camLeft: 78.9, camTop: 51.5 },
  3: { left: 60.2, top: 22.3, width: 23.4, height: 34.9, camLeft: 79.4, camTop: 51.5 },
  4: { left: 60.2, top: 22.3, width: 23.5, height: 34.8, camLeft: 79.6, camTop: 51.8 },
  5: { left: 60.3, top: 22.1, width: 23.1, height: 35.0, camLeft: 79.2, camTop: 51.2 },
};

const SPARKLE_POSITIONS = [
  { top: '-6%', left: '8%', size: 26, delay: '0s', color: '#ffffff' },
  { top: '6%', right: '-5%', size: 30, delay: '0.45s', color: '#fff8c7' },
  { top: '42%', left: '-7%', size: 22, delay: '0.9s', color: '#ffffff' },
  { bottom: '10%', right: '-4%', size: 24, delay: '1.25s', color: '#fff4b8' },
  { bottom: '-6%', left: '22%', size: 20, delay: '0.7s', color: '#ffffff' },
  { top: '14%', left: '46%', size: 18, delay: '1.5s', color: '#ffffff' },
];

export const CertificateModal: React.FC<CertificateModalProps> = ({
  mode,
  playerName,
  rankingSaving = false,
  rankingSavedId,
  stats,
  muted,
  onToggleMute,
  onOpenStudy,
  onOpenRanking,
  onPortraitChoiceChange,
  onRetry,
  onGoHome,
}) => {
  const grade = computeGrade(stats.score);
  const cert = GRADE_CERTIFICATES[grade];
  const idBox = GRADE_ID_BOX[grade];

  const [selectedChar, setSelectedChar] = useState<CharacterId>('chiikawa');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const activePortrait = CHARACTER_PORTRAITS[selectedChar];

  const sparkles = useMemo(() => {
    const count = grade <= 2 ? 6 : grade === 3 ? 5 : 4;
    return SPARKLE_POSITIONS.slice(0, count);
  }, [grade]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: -ny * 24,
      ry: nx * 28,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const handleDownloadCertificate = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const certImg = await loadImg(cert.sprite);
      const canvas = document.createElement('canvas');
      canvas.width = certImg.naturalWidth * 2;
      canvas.height = certImg.naturalHeight * 2;
      const ctx = canvas.getContext('2d')!;

      const customSrc = customPhotoUrl || (selectedChar !== 'chiikawa' ? activePortrait.sprite : null);

      if (customSrc) {
        const photoImg = await loadImg(customSrc);
        const boxX = canvas.width * (idBox.left / 100);
        const boxY = canvas.height * (idBox.top / 100);
        const boxW = canvas.width * (idBox.width / 100);
        const boxH = canvas.height * (idBox.height / 100);

        const off = document.createElement('canvas');
        off.width = canvas.width;
        off.height = canvas.height;
        const octx = off.getContext('2d')!;
        octx.fillStyle = '#ffffff';
        octx.beginPath();
        octx.roundRect(boxX, boxY, boxW, boxH, boxW * 0.12);
        octx.fill();

        octx.save();
        octx.beginPath();
        octx.roundRect(boxX, boxY, boxW, boxH, boxW * 0.12);
        octx.clip();

        if (customPhotoUrl) {
          // Cover-crop camera photo inside ID box
          const boxRatio = boxW / boxH;
          const imgRatio = photoImg.naturalWidth / photoImg.naturalHeight;
          let dw = boxW;
          let dh = boxH;
          if (imgRatio > boxRatio) {
            dh = boxH;
            dw = dh * imgRatio;
          } else {
            dw = boxW;
            dh = dw / imgRatio;
          }
          octx.drawImage(
            photoImg,
            boxX + (boxW - dw) / 2,
            boxY + (boxH - dh) / 2,
            dw,
            dh,
          );
        } else {
          const pad = boxW * 0.06;
          const maxW = boxW - pad * 2;
          const maxH = boxH - pad * 2;
          const scale = Math.min(maxW / photoImg.naturalWidth, maxH / photoImg.naturalHeight);
          const dw = photoImg.naturalWidth * scale;
          const dh = photoImg.naturalHeight * scale;
          octx.drawImage(
            photoImg,
            boxX + (boxW - dw) / 2,
            boxY + boxH - dh - pad * 0.35,
            dw,
            dh,
          );
        }
        octx.restore();

        // Carve out circular notch for the yellow camera badge
        octx.globalCompositeOperation = 'destination-out';
        octx.beginPath();
        octx.arc(boxX + boxW * 0.96, boxY + boxH * 0.95, boxW * 0.27, 0, Math.PI * 2);
        octx.fill();

        ctx.drawImage(certImg, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(off, 0, 0);
      } else {
        ctx.drawImage(certImg, 0, 0, canvas.width, canvas.height);
      }

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `제초자격증-${grade}급.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      const a = document.createElement('a');
      a.href = cert.sprite;
      a.download = `제초자격증-${grade}급.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setSaving(false);
    }
  };

  const showOverlayPortrait = Boolean(customPhotoUrl) || selectedChar !== 'chiikawa';

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between overflow-y-auto bg-[#e6efda]/76 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7"
      role="dialog"
      aria-modal="true"
      aria-label={`제초 ${grade}급 자격증 결과`}
    >
      {/* Top corner buttons matching IMG_1426–1431 */}
      <div className="flex shrink-0 items-start justify-between">
        <button
          type="button"
          onClick={onGoHome}
          aria-label="처음 화면으로"
          className="game-btn flex h-10 w-10 items-center justify-center rounded-full bg-[#fbf9f1] text-[#342f2a] sm:h-11 sm:w-11"
        >
          <Home className="h-5 w-5" strokeWidth={2.4} />
        </button>

        <SoundButton muted={muted} onToggle={onToggleMute} />
      </div>

      {/* Center Certificate + Stats & Actions */}
      <div className="my-auto flex flex-col items-center py-2">
        {mode === 'ranking' && (
          <div className="game-pill mb-3 flex items-center gap-2 rounded-full bg-[#fff5c4] px-4 py-1 text-base font-bold text-[#342f2a] sm:text-lg">
            <Trophy className="h-4 w-4 text-[#d99114]" strokeWidth={2.5} />
            <span>
              30초 랭킹 도전 · {playerName || '도전자'}
            </span>
            <span className="rounded-full bg-[#83bc7b] px-2 py-0.5 text-xs text-white">
              {rankingSaving ? '저장 중...' : rankingSavedId ? '랭킹 등록 완료!' : '기록 완료'}
            </span>
          </div>
        )}

        {/* Certificate Card with 3D tilt, clipped sweeping white glare, and twinkling sparkles */}
        <div className="cert-float">
          <div
            ref={cardRef}
            data-testid="cert-card"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="relative w-[min(360px,84vw)] select-none sm:w-[min(430px,86vw)]"
            style={{
              transform: `perspective(750px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: 'transform 120ms ease-out',
            }}
          >
          <img
            src={cert.sprite}
            alt={`제초 ${grade}급 자격증`}
            referrerPolicy="no-referrer"
            className="block h-auto w-full drop-shadow-[0_12px_20px_rgba(40,48,30,0.22)]"
            draggable={false}
          />

          {/* Swapped portrait or user camera selfie cleanly inset inside ID box */}
          {showOverlayPortrait && (
            <div
              className={`pointer-events-none absolute flex items-end justify-center overflow-hidden bg-white ${
                customPhotoUrl ? 'p-0' : 'p-1'
              }`}
              style={{
                left: `${idBox.left}%`,
                top: `${idBox.top}%`,
                width: `${idBox.width}%`,
                height: `${idBox.height}%`,
                borderRadius: '10% 10% 42% 10% / 10% 10% 36% 10%',
              }}
            >
              {customPhotoUrl ? (
                <img
                  src={customPhotoUrl}
                  alt="내 자격증 사진"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={activePortrait.sprite}
                  alt={activePortrait.name}
                  referrerPolicy="no-referrer"
                  className="h-[92%] w-auto object-contain"
                />
              )}
            </div>
          )}

          {/* Sweeping white light glare: travels left->right inside black outline and vanishes cleanly */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[5%_4.5%_6%_4.5%] overflow-hidden rounded-[22%/32%]"
          >
            <div
              className="cert-shine-beam absolute -inset-y-8 w-[24%]"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.34) 24%, rgba(255,255,255,0.96) 50%, rgba(255,255,255,0.34) 76%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>

          {/* Interactive camera button over the yellow camera icon on the ID frame */}
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            title="카메라로 내 사진 찍기 / 캐릭터 변경"
            aria-label="카메라로 자격증 사진 찍기 또는 캐릭터 변경"
            className="absolute rounded-full focus-visible:outline-2 focus-visible:outline-blue-500"
            style={{
              left: `${idBox.camLeft}%`,
              top: `${idBox.camTop}%`,
              width: '11.2%',
              height: '16.5%',
              cursor: 'pointer',
              background: 'transparent',
            }}
          />

          {/* Twinkling 4-point star sparkles around the certificate */}
          {sparkles.map((sp, i) => (
            <svg
              key={i}
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="cert-sparkle pointer-events-none absolute"
              style={{
                top: sp.top,
                left: sp.left,
                right: sp.right,
                bottom: sp.bottom,
                width: sp.size,
                height: sp.size,
                animationDelay: sp.delay,
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.9))',
              }}
            >
              <path
                d="M12 0 C13 8.5 15.5 11 24 12 C15.5 13 13 15.5 12 24 C11 15.5 8.5 13 0 12 C8.5 11 11 8.5 12 0 Z"
                fill={sp.color}
                stroke="#342f2a"
                strokeWidth="1.2"
              />
            </svg>
          ))}
          </div>
        </div>

        {/* Row 1: 3 stat pills + 제초 공부 button */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3">
          <div
            className="game-pill flex items-center gap-1.5 rounded-full px-3 py-1 sm:gap-2 sm:px-4 sm:py-1.5"
            aria-label={`뽑은 잡초 ${stats.score}개`}
          >
            <img
              src="/assets/sprites/weed_long_lg.png"
              alt="잡초"
              referrerPolicy="no-referrer"
              className="h-5 w-auto object-contain sm:h-6"
            />
            <span data-testid="result-score" className="font-hand tabular-nums text-lg font-bold sm:text-xl">
              {stats.score}
            </span>
          </div>

          <div
            className="game-pill flex items-center gap-1 rounded-full px-3 py-1 sm:gap-1.5 sm:px-4 sm:py-1.5"
            aria-label={`최대 콤보 ${stats.maxCombo}`}
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12.5 2C12.5 2 17 6.5 17 11.5C17 14.8 14.8 17.5 12 17.5C9.2 17.5 7 14.8 7 11.5C7 9.7 7.8 8.2 8.7 7C8.7 7 9.2 9.4 10.6 9.8C10.1 7.2 11.5 4 12.5 2Z"
                fill="#ff7b3b"
                stroke="#342f2a"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span data-testid="result-combo" className="font-hand tabular-nums text-lg font-bold sm:text-xl">
              x{stats.maxCombo}
            </span>
          </div>

          <div
            className="game-pill flex items-center gap-1.5 rounded-full px-3 py-1 sm:gap-2 sm:px-4 sm:py-1.5"
            aria-label={`실수한 꽃 ${stats.mistakes}개`}
          >
            <img
              src="/assets/sprites/flower_yellow.png"
              alt="꽃"
              referrerPolicy="no-referrer"
              className="h-5 w-auto object-contain sm:h-6"
            />
            <span
              data-testid="result-mistakes"
              className="font-hand tabular-nums text-lg font-bold text-[#c94141] sm:text-xl"
            >
              {stats.mistakes}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenStudy}
            className="game-btn font-hand flex items-center gap-1.5 rounded-full bg-[#b4dc9c] px-3.5 py-1 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xl"
          >
            <BookOpen className="h-4 w-4" strokeWidth={2.5} />
            <span>제초 공부</span>
          </button>
        </div>

        {/* Row 2: 자격증 저장, 랭킹표, 다시 도전 buttons */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 sm:mt-3.5 sm:gap-3">
          <button
            type="button"
            onClick={handleDownloadCertificate}
            disabled={saving}
            className="game-btn font-hand flex items-center gap-1.5 rounded-2xl bg-[#fbf9f1] px-4 py-2 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xl"
          >
            <Download className="h-4 w-4" strokeWidth={2.5} />
            <span>{saving ? '저장 중...' : '자격증 저장'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenRanking}
            className="game-btn font-hand flex items-center gap-1.5 rounded-2xl bg-[#fbf9f1] px-4 py-2 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xl"
          >
            <Trophy className="h-4 w-4 text-[#e09f1f]" strokeWidth={2.5} />
            <span>랭킹표</span>
          </button>

          <button
            type="button"
            data-start="true"
            onClick={onRetry}
            className="game-btn font-hand flex items-center gap-1.5 rounded-2xl bg-[#fdd64c] px-5 py-2 text-lg font-bold text-[#342f2a] whitespace-nowrap sm:gap-2 sm:px-6 sm:py-2.5 sm:text-xl"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
            <span>다시 도전</span>
          </button>
        </div>
      </div>

      {/* Bottom spacer for balanced vertical framing */}
      <div className="h-2 sm:h-4" aria-hidden="true" />

      {cameraOpen && (
        <CameraCaptureModal
          activeCharacter={selectedChar}
          hasCustomPhoto={Boolean(customPhotoUrl)}
          onSelectCameraPhoto={(dataUrl) => {
            setCustomPhotoUrl(dataUrl);
            onPortraitChoiceChange?.('camera');
            setCameraOpen(false);
          }}
          onSelectCharacter={(charId) => {
            setCustomPhotoUrl(null);
            setSelectedChar(charId);
            onPortraitChoiceChange?.(charId);
            setCameraOpen(false);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
};
