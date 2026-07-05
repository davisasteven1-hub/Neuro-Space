import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Exam } from '../types';

interface ExamFormProps {
  exam: Exam | null;
  onSave: (exam: Exam) => void;
  onDelete?: (courseCode: string) => void;
  onClose: () => void;
}

const URGENCY_OPTIONS: Exam['urgency'][] = ['EXTREME', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

const inputClass =
  'bg-void border border-gray-700 px-2 py-1.5 text-sm font-mono text-gray-200 outline-none focus:border-safe w-full disabled:opacity-50';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] uppercase text-gray-500 font-mono">{label}</label>
    {children}
  </div>
);

export const ExamForm: React.FC<ExamFormProps> = ({ exam, onSave, onDelete, onClose }) => {
  const [courseCode, setCourseCode] = useState(exam?.course_code ?? '');
  const [courseName, setCourseName] = useState(exam?.course_name ?? '');
  const [date, setDate] = useState(exam?.date ?? '');
  const [time, setTime] = useState(exam?.time ?? '');
  const [duration, setDuration] = useState(exam?.duration ?? '3 hours');
  const [urgency, setUrgency] = useState<Exam['urgency']>(exam?.urgency ?? 'HIGH');
  const [venue, setVenue] = useState(exam?.venue ?? '');
  const [notes, setNotes] = useState(exam?.notes ?? '');
  const [error, setError] = useState('');

  const isEditing = !!exam;

  const handleSubmit = () => {
    if (!courseCode.trim() || !courseName.trim() || !date || !time || !venue.trim()) {
      setError('Course code, name, date, time, and venue are all required.');
      return;
    }
    const payload: Exam = {
      ...(exam ?? {}),
      course_code: courseCode.trim(),
      course_name: courseName.trim(),
      date,
      time,
      duration: duration.trim() || '3 hours',
      urgency,
      venue: venue.trim(),
      notes: notes.trim() || undefined,
    } as Exam;
    onSave(payload);
  };

  return (
    <div className="border-2 border-gray-700 bg-surface p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs uppercase tracking-widest font-mono text-gray-300 font-bold">
          {isEditing ? `Edit ${exam!.course_code}` : 'Add Exam'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Course Code">
          <input
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            disabled={isEditing}
            className={inputClass}
            placeholder="CS301"
          />
        </Field>
        <Field label="Urgency">
          <select value={urgency} onChange={(e) => setUrgency(e.target.value as Exam['urgency'])} className={inputClass}>
            {URGENCY_OPTIONS.map((u) => (
              <option key={u} value={u} className="bg-surface">
                {u}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Course Name">
        <input value={courseName} onChange={(e) => setCourseName(e.target.value)} className={inputClass} placeholder="Data Structures" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Time">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration">
          <input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} placeholder="3 hours" />
        </Field>
        <Field label="Venue">
          <input value={venue} onChange={(e) => setVenue(e.target.value)} className={inputClass} placeholder="Hall B" />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Bring calculator..." />
      </Field>

      {error && <p className="text-panic text-[11px] font-mono">{error}</p>}

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSubmit}
          className="flex-1 py-2 border border-gray-700 text-gray-300 hover:border-safe hover:text-safe font-mono text-[10px] uppercase tracking-widest"
        >
          {isEditing ? 'Save Changes' : 'Add Exam'}
        </button>
        {isEditing && onDelete && (
          <button
            onClick={() => onDelete(exam!.course_code)}
            className="px-4 py-2 border border-panic/40 text-panic hover:bg-panic/10 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1"
          >
            <Trash2 size={12} /> Delete
          </button>
        )}
      </div>
    </div>
  );
};