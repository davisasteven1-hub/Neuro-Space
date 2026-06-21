import { useState, useEffect, useCallback, useRef } from 'react';
import { Exam } from '../types';
import { EXAM_DATA } from '../constants';

export function useExamStorage(): [Exam[], (value: Exam[] | ((prev: Exam[]) => Exam[])) => void, boolean] {
    const [exams, setExamsState] = useState<Exam[]>(EXAM_DATA);
    const [loading, setLoading] = useState(true);
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load from JSON file on mount
    useEffect(() => {
        fetch('/api/exams')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((data: Exam[]) => {
                setExamsState(data);
                setLoading(false);
            })
            .catch(() => {
                // Fallback to constants if API unavailable (e.g. static hosting)
                setExamsState(EXAM_DATA);
                setLoading(false);
            });
    }, []);

    // Save to JSON file (debounced 500ms to avoid excessive writes)
    const persistToFile = useCallback((data: Exam[]) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            fetch('/api/exams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data, null, 4),
            }).catch(() => {
                // Silent fail — file write unavailable
            });
        }, 500);
    }, []);

    const setExams = useCallback((value: Exam[] | ((prev: Exam[]) => Exam[])) => {
        setExamsState(prev => {
            const next = typeof value === 'function' ? value(prev) : value;
            persistToFile(next);
            return next;
        });
    }, [persistToFile]);

    return [exams, setExams, loading];
}
