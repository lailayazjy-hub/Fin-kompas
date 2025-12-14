import React, { useState, useEffect } from 'react';
import { LineItem, LineItemType, SourceFile, AppSettings, AppTheme } from '../types';
import { getThemeById } from '../utils/themes';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, AlertCircle, Calculator, Info, Percent, Wallet } from 'lucide-react';

interface Props {
  files: SourceFile[];
  settings: AppSettings;
}

export const AnalysisDashboard: React.FC<Props> = ({ files, settings }) => {
  const theme = getThemeById(settings.themeId);
  const [viewMode, setViewMode] = useState<'overview' | 'fulltime' | 'cao'>('overview');
  const [customHours, setCustomHours] = useState<number>(0); 
  const [targetFullTimeHours, setTargetFullTimeHours] = useState<number>(40); 
  
  // CAO States
  const [raisePercent, setRaisePercent] = useState<number>(2.5);
  const [raiseNominal, setRaiseNominal] = useState<number>(0);

  // Chart Colors based on Theme
  const CHART_COLORS = [
    theme.colors.primary,
    theme.colors.lowRisk,
    theme.colors.mediumRisk,
    theme.colors.highRisk,
    theme.colors.accent1 || '#cbd5e1',
    theme.colors.accent2 || '#94a3b8'
  ];

  const activeFiles = files.filter(f => f.isActive);
  const activeLines = activeFiles.flatMap(f => f.lines);

  useEffect(() => {
    const detected = activeFiles.find(f => f.metadata?.detectedHoursPerWeek)?.metadata?.detectedHoursPerWeek;
    if (detected) {
      setCustomHours(detected);
    } else if (customHours === 0 && activeFiles.length > 0) {
      setCustomHours(32); 
    }
  }, [activeFiles.length, activeFiles.map(f => f.id).join(',')]);

  const totalIncome = activeLines
    .filter(l => l.type === LineItemType.INCOME)
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDeductions = activeLines
    .filter(l => l.type === LineItemType.DEDUCTION)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  
  const calculatedNet = totalIncome - totalDeductions;
  
  const explicitNet = activeLines
    .filter(l => l.type === LineItemType.NET_PAYOUT)
    .reduce((sum, item) => sum + item.amount, 0);

  const netToDisplay = explicitNet || calculatedNet;

  const categoryData = activeLines
    .filter(l => l.type === LineItemType.INCOME || l.type === LineItemType.DEDUCTION)
    .reduce((acc, item) => {
      const existing = acc.find(x => x.name === item.category);
      if (existing) {
        existing.value += Math.abs(item.amount);
      } else {
        acc.push({ name: item.category, value: Math.abs(item.amount) });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  categoryData.sort((a, b) => b.value - a.value);

  const targetHours = targetFullTimeHours;
  const currentHours = customHours > 0 ? customHours : 32; 
  const multiplier = targetHours / currentHours;

  const caoNewGross = (totalIncome * (1 + raisePercent / 100)) + raiseNominal;
  const effectiveTaxRate = totalIncome > 0 ? totalDeductions / totalIncome : 0;
  const caoNewDeduction = caoNewGross * effectiveTaxRate;
  const caoNewNet = caoNewGross - caoNewDeduction;

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Cards */}
        <div className="bg-white p-6 rounded-xl border border-[var(--color-primary-light)] shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.lowRisk}20`, color: theme.colors.lowRisk }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: `${theme.colors.text}99` }}>Totaal Bruto</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{formatCurrency(totalIncome, settings.currencyMode)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[var(--color-primary-light)] shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.highRisk}20`, color: theme.colors.highRisk }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: `${theme.colors.text}99` }}>Inhoudingen</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{formatCurrency(totalDeductions, settings.currencyMode)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[var(--color-primary-light)] shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
            <PiggyBank size={24} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: `${theme.colors.text}99` }}>Netto Indicatie</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{formatCurrency(netToDisplay, settings.currencyMode)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-6" style={{ color: theme.colors.text }}>Kostenverdeling per Categorie</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, settings.currencyMode)} />
                  <Legend />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Panel */}
        {settings.showAiRemarks && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
              <AlertCircle size={20} style={{ color: theme.colors.mediumRisk }} />
              AI Inzichten
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {activeLines.filter(l => l.aiRemark).length === 0 ? (
                <p className="italic" style={{ color: `${theme.colors.text}60` }}>Geen opvallende zaken gevonden door AI.</p>
              ) : (
                activeLines.filter(l => l.aiRemark).map(item => (
                  <div key={item.id} className="p-3 rounded-lg border" style={{ backgroundColor: `${theme.colors.primary}08`, borderColor: `${theme.colors.primary}20` }}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm" style={{ color: theme.colors.text }}>{item.description}</span>
                      <span className="text-xs font-mono" style={{ color: theme.colors.primary }}>{formatCurrency(item.amount, settings.currencyMode)}</span>
                    </div>
                    <p className="text-sm leading-snug" style={{ color: `${theme.colors.text}CC` }}>{item.aiRemark}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFullTimeScenario = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="p-6 rounded-xl border" style={{ background: `linear-gradient(to right, ${theme.colors.primary}10, ${theme.colors.lowRisk}10)`, borderColor: `${theme.colors.primary}30` }}>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
           <div>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.primary }}>
                 <Calculator size={20} />
                 Voltijd Calculator
              </h3>
              <p className="text-sm mt-1 max-w-lg" style={{ color: theme.colors.text }}>
                Bekijk wat het inkomen zou zijn bij een voltijd werkweek op basis van de huidige uurprijs.
              </p>
           </div>
           
           <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
             <div className="flex flex-col">
               <label className="text-xs font-semibold text-gray-500 uppercase">Huidig (uur/wk)</label>
               <input 
                 type="number" 
                 value={customHours}
                 onChange={(e) => setCustomHours(Number(e.target.value))}
                 className="w-20 font-mono font-bold text-gray-900 outline-none border-b border-gray-300 focus:border-[var(--color-primary)]"
               />
             </div>
             <span className="text-gray-400">➔</span>
             <div className="flex flex-col">
               <label className="text-xs font-semibold text-gray-500 uppercase">Norm Voltijd</label>
               <select
                 value={targetFullTimeHours}
                 onChange={(e) => setTargetFullTimeHours(Number(e.target.value))}
                 className="w-24 font-mono font-bold outline-none border-b border-gray-300 bg-transparent py-0.5"
                 style={{ color: theme.colors.primary }}
               >
                 <option value={36}>36 uur</option>
                 <option value={38}>38 uur</option>
                 <option value={40}>40 uur</option>
               </select>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Comparison Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium">
               <tr>
                 <th className="px-6 py-4 text-left">Onderdeel</th>
                 <th className="px-6 py-4 text-right">Huidig ({currentHours}u)</th>
                 <th className="px-6 py-4 text-right text-white" style={{ backgroundColor: theme.colors.primary }}>Voltijd ({targetHours}u)</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
               <tr>
                 <td className="px-6 py-4 font-medium" style={{ color: theme.colors.text }}>Bruto Inkomen</td>
                 <td className="px-6 py-4 text-right">{formatCurrency(totalIncome, settings.currencyMode)}</td>
                 <td className="px-6 py-4 text-right font-bold" style={{ backgroundColor: `${theme.colors.primary}10`, color: theme.colors.primary }}>
                    {formatCurrency(totalIncome * multiplier, settings.currencyMode)}
                 </td>
               </tr>
               <tr>
                 <td className="px-6 py-4 text-gray-500">Inhoudingen (Schatting)</td>
                 <td className="px-6 py-4 text-right" style={{ color: theme.colors.highRisk }}>{formatCurrency(totalDeductions, settings.currencyMode)}</td>
                 <td className="px-6 py-4 text-right" style={{ backgroundColor: `${theme.colors.primary}10`, color: theme.colors.highRisk }}>
                    {formatCurrency(totalDeductions * multiplier, settings.currencyMode)}
                 </td>
               </tr>
               <tr className="bg-gray-50">
                 <td className="px-6 py-4 font-bold" style={{ color: theme.colors.text }}>Netto Resultaat</td>
                 <td className="px-6 py-4 text-right font-bold" style={{ color: theme.colors.lowRisk }}>{formatCurrency(netToDisplay, settings.currencyMode)}</td>
                 <td className="px-6 py-4 text-right font-bold" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.lowRisk }}>
                    {formatCurrency(netToDisplay * multiplier, settings.currencyMode)}
                 </td>
               </tr>
            </tbody>
          </table>
          <div className="p-4 text-xs flex gap-2 items-start" style={{ backgroundColor: `${theme.colors.mediumRisk}15`, color: theme.colors.text }}>
             <Info size={16} className="shrink-0 mt-0.5" style={{ color: theme.colors.mediumRisk }} />
             <p>
               <strong>Let op:</strong> Dit is een lineaire extrapolatie. In werkelijkheid is de belastingdruk progressief.
               Het daadwerkelijke netto bedrag bij {targetHours} uur zal waarschijnlijk lager uitvallen.
             </p>
          </div>
        </div>

        {/* Visual Difference */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
             <h4 className="font-medium mb-6 text-center" style={{ color: `${theme.colors.text}80` }}>Projectie Bruto Maandinkomen</h4>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: `${currentHours}u`, bedrag: totalIncome },
                   { name: `${targetHours}u`, bedrag: totalIncome * multiplier }
                 ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" />
                   <YAxis hide />
                   <Tooltip formatter={(value: number) => formatCurrency(value, settings.currencyMode)} />
                   <Bar dataKey="bedrag" fill={theme.colors.primary} radius={[4, 4, 0, 0]} barSize={60}>
                      {
                        [{name: 'Current'}, {name: 'Future'}].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#9CA3AF' : theme.colors.primary} />
                        ))
                      }
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
             <p className="text-center text-sm text-gray-500 mt-2">
                Potentiële stijging: <span className="font-bold" style={{ color: theme.colors.lowRisk }}>+{formatCurrency((totalIncome * multiplier) - totalIncome, settings.currencyMode)}</span> bruto
             </p>
        </div>
      </div>
    </div>
  );

  const renderCaoScenario = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="p-6 rounded-xl border" style={{ background: `linear-gradient(to right, ${theme.colors.lowRisk}15, ${theme.colors.primary}15)`, borderColor: `${theme.colors.lowRisk}30` }}>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
           <div>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                 <Percent size={20} style={{ color: theme.colors.lowRisk }} />
                 Salarisverhoging (CAO)
              </h3>
              <p className="text-sm mt-1 max-w-lg" style={{ color: `${theme.colors.text}99` }}>
                Bereken het effect van een algemene loonsverhoging of CAO-afspraak op je salaris.
              </p>
           </div>
           
           <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
             <div className="flex flex-col">
               <label className="text-xs font-semibold text-gray-500 uppercase">Percentage (%)</label>
               <input 
                 type="number" 
                 step="0.1"
                 value={raisePercent}
                 onChange={(e) => setRaisePercent(Number(e.target.value))}
                 className="w-24 font-mono font-bold outline-none border-b border-gray-300 bg-transparent"
                 style={{ color: theme.colors.lowRisk }}
               />
             </div>
             <span className="text-gray-400">+</span>
             <div className="flex flex-col">
               <label className="text-xs font-semibold text-gray-500 uppercase">Vast Bedrag (€)</label>
               <input 
                 type="number" 
                 value={raiseNominal}
                 onChange={(e) => setRaiseNominal(Number(e.target.value))}
                 className="w-24 font-mono font-bold outline-none border-b border-gray-300 bg-transparent"
                 style={{ color: theme.colors.lowRisk }}
               />
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Comparison Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium">
               <tr>
                 <th className="px-6 py-4 text-left">Onderdeel</th>
                 <th className="px-6 py-4 text-right">Huidig</th>
                 <th className="px-6 py-4 text-right text-white" style={{ backgroundColor: theme.colors.lowRisk }}>Nieuw</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
               <tr>
                 <td className="px-6 py-4 font-medium" style={{ color: theme.colors.text }}>Bruto Inkomen</td>
                 <td className="px-6 py-4 text-right">{formatCurrency(totalIncome, settings.currencyMode)}</td>
                 <td className="px-6 py-4 text-right font-bold" style={{ backgroundColor: `${theme.colors.lowRisk}15`, color: theme.colors.text }}>
                    {formatCurrency(caoNewGross, settings.currencyMode)}
                 </td>
               </tr>
               <tr>
                 <td className="px-6 py-4 text-gray-500">Inhoudingen (Schatting)</td>
                 <td className="px-6 py-4 text-right" style={{ color: theme.colors.highRisk }}>{formatCurrency(totalDeductions, settings.currencyMode)}</td>
                 <td className="px-6 py-4 text-right" style={{ backgroundColor: `${theme.colors.lowRisk}15`, color: theme.colors.highRisk }}>
                    {formatCurrency(caoNewDeduction, settings.currencyMode)}
                 </td>
               </tr>
               <tr className="bg-gray-50">
                 <td className="px-6 py-4 font-bold" style={{ color: theme.colors.text }}>Netto Resultaat</td>
                 <td className="px-6 py-4 text-right font-bold" style={{ color: theme.colors.lowRisk }}>{formatCurrency(netToDisplay, settings.currencyMode)}</td>
                 <td className="px-6 py-4 text-right font-bold" style={{ backgroundColor: `${theme.colors.lowRisk}25`, color: theme.colors.lowRisk }}>
                    {formatCurrency(caoNewNet, settings.currencyMode)}
                 </td>
               </tr>
            </tbody>
          </table>
           <div className="p-4 border-t border-emerald-100 flex justify-between items-center" style={{ backgroundColor: `${theme.colors.lowRisk}15` }}>
              <div className="text-sm font-medium" style={{ color: theme.colors.text }}>Extra per jaar (Netto):</div>
              <div className="font-bold font-mono" style={{ color: theme.colors.lowRisk }}>
                +{formatCurrency((caoNewNet - netToDisplay) * 12, settings.currencyMode)}
              </div>
           </div>
        </div>

        {/* Visual Difference */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
             <h4 className="font-medium mb-6 text-center" style={{ color: `${theme.colors.text}80` }}>Effect Salarisverhoging</h4>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: 'Huidig', bedrag: totalIncome },
                   { name: 'Nieuw', bedrag: caoNewGross }
                 ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" />
                   <YAxis hide />
                   <Tooltip formatter={(value: number) => formatCurrency(value, settings.currencyMode)} />
                   <Bar dataKey="bedrag" fill={theme.colors.lowRisk} radius={[4, 4, 0, 0]} barSize={60}>
                      {
                        [{name: 'Huidig'}, {name: 'Nieuw'}].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#9CA3AF' : theme.colors.lowRisk} />
                        ))
                      }
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
             <p className="text-center text-sm text-gray-500 mt-2">
                Stijging per maand: <span className="font-bold" style={{ color: theme.colors.lowRisk }}>+{formatCurrency(caoNewGross - totalIncome, settings.currencyMode)}</span> bruto
             </p>
        </div>
      </div>
    </div>
  );

  if (files.length === 0 && !settings.demoMode) {
    return <div className="p-6 text-gray-400 text-center">Geen data om te analyseren.</div>;
  }

  return (
    <div className="p-6">
      {/* Sub-navigation for Analysis */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-1 overflow-x-auto">
         <button 
           onClick={() => setViewMode('overview')}
           className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${viewMode === 'overview' ? 'border-[var(--color-text)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           style={viewMode === 'overview' ? { color: theme.colors.text } : {}}
         >
           Overzicht
         </button>
         <button 
           onClick={() => setViewMode('fulltime')}
           className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${viewMode === 'fulltime' ? '' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           style={viewMode === 'fulltime' ? { color: theme.colors.primary, borderColor: theme.colors.primary } : {}}
         >
           Voltijd Scenario ({targetFullTimeHours}u)
         </button>
         <button 
           onClick={() => setViewMode('cao')}
           className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1 ${viewMode === 'cao' ? '' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
           style={viewMode === 'cao' ? { color: theme.colors.lowRisk, borderColor: theme.colors.lowRisk } : {}}
         >
           Salarisverhoging (CAO)
         </button>
      </div>

      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'fulltime' && renderFullTimeScenario()}
      {viewMode === 'cao' && renderCaoScenario()}
    </div>
  );
};
