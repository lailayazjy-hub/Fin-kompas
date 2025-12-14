import React, { useState } from 'react';
import { ProjectRecord, AppSettings, ThemeColors } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { analyzeFinancialData } from '../services/geminiService';
import { BrainCircuit, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils';

interface AnalysisViewProps {
  records: ProjectRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ records, settings, theme }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Prepare Chart Data (Aggregated by Period)
  const groupedData: Record<string, any> = {};
  records.forEach(r => {
    const key = `${r.year} ${r.period}`;
    if (!groupedData[key]) {
      groupedData[key] = { name: key, Omzet: 0, Kosten: 0, Marge: 0, Count: 0 };
    }
    groupedData[key].Omzet += r.revenue;
    groupedData[key].Kosten += r.totalCosts;
    groupedData[key].Marge += r.margin;
    groupedData[key].Count += 1;
  });
  
  const chartData = Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name));
  
  // Calculate average margin
  const totalMargin = records.reduce((sum, r) => sum + r.margin, 0);
  const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
  const avgMarginPercent = totalRevenue > 0 ? totalMargin / totalRevenue : 0;
  
  const lowMarginProjects = records.filter(r => r.status === 'Critical').length;

  const handleAiAnalysis = async () => {
    setLoading(true);
    const result = await analyzeFinancialData(records);
    setAiAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200 pdf-card">
          <h3 className="text-sm font-medium text-slate-500">Totaal Marge (Portfolio)</h3>
          <p className="text-2xl font-bold" style={{ color: theme.lowRisk }}>
            {formatPercent(avgMarginPercent)}
          </p>
          <p className="text-xs text-slate-400">{formatCurrency(totalMargin, settings.currencyMode)} netto winst</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200 pdf-card">
           <h3 className="text-sm font-medium text-slate-500">Kritieke Projecten</h3>
           <div className="flex items-center gap-2">
             <AlertTriangle className="w-6 h-6" style={{ color: theme.highRisk }} />
             <p className="text-2xl font-bold" style={{ color: theme.text }}>
              {lowMarginProjects}
             </p>
           </div>
           <p className="text-xs text-slate-400">Projecten met &lt; 5% marge</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200 pdf-card">
           <h3 className="text-sm font-medium text-slate-500">Totaal Omzet</h3>
           <p className="text-2xl font-bold" style={{ color: theme.text }}>
            {formatCurrency(totalRevenue, settings.currencyMode)}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 pdf-card">
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.text }}>Omzet vs Kosten Trend</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(val: number) => formatCurrency(val, settings.currencyMode)} />
                <Legend />
                <Bar dataKey="Omzet" fill={theme.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Kosten" fill={theme.highRisk} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 pdf-card">
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.text }}>Winstgevendheid (Marge %)</h2>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} unit="%" />
                <Tooltip 
                   formatter={(val: number) => formatCurrency(val, settings.currencyMode)}
                   labelFormatter={(label) => label}
                />
                <Legend />
                <Line type="monotone" dataKey="Marge" stroke={theme.lowRisk} strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-slate-200 pdf-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <BrainCircuit className="w-5 h-5" style={{ color: theme.primary }} />
            AI Project Adviseur
          </h2>
          <button 
            onClick={handleAiAnalysis}
            disabled={loading}
            className="text-sm px-3 py-1.5 border rounded flex items-center gap-2 transition-colors hover:opacity-80"
            style={{ 
              backgroundColor: theme.accent || theme.primary + '10', 
              borderColor: theme.primary, 
              color: theme.primary
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Analyse'}
          </button>
        </div>
        
        {aiAnalysis ? (
          <div 
            className="p-4 rounded border text-sm leading-relaxed"
            style={{ backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}30`, color: theme.text }}
          >
            {aiAnalysis}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Laat AI uw projectdata analyseren voor kostenbesparingen en risico's.
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;
