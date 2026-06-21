import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Plus } from 'lucide-react';
import { Exam } from '../types';

interface ExamFormProps {
    exam?: Exam | null;
    onSave: (exam: Exam) => void;
    onDelete?: (courseCode: string) => void;
    onClose: () => void;
}

const URGENCY_OPTIONS: Exam['urgency'][] = ['EXTREME', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const ExamForm: React.FC<ExamFormProps> = ({ exam, onSave, onDelete, onClose }) => {
    const [form, setForm] = useState<Exam>({
        course_code: '',
        course_name: '',
        date: '',
        time: '09:00',
        duration: '3h',
        venue: '',
        urgency: 'MEDIUM',
        notes: '',
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (exam) {
            setForm({ ...exam });
        }
    }, [exam]);

    const isEditing = !!exam;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.course_code.trim() || !form.course_name.trim() || !form.date) return;
        onSave(form);
    };

    const handleDelete = () => {
        if (exam && onDelete) {
            onDelete(exam.course_code);
        }
    };

    return (
        <div className="bg-surface border border-gray-700 p-4 md:p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest font-mono flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Save size={14} className="text-safe" />
                            Edit Exam
                        </>
                    ) : (
                        <>
                            <Plus size={14} className="text-safe" />
                            Add Exam
                        </>
                    )}
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-gray-500 hover:text-white active:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Course Code + Urgency — side by side even on mobile */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Code *</label>
                        <input
                            type="text"
                            value={form.course_code}
                            onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                            placeholder="ICE 502"
                            disabled={isEditing}
                            className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Urgency *</label>
                        <select
                            value={form.urgency}
                            onChange={(e) => setForm({ ...form, urgency: e.target.value as Exam['urgency'] })}
                            className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none appearance-none"
                        >
                            {URGENCY_OPTIONS.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Course Name — full width */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Course Name *</label>
                    <input
                        type="text"
                        value={form.course_name}
                        onChange={(e) => setForm({ ...form, course_name: e.target.value })}
                        placeholder="Reliability & Maintenance Engineering"
                        className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none"
                    />
                </div>

                {/* Date + Time — 2 col on mobile, Duration below */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Date *</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Time *</label>
                        <input
                            type="time"
                            value={form.time}
                            onChange={(e) => setForm({ ...form, time: e.target.value })}
                            className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none"
                        />
                    </div>
                </div>

                {/* Duration + Venue — 2 col */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Duration</label>
                        <input
                            type="text"
                            value={form.duration}
                            onChange={(e) => setForm({ ...form, duration: e.target.value })}
                            placeholder="3h"
                            className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Venue</label>
                        <input
                            type="text"
                            value={form.venue}
                            onChange={(e) => setForm({ ...form, venue: e.target.value })}
                            placeholder="LR 202"
                            className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none"
                        />
                    </div>
                </div>

                {/* Notes — full width */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Notes</label>
                    <input
                        type="text"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Optional notes..."
                        className="bg-void border border-gray-700 text-white px-3 py-3 text-sm font-mono rounded-none focus:border-safe focus:outline-none"
                    />
                </div>

                {/* Actions — stacked on mobile for easy thumb reach */}
                <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-gray-800">
                    <button
                        type="submit"
                        className="w-full py-3.5 border-2 border-safe text-safe text-xs font-mono uppercase tracking-widest font-bold hover:bg-safe/10 active:bg-safe/20 transition-colors"
                    >
                        {isEditing ? 'Save Changes' : 'Add Exam'}
                    </button>

                    {isEditing && onDelete && (
                        <>
                            {showDeleteConfirm ? (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex-1 py-3 bg-panic/10 border border-panic text-panic text-xs font-mono uppercase tracking-wider font-bold active:bg-panic/20 transition-colors"
                                    >
                                        Confirm Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-3 border border-gray-700 text-gray-400 text-xs font-mono uppercase tracking-wider active:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-3 flex items-center justify-center gap-2 border border-gray-700 text-gray-500 text-xs font-mono uppercase tracking-wider hover:border-panic hover:text-panic active:bg-panic/10 transition-colors"
                                >
                                    <Trash2 size={14} /> Delete Exam
                                </button>
                            )}
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};
