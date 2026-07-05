import { TimeRemaining, Exam, SleepSchedule, StudyAllocation } from '../types';

export const parseExamDate = (date: string, time: string): Date => {
  return new Date(`${date}T${time}:00+01:00`);
};

export const getExamEndDate = (exam: Exam): Date => {
  const start = parseExamDate(exam.date, exam.time);
  const durationHours = parseInt(exam.duration.split(' ')[0]) || 3;
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
};

export const getSleepHours = (schedule: SleepSchedule): number => {
  const [bedH, bedM] = schedule.bedtime.split(':').map(Number);
  const [wakeH, wakeM] = schedule.wakeTime.split(':').map(Number);
  const bedMinutes = bedH * 60 + bedM;
  const wakeMinutes = wakeH * 60 + wakeM;
  if (wakeMinutes <= bedMinutes) {
    return (1440 - bedMinutes + wakeMinutes) / 60;
  }
  return (wakeMinutes - bedMinutes) / 60;
};

export const calculateTimeRemaining = (
  targetDate: Date,
  sleepAdjusted: boolean,
  schedule?: SleepSchedule
): TimeRemaining => {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalHours: 0, isLate: true };
  }

  const totalHoursReal = diffMs / (1000 * 60 * 60);
  let effectiveSeconds = Math.floor(diffMs / 1000);

  if (sleepAdjusted) {
    const sleepHours = schedule ? getSleepHours(schedule) : 8;
    const studyRatio = (24 - sleepHours) / 24;
    effectiveSeconds = Math.floor(effectiveSeconds * studyRatio);
  }

  const divisor = 24 * 3600;
  const days = Math.floor(effectiveSeconds / divisor);
  const hours = Math.floor((effectiveSeconds % divisor) / 3600);
  const minutes = Math.floor((effectiveSeconds % 3600) / 60);
  const seconds = Math.floor(effectiveSeconds % 60);

  return { days, hours, minutes, seconds, totalHours: totalHoursReal, isLate: false };
};

const URGENCY_WEIGHTS: Record<string, number> = {
  EXTREME: 5,
  CRITICAL: 4,
  HIGH: 3,
  MODERATE: 2,
  LOW: 1,
};

export const calculateStudyAllocations = (
  exams: Exam[],
  schedule: SleepSchedule
): StudyAllocation[] => {
  const now = new Date();
  const futureExams = exams
    .filter((e) => parseExamDate(e.date, e.time) > now)
    .sort((a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime());

  if (futureExams.length === 0) return [];

  const sleepHours = getSleepHours(schedule);
  const availableHoursPerDay = Math.max(0, 24 - sleepHours);

  const allocations: StudyAllocation[] = futureExams.map((exam) => {
    const examDate = parseExamDate(exam.date, exam.time);
    const daysUntil = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalStudyHours = daysUntil * availableHoursPerDay;
    const weight = URGENCY_WEIGHTS[exam.urgency] || 1;

    return {
      course_code: exam.course_code,
      course_name: exam.course_name,
      hoursPerDay: 0,
      totalHoursAvailable: totalStudyHours,
      urgencyWeight: weight,
    };
  });

  const totalWeight = allocations.reduce((sum, a) => sum + a.urgencyWeight, 0) || 1;
  allocations.forEach((a) => {
    a.hoursPerDay = Math.round((a.urgencyWeight / totalWeight) * availableHoursPerDay * 10) / 10;
  });

  return allocations;
};

export const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'EXTREME':
    case 'CRITICAL':
      return 'text-panic border-panic';
    case 'HIGH':
      return 'text-caution border-caution';
    case 'MODERATE':
      return 'text-yellow-500 border-yellow-500';
    default:
      return 'text-safe border-safe';
  }
};

export const getUrgencyBg = (urgency: string) => {
  switch (urgency) {
    case 'EXTREME':
      return 'bg-panic/10';
    case 'CRITICAL':
      return 'bg-panic/5';
    case 'HIGH':
      return 'bg-caution/5';
    default:
      return 'bg-safe/5';
  }
};