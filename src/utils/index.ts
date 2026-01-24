import { TimeRemaining, Exam } from '../types';

export const parseExamDate = (date: string, time: string): Date => {
    return new Date(`${date}T${time}:00`);
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

    let totalSeconds = Math.floor(diffMs / 1000);
    let days = Math.floor(totalSeconds / (3600 * 24));
    let hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    const totalHoursReal = diffMs / (1000 * 60 * 60);

    if (sleepAdjusted) {
        const awakeRatio = 16 / 24;
        const adjustedTotalSeconds = totalSeconds * awakeRatio;

        days = Math.floor(adjustedTotalSeconds / (3600 * 16));
        const remainingSeconds = adjustedTotalSeconds % (3600 * 16);
        hours = Math.floor(remainingSeconds / 3600);
        minutes = Math.floor((remainingSeconds % 3600) / 60);
        seconds = Math.floor(remainingSeconds % 60);
    }

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
