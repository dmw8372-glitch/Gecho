import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundButtonProps {
  muted: boolean;
  onToggle: () => void;
}

export const SoundButton: React.FC<SoundButtonProps> = ({ muted, onToggle }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur();
        onToggle();
      }}
      tabIndex={-1}
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      className={`game-btn pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-full text-[#3c332c] sm:h-12 sm:w-12 ${
        muted ? 'bg-[#e9f1f7]' : 'bg-[#fffdf6]'
      }`}
    >
      {muted ? (
        <VolumeX className="h-5 w-5 text-[#7a8a99]" strokeWidth={2.5} />
      ) : (
        <Volume2 className="h-5 w-5" strokeWidth={2.5} />
      )}
    </button>
  );
};
