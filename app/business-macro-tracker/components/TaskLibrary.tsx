import React, { useState } from 'react';
import { X, Search, Clock, Plus, Tag, PenSquare } from 'lucide-react';
import { TASK_LIBRARY, CATEGORY_BG, CATEGORY_COLORS } from '../constants';
import { TaskTemplate, Category } from '../types';

interface TaskLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (task: TaskTemplate, duration: number, unit: string, shouldEdit?: boolean) => void;
}

const TaskLibrary: React.FC<TaskLibraryProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [customDuration, setCustomDuration] = useState<Record<string, number>>({});
  const [customUnit, setCustomUnit] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const filteredTasks = TASK_LIBRARY.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.scores[selectedCategory] >= 3; 
    return matchesSearch && matchesCategory;
  });

  const getDominantCategory = (task: TaskTemplate): { label: string, color: string } | null => {
    let maxScore = 0;
    let maxCat: string | null = null;
    Object.entries(task.scores).forEach(([cat, score]) => {
      if (score > maxScore) {
        maxScore = score;
        maxCat = cat;
      }
    });
    if (!maxCat) return null;
    // @ts-ignore
    return { label: maxCat, color: CATEGORY_COLORS[maxCat] };
  };

  const handleDurationChange = (id: string, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
      setCustomDuration(prev => ({ ...prev, [id]: num }));
    }
  };

  const handleUnitChange = (id: string, val: string) => {
    setCustomUnit(prev => ({ ...prev, [id]: val }));
  };

  const handleCustomTask = () => {
    const newTask: TaskTemplate = {
        id: 'custom-new',
        title: 'Nieuwe Activiteit',
        defaultMinutes: 60,
        scores: { control: 1, reports: 1, admin: 1, network: 1 }
    };
    onSelect(newTask, 60, '', true); // true = shouldEdit
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100">Bibliotheek</h2>
          <div className="flex items-center gap-2">
            <button 
                onClick={handleCustomTask}
                className="bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
            >
                <PenSquare size={14} />
                + Eigen Taak
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 bg-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Zoek activiteit..." 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(['all', 'control', 'reports', 'admin', 'network'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat === 'all' ? 'Alles' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTasks.map(task => {
            const domCat = getDominantCategory(task);
            const duration = customDuration[task.id] ?? task.defaultMinutes;
            const unit = customUnit[task.id] ?? '';

            return (
              <div key={task.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col gap-3 hover:border-slate-600 transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-200">{task.title}</h3>
                    <div className="flex gap-2 mt-1.5">
                      {domCat && (
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${domCat.color}`}>
                          {domCat.label} Focus
                        </span>
                      )}
                      {/* Macro bars (1-5 scale) */}
                      <div className="flex items-center gap-1 ml-2">
                        {Object.entries(task.scores).map(([cat, score]) => (
                             // @ts-ignore
                             <div key={cat} className="flex flex-col justify-end h-3 w-1 bg-slate-700 rounded-sm" title={`${cat}: ${score}`}>
                                {/* @ts-ignore */}
                                <div className={`w-full rounded-sm ${CATEGORY_BG[cat]}`} style={{height: `${(score/5)*100}%`}}></div>
                             </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        onSelect(task, duration, unit);
                        onClose();
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-transform"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                    <Clock size={14} className="text-slate-400"/>
                    <input 
                      type="number" 
                      className="bg-transparent w-12 text-center text-sm text-white focus:outline-none"
                      value={duration}
                      onChange={(e) => handleDurationChange(task.id, e.target.value)}
                    />
                    <span className="text-xs text-slate-500">min</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50 flex-1">
                    <Tag size={14} className="text-slate-400"/>
                    <input 
                      type="text" 
                      className="bg-transparent w-full text-sm text-white focus:outline-none placeholder:text-slate-600"
                      placeholder="Eenheid (optioneel)"
                      value={unit}
                      onChange={(e) => handleUnitChange(task.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredTasks.length === 0 && (
             <div className="text-center py-10 text-slate-500">
               Geen activiteiten gevonden.
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TaskLibrary;
