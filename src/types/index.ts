export interface Exam {
    course_code: string;
    course_name: string;
    date: string;
    time: string;
    duration: string;
    venue: string;
    urgency: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'CRITICAL' | 'LOW';
    notes: string;
}

export interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalHours: number;
    isLate: boolean;
}

export type ThemeState = 'panic' | 'caution' | 'safe';

export interface SleepSchedule {
    bedtime: string;   // "23:00" format
    wakeTime: string;  // "07:00" format
}

export interface PomodoroState {
    isRunning: boolean;
    mode: 'focus' | 'break';
    secondsLeft: number;
    sessionsCompleted: number;
    targetExamCode: string | null;
}

export interface PomodoroSettings {
    focusMinutes: number;
    breakMinutes: number;
}

export interface StudyAllocation {
    course_code: string;
    course_name: string;
    hoursPerDay: number;
    totalHoursAvailable: number;
    urgencyWeight: number;
}

export interface UserPreferences {
    sleepSchedule: SleepSchedule;
    pomodoroSettings: PomodoroSettings;
    triageMode: boolean;
    sleepMode: boolean;
}
