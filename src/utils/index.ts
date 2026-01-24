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
        // "Subtract 8 hours of sleep per day"
        // We calculate how many 24-hour chunks exist and subtract 8h for each.
        // This is equivalent to multiplying by (16/24) or 2/3.
        const studyRatio = 16 / 24;
        effectiveSeconds = Math.floor(effectiveSeconds * studyRatio);
    }

    // For the UI blocks, we still want to show them in a way that feels natural.
    // In "Study Mode", a "Day" is now a 16-hour session of potential studying.
    const secondsInStudyDay = 16 * 3600;
    const secondsInRealDay = 24 * 3600;

    const divisor = sleepAdjusted ? secondsInStudyDay : secondsInRealDay;

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
