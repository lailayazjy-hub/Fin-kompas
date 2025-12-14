'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Upload, Download, Calendar, AlertTriangle, FileText, Activity, 
  MessageSquare, ChevronDown, RefreshCw, Settings, X 
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

import { 
  Language, DateRangeOption, FinancialRecord, Anomaly, 
  Comment, AIInsight, Theme 
} from './types';
import { LABELS, THEMES } from './constants';
import { formatCurrency, detectAnomalies, generateDemoData, downloadTemplate, formatDate } from './utils';
import { generateFinancialInsight } from './services/geminiService';

// --- SVG Logo Component (Neutral, Watercolor-style abstraction) ---
const WoodpeckerLogo: React.FC<{ className?: string, opacity?: number }> = ({ className, opacity = 1 }) => (
  <svg 
    viewBox="0 0 200 200" 
    className={className} 
    style={{ opacity }}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Circle Background */}
    <circle cx="100" cy="100" r="90" fill="#f3f4f6" />
    
    {/* Abstract Trunk (Watercolor wash style) */}
    <path 
      d="M120 190 C 130 150, 110 50, 130 10" 
      stroke="#e5e7eb" 
      strokeWidth="20" 
      fill="none" 
      strokeLinecap="round"
    />
    
    {/* Woodpecker Silhouette / Artistic Representation */}
    <g fill="#9ca3af">
      {/* Body & Wing */}
      <path d="M95 80 Q 80 100 85 130 C 85 140 80 150 90 160 L 95 140 Q 105 120 95 80" fill="#4b5563" />
      {/* Head */}
      <circle cx="95" cy="70" r="12" fill="#1f2937" />
      {/* Red Patch (Neutralized to dark grey for consistency as requested, or subtle hint) */}
      <path d="M100 65 Q 105 65 102 75" stroke="#6b7280" strokeWidth="3" fill="none" />
      {/* Beak */}
      <path d="M105 70 L 120 72 L 105 75 Z" fill="#1f2937" />
      {/* White Chest Area */}
      <path d="M90 85 Q 85 110 90 130" stroke="#f9fafb" strokeWidth="4" fill="none" />
    </g>
  </svg>
);

export default function KostenTrendAnalysePage() {
  // --- State ---
  const [language, setLanguage] = useState<Language>(Language.NL);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES.TERRA_COTTA);
  const [appName, setAppName] = useState("FinFocus AI Studio");
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempAppName, setTempAppName] = useState(appName);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [rawData, setRawData] = useState<FinancialRecord[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  const [dateRange, setDateRange] = useState<DateRangeOption>(DateRangeOption.MONTHS_6);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  
  const [selectedCostType, setSelectedCostType] = useState<string>('All');
  const [comments, setComments] = useState<Comment[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [aiInsights, setAiInsights] = useState<Record<string, AIInsight>>({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // --- Effects ---

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Process data when rawData or filters change
  const filteredData = useMemo(() => {
    if (rawData.length === 0) return [];

    let start: Date;
    let end: Date = new Date();

    switch (dateRange) {
      case DateRangeOption.MONTHS_3: start = subMonths(end, 3); break;
      case DateRangeOption.MONTHS_6: start = subMonths(end, 6); break;
      case DateRangeOption.MONTHS_9: start = subMonths(end, 9); break;
      case DateRangeOption.YEAR_1: start = subMonths(end, 12); break;
      case DateRangeOption.CUSTOM:
        start = customStart ? new Date(customStart) : subMonths(end, 6);
        end = customEnd ? new Date(customEnd) : new Date();
        break;
      default: start = subMonths(end, 6);
    }

    // Ensure filtering covers whole days
    start = startOfMonth(start);
    end = endOfMonth(end);

    return rawData.filter(r => 
      isWithinInterval(r.date, { start, end }) && 
      (selectedCostType === 'All' || r.costType === selectedCostType)
    );
  }, [rawData, dateRange, customStart, customEnd, selectedCostType]);

  // Recalculate anomalies based on filtered data
  useEffect(() => {
    if (filteredData.length > 0) {
      const foundAnomalies = detectAnomalies(filteredData);
      setAnomalies(foundAnomalies);
    } else {
      setAnomalies([]);
    }
  }, [filteredData]);

  // Trigger AI analysis when cost type changes or data is loaded
  const runAIAnalysis = useCallback(async () => {
    if (rawData.length === 0) return;
    
    setIsLoadingAI(true);
    const costTypesToAnalyze = selectedCostType === 'All' 
      ? Array.from(new Set(rawData.map(r => r.costType)))
      : [selectedCostType];

    const newInsights: Record<string, AIInsight> = {};

    // Parallel execution for speed
    await Promise.all(costTypesToAnalyze.map(async (type) => {
      // Filter records for this type
      const records = rawData.filter(r => r.costType === type);
      const insight = await generateFinancialInsight(type, records, language);
      newInsights[type] = insight;
    }));

    setAiInsights(prev => ({ ...prev, ...newInsights }));
    setIsLoadingAI(false);
  }, [rawData, selectedCostType, language]);

  // Run AI analysis initially when data is loaded
  useEffect(() => {
    if (rawData.length > 0) {
      runAIAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData.length]); 

  // --- Handlers ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    const parseData = (data: any[][]) => {
      if (!data || data.length < 2) return;

      const headers = data[0].map(h => String(h).toLowerCase().trim());
      
      let dateIdx = headers.findIndex(h => ['datum', 'date', 'transactiedatum'].some(k => h.includes(k)));
      let amountIdx = headers.findIndex(h => ['bedrag', 'amount', 'saldo'].some(k => h.includes(k)));
      let idIdx = headers.findIndex(h => ['boekstuk', 'id', 'transactie'].some(k => h.includes(k)));
      
      // Strict priority for Exact Online structure: Grootboekrekening first
      let typeIdx = headers.findIndex(h => h.includes('grootboek'));
      if (typeIdx === -1) {
        typeIdx = headers.findIndex(h => ['kostensoort', 'category', 'cost', 'rubriek'].some(k => h.includes(k)));
      }

      if (dateIdx === -1 === undefined || amountIdx === -1 || typeIdx === -1) {
        alert(language === Language.NL 
          ? "Kon kolommen niet herkennen. Zorg voor 'Grootboekrekening' (of Kostensoort), 'Datum' en 'Bedrag'."
          : "Could not recognize columns. Ensure 'Ledger' (or Cost Type), 'Date' and 'Amount'.");
        return;
      }

      const records: FinancialRecord[] = data.slice(1).map((row, idx) => {
        const rawDate = row[dateIdx];
        const rawType = row[typeIdx];
        const rawAmount = row[amountIdx];
        const rawId = idIdx !== -1 ? row[idIdx] : `row-${idx}`;
        
        let dateObj = new Date(rawDate);
        if (typeof rawDate === 'number') {
           dateObj = new Date(Math.round((rawDate - 25569)*86400*1000));
        } else if (typeof rawDate === 'string') {
           if (isNaN(dateObj.getTime())) {
             const parts = rawDate.split(/[-/]/);
             if (parts.length === 3) { 
                dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
             }
           }
        }

        let amount = typeof rawAmount === 'number' ? rawAmount : 0;
        if (typeof rawAmount === 'string') {
          let clean = rawAmount.trim();
          if (clean.includes(',') && !clean.includes('.')) {
             clean = clean.replace(',', '.');
          } else if (clean.includes('.') && clean.includes(',')) {
             if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
               clean = clean.replace(/\./g, '').replace(',', '.');
             } else {
               clean = clean.replace(/,/g, '');
             }
          }
          amount = parseFloat(clean);
        }

        return {
          id: String(rawId),
          date: dateObj,
          costType: String(rawType || 'Onbekend'),
          amount: isNaN(amount) ? 0 : amount
        };
      }).filter(r => r.date instanceof Date && !isNaN(r.date.getTime()) && r.amount !== 0);

      setRawData(records);
    };

    if (file.name.endsWith('.csv')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        Papa.parse(text, {
          skipEmptyLines: true,
          complete: (results) => parseData(results.data as any[][])
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        parseData(json as any[][]);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleLoadDemo = () => {
    const demo = generateDemoData();
    setRawData(demo);
  };

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const addComment = (recordId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      recordId,
      author: 'Manager',
      text,
      timestamp: new Date()
    };
    setComments([...comments, newComment]);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Financial Report - ${format(new Date(), 'yyyy-MM-dd')}`, 14, 15);
    
    const tableData = anomalies.map(a => [
      format(a.date, 'yyyy-MM-dd'),
      a.costType,
      formatCurrency(a.amount),
      a.description,
      a.severity
    ]);

    autoTable(doc, {
      head: [['Date', 'Type', 'Amount', 'Description', 'Severity']],
      body: tableData,
      startY: 20
    });

    doc.save('financial_analysis.pdf');
  };

  // --- Helper to get risk color based on theme ---
  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return currentTheme.colors.highRisk;
      case 'MEDIUM': return currentTheme.colors.mediumRisk;
      case 'LOW': return currentTheme.colors.lowRisk;
      default: return currentTheme.colors.text;
    }
  };

  const getRiskBg = (severity: string) => {
     // Use hex to rgba conversion or just lower opacity if possible, 
     // but for simplicity, we will use inline style opacity on the element
     return getRiskColor(severity);
  };

  // --- Chart Preparation ---
  const chartData = useMemo(() => {
    const grouped: Record<string, { [key: string]: number }> = {};
    
    filteredData.forEach(r => {
      const monthKey = format(r.date, 'yyyy-MM');
      if (!grouped[monthKey]) grouped[monthKey] = { time: new Date(monthKey).getTime() };
      
      if (!grouped[monthKey][r.costType]) grouped[monthKey][r.costType] = 0;
      grouped[monthKey][r.costType] += r.amount;
    });

    return Object.keys(grouped)
      .sort()
      .map(key => ({
        name: key,
        ...grouped[key]
      }));
  }, [filteredData]);

  const uniqueCostTypes = useMemo(() => 
    Array.from(new Set(rawData.map(r => r.costType))), 
  [rawData]);

  return (
    <div className="min-h-screen pb-10 relative bg-slate-50 transition-colors duration-300">
      
      {/* --- Watermark Logo --- */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-5">
         <WoodpeckerLogo className="w-[600px] h-[600px]" opacity={0.05} />
      </div>

      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {/* Header Logo */}
              <WoodpeckerLogo className="w-10 h-10" />
              <h1 className="text-xl font-bold transition-colors duration-300" style={{ color: currentTheme.colors.text }}>
                {appName}
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end text-xs font-medium" style={{ color: currentTheme.colors.text, opacity: 0.7 }}>
                <span>{formatDate(currentTime, language)}</span>
                <span>{format(currentTime, 'HH:mm:ss')}</span>
              </div>
              
              <button 
                onClick={() => setLanguage(language === Language.NL ? Language.EN : Language.NL)}
                className="px-3 py-1 text-sm font-semibold rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                style={{ color: currentTheme.colors.text }}
              >
                {language}
              </button>

              <button 
                onClick={() => { setTempAppName(appName); setIsSettingsOpen(true); }}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                title={LABELS.settings[language]}
              >
                <Settings className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* --- Controls Section --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end">
            
            {/* Input & Filters */}
            <div className="w-full lg:w-3/4 space-y-6">
              
              {/* File Actions */}
              <div className="flex flex-wrap gap-4">
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button 
                    className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:opacity-90"
                    style={{ backgroundColor: currentTheme.colors.primary }}
                  >
                    <Upload className="w-4 h-4" />
                    {LABELS.upload[language]}
                  </button>
                </div>
                
                <button 
                  onClick={handleLoadDemo}
                  className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:opacity-90"
                  style={{ backgroundColor: currentTheme.colors.lowRisk }} 
                >
                  <Activity className="w-4 h-4" />
                  {LABELS.demo[language]}
                </button>

                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-all hover:bg-slate-50"
                  style={{ borderColor: currentTheme.colors.text, color: currentTheme.colors.text }}
                >
                  <FileText className="w-4 h-4" />
                  {LABELS.downloadTemplate[language]}
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Period Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1" style={{ color: currentTheme.colors.text, opacity: 0.6 }}>
                    {LABELS.analysisPeriod[language]}
                  </label>
                  <div className="relative">
                    <select 
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                      className="w-full appearance-none bg-slate-50 border border-slate-300 text-sm rounded-lg focus:ring-2 block p-2.5 pr-8 transition-colors"
                      style={{ color: currentTheme.colors.text, outlineColor: currentTheme.colors.primary }}
                    >
                      <option value={DateRangeOption.MONTHS_3}>3 {language === Language.NL ? 'Maanden' : 'Months'}</option>
                      <option value={DateRangeOption.MONTHS_6}>6 {language === Language.NL ? 'Maanden' : 'Months'}</option>
                      <option value={DateRangeOption.MONTHS_9}>9 {language === Language.NL ? 'Maanden' : 'Months'}</option>
                      <option value={DateRangeOption.YEAR_1}>1 {language === Language.NL ? 'Jaar' : 'Year'}</option>
                      <option value={DateRangeOption.CUSTOM}>{LABELS.customRange[language]}</option>
                    </select>
                    <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Custom Date Inputs (Conditional) */}
                {dateRange === DateRangeOption.CUSTOM && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1" style={{ color: currentTheme.colors.text, opacity: 0.6 }}>
                        {LABELS.startDate[language]}
                      </label>
                      <input 
                        type="date" 
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-sm rounded-lg p-2.5"
                        style={{ color: currentTheme.colors.text }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-1" style={{ color: currentTheme.colors.text, opacity: 0.6 }}>
                        {LABELS.endDate[language]}
                      </label>
                      <input 
                        type="date" 
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-sm rounded-lg p-2.5"
                        style={{ color: currentTheme.colors.text }}
                      />
                    </div>
                  </>
                )}

                {/* Cost Type Filter */}
                <div>
                   <label className="block text-xs font-semibold uppercase mb-1" style={{ color: currentTheme.colors.text, opacity: 0.6 }}>
                    {LABELS.costType[language]}
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedCostType}
                      onChange={(e) => setSelectedCostType(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-300 text-sm rounded-lg focus:ring-2 block p-2.5 pr-8"
                      style={{ color: currentTheme.colors.text, outlineColor: currentTheme.colors.primary }}
                    >
                      <option value="All">{LABELS.all[language]}</option>
                      {uniqueCostTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="w-full lg:w-auto">
               <button 
                  onClick={exportPDF}
                  disabled={rawData.length === 0}
                  className="w-full lg:w-auto flex justify-center items-center gap-2 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-90"
                  style={{ backgroundColor: currentTheme.colors.text }}
                >
                  <Download className="w-4 h-4" />
                  {LABELS.export[language]}
                </button>
            </div>
          </div>
        </div>

        {rawData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Upload className="w-12 h-12 mb-4" style={{ color: currentTheme.colors.primary, opacity: 0.5 }} />
            <p style={{ color: currentTheme.colors.text, opacity: 0.7 }}>{LABELS.noData[language]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* --- Left Column: Visualization --- */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* AI Insight Card */}
              {selectedCostType !== 'All' && (
                <div 
                  className="rounded-xl p-5 shadow-sm border"
                  style={{ 
                    backgroundColor: `${currentTheme.colors.primary}10`, // 10% opacity hex
                    borderColor: `${currentTheme.colors.primary}40`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-full mt-1"
                      style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoadingAI ? 'animate-spin' : ''}`} style={{ color: currentTheme.colors.primary }} />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: currentTheme.colors.primary }}>
                        {LABELS.aiAnalysis[language]}
                      </h3>
                      <p className="text-lg leading-snug font-medium" style={{ color: currentTheme.colors.text }}>
                        {aiInsights[selectedCostType]?.insight || (isLoadingAI ? LABELS.loading[language] : '')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold mb-6" style={{ color: currentTheme.colors.text }}>{LABELS.trendAnalysis[language]}</h2>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b" 
                        tick={{fill: '#64748b', fontSize: 12}}
                        tickFormatter={(val) => {
                          const [y, m] = val.split('-');
                          const date = new Date(parseInt(y), parseInt(m)-1);
                          return format(date, 'MMM yy');
                        }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        tick={{fill: '#64748b', fontSize: 12}} 
                        tickFormatter={(val) => `${val/1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '8px', 
                          border: `1px solid ${currentTheme.colors.primary}`, 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                        }}
                        formatter={(value: number) => [`EUR ${value.toLocaleString()}`, 'Amount']}
                      />
                      <Legend />
                      {uniqueCostTypes
                        .filter(type => selectedCostType === 'All' || selectedCostType === type)
                        .map((type, index) => (
                          <Line 
                            key={type}
                            type="monotone" 
                            dataKey={type} 
                            // Cycle through accents, fallback to primary if index exceeds
                            stroke={currentTheme.colors.accents[index % currentTheme.colors.accents.length]} 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* --- Right Column: Anomalies & Details --- */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[800px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: currentTheme.colors.text }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: currentTheme.colors.highRisk }} />
                    {LABELS.anomalies[language]}
                  </h2>
                  <span 
                    className="text-xs font-bold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: currentTheme.colors.mediumRisk }}
                  >
                    {anomalies.length}
                  </span>
                </div>
                
                <div className="overflow-y-auto flex-1 p-2">
                  {anomalies.length === 0 ? (
                    <div className="p-8 text-center text-sm" style={{ color: currentTheme.colors.text, opacity: 0.5 }}>
                      {LABELS.noAnomalies[language]}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {anomalies.map((anomaly) => {
                        const isExpanded = expandedRows.has(anomaly.id);
                        const rowComments = comments.filter(c => c.recordId === anomaly.id);
                        const riskColor = getRiskColor(anomaly.severity);

                        return (
                          <div 
                            key={anomaly.id} 
                            className="border rounded-lg overflow-hidden transition-all hover:shadow-md"
                            style={{ borderColor: `${riskColor}50` }} // 50 opacity hex
                          >
                            <div 
                              className="p-4 bg-white cursor-pointer flex justify-between items-start"
                              onClick={() => toggleRow(anomaly.id)}
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: riskColor }}
                                  />
                                  <span className="text-xs font-bold uppercase" style={{ color: riskColor }}>
                                    {anomaly.costType}
                                  </span>
                                </div>
                                <h3 className="font-semibold" style={{ color: currentTheme.colors.text }}>
                                  {formatDate(anomaly.date, language)}
                                </h3>
                                <p className="text-sm" style={{ color: currentTheme.colors.text, opacity: 0.7 }}>
                                  {anomaly.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>
                                  {formatCurrency(anomaly.amount)}
                                </div>
                                <div className="text-xs font-medium" style={{ color: currentTheme.colors.text, opacity: 0.5 }}>
                                  Z: {anomaly.zScore.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Collapsible Content */}
                            {isExpanded && (
                              <div className="bg-slate-50 p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                {/* AI Mini Insight for this specific anomaly */}
                                <div 
                                  className="mb-4 text-xs p-2 rounded border"
                                  style={{ 
                                    backgroundColor: `${currentTheme.colors.primary}10`,
                                    borderColor: `${currentTheme.colors.primary}30`,
                                    color: currentTheme.colors.text
                                  }}
                                >
                                  <strong style={{ color: currentTheme.colors.primary }}>{LABELS.aiInsightLabel[language]}</strong> {aiInsights[anomaly.costType]?.insight || LABELS.loading[language]}
                                </div>

                                <div className="space-y-3 mb-4">
                                  {rowComments.map(c => (
                                    <div key={c.id} className="bg-white p-2 rounded border border-slate-200 text-sm shadow-sm">
                                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span className="font-semibold text-slate-600">{c.author}</span>
                                        <span>{format(c.timestamp, 'dd/MM HH:mm')}</span>
                                      </div>
                                      <p className="text-slate-700">{c.text}</p>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="relative">
                                  <input 
                                    type="text" 
                                    placeholder={LABELS.commentPlaceholder[language]}
                                    className="w-full text-sm border-slate-300 rounded-md pr-10 focus:ring-2 focus:border-transparent outline-none"
                                    style={{ 
                                      '--tw-ring-color': currentTheme.colors.primary 
                                    } as React.CSSProperties}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        addComment(anomaly.id, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <MessageSquare className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Settings Modal --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>
                {LABELS.settings[language]}
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* App Name Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
                  {LABELS.appName[language]}
                </label>
                <input 
                  type="text" 
                  value={tempAppName}
                  onChange={(e) => setTempAppName(e.target.value)}
                  className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:border-transparent outline-none"
                  style={{ '--tw-ring-color': currentTheme.colors.primary } as React.CSSProperties}
                />
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: currentTheme.colors.text }}>
                  {LABELS.theme[language]}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setCurrentTheme(theme)}
                      className={`
                        relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                        ${currentTheme.id === theme.id ? 'bg-slate-50' : 'bg-white border-slate-200 hover:border-slate-300'}
                      `}
                      style={{ 
                        borderColor: currentTheme.id === theme.id ? theme.colors.primary : undefined 
                      }}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.highRisk }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.lowRisk }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors font-medium text-sm"
              >
                {LABELS.close[language]}
              </button>
              <button 
                onClick={() => {
                  setAppName(tempAppName);
                  setIsSettingsOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm shadow-sm hover:opacity-90"
                style={{ backgroundColor: currentTheme.colors.primary }}
              >
                {LABELS.save[language]}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
