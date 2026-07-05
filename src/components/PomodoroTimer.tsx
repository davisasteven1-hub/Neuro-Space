import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { PomodoroState, PomodoroSettings } from '../types';

interface PomodoroTimerProps {
  state: PomodoroState;
  settings: PomodoroSettings;
  onStateChange: (state: PomodoroState) => void;
  examName?: string;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ state, settings, onStateChange, examName }) => {
  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => {
      if (state.secondsLeft <= 1) {
        const nextMode = state.mode === 'focus' ? 'break' : 'focus';
        const nextSeconds = nextMode === 'focus' ? settings.focusMinutes * 60 : settings.breakMinutes * 60;
        onStateChange({
          ...state,
          mode: nextMode,
          secondsLeft: nextSeconds,
          sessionsCompleted: state.mode === 'focus' ? state.sessionsCompleted + 1 : state.sessionsCompleted,
        });
      } else {
        onStateChange({ ...state, secondsLeft: state.secondsLeft - 1 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state, settings, onStateChange]);

  const toggle = () => onStateChange({ ...state, isRunning: !state.isRunning });
  const reset = () =>
    onStateChange({
      isRunning: false,
      mode: 'focus',
      secondsLeft: settings.focusMinutes * 60,
      sessionsCompleted: 0,
      targetExamCode: state.targetExamCode,
    });

  const minutes = Math.floor(state.secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (state.secondsLeft % 60).toString().padStart(2, '0');

  return (
    <div className="border-2 border-gray-700 bg-surface p-4 flex flex-col items-center gap-3">
      <h3 className="text-xs uppercase tracking-widest font-mono text-gray-300 font-bold self-start">
        Pomodoro{examName ? ` — ${examName}` : ''}
      </h3>
      <span className={`text-5xl font-mono font-bold ${state.mode === 'focus' ? 'text-white' : 'text-safe'}`}>
        {minutes}:{seconds}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
        {state.mode === 'focus' ? 'Focus' : 'Break'} · {state.sessionsCompleted} sessions done
      </span>
      <div className="flex gap-2">
        <button
          onClick={toggle}
          className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe font-mono text-[10px] uppercase flex items-center gap-1"
        >
          {state.isRunning ? <Pause size={12} /> : <Play size={12} />} {state.isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white font-mono text-[10px] uppercase flex items-center gap-1"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
};