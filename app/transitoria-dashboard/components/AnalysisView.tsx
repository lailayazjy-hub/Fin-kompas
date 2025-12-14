import React, { useState } from 'react';
import { LedgerRecord, AppSettings, ThemeColors } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyzeFinancialData } from '../services/geminiService';
import { BrainCircuit, Loader2, TrendingUp, AlertTriangle, Layers } from 'lucide-react';
import { formatCurrency } from '../utils';

interface AnalysisViewProps {
  records: LedgerRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ records, settings, theme }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Chart 1: Monthly Cost Distribution
  const monthlyData = Array(12).fill(0).map((_, i) => ({ 
    name: new Date(0, i).toLocaleString('nl', { month: 'short' }), 
    Booked: 0,
    Allocated: 0 // Ideally we calculate 'Allocated' if we had strict start/end dates. Here we mock it or spread huge items.
  }));

  records.forEach(r => {
    const idx = (r.periode - 1) % 12;
    if (idx >= 0) monthlyData[idx].Booked += r.bedrag;
    
    // Simple allocation logic for visualisation: If amount > 5000, spread over 12 months evenly
    if (Math.abs(r.bedrag) > 5000 && r.omschrijving.toLowerCase().includes('jaar')) {
       const monthlyShare = r.bedrag / 12;
       for (let j=0; j<12; j++) monthlyData[j].Allocated += monthlyShare;
    } else {
       if (idx >= 0) monthlyData[idx].Allocated += r.bedrag;
    }
  });

  const handleAiAnalysis = async () => {
    setLoading(true);
    const result = await analyzeFinancialData(records);
    setAiAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Totaal Waarde (GBR)</h3>
          <p className="text-2xl font-bold" style={{ color: theme.text }}>
            {formatCurrency(records.reduce((a,b) => a+b.bedrag, 0), settings.currencyMode)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
           <h3 className="text-sm font-medium text-slate-500">High Risk Items</h3>
           <p className="text-2xl font-bold" style={{ color: theme.highRisk }}>
            {records.filter(r => r.anomalyScore > 0.7).length}
           </p>
           <p className="text-xs text-slate-400">Gebaseerd op bedrag & omschrijving</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
           <h3 className="text-sm font-medium text-slate-500">Nog te verwerken</h3>
           <p className="text-2xl font-bold" style={{ color: theme.primary }}>
            {records.filter(r => r.status === 'PENDING').length}
           </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <Layers className="w-5 h-5" style={{ color: theme.primary }} />
            Boeking vs. Allocatie (Verschuivingen)
          </h2>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke={theme.text} fontSize={12} />
              <YAxis stroke={theme.text} fontSize={12} />
              <Tooltip formatter={(value: number) => formatCurrency(value, settings.currencyMode)} />
              <Legend />
              <Line type="monotone" dataKey="Booked" stroke={theme.primary} strokeWidth={2} name="Geboekt" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Allocated" stroke={theme.lowRisk} strokeWidth={2} name="Theoretische Allocatie" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          * De stippellijn toont een simulatie van hoe kosten zouden vallen als grote jaarposten gespreid worden.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <BrainCircuit className="w-5 h-5" style={{ color: theme.primary }} />
            AI Transitoria Analyse
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
            Klik op 'Start Analyse' om AI te laten zoeken naar ontbrekende periodieke kosten en anomalieën.
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;
