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
