import { useState, useEffect } from 'react';
import { Exam } from '../types';
import { EXAM_DATA } from '../constants';

const STORAGE_KEY = 'exams';

export function useExamStorage(): [Exam[], React.Dispatch<React.SetStateAction<Exam[]>>, boolean] {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setExams(raw ? (JSON.parse(raw) as Exam[]) : EXAM_DATA);
    } catch {
      setExams(EXAM_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
    } catch {
      // ignore
    }
  }, [exams, loading]);

  return [exams, setExams, loading];
}