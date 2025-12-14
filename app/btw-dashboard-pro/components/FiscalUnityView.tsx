
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ExactRecord, AppSettings, ThemeColors } from '../types';
import { formatCurrency } from '../utils';
import { Building2, Calculator, CheckSquare, Users, ArrowRightLeft, Landmark, GripHorizontal } from 'lucide-react';

interface FiscalUnityViewProps {
  records: ExactRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const FiscalUnityView: React.FC<FiscalUnityViewProps> = ({ records, settings, theme }) => {
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

  // 1. Identify Companies
  const allCompanies = useMemo(() => {
    const companies = Array.from(new Set(records.map(r => r.company || 'Onbekend'))).sort();
    return companies;
  }, [records]);

  // Initialize selection with all companies on first load
  useEffect(() => {
    if (allCompanies.length > 0 && selectedCompanies.size === 0) {
      setSelectedCompanies(new Set(allCompanies));
    }
  }, [allCompanies]);

  const toggleCompany = (company: string) => {
    const next = new Set(selectedCompanies);
    if (next.has(company)) next.delete(company);
    else next.add(company);
    setSelectedCompanies(next);
  };

  // 2. Aggregate Data
  const unityData = useMemo(() => {
    const filtered = records.filter(r => selectedCompanies.has(r.company || 'Onbekend') && !r.isTotalLine);
    
    // Per Company Breakdown
    const breakdown: Record<string, { turnover: number, outputVat: number, inputVat: number, payable: number }> = {};
    
    // Grand Total (Tax Form Boxes)
    const totals = {
       s1_turnover: 0, s1_vat: 0,
       s2_turnover: 0, s2_vat: 0,
       s3_turnover: 0,
       s4_turnover: 0, s4_vat: 0,
       s5_input: 0
    };

    filtered.forEach(r => {
        const comp = r.company || 'Onbekend';
        if (!breakdown[comp]) breakdown[comp] = { turnover: 0, outputVat: 0, inputVat: 0, payable: 0 };
        
        const vatBox = (r.vatBox || '').toLowerCase().replace(/[^0-9a-z]/g, '');
        const base = r.vatBase || 0;
        const tax = r.vatAmount || 0;

        // Breakdown Logic (Simple)
        if (['1','2','3','4'].some(k => vatBox.startsWith(k))) {
            if (['1','2','3'].some(k => vatBox.startsWith(k))) breakdown[comp].turnover += base;
            breakdown[comp].outputVat += tax;
        } else if (vatBox.includes('5b') || vatBox.includes('voorbelasting')) {
            breakdown[comp].inputVat += tax;
        }

        // Totals Logic (Specific Boxes)
        if (vatBox.startsWith('1')) { totals.s1_turnover += base; totals.s1_vat += tax; }
        else if (vatBox.startsWith('2')) { totals.s2_turnover += base; totals.s2_vat += tax; }
        else if (vatBox.startsWith('3')) { totals.s3_turnover += base; }
        else if (vatBox.startsWith('4')) { totals.s4_turnover += base; totals.s4_vat += tax; }
        else if (vatBox.includes('5b')) { totals.s5_input += tax; }
    });

    // Calculate payables per company
    Object.keys(breakdown).forEach(k => {
        breakdown[k].payable = breakdown[k].outputVat - breakdown[k].inputVat;
    });

    const totalOutput = totals.s1_vat + totals.s2_vat + totals.s4_vat;
    const totalPayable = totalOutput - totals.s5_input;

    return { totals, breakdown, totalOutput, totalPayable };
  }, [records, selectedCompanies]);


  if (records.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-dashed border-slate-300 animate-in fade-in">
           <div className="bg-slate-50 p-6 rounded-full mb-6">
             <Landmark className="w-12 h-12 text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">Fiscale Eenheid</h3>
           <p className="text-slate-500 max-w-md text-center mt-2 mb-6 text-sm">
             Upload eerst financiële administraties in het Btw-overzicht om deze samen te voegen.
           </p>
        </div>
      );
  }

  const Row = ({ label, col1, col2, bold = false, borderTop = false }: any) => (
      <div className={`flex justify-between py-2 px-3 text-sm ${borderTop ? 'border-t border-slate-200 mt-1 pt-2' : ''} ${bold ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
          <div className="flex-1">{label}</div>
          {col1 !== undefined && <div className="w-32 text-right font-mono text-slate-500">{formatCurrency(col1, settings.currencyMode)}</div>}
          {col2 !== undefined && <div className={`w-32 text-right font-mono ${bold ? (col2 >= 0 ? 'text-blue-700' : 'text-green-600') : 'text-slate-700'}`}>{formatCurrency(col2, settings.currencyMode)}</div>}
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
       
       {/* Header */}
       <div className="bg-white p-6 rounded-lg shadow border border-slate-200 flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 rounded-full shrink-0" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>
             <Users className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
             <h1 className="text-2xl font-bold text-slate-800 mb-2">Fiscale Eenheid BTW</h1>
             <p className="text-slate-600 max-w-2xl text-sm">
                Consolideer meerdere administraties in één aangifte. Selecteer de deelnemende maatschappijen en bekijk de geaggregeerde resultaten.
             </p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* LEFT COLUMN: Configuration */}
           <div className="lg:col-span-1 space-y-6">
               
               {/* Entity Selector */}
               <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                   <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="font-bold text-slate-700 flex items-center gap-2">
                           <Building2 className="w-4 h-4" /> Deelnemers
                       </h3>
                       <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">{selectedCompanies.size} geselecteerd</span>
                   </div>
                   <div className="p-2 max-h-[400px] overflow-y-auto">
                       {allCompanies.map(c => (
                           <div 
                             key={c} 
                             onClick={() => toggleCompany(c)}
                             className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors hover:bg-slate-50`}
                             style={{ 
                               backgroundColor: selectedCompanies.has(c) ? `${theme.primary}10` : undefined,
                               borderColor: selectedCompanies.has(c) ? `${theme.primary}20` : 'transparent',
                               borderWidth: '1px'
                             }}
                           >
                               <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0`} 
                                    style={{ 
                                        backgroundColor: selectedCompanies.has(c) ? theme.primary : 'white', 
                                        borderColor: selectedCompanies.has(c) ? theme.primary : '#cbd5e1' 
                                    }}>
                                   {selectedCompanies.has(c) && <CheckSquare className="w-3 h-3 text-white" />}
                               </div>
                               <span className={`text-sm font-medium ${selectedCompanies.has(c) ? 'font-bold' : 'text-slate-600'}`} style={{ color: selectedCompanies.has(c) ? theme.primary : undefined }}>{c}</span>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Summary Card */}
               <div className="bg-slate-800 text-white rounded-lg shadow-lg p-6">
                   <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                       <Calculator className="w-4 h-4" /> Resultaat Eenheid
                   </div>
                   <div className="text-4xl font-bold mb-1">
                       {formatCurrency(unityData.totalPayable, settings.currencyMode)}
                   </div>
                   <div className={`text-sm font-medium ${unityData.totalPayable >= 0 ? 'text-blue-300' : 'text-green-300'}`}>
                       {unityData.totalPayable >= 0 ? 'Te Betalen aan Belastingdienst' : 'Terug te ontvangen'}
                   </div>
               </div>

           </div>

           {/* RIGHT COLUMN: Results */}
           <div className="lg:col-span-2 space-y-6">
               
               {/* 1. Contribution Table */}
               <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                   <div className="bg-slate-50 p-4 border-b border-slate-200">
                       <h3 className="font-bold text-slate-700 flex items-center gap-2">
                           <ArrowRightLeft className="w-4 h-4" /> Bijdrage per Maatschappij
                       </h3>
                   </div>
                   <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-white text-slate-500 font-bold uppercase text-xs border-b border-slate-100">
                               <tr>
                                   <th className="px-4 py-3">Bedrijf</th>
                                   <th className="px-4 py-3 text-right">Afdracht (Uit)</th>
                                   <th className="px-4 py-3 text-right">Voorbelasting (In)</th>
                                   <th className="px-4 py-3 text-right">Resultaat</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                               {Object.entries(unityData.breakdown).map(([comp, rawData]) => {
                                   const data = rawData as { turnover: number; outputVat: number; inputVat: number; payable: number; };
                                   return (
                                   <tr key={comp} className="hover:bg-slate-50">
                                       <td className="px-4 py-3 font-medium text-slate-700">{comp}</td>
                                       <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(data.outputVat, settings.currencyMode)}</td>
                                       <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(data.inputVat, settings.currencyMode)}</td>
                                       <td className={`px-4 py-3 text-right font-mono font-bold ${data.payable >= 0 ? 'text-blue-600' : 'text-green-600'}`}>
                                           {formatCurrency(data.payable, settings.currencyMode)}
                                       </td>
                                   </tr>
                                   );
                               })}
                               {Object.keys(unityData.breakdown).length === 0 && (
                                   <tr><td colSpan={4} className="p-8 text-center text-slate-400">Selecteer bedrijven om te beginnen.</td></tr>
                               )}
                           </tbody>
                           <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                               <tr>
                                   <td className="px-4 py-3">Totaal</td>
                                   <td className="px-4 py-3 text-right font-mono">{formatCurrency(unityData.totals.s5_input + unityData.totalPayable, settings.currencyMode)}</td>
                                   <td className="px-4 py-3 text-right font-mono">{formatCurrency(unityData.totals.s5_input, settings.currencyMode)}</td>
                                   <td className={`px-4 py-3 text-right font-mono ${unityData.totalPayable >= 0 ? 'text-blue-700' : 'text-green-700'}`}>
                                       {formatCurrency(unityData.totalPayable, settings.currencyMode)}
                                   </td>
                               </tr>
                           </tfoot>
                       </table>
                   </div>
               </div>

               {/* 2. Consolidated Tax Form */}
               <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                   <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="font-bold text-slate-700 flex items-center gap-2">
                           <FileText className="w-4 h-4" /> Geconsolideerde Aangifte (Concept)
                       </h3>
                   </div>
                   <div className="p-6">
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prestaties Binnenland (1)</div>
                       <Row label="Hoog / Laag / Overig" col1={unityData.totals.s1_turnover} col2={unityData.totals.s1_vat} />
                       
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Verlegd (2)</div>
                       <Row label="Verlegd naar u" col1={unityData.totals.s2_turnover} col2={unityData.totals.s2_vat} />

                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Prestaties Buitenland (3)</div>
                       <Row label="Leveringen naar buitenland (3a/3b/3c)" col1={unityData.totals.s3_turnover} />

                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Prestaties vanuit Buitenland (4)</div>
                       <Row label="Leveringen uit buitenland" col1={unityData.totals.s4_turnover} col2={unityData.totals.s4_vat} />

                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Totaal (5)</div>
                       <Row label="Verschuldigde Omzetbelasting (5a)" col2={unityData.totalOutput} bold />
                       <Row label="Voorbelasting (5b)" col2={unityData.totals.s5_input} />
                       <Row label="Totaal te betalen / terug te vragen (5g)" col2={unityData.totalPayable} bold borderTop />
                   </div>
               </div>

           </div>
       </div>
    </div>
  );
};

// Helper Icon
const FileText = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);

export default FiscalUnityView;
