import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, X } from 'lucide-react';
import { CHARACTER_PORTRAITS, CharacterId } from '../game/rules';

interface CameraCaptureModalProps {
  activeCharacter: CharacterId;
  hasCustomPhoto: boolean;
  onSelectCameraPhoto: (dataUrl: string) => void;
  onSelectCharacter: (charId: CharacterId) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  activeCharacter,
  hasCustomPhoto,
  onSelectCameraPhoto,
  onSelectCharacter,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraState, setCameraState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      stopStream();
      setCameraState('loading');
      setErrorMsg('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState('error');
        setErrorMsg('이 브라우저에서는 실시간 카메라를 바로 열 수 없어요. 아래 사진 선택을 이용해주세요!');
        return;
      }

      try {
        const streamPromise = navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('camera-timeout')), 2500),
        );
        const stream = await Promise.race([streamPromise, timeoutPromise]);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraState('ready');
      } catch {
        if (!cancelled) {
          setCameraState('error');
          setErrorMsg('카메라 권한이 거부되었거나 연결된 카메라가 없어요. 아래 버튼으로 사진을 찍거나 불러올 수 있어요!');
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode]);

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Crop video center to portrait ID aspect (4:4.3)
    const targetW = 400;
    const targetH = 440;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const targetRatio = targetW / targetH;
    const videoRatio = vw / vh;

    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;
    if (videoRatio > targetRatio) {
      sw = vh * targetRatio;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / targetRatio;
      sy = (vh - sh) / 2;
    }

    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    stopStream();
    onSelectCameraPhoto(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        const targetW = 400;
        const targetH = 440;
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d')!;

        const targetRatio = targetW / targetH;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0;
        let sy = 0;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;
        if (imgRatio > targetRatio) {
          sw = img.naturalHeight * targetRatio;
          sx = (img.naturalWidth - sw) / 2;
        } else {
          sh = img.naturalWidth / targetRatio;
          sy = (img.naturalHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        stopStream();
        onSelectCameraPhoto(canvas.toDataURL('image/png'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#283324]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="relative flex max-h-[90dvh] w-full max-w-[380px] flex-col rounded-[26px] border-[3px] border-[#342f2a] bg-[#fbf9f1] p-4 shadow-xl sm:p-5">
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          aria-label="카메라 닫기"
          className="game-btn absolute -top-3.5 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#fdd64c] text-[#342f2a]"
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        <h2 id="camera-modal-title" className="font-display text-center text-2xl text-[#342f2a]">
          자격증 증명사진 찍기
        </h2>
        <p className="mt-0.5 text-center text-sm font-bold text-[#625b52]">
          내 얼굴을 찍거나 캐릭터를 골라 넣을 수 있어요!
        </p>

        {/* Live Camera Viewfinder */}
        <div className="relative mx-auto mt-3 aspect-[10/11] w-[210px] overflow-hidden rounded-2xl border-[3px] border-[#342f2a] bg-[#e9e5d6] sm:w-[230px]">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''} ${
              cameraState === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {cameraState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-base font-bold text-[#524c44]">
              <Camera className="h-8 w-8 animate-pulse text-[#58a855]" />
              <span>카메라 준비 중...</span>
            </div>
          )}

          {cameraState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm font-bold leading-snug text-[#625b52]">
              <Camera className="h-8 w-8 text-[#9a9285]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cameraState === 'ready' && (
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              aria-label="전후면 카메라 전환"
              className="game-btn absolute right-2 bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#fbf9f1]/90 text-[#342f2a]"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Shutter & File Upload Controls */}
        <div className="mt-3.5 flex flex-col gap-2.5">
          {cameraState === 'ready' && (
            <button
              type="button"
              onClick={handleCaptureFrame}
              className="game-btn font-hand flex items-center justify-center gap-2 rounded-2xl bg-[#fdd64c] px-4 py-2.5 text-xl font-bold text-[#342f2a]"
            >
              <Camera className="h-5 w-5" strokeWidth={2.5} />
              <span>찰칵! 사진 찍기</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="game-btn font-hand flex items-center justify-center gap-2 rounded-2xl bg-[#b4dc9c] px-4 py-2 text-lg font-bold text-[#342f2a]"
          >
            <ImagePlus className="h-4 w-4" strokeWidth={2.5} />
            <span>카메라 앱 / 사진첩에서 고르기</span>
          </button>
        </div>

        {/* Quick Character Presets */}
        <div className="mt-3.5 border-t-2 border-[#e3decb] pt-3">
          <div className="mb-2 text-center text-sm font-bold text-[#625b52]">
            또는 기본 캐릭터 선택
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['chiikawa', 'hachiware', 'usagi'] as CharacterId[]).map((cid) => {
              const info = CHARACTER_PORTRAITS[cid];
              const isSelected = !hasCustomPhoto && activeCharacter === cid;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => {
                    stopStream();
                    onSelectCharacter(cid);
                  }}
                  className={`game-btn flex flex-col items-center rounded-xl px-2 py-1.5 ${
                    isSelected ? 'bg-[#fff2b2]' : 'bg-white'
                  }`}
                >
                  <img
                    src={info.sprite}
                    alt={info.name}
                    referrerPolicy="no-referrer"
                    className="h-10 w-auto object-contain"
                  />
                  <span className="font-hand mt-0.5 text-sm font-bold text-[#342f2a]">
                    {info.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
