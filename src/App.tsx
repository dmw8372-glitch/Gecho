import { useCallback, useEffect, useRef, useState } from 'react';
import { CertificateModal } from './components/CertificateModal';
import { PauseModal } from './components/PauseModal';
import { FloatingFeedback, PlayingHud } from './components/PlayingHud';
import { StudyModal } from './components/StudyModal';
import { TitleOverlay } from './components/TitleOverlay';
import { MeadowScene, PlantPullEvent } from './game/MeadowScene';
import { soundFx } from './game/audio';
import {
  EXAM_DURATION_SECONDS,
  ExamStats,
  GameScreen,
  applyPlantPull,
  computeGrade,
  createInitialExamStats,
} from './game/rules';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MeadowScene | null>(null);

  const [screen, setScreen] = useState<GameScreen>('title');
  const [studyOpen, setStudyOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [stats, setStats] = useState<ExamStats>(createInitialExamStats);
  const [remainingSeconds, setRemainingSeconds] = useState(EXAM_DURATION_SECONDS);
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);

  const statsRef = useRef<ExamStats>(stats);
  statsRef.current = stats;
  const screenRef = useRef<GameScreen>(screen);
  screenRef.current = screen;
  const feedbackIdRef = useRef(1);
  const lastSecondRef = useRef(EXAM_DURATION_SECONDS);

  const pushFeedback = useCallback((fb: Omit<FloatingFeedback, 'id'>) => {
    const id = feedbackIdRef.current++;
    setFeedbacks((prev) => [...prev.slice(-8), { ...fb, id }]);
    window.setTimeout(() => {
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
    }, 740);
  }, []);

  const handlePlantPulled = useCallback(
    (event: PlantPullEvent) => {
      const result = applyPlantPull(statsRef.current, event.isWeed);
      statsRef.current = result.next;
      setStats(result.next);

      if (event.isWeed) {
        soundFx.playWeedPull(result.next.combo);
        if (result.gradeChanged) {
          soundFx.playGradeUp();
        }
        pushFeedback({
          text: '+1',
          subText: result.next.combo >= 3 ? `x${result.next.combo}!` : undefined,
          isPositive: true,
          x: event.screenX,
          y: event.screenY,
        });
      } else {
        soundFx.playMistake();
        pushFeedback({
          text: '-1',
          subText: event.label,
          isPositive: false,
          x: event.screenX,
          y: event.screenY,
        });
      }
    },
    [pushFeedback],
  );

  const handleTimerTick = useCallback((remaining: number) => {
    const rounded = Math.ceil(remaining);
    if (rounded !== lastSecondRef.current || remaining <= 0) {
      lastSecondRef.current = rounded;
      setRemainingSeconds(remaining);
    }
  }, []);

  const handleExamFinished = useCallback(() => {
    const finalGrade = computeGrade(statsRef.current.score);
    soundFx.playExamFinish(finalGrade);
    setRemainingSeconds(0);
    setScreen('gameover');
  }, []);

  const startExam = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundFx.playExamStart();
    const fresh = createInitialExamStats();
    statsRef.current = fresh;
    lastSecondRef.current = EXAM_DURATION_SECONDS;
    setStats(fresh);
    setRemainingSeconds(EXAM_DURATION_SECONDS);
    setFeedbacks([]);
    setStudyOpen(false);
    setScreen('playing');
    sceneRef.current?.setScreen('playing');
    sceneRef.current?.startNewExamRound();
  }, []);

  const pauseExam = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    soundFx.playClick();
    setScreen('paused');
    sceneRef.current?.setScreen('paused');
  }, []);

  const resumeExam = useCallback(() => {
    if (screenRef.current !== 'paused') return;
    soundFx.playClick();
    setScreen('playing');
    sceneRef.current?.setScreen('playing');
  }, []);

  const goHome = useCallback(() => {
    soundFx.playClick();
    setStudyOpen(false);
    setFeedbacks([]);
    setScreen('title');
    sceneRef.current?.setScreen('title');
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundFx.setMuted(next);
      if (!next) soundFx.playClick();
      return next;
    });
  }, []);

  // Sync body[data-state] for accessibility and verification
  useEffect(() => {
    document.body.dataset.state = screen;
  }, [screen]);

  // Pause background 3D loop while modal overlays cover the viewport
  useEffect(() => {
    sceneRef.current?.setModalOpen(studyOpen || screen === 'gameover' || screen === 'paused');
  }, [studyOpen, screen]);

  // Mount Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const meadow = new MeadowScene(mountRef.current, {
      onPlantPulled: handlePlantPulled,
      onTimerTick: handleTimerTick,
      onExamFinished: handleExamFinished,
    });
    sceneRef.current = meadow;

    // Support ?autostart=1 to jump directly into active gameplay
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const fresh = createInitialExamStats();
      statsRef.current = fresh;
      setStats(fresh);
      setRemainingSeconds(EXAM_DURATION_SECONDS);
      setScreen('playing');
      meadow.setScreen('playing');
      meadow.startNewExamRound();
    }

    return () => {
      meadow.dispose();
      sceneRef.current = null;
    };
  }, [handleExamFinished, handlePlantPulled, handleTimerTick]);

  // Global keyboard shortcuts (Enter/Space to start, Escape/P to pause/resume)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (studyOpen) {
        if (e.key === 'Escape') {
          setStudyOpen(false);
        }
        return;
      }

      if (screenRef.current === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startExam();
      } else if (screenRef.current === 'playing' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        pauseExam();
      } else if (screenRef.current === 'paused' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        resumeExam();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pauseExam, resumeExam, startExam, studyOpen]);

  const currentGrade = computeGrade(stats.score);

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#dfecd4]">
      {/* Isolated Three.js WebGL Mount */}
      <div
        ref={mountRef}
        data-testid="meadow-canvas-container"
        className="absolute inset-0 h-full w-full"
      />

      {screen === 'title' && !studyOpen && (
        <TitleOverlay
          muted={muted}
          onToggleMute={toggleMute}
          onOpenStudy={() => {
            soundFx.playClick();
            setStudyOpen(true);
          }}
          onStartExam={startExam}
        />
      )}

      {screen === 'playing' && (
        <PlayingHud
          score={stats.score}
          combo={stats.combo}
          grade={currentGrade}
          remainingSeconds={remainingSeconds}
          feedbacks={feedbacks}
          onPause={pauseExam}
        />
      )}

      {screen === 'paused' && (
        <PauseModal
          score={stats.score}
          remainingSeconds={remainingSeconds}
          onResume={resumeExam}
          onRestart={startExam}
          onGoHome={goHome}
        />
      )}

      {screen === 'gameover' && !studyOpen && (
        <CertificateModal
          stats={stats}
          muted={muted}
          onToggleMute={toggleMute}
          onOpenStudy={() => {
            soundFx.playClick();
            setStudyOpen(true);
          }}
          onRetry={startExam}
          onGoHome={goHome}
        />
      )}

      {studyOpen && (
        <StudyModal
          onClose={() => {
            soundFx.playClick();
            setStudyOpen(false);
          }}
          onStartExam={startExam}
          showStartCta={screen === 'title'}
        />
      )}
    </main>
  );
}
