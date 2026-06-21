import React, { useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';
import { PomodoroState, PomodoroSettings } from '../types';

interface PomodoroTimerProps {
    state: PomodoroState;
    settings: PomodoroSettings;
    onStateChange: (state: PomodoroState) => void;
    examName?: string;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
    state,
    settings,
    onStateChange,
    examName,
}) => {
    const { isRunning, mode, secondsLeft, sessionsCompleted } = state;

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            if (state.secondsLeft <= 1) {
                // Timer finished — switch modes
                const nextMode = mode === 'focus' ? 'break' : 'focus';
                const nextSessions = mode === 'focus' ? sessionsCompleted + 1 : sessionsCompleted;
                const nextSeconds = nextMode === 'focus'
                    ? settings.focusMinutes * 60
                    : settings.breakMinutes * 60;
                onStateChange({
                    ...state,
                    mode: nextMode,
                    secondsLeft: nextSeconds,
                    sessionsCompleted: nextSessions,
                    isRunning: false,
                });
            } else {
                onStateChange({ ...state, secondsLeft: state.secondsLeft - 1 });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning, state, mode, sessionsCompleted, settings, onStateChange]);

    const toggle = useCallback(() => {
        onStateChange({ ...state, isRunning: !isRunning });
    }, [state, isRunning, onStateChange]);

    const reset = useCallback(() => {
        onStateChange({
            ...state,
            isRunning: false,
            mode: 'focus',
            secondsLeft: settings.focusMinutes * 60,
        });
    }, [state, settings, onStateChange]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const progress = mode === 'focus'
        ? 1 - (secondsLeft / (settings.focusMinutes * 60))
        : 1 - (secondsLeft / (settings.breakMinutes * 60));

    return (
        <div className="border border-gray-800 bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {mode === 'focus' ? (
                        <Zap size={14} className="text-panic" />
                    ) : (
                        <Coffee size={14} className="text-safe" />
                    )}
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono font-bold">
                        {mode === 'focus' ? 'Focus Mode' : 'Break Time'}
                    </span>
                </div>
                <span className="text-[10px] font-mono text-gray-600">
                    Sessions: {sessionsCompleted}
                </span>
            </div>

            {examName && (
                <div className="text-[10px] font-mono text-gray-500 mb-2 truncate">
                    Studying: {examName}
                </div>
            )}

            {/* Progress bar */}
            <div className="w-full h-1 bg-gray-800 mb-4 overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ${mode === 'focus' ? 'bg-panic' : 'bg-safe'}`}
                    style={{ width: `${progress * 100}%` }}
                />
            </div>

            {/* Timer display */}
            <div className="text-center mb-4">
                <span className={`text-4xl font-mono font-bold tabular-nums ${mode === 'focus' ? 'text-white' : 'text-safe'}`}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={toggle}
                    className={`p-3 border ${isRunning ? 'border-panic text-panic hover:bg-panic/10' : 'border-safe text-safe hover:bg-safe/10'} transition-colors`}
                >
                    {isRunning ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                    onClick={reset}
                    className="p-3 border border-gray-700 text-gray-500 hover:border-white hover:text-white transition-colors"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>
    );
};
