'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Upload, 
  BarChart3, 
  Clock, 
  Euro, 
  AlertTriangle,
  MessageSquare,
  Play,
  ChevronUp,
  ChevronDown,
  Table,
  Calculator,
  X,
  Settings
} from 'lucide-react';

import { Debtor, Invoice, WIPItem, AppState, TimeRange, Comment, AppSettings, ThemePalette } from './types';
import { MOCK_DEBTORS, MOCK_INVOICES, MOCK_WIP, THEMES, DEFAULT_SETTINGS } from './constants';
import { analyzeFinancials, getDebtorAdvice, suggestCreditLimit } from './services/geminiService';

// --- Utility Functions ---

const formatCurrencyK = (amount: number) => {
  return `€ ${(amount / 1000).toFixed(1).replace('.', ',')}k`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('nl-NL');
};

const getDaysOpen = (invoice: Invoice) => {
  const today = new Date();
  const invoiceDate = new Date(invoice.date);
  const diffTime = Math.abs(today.getTime() - invoiceDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// --- Custom Components ---

const WoodpeckerLogo = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Light Grey Circle Background */}
    <circle cx="50" cy="50" r="48" fill="#F3F4F6" />
    
    {/* Tree Trunk (Watercolor style - simple shapes) */}
    <path d="M70 100 L75 50 L65 10 L85 10 L90 100 Z" fill="#D1D5DB" />
    <path d="M72 100 L76 60 L70 30 L80 100 Z" fill="#9CA3AF" opacity="0.5" />
    
    {/* Woodpecker */}
    {/* Body / Wing - Dark */}
    <path d="M55 40 Q 45 60 55 80 L 60 90 L 65 80 Q 75 60 65 40 Z" fill="#374151" />
    {/* White Breast */}
    <path d="M55 40 Q 40 55 55 75 L 58 75 Q 50 55 58 40 Z" fill="#FFFFFF" />
    {/* Head - Black & White */}
    <circle cx="58" cy="35" r="8" fill="#111827" />
    <path d="M58 35 L 50 38 L 58 42 Z" fill="#FFFFFF" /> 
    {/* Red Spot behind eye */}
    <circle cx="62" cy="33" r="3" fill="#EF4444" />
    {/* Beak */}
    <path d="M50 35 L 40 37 L 50 39 Z" fill="#1F2937" />
  </svg>
);

// --- Sub-Components with Dynamic Theming ---

const MetricCard = ({ title, value, subtext, alert = false, theme }: { title: string, value: string, subtext?: string, alert?: boolean, theme: ThemePalette['colors'] }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
    <div 
        className="absolute top-0 left-0 w-1 h-full" 
        style={{ backgroundColor: alert ? theme.highRisk : theme.primary }}
    ></div>
    <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.text, opacity: 0.6 }}>{title}</h3>
    <div className="text-3xl font-extrabold" style={{ color: alert ? theme.highRisk : theme.text }}>{value}</div>
    {subtext && <p className="mt-2 text-xs font-medium" style={{ color: theme.text, opacity: 0.5 }}>{subtext}</p>}
  </div>
);

const AIAnalysisBox = ({ text, loading, theme }: { text: string, loading: boolean, theme: ThemePalette['colors'] }) => (
  <div className="bg-white border-l-4 p-6 rounded-r-xl shadow-sm mb-6" style={{ borderColor: theme.primary }}>
    <div className="flex items-start gap-4">
      <div className="mt-1 p-2 rounded-full" style={{ backgroundColor: `${theme.primary}20` }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={theme.primary} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 9l2.846-.813a4.5 4.5 0 003.09-3.09L9 2.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 9l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 3.259L21 5.918l-2.846-.813a4.5 4.5 0 00-3.09-3.09L12 2.25l-.813 2.846a4.5 4.5 0 00-3.09 3.09L5.918 5.918l2.846.813a4.5 4.5 0 003.09 3.09L12 9.75l2.846-.813a4.5 4.5 0 003.09-3.09z" />
        </svg>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.primary }}>AI Financiële Analyse</h4>
        <p className="leading-relaxed mt-1" style={{ color: theme.text }}>
          {loading ? "Analyseren van data..." : text}
        </p>
      </div>
    </div>
  </div>
);

const CommentSection = ({ itemId, comments, onAddComment, theme }: { itemId: string, comments: Comment[] | undefined, onAddComment: (text: string) => void, theme: ThemePalette['colors'] }) => {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddComment(input);
      setInput("");
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 transition-colors"
        style={{ color: theme.text, opacity: 0.5 }}
        title="Opmerkingen"
      >
        <MessageSquare className="w-4 h-4" />
        {comments && comments.length > 0 && <span className="text-xs font-bold">{comments.length}</span>}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-72 bg-white p-3 rounded-xl shadow-xl border border-slate-100 ring-1 ring-black/5">
          <div className="max-h-40 overflow-y-auto mb-3 space-y-3 pr-1">
            {comments?.length === 0 && <p className="text-xs italic" style={{ color: theme.text, opacity: 0.5 }}>Geen opmerkingen.</p>}
            {comments?.map(c => (
              <div key={c.id} className="text-xs bg-slate-50 p-2 rounded">
                <div className="flex justify-between mb-1">
                    <span className="font-bold" style={{ color: theme.text }}>{c.user}</span>
                    <span className="text-[10px]" style={{ color: theme.text, opacity: 0.5 }}>{new Date(c.timestamp).toLocaleDateString()}</span>
                </div>
                <p style={{ color: theme.text, opacity: 0.8 }}>{c.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type een opmerking..."
              className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1"
              style={{ caretColor: theme.primary }}
            />
            <button type="submit" className="text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors" style={{ backgroundColor: theme.primary }}>
              +
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  total: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  subTitle?: React.ReactNode;
  theme: ThemePalette['colors'];
}> = ({ title, total, children, defaultOpen = false, subTitle, theme }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white border border-slate-100 rounded-xl mb-4 overflow-hidden shadow-sm transition-all hover:shadow-md">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 transition-colors text-left hover:bg-slate-50"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-md`} style={{ backgroundColor: isOpen ? `${theme.primary}20` : '#e2e8f0', color: isOpen ? theme.primary : theme.text }}>
                         {isOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </div>
                    <div>
                        <span className="font-bold block" style={{ color: theme.text }}>{title}</span>
                        {subTitle && <div className="text-xs font-normal mt-0.5">{subTitle}</div>}
                    </div>
                </div>
                <span className="font-mono font-bold px-3 py-1 rounded border border-slate-200" style={{ color: theme.text, backgroundColor: '#fff' }}>{formatCurrencyK(total)}</span>
            </button>
            {isOpen && (
                <div className="border-t border-slate-100 p-4 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    )
}

interface CreditCalculatorProps {
    debtor: Debtor;
    invoices: Invoice[];
    onClose: () => void;
    onApply: (val: number) => void;
    theme: ThemePalette['colors'];
}

const CreditLimitModal: React.FC<CreditCalculatorProps> = ({ debtor, invoices, onClose, onApply, theme }) => {
    const stats = useMemo(() => {
        const debtorInvoices = invoices.filter(i => i.debtorId === debtor.id);
        const totalRevenue = debtorInvoices.reduce((sum, i) => sum + i.amount, 0);
        const maxExposure = Math.max(...debtorInvoices.map(i => i.amount), 0);
        const dates = debtorInvoices.map(i => new Date(i.date).getTime());
        let months = 1;
        if (dates.length > 1) {
            const minDate = Math.min(...dates);
            const maxDate = Math.max(...dates);
            months = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24 * 30));
        }
        const avgRev = Math.round(totalRevenue / months);
        const lateInvoices = debtorInvoices.filter(i => {
            if (!i.dueDate) return false;
            return new Date(i.dueDate) < new Date();
        });
        const lateFreq = debtorInvoices.length > 0 ? Math.round((lateInvoices.length / debtorInvoices.length) * 100) : 0;
        const totalDaysOver = lateInvoices.reduce((sum, i) => {
             const due = new Date(i.dueDate);
             const now = new Date();
             const diff = Math.max(0, (now.getTime() - due.getTime()) / (1000 * 3600 * 24));
             return sum + diff;
        }, 0);
        const avgDaysOver = lateInvoices.length > 0 ? Math.round(totalDaysOver / lateInvoices.length) : 0;
        return { avgRev, maxExposure, lateFreq, avgDaysOver };
    }, [debtor, invoices]);

    const [formData, setFormData] = useState({
        avgRevenue: stats.avgRev,
        avgDaysOverdue: stats.avgDaysOver,
        latePaymentFreq: stats.lateFreq,
        maxPastExposure: stats.maxExposure,
        riskAppetite: 'Neutraal' 
    });

    const [loading, setLoading] = useState(false);

    const handleCalculate = async () => {
        setLoading(true);
        const limit = await suggestCreditLimit(
            debtor.name, 
            formData.avgRevenue, 
            formData.avgDaysOverdue, 
            formData.latePaymentFreq,
            formData.maxPastExposure,
            formData.riskAppetite
        );
        onApply(limit);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg" style={{ color: theme.text }}>Krediet Calculator</h3>
                        <p className="text-xs" style={{ color: theme.text, opacity: 0.6 }}>Bepaal limiet voor {debtor.name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: theme.text }}>Gem. Maandomzet (€)</label>
                        <input 
                            type="number" 
                            value={formData.avgRevenue} 
                            onChange={e => setFormData({...formData, avgRevenue: parseInt(e.target.value)||0})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 outline-none"
                            style={{ '--tw-ring-color': theme.primary } as any}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: theme.text }}>Dagen te laat (gem)</label>
                            <input 
                                type="number" 
                                value={formData.avgDaysOverdue} 
                                onChange={e => setFormData({...formData, avgDaysOverdue: parseInt(e.target.value)||0})}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 outline-none"
                                style={{ '--tw-ring-color': theme.primary } as any}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: theme.text }}>Freq. te laat (%)</label>
                            <input 
                                type="number" 
                                value={formData.latePaymentFreq} 
                                onChange={e => setFormData({...formData, latePaymentFreq: parseInt(e.target.value)||0})}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 outline-none"
                                style={{ '--tw-ring-color': theme.primary } as any}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: theme.text }}>Hoogste Eerdere Saldo (€)</label>
                        <input 
                            type="number" 
                            value={formData.maxPastExposure} 
                            onChange={e => setFormData({...formData, maxPastExposure: parseInt(e.target.value)||0})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 outline-none"
                            style={{ '--tw-ring-color': theme.primary } as any}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: theme.text }}>Risico Bereidheid</label>
                        <select 
                            value={formData.riskAppetite} 
                            onChange={e => setFormData({...formData, riskAppetite: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 outline-none bg-white"
                            style={{ '--tw-ring-color': theme.primary } as any}
                        >
                            <option value="Conservatief">Conservatief (Laag Risico)</option>
                            <option value="Neutraal">Neutraal (Standaard)</option>
                            <option value="Speculatief">Speculatief (Groei Focus)</option>
                        </select>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Annuleren</button>
                    <button 
                        onClick={handleCalculate} 
                        disabled={loading}
                        className="px-4 py-2 text-white text-sm font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: theme.primary }}
                    >
                        {loading ? 'Berekenen...' : <><Calculator className="w-4 h-4"/> Bereken Limiet</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

const SettingsModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    settings: AppSettings; 
    onSave: (s: AppSettings) => void;
    currentTheme: ThemePalette;
}> = ({ isOpen, onClose, settings, onSave, currentTheme }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Instellingen</h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="p-8 space-y-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Applicatie Naam</label>
                        <input 
                            type="text" 
                            value={localSettings.appName} 
                            onChange={(e) => setLocalSettings({...localSettings, appName: e.target.value})}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 outline-none"
                            style={{ '--tw-ring-color': currentTheme.colors.primary } as any}
                        />
                        <p className="text-xs text-slate-400 mt-2">Deze naam wordt direct overal in de app gebruikt.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-4">Thema Selectie</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {THEMES.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => setLocalSettings({...localSettings, themeId: t.id})}
                                    className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] flex items-center gap-4 ${localSettings.themeId === t.id ? 'bg-slate-50' : 'bg-white border-slate-100'}`}
                                    style={{ borderColor: localSettings.themeId === t.id ? t.colors.primary : '#f1f5f9' }}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex gap-1 mb-1">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }}></div>
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.highRisk }}></div>
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.lowRisk }}></div>
                                        </div>
                                        <span className="font-bold text-sm text-slate-700">{t.name}</span>
                                    </div>
                                    {localSettings.themeId === t.id && (
                                        <div className="absolute top-4 right-4 w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.primary }}></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Annuleren</button>
                    <button 
                        onClick={() => { onSave(localSettings); onClose(); }} 
                        className="px-5 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                    >
                        Opslaan & Toepassen
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component ---

export default function DebiteurenBeheerPage() {
  // --- Global Settings & Theme ---
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const theme = useMemo(() => {
      return THEMES.find(t => t.id === settings.themeId) || THEMES[0];
  }, [settings.themeId]);
  
  const colors = theme.colors;

  // --- App State ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<'dashboard' | 'aging' | 'credit' | 'wip' | 'upload'>('dashboard');
  
  // Filter State
  const [dateRange, setDateRange] = useState<TimeRange>(TimeRange.THREE_MONTHS);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [data, setData] = useState<AppState>({
    debtors: [],
    invoices: [],
    wipItems: [],
    lastAnalysis: ''
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [debtorAdvice, setDebtorAdvice] = useState<Record<string, string>>({});
  
  // Calculator Modal State
  const [showCalculator, setShowCalculator] = useState<string | null>(null); // debtorId

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Demo Data
  const loadDemoData = () => {
    const newData = {
      debtors: MOCK_DEBTORS,
      invoices: MOCK_INVOICES,
      wipItems: MOCK_WIP,
      lastAnalysis: ''
    };
    setData(newData);
    triggerDebtorAdvice(newData);
  };

  const triggerDebtorAdvice = async (currentState: AppState) => {
    const adviceMap: Record<string, string> = {};
    for(const debtor of currentState.debtors) {
        const overdue = currentState.invoices
            .filter(i => i.debtorId === debtor.id && i.isOpen && getDaysOpen(i) > 30)
            .reduce((sum, i) => sum + i.amount, 0);
        
        if (overdue > 0) {
            const advice = await getDebtorAdvice(debtor.name, overdue, debtor.riskProfile);
            adviceMap[debtor.id] = advice;
        }
    }
    setDebtorAdvice(adviceMap);
  };

  const handleAddComment = (invoiceId: string, text: string) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            comments: [
              ...(inv.comments || []),
              { id: Math.random().toString(), user: 'Manager', text, timestamp: new Date().toISOString() }
            ]
          };
        }
        return inv;
      })
    }));
  };

  const handleDownloadTemplate = () => {
      // Generic Compatible Template
      const headers = "Boekstuknummer;Relatiecode;Factuurnr;Datum;Bedrag;Vervaldatum";
      const example = "20240001;D100;2024-001;01-01-2024;15000;31-01-2024";
      const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Import_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const handleCreditLimitChange = (debtorId: string, newLimit: string) => {
    const numValue = parseInt(newLimit.replace(/[^0-9]/g, ''), 10) || 0;
    setData(prev => ({
        ...prev,
        debtors: prev.debtors.map(d => d.id === debtorId ? { ...d, creditLimit: numValue } : d)
    }));
  };

  const handleCalculatorApply = (limit: number) => {
      if (showCalculator) {
          setData(prev => ({
              ...prev,
              debtors: prev.debtors.map(d => d.id === showCalculator ? { ...d, creditLimit: limit } : d)
          }));
          setShowCalculator(null);
      }
  };

  // --- Filtering Logic ---
  const filteredInvoices = useMemo(() => {
      if (data.invoices.length === 0) return [];
      
      let cutoffDate = new Date();
      
      if (dateRange === TimeRange.CUSTOM) {
          if (!customStartDate) return data.invoices;
          const start = new Date(customStartDate);
          const end = customEndDate ? new Date(customEndDate) : new Date();
          return data.invoices.filter(i => {
              const d = new Date(i.date);
              return d >= start && d <= end;
          });
      }

      switch (dateRange) {
          case TimeRange.THREE_MONTHS: cutoffDate.setMonth(cutoffDate.getMonth() - 3); break;
          case TimeRange.SIX_MONTHS: cutoffDate.setMonth(cutoffDate.getMonth() - 6); break;
          case TimeRange.NINE_MONTHS: cutoffDate.setMonth(cutoffDate.getMonth() - 9); break;
          case TimeRange.ONE_YEAR: cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); break;
          default: return data.invoices;
      }

      return data.invoices.filter(i => new Date(i.date) >= cutoffDate);
  }, [data.invoices, dateRange, customStartDate, customEndDate]);

  // --- Effect: Update AI Analysis when Filter Changes ---
  useEffect(() => {
    const updateAnalysis = async () => {
        if (filteredInvoices.length === 0) return;
        
        setAiLoading(true);
        const analysis = await analyzeFinancials(filteredInvoices, data.debtors);
        setData(prev => ({ ...prev, lastAnalysis: analysis }));
        setAiLoading(false);
    };

    const timeoutId = setTimeout(() => {
        updateAnalysis();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [filteredInvoices, data.debtors]);

  // --- Derived Stats based on FILTERED data ---
  const stats = useMemo(() => {
    const totalOutstanding = filteredInvoices.filter(i => i.isOpen).reduce((acc, curr) => acc + curr.amount, 0);
    const totalOverdue = filteredInvoices.filter(i => i.isOpen && new Date(i.dueDate) < new Date()).reduce((acc, curr) => acc + curr.amount, 0);
    
    let provision = 0;
    filteredInvoices.forEach(inv => {
      if (inv.isOpen) {
        const days = getDaysOpen(inv);
        if (days > 120) provision += inv.amount;
        else if (days > 90) provision += inv.amount * 0.5;
      }
    });

    const wipTotal = data.wipItems.reduce((acc, curr) => acc + curr.estimatedAmount, 0);
    return { totalOutstanding, totalOverdue, provision, wipTotal };
  }, [filteredInvoices, data.wipItems]);

  const agingBuckets = useMemo(() => {
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 };
    filteredInvoices.filter(i => i.isOpen).forEach(inv => {
      const days = getDaysOpen(inv);
      if (days <= 30) buckets['0-30'] += inv.amount;
      else if (days <= 60) buckets['31-60'] += inv.amount;
      else if (days <= 90) buckets['61-90'] += inv.amount;
      else buckets['>90'] += inv.amount;
    });
    return [
      { name: '0-30', value: buckets['0-30'] },
      { name: '31-60', value: buckets['31-60'] },
      { name: '61-90', value: buckets['61-90'] },
      { name: '>90', value: buckets['>90'] },
    ];
  }, [filteredInvoices]);

  const CHART_COLORS = [colors.lowRisk, colors.mediumRisk, colors.primary, colors.highRisk];

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* AI Banner */}
      <AIAnalysisBox text={data.lastAnalysis || "Start de demo of upload data voor een analyse."} loading={aiLoading} theme={colors} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Openstaand Totaal" value={formatCurrencyK(stats.totalOutstanding)} subtext="Binnen selectie" theme={colors} />
        <MetricCard title="Vervallen" value={formatCurrencyK(stats.totalOverdue)} alert={stats.totalOverdue > 0} subtext="Direct opeisbaar" theme={colors} />
        <MetricCard title="Voorziening" value={formatCurrencyK(stats.provision)} subtext="Risico correctie" theme={colors} />
        <MetricCard title="Onderhanden Werk" value={formatCurrencyK(stats.wipTotal)} subtext="Nog te factureren" theme={colors} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold" style={{ color: colors.text }}>Ouderdomsanalyse</h3>
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={agingBuckets}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val/1000}k`} tickLine={false} axisLine={false} />
                 <Tooltip 
                    formatter={(val: number) => formatCurrencyK(val)} 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                 />
                 <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {agingBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6" style={{ color: colors.text }}>Risico Spreiding</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={agingBuckets}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {agingBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                 </Pie>
                 <Tooltip formatter={(val: number) => formatCurrencyK(val)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Legend verticalAlign="bottom" height={36} iconType="circle"/>
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  // Standard Modern Invoice Table
  const renderInvoiceTable = (invoices: Invoice[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200">
            <tr>
                <th className="p-4 font-medium">Boekstuk</th>
                <th className="p-4 font-medium">Factuur</th>
                <th className="p-4 font-medium">Datum</th>
                <th className="p-4 font-medium">Vervaldatum</th>
                <th className="p-4 font-medium text-right">Bedrag</th>
                <th className="p-4 font-medium text-center">Dagen Open</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actie</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
            {invoices.map(inv => {
                 const daysOpen = getDaysOpen(inv);
                 const isOverdue = new Date(inv.dueDate) < new Date();
                 
                 return (
                     <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                         <td className="p-4 font-mono text-xs text-slate-500">{inv.entryNumber}</td>
                         <td className="p-4 font-medium" style={{ color: colors.text }}>{inv.invoiceNumber}</td>
                         <td className="p-4">{formatDate(inv.date)}</td>
                         <td className="p-4">{formatDate(inv.dueDate)}</td>
                         <td className="p-4 text-right font-semibold" style={{ color: colors.text }}>{formatCurrencyK(inv.amount)}</td>
                         <td className="p-4 text-center">
                             <span className={`px-2 py-1 rounded-full text-xs font-bold`} style={{ 
                                 backgroundColor: daysOpen > 60 ? `${colors.highRisk}20` : '#f1f5f9',
                                 color: daysOpen > 60 ? colors.highRisk : colors.text
                             }}>
                                 {daysOpen} dagen
                             </span>
                         </td>
                         <td className="p-4">
                             {isOverdue ? 
                                <span className="flex items-center gap-1 font-bold text-xs" style={{ color: colors.highRisk }}><AlertTriangle className="w-4 h-4"/> Vervallen</span> : 
                                <span className="flex items-center gap-1 font-bold text-xs" style={{ color: colors.lowRisk }}>Op tijd</span>
                             }
                         </td>
                         <td className="p-4">
                             <CommentSection itemId={inv.id} comments={inv.comments} onAddComment={(t) => handleAddComment(inv.id, t)} theme={colors} />
                         </td>
                     </tr>
                 )
            })}
        </tbody>
      </table>
    </div>
  );

  const renderAging = () => {
      const grouped = filteredInvoices.reduce((acc, inv) => {
          if (!inv.isOpen) return acc;
          if (!acc[inv.debtorId]) acc[inv.debtorId] = [];
          acc[inv.debtorId].push(inv);
          return acc;
      }, {} as Record<string, Invoice[]>);

      return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.text }}>
                    <Clock className="w-7 h-7" style={{ color: colors.primary }} />
                    Ouderdomsanalyse
                </h2>
            </div>
            
            <AIAnalysisBox text="Advies: Categoriseer facturen ouder dan 90 dagen als dubieus en overweeg een voorziening te treffen." loading={false} theme={colors} />
            
            <div className="space-y-4">
                {Object.keys(grouped).map(debtorId => {
                    const debtor = data.debtors.find(d => d.id === debtorId);
                    const invs = grouped[debtorId];
                    const total = invs.reduce((sum, i) => sum + i.amount, 0);
                    
                    const subTitle = (
                        <div className="flex gap-4 text-slate-500 mt-1">
                             <span className="flex items-center gap-1">Risico: <strong style={{ color: debtor?.riskProfile === 'Hoog' ? colors.highRisk : colors.text }}>{debtor?.riskProfile}</strong></span>
                             {debtorAdvice[debtorId] && <span className="font-medium italic flex items-center gap-1" style={{ color: colors.primary }}>AI Tip: {debtorAdvice[debtorId]}</span>}
                        </div>
                    );

                    return (
                        <CollapsibleSection 
                            key={debtorId} 
                            title={debtor?.name || 'Onbekend'} 
                            total={total}
                            subTitle={subTitle}
                            defaultOpen={false}
                            theme={colors}
                        >
                            {renderInvoiceTable(invs)}
                        </CollapsibleSection>
                    );
                })}
            </div>
        </div>
      );
  };

  const renderCredit = () => (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Kredietlimiet Bewaking</h2>
       <p className="text-sm" style={{ color: colors.text, opacity: 0.6 }}>Pas limieten aan of gebruik de calculator op basis van betaalhistorie.</p>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {data.debtors.map(debtor => {
            const openBalance = filteredInvoices
              .filter(i => i.debtorId === debtor.id && i.isOpen)
              .reduce((sum, i) => sum + i.amount, 0);
            const usage = (openBalance / debtor.creditLimit) * 100;
            const isOverLimit = openBalance > debtor.creditLimit;
            
            // Dynamic Risk Colors for Card
            let statusStyle = { border: '1px solid #e2e8f0', backgroundColor: '#fff' };
            if (isOverLimit) statusStyle = { border: `1px solid ${colors.highRisk}40`, backgroundColor: `${colors.highRisk}10` };
            else if (usage > 80) statusStyle = { border: `1px solid ${colors.mediumRisk}40`, backgroundColor: `${colors.mediumRisk}10` };
            
            return (
              <div key={debtor.id} className={`p-6 rounded-xl shadow-sm transition-shadow hover:shadow-md`} style={statusStyle}>
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: colors.text }}>{debtor.name}</h3>
                      <p className="text-xs text-slate-400">{debtor.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide`} style={{ backgroundColor: isOverLimit ? `${colors.highRisk}20` : '#f1f5f9', color: isOverLimit ? colors.highRisk : colors.text }}>
                      {debtor.riskProfile}
                    </span>
                 </div>

                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between items-end">
                     <span className="text-xs uppercase font-semibold" style={{ color: colors.text, opacity: 0.6 }}>Openstaand</span>
                     <span className="font-bold text-lg" style={{ color: colors.text }}>{formatCurrencyK(openBalance)}</span>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className="text-xs uppercase font-semibold" style={{ color: colors.text, opacity: 0.6 }}>Limiet</span>
                     <div className="flex items-center gap-2 bg-white rounded-md border border-slate-200 p-1 focus-within:ring-2" style={{ '--tw-ring-color': colors.primary } as any}>
                         <span className="text-slate-400 pl-1">€</span>
                         <input 
                            type="number" 
                            value={debtor.creditLimit}
                            onChange={(e) => handleCreditLimitChange(debtor.id, e.target.value)}
                            className="w-20 text-right font-mono text-slate-700 focus:outline-none text-sm"
                            step="1000"
                         />
                     </div>
                   </div>

                   <div className="flex justify-end">
                      <button 
                         onClick={() => setShowCalculator(debtor.id)}
                         className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded transition-colors"
                         style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      >
                        <Calculator className="w-3 h-3" /> Calculator
                      </button>
                   </div>

                   <div className="w-full bg-slate-200 rounded-full h-2 mt-2 relative overflow-hidden">
                     <div 
                        className={`h-2 rounded-full transition-all duration-500`} 
                        style={{ 
                            width: `${Math.min(usage, 100)}%`,
                            backgroundColor: isOverLimit ? colors.highRisk : usage > 80 ? colors.mediumRisk : colors.lowRisk
                        }}
                     ></div>
                   </div>
                   <div className="text-[10px] text-right text-slate-400">
                       {usage.toFixed(0)}% benut
                   </div>
                 </div>
              </div>
            );
         })}
       </div>
    </div>
  );

  const renderWIP = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Onderhanden Werk</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4">Klant</th>
              <th className="p-4">Omschrijving</th>
              <th className="p-4 text-right">Waarde</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.wipItems.map(item => {
               const debtor = data.debtors.find(d => d.id === item.debtorId);
               return (
                 <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                   <td className="p-4 font-bold" style={{ color: colors.text }}>{debtor?.name}</td>
                   <td className="p-4" style={{ color: colors.text, opacity: 0.8 }}>{item.description}</td>
                   <td className="p-4 text-right font-mono font-bold" style={{ color: colors.text }}>{formatCurrencyK(item.estimatedAmount)}</td>
                   <td className="p-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                          {item.status}
                      </span>
                   </td>
                   <td className="p-4 text-center">
                     <button className="text-xs text-white font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm" style={{ backgroundColor: colors.primary }}>
                       Factureren
                     </button>
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUpload = () => (
     <div className="max-w-4xl mx-auto mt-10 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-10 text-center border-b border-slate-50 bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: colors.text }}>Data Import Center</h2>
            <p className="mt-2" style={{ color: colors.text, opacity: 0.6 }}>Importeer uw debiteuren en facturen om te starten.</p>
        </div>
        
        <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="p-8 space-y-6 hover:bg-slate-50/50 transition-colors">
                <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: colors.text }}>
                    <Table className="w-5 h-5" style={{ color: colors.primary }}/> Excel / CSV Upload
                </h3>
                <label 
                    className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer transition-all text-center group"
                    style={{ borderColor: colors.primary + '60' }}
                >
                   <input type="file" className="hidden" accept=".csv,.xlsx" />
                   <span className="text-sm font-medium group-hover:opacity-80 transition-opacity" style={{ color: colors.text }}>Selecteer bestand</span>
                   <span className="text-xs text-slate-400 block mt-1">.csv of .xlsx</span>
                </label>
                <button onClick={handleDownloadTemplate} className="text-sm font-medium hover:opacity-80 flex items-center justify-center gap-1" style={{ color: colors.primary }}>
                    <Upload className="w-3 h-3"/>
                    Download Template
                </button>
            </div>

            <div className="p-8 space-y-6 hover:bg-slate-50/50 transition-colors">
                 <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: colors.text }}>
                    <span className="font-mono text-lg" style={{ color: colors.primary }}>Aa</span> Handmatige Invoer
                 </h3>
                 <textarea 
                    className="w-full h-32 border border-slate-200 rounded-xl p-4 text-xs font-mono focus:ring-2 focus:outline-none shadow-inner resize-none"
                    placeholder="Plak hier uw data (bijv. direct uit uw boekhoudpakket)..."
                    style={{ '--tw-ring-color': colors.primary } as any}
                 ></textarea>
                 <button className="w-full text-white text-sm font-bold py-3 rounded-xl transition-transform active:scale-[0.98]" style={{ backgroundColor: colors.text }}>
                    Verwerk Data
                 </button>
            </div>
        </div>
        
        <div className="bg-slate-50 p-6 flex justify-center border-t border-slate-100">
             <button 
               onClick={loadDemoData}
               className="flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
               style={{ backgroundColor: colors.primary }}
             >
               <Play className="w-5 h-5" /> Start Demo Modus
             </button>
        </div>
     </div>
  );

  return (
    <div className="flex min-h-screen font-sans relative" style={{ backgroundColor: '#F8FAFC', color: colors.text }}>
      
      {/* BACKGROUND LOGO WATERMARK - Fixed & Neutral */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05]">
          <WoodpeckerLogo className="w-[500px] h-[500px]" />
      </div>

      {/* Sidebar - Neutral Background (White/Light Grey) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight" style={{ color: colors.text }}>
             <WoodpeckerLogo className="w-10 h-10" />
             <span>{settings.appName}</span>
           </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'aging', icon: Clock, label: 'Ouderdom' },
              { id: 'credit', icon: AlertTriangle, label: 'Krediet Risico' },
              { id: 'wip', icon: Euro, label: 'Onderhanden Werk' },
          ].map(item => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium`}
                style={{ 
                    backgroundColor: view === item.id ? `${colors.primary}15` : 'transparent',
                    color: view === item.id ? colors.primary : colors.text,
                    fontWeight: view === item.id ? '700' : '500'
                }}
              >
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2">
            <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium text-slate-500"
            >
                <Settings className="w-5 h-5" /> Instellingen
            </button>
            <button 
                onClick={() => setView('upload')} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wider shadow-lg hover:opacity-90"
                style={{ backgroundColor: colors.primary }}
            >
                <Upload className="w-4 h-4" /> Import Data
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 relative z-10">
        {/* Top Bar */}
        <div className="flex justify-between items-end mb-8 pb-6 border-b border-slate-200/60">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: colors.text }}>
                    {view === 'dashboard' && 'Financieel Dashboard'}
                    {view === 'aging' && 'Ouderdomsanalyse'}
                    {view === 'credit' && 'Debiteurenbeheer'}
                    {view === 'wip' && 'Projecten & WIP'}
                    {view === 'upload' && 'Data Import'}
                </h1>
                <div className="text-sm font-medium mt-2 flex items-center gap-3" style={{ color: colors.text, opacity: 0.6 }}>
                    <span className="font-mono bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">{currentTime.toLocaleTimeString('nl-NL')}</span>
                    <span>{currentTime.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>
            
            {view !== 'upload' && (
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <select 
                       value={dateRange} 
                       onChange={(e) => setDateRange(e.target.value as TimeRange)}
                       className="text-sm font-semibold bg-transparent outline-none px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                       style={{ color: colors.text }}
                    >
                      <option value={TimeRange.THREE_MONTHS}>Afgelopen 3 maanden</option>
                      <option value={TimeRange.SIX_MONTHS}>Afgelopen 6 maanden</option>
                      <option value={TimeRange.NINE_MONTHS}>Afgelopen 9 maanden</option>
                      <option value={TimeRange.ONE_YEAR}>Afgelopen Jaar</option>
                      <option value={TimeRange.CUSTOM}>Aangepast bereik...</option>
                    </select>
                    
                    {dateRange === TimeRange.CUSTOM && (
                         <div className="flex items-center gap-2 px-3 border-l border-slate-200">
                           <input type="date" className="text-xs p-2 border border-slate-200 rounded-md focus:ring-2 outline-none" style={{ '--tw-ring-color': colors.primary } as any} value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                           <span className="text-slate-400 font-bold">-</span>
                           <input type="date" className="text-xs p-2 border border-slate-200 rounded-md focus:ring-2 outline-none" style={{ '--tw-ring-color': colors.primary } as any} value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                         </div>
                    )}
                </div>
            )}
        </div>

        {/* Content Area */}
        <div className="animate-fade-in max-w-7xl mx-auto">
            {view === 'dashboard' && (data.invoices.length > 0 ? renderDashboard() : renderUpload())}
            {view === 'aging' && renderAging()}
            {view === 'credit' && renderCredit()}
            {view === 'wip' && renderWIP()}
            {view === 'upload' && renderUpload()}
        </div>

        {/* Settings Modal */}
        <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            settings={settings} 
            onSave={setSettings} 
            currentTheme={theme}
        />

        {/* Credit Calculator Modal */}
        {showCalculator && (() => {
            const debtor = data.debtors.find(d => d.id === showCalculator);
            if (!debtor) return null;
            return (
                <CreditLimitModal 
                    debtor={debtor} 
                    invoices={data.invoices} 
                    onClose={() => setShowCalculator(null)}
                    onApply={handleCalculatorApply}
                    theme={colors}
                />
            )
        })()}
      </main>
    </div>
  );
}
