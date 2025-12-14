import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { TaskLog, CategoryScores } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_BG } from '../constants';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskLog | null;
  onSave: (updatedTask: TaskLog) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, onSave }) => {
  const [editedTask, setEditedTask] = useState<TaskLog | null>(null);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!isOpen || !editedTask) return null;

  const handleScoreChange = (category: keyof CategoryScores, value: number) => {
    setEditedTask({
        ...editedTask,
        scores: {
            ...editedTask.scores,
            [category]: value
        }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100">Taak Bewerken</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto">
            {/* Title */}
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Omschrijving</label>
                <input 
                    type="text" 
                    value={editedTask.title}
                    onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Time */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Tijd (minuten)</label>
                    <input 
                        type="number" 
                        value={editedTask.minutes}
                        onChange={(e) => setEditedTask({...editedTask, minutes: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
                 {/* Unit */}
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Eenheid</label>
                    <input 
                        type="text" 
                        value={editedTask.unit || ''}
                        placeholder="bv. 1 rapport"
                        onChange={(e) => setEditedTask({...editedTask, unit: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Macros */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-4 border-b border-slate-700/50 pb-2">
                    Punten per Uur (1-5)
                </label>
                <div className="space-y-5">
                    {(Object.keys(CATEGORY_LABELS) as Array<keyof CategoryScores>).map((cat) => (
                        <div key={cat} className="space-y-2">
                             <div className="flex justify-between text-xs items-center">
                                 <span className={`${CATEGORY_COLORS[cat]} font-semibold`}>{CATEGORY_LABELS[cat]}</span>
                             </div>
                             {/* 1-5 Button Selector */}
                             <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((score) => {
                                    const isSelected = editedTask.scores[cat] === score;
                                    return (
                                        <button
                                            key={score}
                                            onClick={() => handleScoreChange(cat, score)}
                                            className={`
                                                flex-1 py-2 rounded-md text-xs font-bold border transition-all
                                                ${isSelected 
                                                    ? `${CATEGORY_BG[cat]} text-white border-transparent shadow-lg shadow-black/20 scale-105 z-10` 
                                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600 hover:bg-slate-800'
                                                }
                                            `}
                                        >
                                            {score}
                                        </button>
                                    );
                                })}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-xl">
            <button 
                onClick={() => {
                    onSave(editedTask);
                    onClose();
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
                <Save size={18} />
                Wijzigingen Opslaan
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
