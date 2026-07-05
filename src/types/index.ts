export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Exam {
  course_code: string;
  course_name: string;
  date: string;       // YYYY-MM-DD
  time: string;        // HH:MM (24hr)
  duration: string;    // e.g. "3 hours"
  urgency: 'EXTREME' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  venue: string;
  notes?: string;
  difficulty?: 1 | 2 | 3 | 4;
  checklist?: ChecklistItem[];
  createdAt?: string;
}

export interface SleepSchedule {
  bedtime: string;
  wakeTime: string;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  isLate: boolean;
}

export interface StudyAllocation {
  course_code: string;
  course_name: string;
  hoursPerDay: number;
  totalHoursAvailable: number;
  urgencyWeight: number;
}

export type ThemeState = 'panic' | 'caution' | 'safe';

export interface PomodoroSettings {
  focusMinutes: number;
  breakMinutes: number;
}

export interface PomodoroState {
  isRunning: boolean;
  mode: 'focus' | 'break';
  secondsLeft: number;
  sessionsCompleted: number;
  targetExamCode: string | null;
}