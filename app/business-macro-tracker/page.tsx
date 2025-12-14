'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Settings, 
  PlusCircle, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Briefcase,
  Zap,
  Clock,
  Pencil,
  Copy
} from 'lucide-react';
import MacroRing from './components/MacroRing';
import TaskLibrary from './components/TaskLibrary';
import EditTaskModal from './components/EditTaskModal';
import { Category, TaskLog, UserSettings, TaskTemplate, CategoryScores, ViewMode } from './types';
import { DEFAULT_SETTINGS, CATEGORY_COLORS, PLANS, CATEGORY_LABELS, BASELINE_POINTS_PER_HOUR } from './constants';
import HomeButton from '../components/HomeButton';

// --- Helpers ---

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const generateId = () => Math.random().toString(36).substring(2, 9);

const getWeekDateRange = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(new Date(date).setDate(diff));
  
  const dates: string[] = [];
  for (let i = 0; i < 5; i++) { // Business week (Mon-Fri)
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// --- App Component ---

const BusinessMacroTrackerPage: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<TaskLog[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bizfit_tasks');
        return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bizfit_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  const [viewDate, setViewDate] = useState<string>(getTodayDateString());
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskLog | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('bizfit_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('bizfit_settings', JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Derived Data
  const dailyTasks = useMemo(() => {
    return tasks.filter(t => t.date === viewDate);
  }, [tasks, viewDate]);

  // CORE LOGIC: Points = (Minutes / 60) * Score
  const calculatePoints = (task: TaskLog) => {
    const hours = task.minutes / 60;
    return {
      control: hours * task.scores.control,
      reports: hours * task.scores.reports,
      admin: hours * task.scores.admin,
      network: hours * task.scores.network
    };
  };

  // Stats Calculation (Daily)
  const stats = useMemo(() => {
    const categoryPoints: CategoryScores = { control: 0, admin: 0, network: 0, reports: 0 };
    let totalMinutesConsumed = 0;

    dailyTasks.forEach(task => {
      totalMinutesConsumed += task.minutes;
      const p = calculatePoints(task);
      
      categoryPoints.control += p.control;
      categoryPoints.admin += p.admin;
      categoryPoints.network += p.network;
      categoryPoints.reports += p.reports;
    });

    return { categoryPoints, totalMinutesConsumed };
  }, [dailyTasks]);

  // Stats Calculation (Weekly)
  const weekStats = useMemo(() => {
    const weekDates = getWeekDateRange(viewDate);
    const weekTasks = tasks.filter(t => weekDates.includes(t.date));
    
    const categoryPoints: CategoryScores = { control: 0, admin: 0, network: 0, reports: 0 };
    let totalMinutesConsumed = 0;
    let completedTasksCount = 0;

    weekTasks.forEach(task => {
      totalMinutesConsumed += task.minutes;
      if(task.isCompleted) completedTasksCount++;
      const p = calculatePoints(task);
      
      categoryPoints.control += p.control;
      categoryPoints.admin += p.admin;
      categoryPoints.network += p.network;
      categoryPoints.reports += p.reports;
    });

    return { categoryPoints, totalMinutesConsumed, weekDates, taskCount: weekTasks.length, completedTasksCount };
  }, [tasks, viewDate]);

  // Calculate Targets (Based on Time Budget & Plan %)
  // Logic: Total Potential Points = BudgetHours * BaselinePointsPerHour(3). 
  // Category Target = Total Potential Points * PlanPercentage.
  const getTargets = (isWeekly: boolean) => {
    const budgetHours = isWeekly ? settings.weeklyBudgetHours : settings.dailyBudgetHours;
    const totalPointsCapacity = budgetHours * BASELINE_POINTS_PER_HOUR; 
    
    return {
      control: totalPointsCapacity * settings.targets.control,
      reports: totalPointsCapacity * settings.targets.reports,
      admin: totalPointsCapacity * settings.targets.admin,
      network: totalPointsCapacity * settings.targets.network,
    };
  };

  // Analysis AI Logic
  const getAiAnalysis = () => {
    if (dailyTasks.length === 0) return "Dagplanning is leeg. Start met het invoeren van je kernactiviteiten.";
    
    const dailyBudgetMins = settings.dailyBudgetHours * 60;
    const consumptionRate = stats.totalMinutesConsumed / dailyBudgetMins;
    
    if (consumptionRate > 1.1) return "Waarschuwing: Dagbudget overschreden. Prioriteer kritieke taken en delegeer de rest.";
    
    // Check balance based on plan
    const targets = getTargets(false);
    let maxGap = 0;
    let gapCategory = '';
    
    (Object.keys(targets) as Array<keyof CategoryScores>).forEach(cat => {
       const diff = targets[cat] - stats.categoryPoints[cat];
       if (diff > maxGap) {
         maxGap = diff;
         gapCategory = CATEGORY_LABELS[cat];
       }
    });

    if (maxGap > 3 && consumptionRate > 0.5) {
      return `Balans alert: ${gapCategory} blijft achter op planning. Plan een specifiek blok hiervoor in.`;
    }
    
    if (consumptionRate < 0.5) return "Capaciteit beschikbaar. Goed moment voor strategische deep-dives.";
    
    return "Planning is in balans. Focus op uitvoering.";
  };

  // Handlers
  const handleAddTask = (template: TaskTemplate, duration: number, unit: string, shouldEdit: boolean = false) => {
    const newTask: TaskLog = {
      id: generateId(),
      templateId: template.id,
      title: template.title,
      minutes: duration,
      unit: unit,
      scores: template.scores,
      date: viewDate,
      isCompleted: false, 
    };
    setTasks(prev => [...prev, newTask]);
    
    if (shouldEdit) {
        // Small delay to ensure modal opens after state update
        setTimeout(() => setEditingTask(newTask), 50);
    }
  };

  const handleDuplicateTask = (task: TaskLog) => {
    const newTask = { ...task, id: generateId(), isCompleted: false };
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = (updatedTask: TaskLog) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const changeDate = (offset: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + offset);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const applyPlan = (planName: string) => {
    const plan = PLANS[planName];
    if (plan) {
      setSettings(prev => ({ ...prev, targets: plan }));
      setViewMode('dashboard');
    }
  };

  // Render Helpers
  const renderRing = (
    category: Category, 
    label: string, 
    colorClass: string, 
    currentPoints: number, 
    targetPoints: number
  ) => {
    const percentage = targetPoints > 0 ? (currentPoints / targetPoints) * 100 : 0;
    
    return (
      <MacroRing 
        key={category}
        label={label} 
        percentage={percentage} 
        colorClass={colorClass} 
        subLabel={`${Math.round(currentPoints)}/${Math.round(targetPoints)} pts`}
      />
    );
  };

  const currentTargets = getTargets(viewMode === 'week');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
      <HomeButton />
      
      {/* --- HEADER --- */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800 transition-all">
        <div className="max-w-md mx-auto px-4 py-3">
          {/* Top Bar: Clock & Date Nav */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                <Clock size={14} />
                {currentTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})}
            </div>
            
            <div className="flex items-center bg-slate-800 rounded-full p-1">
                <button onClick={() => changeDate(-1)} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400"><ChevronLeft size={16} /></button>
                <div className="px-3 text-sm font-semibold text-slate-200 w-32 text-center">
                {new Date(viewDate).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <button onClick={() => changeDate(1)} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400"><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Rings (Driven by POINTS now) */}
          <div className="grid grid-cols-4 gap-2">
            {renderRing('control', 'Controle', CATEGORY_COLORS.control, 
                viewMode === 'week' ? weekStats.categoryPoints.control : stats.categoryPoints.control, 
                currentTargets.control)}
            {renderRing('reports', 'Rapporten', CATEGORY_COLORS.reports, 
                viewMode === 'week' ? weekStats.categoryPoints.reports : stats.categoryPoints.reports, 
                currentTargets.reports)}
            {renderRing('admin', 'Admin', CATEGORY_COLORS.admin, 
                viewMode === 'week' ? weekStats.categoryPoints.admin : stats.categoryPoints.admin, 
                currentTargets.admin)}
            {renderRing('network', 'Netwerken', CATEGORY_COLORS.network, 
                viewMode === 'week' ? weekStats.categoryPoints.network : stats.categoryPoints.network, 
                currentTargets.network)}
          </div>

          {/* Time Budget Bar */}
          <div className="mt-4">
             {(() => {
                 const currentMins = viewMode === 'week' ? weekStats.totalMinutesConsumed : stats.totalMinutesConsumed;
                 const maxMins = viewMode === 'week' ? settings.weeklyBudgetHours * 60 : settings.dailyBudgetHours * 60;
                 const percent = Math.min((currentMins / maxMins) * 100, 100);
                 const isOver = currentMins > maxMins;

                 return (
                    <>
                        <div className="bg-slate-800 rounded-full h-2 overflow-hidden relative">
                            <div 
                                className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-blue-600'}`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
                            <span className={isOver ? 'text-red-400' : ''}>
                                {(currentMins / 60).toFixed(1)}u gepland
                            </span>
                            <span>
                                Budget: {(maxMins / 60).toFixed(0)}u
                            </span>
                        </div>
                    </>
                 );
             })()}
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        
        {viewMode === 'dashboard' && (
          <>
            {/* AI Analysis */}
            <div className="mb-6 bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
                <Zap className="text-blue-400" size={18} />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Controller AI</h3>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {getAiAnalysis()}
                </p>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              <div className="flex justify-between items-end mb-2">
                <h2 className="text-lg font-semibold text-slate-100">Dagplanning</h2>
                <span className="text-xs text-slate-500">{dailyTasks.length} activiteiten</span>
              </div>

              {dailyTasks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                  <p className="text-slate-500 mb-2 text-sm">Nog geen activiteiten gepland.</p>
                  <button 
                    onClick={() => setIsLibraryOpen(true)}
                    className="text-blue-400 text-sm font-medium hover:underline"
                  >
                    + Activiteit toevoegen
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dailyTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`
                        relative overflow-hidden border rounded-xl p-3 transition-all duration-200 group
                        ${task.isCompleted 
                          ? 'bg-slate-800/80 border-slate-700' 
                          : 'bg-slate-900 border-dashed border-slate-700/60'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <button 
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`transition-colors ${task.isCompleted ? 'text-green-400' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${task.isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 font-medium text-slate-400">
                                <Clock size={12}/> {task.minutes}m
                            </span>
                            {task.unit && (
                                <span className="bg-slate-800 px-1.5 rounded text-[10px] border border-slate-700">
                                    {task.unit}
                                </span>
                            )}
                            {/* Show dominant scores */}
                            {Object.entries(task.scores).map(([cat, score]) => (
                               (score as number) >= 3 && (
                                <span key={cat} className={`${CATEGORY_COLORS[cat as Category]} flex items-center gap-0.5 font-bold text-[10px]`}>
                                   {CATEGORY_LABELS[cat].substring(0,1)}
                                </span>
                               )
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                             <button 
                                onClick={() => handleDuplicateTask(task)}
                                className="text-slate-600 hover:text-blue-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
                                title="Dupliceer"
                            >
                                <Copy size={14} />
                            </button>
                            <button 
                                onClick={() => setEditingTask(task)}
                                className="text-slate-600 hover:text-blue-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
                                title="Bewerk"
                            >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={() => deleteTask(task.id)}
                                className="text-slate-600 hover:text-red-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
                                title="Verwijder"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                      </div>
                      
                      {/* Status Indicator Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                         task.isCompleted ? 'bg-green-500' : 'bg-slate-700'
                      }`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'week' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-lg font-bold text-slate-100">Weekoverzicht</h2>
                        {weekStats.totalMinutesConsumed >= (settings.weeklyBudgetHours * 60) && (
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-green-500/30">
                                Doel Bereikt
                            </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                            <span className="text-[10px] text-slate-500 block mb-1 uppercase">Totaal Uren</span>
                            <span className="text-lg font-bold text-white">
                                {(weekStats.totalMinutesConsumed / 60).toFixed(1)}
                            </span>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                            <span className="text-[10px] text-slate-500 block mb-1 uppercase">Voltooid</span>
                            <span className="text-lg font-bold text-green-400">{weekStats.completedTasksCount}</span>
                        </div>
                         <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                            <span className="text-[10px] text-slate-500 block mb-1 uppercase">Avg / Dag</span>
                            <span className="text-lg font-bold text-blue-400">
                                {((weekStats.totalMinutesConsumed / 60) / 5).toFixed(1)}u
                            </span>
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Macro Balans (Punten vs Plan)</h3>
                    <div className="space-y-4">
                        {(Object.entries(weekStats.categoryPoints) as [string, number][]).map(([cat, points]) => {
                             // @ts-ignore
                             const target = currentTargets[cat];
                             const pct = target > 0 ? Math.min((points / target) * 100, 100) : 0;
                             
                             return (
                                <div key={cat}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300">{CATEGORY_LABELS[cat]}</span>
                                        <span className="text-slate-500">{Math.round(points)} / {Math.round(target)} ({Math.round(pct)}%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <div 
                                            // @ts-ignore
                                            className={`h-full ${CATEGORY_COLORS[cat].replace('text-', 'bg-')}`} 
                                            style={{width: `${pct}%`}} 
                                        />
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>

                <div className="text-center">
                   <p className="text-slate-500 text-sm">
                       Business week {new Date(weekStats.weekDates[0]).toLocaleDateString('nl-NL', {day:'numeric', month:'short'})} - {new Date(weekStats.weekDates[4]).toLocaleDateString('nl-NL', {day:'numeric', month:'short'})}
                   </p>
                </div>
            </div>
        )}

        {viewMode === 'settings' && (
           <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Settings className="text-blue-400" size={24}/>
                  </div>
                  <h2 className="text-xl font-bold">Controller Plan & Budget</h2>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                 <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-700 pb-2">Tijdsbudget (Uren)</h3>
                 <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-slate-200">Dagbudget</span>
                        <div className="flex items-center gap-2">
                            <input 
                            type="number" 
                            value={settings.dailyBudgetHours}
                            onChange={(e) => setSettings({...settings, dailyBudgetHours: parseFloat(e.target.value) || 0})}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-20 text-center text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-xs text-slate-500">uur</span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-200">Weekbudget</span>
                        <div className="flex items-center gap-2">
                            <input 
                            type="number" 
                            value={settings.weeklyBudgetHours}
                            onChange={(e) => setSettings({...settings, weeklyBudgetHours: parseFloat(e.target.value) || 0})}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-20 text-center text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-xs text-slate-500">uur</span>
                        </div>
                     </div>
                 </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-2">Kies Strategie Plan</h3>
                <div className="grid grid-cols-1 gap-3">
                   {Object.keys(PLANS).map(planName => (
                     <button 
                       key={planName}
                       onClick={() => applyPlan(planName)}
                       className="group flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500 transition-all text-left"
                     >
                       <div>
                            <span className="font-medium text-slate-200 block group-hover:text-blue-400 transition-colors">{planName}</span>
                            <span className="text-[10px] text-slate-500">Activeer plan</span>
                       </div>
                       <div className="flex gap-1">
                         {/* Mini Viz */}
                         <div className="flex h-2 w-16 rounded-full overflow-hidden bg-slate-800">
                           <div className="bg-blue-500" style={{width: `${PLANS[planName].control * 100}%`}} />
                           <div className="bg-rose-400" style={{width: `${PLANS[planName].reports * 100}%`}} />
                           <div className="bg-teal-400" style={{width: `${PLANS[planName].admin * 100}%`}} />
                           <div className="bg-emerald-400" style={{width: `${PLANS[planName].network * 100}%`}} />
                         </div>
                       </div>
                     </button>
                   ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-xs font-bold text-slate-400 mb-3">Aangepast Plan (%)</h4>
                    <div className="space-y-3">
                        {(Object.entries(settings.targets) as [string, number][]).map(([cat, val]) => (
                            <div key={cat} className="flex items-center gap-2 text-xs">
                                <span className={`w-20 ${CATEGORY_COLORS[cat as Category]}`}>{CATEGORY_LABELS[cat]}</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100"
                                    value={Math.round(val * 100)}
                                    onChange={(e) => {
                                        const newVal = parseInt(e.target.value) / 100;
                                        setSettings({
                                            ...settings,
                                            targets: { ...settings.targets, [cat]: newVal }
                                        });
                                    }}
                                    className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-8 text-right">{Math.round(val * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
           </div>
        )}

      </main>

      {/* --- FLOATING ACTION BUTTON --- */}
      {viewMode === 'dashboard' && (
        <button 
          onClick={() => setIsLibraryOpen(true)}
          className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center transition-all hover:scale-105 hover:rotate-90 z-30"
        >
          <PlusCircle size={28} />
        </button>
      )}

      {/* --- TAB BAR --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 py-2 px-6 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button 
            onClick={() => setViewMode('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${viewMode === 'dashboard' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Briefcase size={20} />
            <span className="text-[10px] font-medium">Vandaag</span>
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${viewMode === 'week' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BarChart3 size={20} />
            <span className="text-[10px] font-medium">Week</span>
          </button>
          <button 
            onClick={() => setViewMode('settings')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${viewMode === 'settings' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Settings size={20} />
            <span className="text-[10px] font-medium">Plan</span>
          </button>
        </div>
      </nav>

      {/* --- MODALS --- */}
      <TaskLibrary 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        onSelect={handleAddTask}
      />
      
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSave={handleUpdateTask}
      />

    </div>
  );
};

export default BusinessMacroTrackerPage;
