import React, { useMemo, useState } from 'react';
import { SourceDocument, AnalysisSettings, FinancialItem, Theme } from '../types';
import BusinessIntelligenceTab from './BusinessIntelligenceTab';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Building2,
  BrainCircuit,
  PieChart,
  ClipboardList,
  Calculator,
  Copy,
  Layers,
  BarChart3,
  ArrowRight,
  LineChart,
  Briefcase,
  Gavel,
  Users,
  Scale
} from 'lucide-react';

interface AnalysisTabProps {
  sources: SourceDocument[];
  settings: AnalysisSettings;
  documentVisual?: React.ReactNode;
  theme: Theme;
}

type ViewMode = 'financial' | 'business';

const AnalysisTab: React.FC<AnalysisTabProps> = ({ sources, settings, documentVisual, theme }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('financial');
  
  // Aggregate data from enabled sources
  const activeSources = sources.filter(s => s.isEnabled);

  // Group items by Category for "Smart Grouping"
  const groupedFinancials = useMemo(() => {
    let totalValue = 0;
    const groups: Record<string, { items: FinancialItem[], subtotal: number }> = {};
    
    activeSources.forEach(source => {
        totalValue += source.data.financials.totalValue;
        
        source.data.financials.items.forEach(item => {
            // Apply Filters (Small amounts)
            if (settings.hideSmallAmounts && item.amount < settings.thresholdAmount) return;

            const category = item.category || 'Overige Kosten';
            
            if (!groups[category]) {
                groups[category] = { items: [], subtotal: 0 };
            }

            groups[category].items.push({
                ...item,
                // Append source name if we are in consolidated view to avoid confusion
                description: activeSources.length > 1 ? `${item.description} (${source.name})` : item.description
            });
            groups[category].subtotal += item.amount;
        });
    });

    // Sort categories by subtotal descending for the chart
    const sortedCategories = Object.entries(groups).sort(([, a], [, b]) => b.subtotal - a.subtotal);

    return { totalValue, groups, sortedCategories };
  }, [activeSources, settings.hideSmallAmounts, settings.thresholdAmount]);

  const aggregatedRisks = useMemo(() => {
    return activeSources.flatMap(s => s.data.risks.map(r => ({...r, source: s.name})));
  }, [activeSources]);

  const formatMoney = (amount: number, currency: string = 'EUR') => {
    let displayAmount = amount;
    let suffix = '';

    if (settings.showThousands) {
      displayAmount = amount / 1000;
      suffix = 'k';
    }

    return new Intl.NumberFormat('nl-NL', { 
      style: 'currency', 
      currency: currency,
      maximumFractionDigits: settings.showThousands ? 1 : 2
    }).format(displayAmount) + suffix;
  };

  const getRiskStyle = (severity: string) => {
    switch(severity) {
      case 'High': return { backgroundColor: `${theme.colors.highRisk}15`, color: theme.colors.highRisk, borderColor: `${theme.colors.highRisk}30` };
      case 'Medium': return { backgroundColor: `${theme.colors.mediumRisk}15`, color: theme.colors.mediumRisk, borderColor: `${theme.colors.mediumRisk}30` };
      case 'Low': return { backgroundColor: `${theme.colors.lowRisk}15`, color: theme.colors.lowRisk, borderColor: `${theme.colors.lowRisk}30` };
      default: return { backgroundColor: '#f9fafb', color: '#374151', borderColor: '#e5e7eb' };
    }
  };

  if (activeSources.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
        <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">Geen Data Geselecteerd</h3>
        <p className="max-w-md mx-auto mt-2">Vink minimaal één bronbestand aan in de tabbladenbalk om de analyse te starten.</p>
      </div>
    );
  }

  // Calculate max value for chart scaling
  const maxCategoryValue = groupedFinancials.sortedCategories.length > 0 
    ? groupedFinancials.sortedCategories[0][1].subtotal 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* View Toggle (Financial vs Business Intelligence) */}
      <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm inline-flex">
              <button 
                  onClick={() => setViewMode('financial')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'financial' ? 'shadow-sm text-white' : 'text-gray-500 hover:text-gray-900'}`}
                  style={{ backgroundColor: viewMode === 'financial' ? theme.colors.primary : 'transparent' }}
              >
                  <LineChart className="w-4 h-4" />
                  Financiële Analyse
              </button>
              <button 
                  onClick={() => setViewMode('business')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'business' ? 'shadow-sm text-white' : 'text-gray-500 hover:text-gray-900'}`}
                  style={{ backgroundColor: viewMode === 'business' ? theme.colors.primary : 'transparent' }}
              >
                  <Briefcase className="w-4 h-4" />
                  Business Intelligence
              </button>
          </div>
      </div>

      {/* Document Visualization Area (Only visible in specific file tabs) */}
      {documentVisual && (
        <div className="mb-8 p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
           <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl mb-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.colors.text }}>
                 <FileText className="w-4 h-4" /> Origineel Bronbestand Preview
              </span>
           </div>
           {documentVisual}
        </div>
      )}

      {/* RENDER VIEW: BUSINESS INTELLIGENCE */}
      {viewMode === 'business' && (
          <BusinessIntelligenceTab sources={activeSources} theme={theme} />
      )}

      {/* RENDER VIEW: FINANCIAL DASHBOARD (Default) */}
      {viewMode === 'financial' && (
      <>
        {/* Top Row: Context Metadata (Requested specific fields) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Contract Looptijd */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-xs uppercase font-semibold tracking-wider opacity-70 mb-2" style={{ color: theme.colors.text }}>Contract Looptijd</p>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Start:</span>
                            <span className="font-mono font-medium">{activeSources[0]?.data.dates.startDate || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Einde:</span>
                            <span className="font-mono font-medium">{activeSources[0]?.data.dates.endDate || 'Onbepaald'}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Periode</span>
                </div>
            </div>

            {/* 2. Betrokken Partijen */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-xs uppercase font-semibold tracking-wider opacity-70 mb-2" style={{ color: theme.colors.text }}>Betrokken Partijen</p>
                    <div className="text-sm font-medium space-y-1" style={{ color: theme.colors.text }}>
                        {activeSources.flatMap(s => s.data.parties).slice(0, 3).map((p, i) => (
                            <div key={i} className="flex items-center gap-2 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full ${p.role === 'Supplier' ? 'bg-blue-400' : p.role === 'Customer' ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                                <span className="truncate" title={p.name}>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">{activeSources.reduce((acc, s) => acc + s.data.parties.length, 0)} Stakeholders</span>
                </div>
            </div>

            {/* 3. Tijdslijnen & Verlengingen */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-xs uppercase font-semibold tracking-wider opacity-70 mb-2" style={{ color: theme.colors.text }}>Verlenging & Opzegtermijn</p>
                    <div className="space-y-2">
                        {activeSources.some(s => s.data.dates.isAutoRenewal) ? (
                            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-medium">Stilzwijgend</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Geen auto-verlenging</span>
                            </div>
                        )}
                        <div className="text-sm text-gray-600">
                             Opzegtermijn: <span className="font-bold">{activeSources[0]?.data.dates.noticePeriodDays} dagen</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Tijdslijnen</span>
                </div>
            </div>

            {/* 4. Toepasselijk Recht */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-xs uppercase font-semibold tracking-wider opacity-70 mb-2" style={{ color: theme.colors.text }}>Toepasselijk Recht</p>
                    <div className="space-y-1">
                         <div className="font-medium text-sm flex items-center gap-2" style={{ color: theme.colors.text }}>
                             <Scale className="w-4 h-4 opacity-70" />
                             {activeSources[0]?.data.governingLaw || 'Niet vermeld'}
                         </div>
                         <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                             Taal: {activeSources[0]?.data.language || 'Onbekend'}
                         </div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Governance</span>
                </div>
            </div>

        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Visualization & Financial Details (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
            
            {/* COST DISTRIBUTION CHART */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
                            <BarChart3 className="w-5 h-5" style={{ color: theme.colors.primary }} /> Kostenverdeling
                        </h3>
                        <span className="text-xs text-gray-500">Gesorteerd op volume</span>
                    </div>
                    {/* Total Value Badge inside Chart Header */}
                    <div className="text-right">
                        <span className="text-xs uppercase font-bold text-gray-400 block">Totaal Waarde</span>
                        <span className="text-lg font-bold font-mono" style={{ color: theme.colors.primary }}>
                             {formatMoney(groupedFinancials.totalValue)}
                        </span>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {groupedFinancials.sortedCategories.map(([category, data], idx) => {
                        const percentage = maxCategoryValue > 0 ? (data.subtotal / maxCategoryValue) * 100 : 0;
                        const isDominant = idx === 0;
                        
                        return (
                            <div key={category} className="group">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{category}</span>
                                    <span className="font-mono font-semibold" style={{ color: theme.colors.text }}>{formatMoney(data.subtotal)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                        style={{ 
                                            width: `${percentage}%`, 
                                            backgroundColor: isDominant ? theme.colors.primary : `${theme.colors.primary}80` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                    {groupedFinancials.sortedCategories.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">Geen financiële data om te visualiseren.</div>
                    )}
                </div>
            </div>

            {/* DYNAMIC FINANCIAL GROUPING TABLES */}
            {Object.entries(groupedFinancials.groups).map(([category, groupData]: [string, { items: FinancialItem[], subtotal: number }], idx) => (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <Layers className="w-4 h-4" style={{ color: theme.colors.primary }} /> {category}
                    </h3>
                    {settings.hideSmallAmounts && (
                        <span className="text-[10px] uppercase bg-gray-200 text-gray-600 px-2 py-1 rounded tracking-wide">
                        Filter Actief (&lt; {settings.thresholdAmount})
                        </span>
                    )}
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
                        <tr>
                            <th className="px-6 py-3 w-1/2">Omschrijving</th>
                            <th className="px-6 py-3">Frequentie</th>
                            <th className="px-6 py-3 text-right">Bedrag</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {groupData.items.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-700">
                                {item.description}
                            </td>
                            <td className="px-6 py-3 text-gray-500 text-xs">
                                {item.periodicity === 'One-off' ? 'Eenmalig' : 
                                item.periodicity === 'Monthly' ? 'Maandelijks' : 
                                item.periodicity === 'Yearly' ? 'Jaarlijks' : item.periodicity}
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-gray-900 font-mono">
                                {formatMoney(item.amount)}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                                <td colSpan={2} className="px-6 py-3 text-right font-bold text-gray-600 uppercase text-xs tracking-wider">Subtotaal {category}</td>
                                <td className="px-6 py-3 text-right font-bold" style={{ color: theme.colors.primary }}>
                                    {formatMoney(groupData.subtotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                </div>
            ))}

            {/* CALCULATIONS TABLE */}
            {activeSources.map((source) => {
                if (!source.data.calculations || source.data.calculations.length === 0) return null;
                return (
                <div key={`calcs-${source.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <Calculator className="w-4 h-4 text-gray-500" /> Gedetecteerde Berekeningen ({source.name})
                    </h3>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 w-1/2">Onderwerp</th>
                            <th className="px-6 py-3 w-1/3">Formule / Grondslag</th>
                            <th className="px-6 py-3 text-right">Resultaat</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {source.data.calculations.map((calc, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-2 font-medium" style={{ color: theme.colors.text }}>{calc.label}</td>
                            <td className="px-6 py-2 text-xs font-mono bg-yellow-50 text-gray-600 rounded px-2 w-fit">{calc.formula || 'Vaste waarde'}</td>
                            <td className="px-6 py-2 text-right font-bold" style={{ color: theme.colors.primary }}>
                                {calc.result.toLocaleString('nl-NL')} <span className="text-xs font-normal text-gray-400">{calc.unit}</span>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                );
            })}

            {/* SPECIFICATIONS TABLE */}
            {activeSources.map((source) => {
                if (!source.data.specifications || source.data.specifications.length === 0) return null;
                return (
                <div key={`specs-${source.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
                        <ClipboardList className="w-4 h-4 text-gray-500" /> Specificaties & Materiaal ({source.name})
                    </h3>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 w-1/4">Categorie</th>
                            <th className="px-6 py-3 w-1/3">Item</th>
                            <th className="px-6 py-3 w-1/4">Specificatie</th>
                            <th className="px-6 py-3">Eenheid</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {source.data.specifications.map((spec, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-2 text-xs font-semibold opacity-70" style={{ color: theme.colors.text }}>{spec.category}</td>
                            <td className="px-6 py-2 font-medium" style={{ color: theme.colors.text }}>{spec.description}</td>
                            <td className="px-6 py-2 font-mono text-gray-600 bg-gray-50 px-2 rounded w-fit">{spec.value}</td>
                            <td className="px-6 py-2 text-gray-500 text-xs">{spec.unit || '-'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                );
            })}

            </div>

            {/* Right Column: Sidebar (Sources & Risks) (1/3 width) */}
            <div className="space-y-6">
            
            {/* Active Sources List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2" style={{ color: theme.colors.text }}>
                <Copy className="w-4 h-4" /> Actieve Documenten
                </h3>
                <div className="space-y-3">
                {activeSources.map((source, idx) => (
                    <div key={idx} className="group relative bg-gray-50 hover:bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 mb-1">
                                {source.type === 'EXCEL_SHEET' ? (
                                    <FileText className="w-4 h-4 text-green-600" />
                                ) : (
                                    <FileText className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="text-xs font-bold text-gray-800">{source.name}</span>
                            </div>
                            <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-gray-500">{source.data.contractType}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mt-1">{source.data.summary}</p>
                        
                        {/* Quick Arrow to show interaction */}
                        <ArrowRight className="w-3 h-3 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                    </div>
                ))}
                </div>
            </div>

            {/* Aggregated Risk Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#fff' }}>
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.colors.highRisk }}>
                    <AlertTriangle className="w-4 h-4" /> Risico Analyse
                </h3>
                <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{aggregatedRisks.length}</span>
                </div>
                <div className="p-4 space-y-3 max-h-[500px] overflow-auto">
                {aggregatedRisks.map((risk, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border-l-4 text-sm bg-white shadow-sm`} style={{ borderLeftColor: risk.severity === 'High' ? theme.colors.highRisk : risk.severity === 'Medium' ? theme.colors.mediumRisk : theme.colors.lowRisk }}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[10px] uppercase tracking-wide opacity-80" style={{ color: getRiskStyle(risk.severity).color }}>
                            {risk.severity === 'High' ? 'Kritiek' : risk.severity === 'Medium' ? 'Aandachtspunt' : 'Laag'}
                        </span>
                        <span className="text-[9px] text-gray-400">{risk.source}</span>
                    </div>
                    <p className="text-gray-700 leading-snug text-xs">{risk.description}</p>
                    {risk.clauseReference && (
                        <div className="mt-1 text-[10px] text-gray-400 font-mono">Ref: {risk.clauseReference}</div>
                    )}
                    </div>
                ))}
                {aggregatedRisks.length === 0 && (
                    <div className="text-center py-6">
                        <CheckCircle2 className="w-8 h-8 text-green-100 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Geen significante risico's gedetecteerd.</p>
                    </div>
                )}
                </div>
            </div>
            
            {/* AI Insights (Optional) */}
            {settings.showAIComments && (
                <div className="rounded-xl shadow-sm border p-4 bg-indigo-50 border-indigo-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-indigo-700">
                    <BrainCircuit className="w-4 h-4" />
                    AI Controller Notities
                    </h3>
                    <ul className="space-y-2">
                    {activeSources.map((s, i) => (
                        <li key={i} className="text-xs flex gap-2 items-start text-indigo-900">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                            <span>Validatie voltooid voor <strong>{s.name}</strong> ({s.data.currency}). Structuur herkend.</span>
                        </li>
                    ))}
                    </ul>
                </div>
            )}

            </div>
        </div>
      </>
      )}
    </div>
  );
};

export default AnalysisTab;