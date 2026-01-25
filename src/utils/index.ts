import { TimeRemaining, Exam } from '../types';

export const parseExamDate = (date: string, time: string): Date => {
    // Explicitly set to UTC+1 as requested
    return new Date(`${date}T${time}:00+01:00`);
};

export const getExamEndDate = (exam: Exam): Date => {
    const start = parseExamDate(exam.date, exam.time);
    const durationHours = parseInt(exam.duration.split(' ')[0]) || 3;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return end;
};

export const calculateTimeRemaining = (targetDate: Date, sleepAdjusted: boolean): TimeRemaining => {
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();

    if (diffMs <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalHours: 0, isLate: true };
    }

    const totalHoursReal = diffMs / (1000 * 60 * 60);
    let effectiveSeconds = Math.floor(diffMs / 1000);

    if (sleepAdjusted) {
        // Direct Subtraction Logic:
        // We subtract 8 hours for every 24-hour cycle.
        // This means we only count 2/3 of the actual time as "available".
        const studyRatio = 2 / 3; // (24-8)/24
        effectiveSeconds = Math.floor(effectiveSeconds * studyRatio);
    }

    // Always use standard real-world units for display (1 day = 24 hours)
    // This makes the "lost" sleep hours visible (e.g., 48h real becomes 1d 8h study)
    const divisor = 24 * 3600;

    const days = Math.floor(effectiveSeconds / divisor);
    const hours = Math.floor((effectiveSeconds % divisor) / 3600);
    const minutes = Math.floor((effectiveSeconds % 3600) / 60);
    const seconds = Math.floor(effectiveSeconds % 60);

    return { days, hours, minutes, seconds, totalHours: totalHoursReal, isLate: false };
};

export const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
        case 'EXTREME': return 'text-panic border-panic';
        case 'CRITICAL': return 'text-panic border-panic';
        case 'HIGH': return 'text-caution border-caution';
        case 'MEDIUM': return 'text-yellow-500 border-yellow-500';
        default: return 'text-safe border-safe';
    }
};

export const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
        case 'EXTREME': return 'bg-panic/10';
        case 'CRITICAL': return 'bg-panic/5';
        case 'HIGH': return 'bg-caution/5';
        default: return 'bg-safe/5';
    }
};
