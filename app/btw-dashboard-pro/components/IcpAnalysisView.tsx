
'use client';

import React, { useState, useMemo } from 'react';
import { ExactRecord, AppSettings, ThemeColors, FileData } from '../types';
import { formatCurrency } from '../utils';
import { 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Trash2, 
  FileSearch,
  UploadCloud,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Search,
  Truck,
  Briefcase
} from 'lucide-react';

interface IcpAnalysisViewProps {
  records: ExactRecord[];
  files: FileData[];
  onUpload: (files: FileList | null) => void;
  onToggleFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  settings: AppSettings;
  theme: ThemeColors;
}

// Simple list of EU Country Codes (excluding NL) for validation
const EU_COUNTRIES = [
  'BE', 'BG', 'CZ', 'DK', 'DE', 'EE', 'IE', 'EL', 'GR', 'ES', 'FR', 'HR', 
  'IT', 'CY', 'LV', 'LT', 'LU', 'HU', 'MT', 'AT', 'PL', 'PT', 'RO', 'SI', 'SK', 'FI', 'SE'
];

type RiskLevel = 'ok' | 'warning' | 'error';

interface IcpRecord {
  record: ExactRecord;
  riskLevel: RiskLevel;
  riskMessage: string;
  typeLabel: string;
}

const IcpAnalysisView: React.FC<IcpAnalysisViewProps> = ({ 
  records, files, onUpload, onToggleFile, onDeleteFile, settings, theme 
}) => {
  const [filterText, setFilterText] = useState('');

  // --- ANALYSIS LOGIC ---
  const icpData = useMemo(() => {
    const analyzed: IcpRecord[] = [];

    // Filter for Revenue/Sales records that are potentially ICP
    // Criteria: 
    // 1. VAT Box 3a/3b/3c (Export/ICP) OR
    // 2. Country is in EU (and not NL) and has Revenue
    
    const candidates = records.filter(r => {
        if (r.isTotalLine) return false;

        const vatBox = (r.vatBox || '').toLowerCase();
        const country = (r.country || '').toUpperCase();
        
        // Boxes
        const hasRelevantBox = ['3a', '3b', '3c'].some(k => vatBox.includes(k));

        // Country
        const isEuCountry = EU_COUNTRIES.includes(country);
        
        // PnL Revenue with potential EU connection
        const isRevenue = (r.type === 'pnl' && r.credit > 0) || (['1','2','3'].some(k => vatBox.startsWith(k)));

        return isRevenue && (hasRelevantBox || (isEuCountry && isRevenue));
    });

    candidates.forEach(r => {
        let riskLevel: RiskLevel = 'ok';
        let riskMessage = '';
        let typeLabel = 'Onbekend';

        const vatAmount = r.vatAmount || 0;
        const country = (r.country || '').toUpperCase();
        const vatBox = (r.vatBox || '').toLowerCase();

        const isIcl = vatBox.includes('3b'); // Goods (Leveringen EU)
        const isServices = vatBox.includes('3c'); // Services (Diensten EU)
        const isExport = vatBox.includes('3a'); // Export (Non-EU)
        const isDomestic = vatBox.includes('1a') || vatBox.includes('1b');

        // DETERMINE TYPE LABEL
        if (isIcl) typeLabel = 'ICL (Goederen)';
        else if (isServices) typeLabel = 'ICP (Diensten)';
        else if (isExport) typeLabel = 'Export (Non-EU)';
        else if (EU_COUNTRIES.includes(country)) typeLabel = 'EU Transactie?';
        else typeLabel = 'Overig';

        // --- VALIDATION RULES ---

        // Check 1: VAT Amount (Must be 0 for 3a/3b/3c)
        if ((isIcl || isServices || isExport) && vatAmount !== 0) {
            riskLevel = 'error';
            riskMessage = `Btw (${formatCurrency(vatAmount, settings.currencyMode)}) berekend op 0% prestatie.`;
        }

        // Check 2: Country Validation
        if (!country) {
            riskLevel = 'warning';
            riskMessage = 'Geen landcode. Vereist voor Opgaaf ICP.';
        } else if (country === 'NL' || country === 'NEDERLAND') {
             if (isIcl || isServices || isExport) {
                 riskLevel = 'error';
                 riskMessage = 'Nederland geselecteerd bij buitenlandse rubriek.';
             }
        } else {
             const isEu = EU_COUNTRIES.includes(country);
             
             if (isIcl) { // 3b
                 if (!isEu) {
                     riskLevel = 'warning';
                     riskMessage = `Rubriek 3b (EU) gebruikt voor Non-EU land (${country}).`;
                 }
             } else if (isServices) { // 3c
                 if (!isEu) {
                     riskLevel = 'warning';
                     riskMessage = `Rubriek 3c (EU) gebruikt voor Non-EU land (${country}).`;
                 }
             } else if (isExport) { // 3a
                 if (isEu) {
                     riskLevel = 'warning';
                     riskMessage = `Rubriek 3a (Export) gebruikt voor EU-land (${country}). Bedoelde u 3b/3c?`;
                 }
             }
        }

        // Check 3: Box Mismatch (EU Country but Domestic Box)
        if (EU_COUNTRIES.includes(country) && isDomestic) {
             riskLevel = 'error';
             riskMessage = `EU Klant (${country}) geboekt als Binnenland (1a/1b).`;
             if (typeLabel === 'EU Transactie?') typeLabel = 'EU Fout';
        }

        analyzed.push({
            record: r,
            riskLevel,
            riskMessage,
            typeLabel
        });
    });

    return analyzed.sort((a, b) => (a.record.entryDate?.getTime() || 0) - (b.record.entryDate?.getTime() || 0));
  }, [records, settings]);

  const filteredData = icpData.filter(item => {
      if (!filterText) return true;
      const term = filterText.toLowerCase();
      return (
          (item.record.relation || '').toLowerCase().includes(term) ||
          (item.record.description || '').toLowerCase().includes(term) ||
          (item.record.country || '').toLowerCase().includes(term) ||
          item.typeLabel.toLowerCase().includes(term)
      );
  });

  const totalVolume = filteredData.reduce((acc, item) => acc + (item.record.vatBase || item.record.credit || 0), 0);
  const totalIcl = filteredData.filter(i => i.typeLabel.includes('ICL')).reduce((acc, item) => acc + (item.record.vatBase || item.record.credit || 0), 0);
  const totalIcp = filteredData.filter(i => i.typeLabel.includes('ICP')).reduce((acc, item) => acc + (item.record.vatBase || item.record.credit || 0), 0);
  
  const riskCount = filteredData.filter(i => i.riskLevel !== 'ok').length;


  if (files.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-dashed border-slate-300 animate-in fade-in">
           <div className="p-6 rounded-full mb-6" style={{ backgroundColor: `${theme.primary}10` }}>
             <Globe className="w-12 h-12" style={{ color: theme.primary }} />
           </div>
           <h3 className="text-xl font-bold text-slate-800">ICP/ICL Controle</h3>
           <p className="text-slate-500 max-w-md text-center mt-2 mb-6 text-sm">
             Upload uw financiële administratie om intracommunautaire prestaties te controleren op landcodes, BTW-tarieven en rubrieken.
           </p>
           <label 
             className="cursor-pointer px-6 py-3 text-white rounded-lg font-bold hover:opacity-90 transition-colors shadow-lg"
             style={{ backgroundColor: theme.primary }}
           >
             Selecteer Bestand
             <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onUpload(e.target.files)} />
          </label>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* File Management Header (Shared with Financial) */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: theme.primary }} />
                    Bronnen ICP Analyse (Financieel)
                </h3>
                <label className="text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors border border-transparent hover:bg-slate-50" style={{ color: theme.primary }}>
                    + Bestand Toevoegen
                    <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onUpload(e.target.files)} />
                </label>
            </div>
            <div className="flex flex-wrap gap-2">
                {files.map(f => (
                    <div key={f.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors`} style={{ backgroundColor: f.active ? `${theme.primary}10` : undefined, borderColor: f.active ? `${theme.primary}30` : undefined, color: f.active ? theme.primary : undefined }}>
                        <input type="checkbox" checked={f.active} onChange={() => onToggleFile(f.id)} className="rounded focus:ring-0" style={{ accentColor: theme.primary }} />
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <button onClick={() => onDeleteFile(f.id)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                ))}
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500"><Globe className="w-4 h-4"/><span className="text-xs font-bold uppercase">Totaal Volume</span></div>
                <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalVolume, settings.currencyMode)}</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500"><Truck className="w-4 h-4"/><span className="text-xs font-bold uppercase">ICL (Goederen 3b)</span></div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(totalIcl, settings.currencyMode)}</div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500"><Briefcase className="w-4 h-4"/><span className="text-xs font-bold uppercase">ICP (Diensten 3c)</span></div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(totalIcp, settings.currencyMode)}</div>
            </div>
            
            <div className={`p-4 rounded-lg shadow border ${riskCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                    {riskCount > 0 ? <ShieldAlert className="w-4 h-4 text-orange-500"/> : <ShieldCheck className="w-4 h-4 text-green-500"/>}
                    <span className="text-xs font-bold uppercase">Validatie</span>
                </div>
                <div className={`text-2xl font-bold ${riskCount > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                    {riskCount} <span className="text-sm font-normal text-slate-500">issues</span>
                </div>
            </div>
        </div>

        {/* Paper Report Table */}
        <div className="bg-white shadow-2xl min-h-[600px] flex flex-col print:shadow-none print:w-full">
            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900">ICP/ICL Controle</h1>
                    <p className="text-slate-500 text-sm">Validatie van Goederen (3b) en Diensten (3c) binnen de EU.</p>
                </div>
                <div className="text-right">
                    <div className="font-bold text-slate-900">{settings.appName}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString('nl-NL')}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-8 py-4 bg-white border-b border-slate-100 flex gap-4 print:hidden">
                <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Zoek op relatie, land, type..." 
                     value={filterText}
                     onChange={e => setFilterText(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1"
                   />
                </div>
            </div>

            <div className="p-8 flex-1 overflow-x-auto">
                 <table className="w-full text-xs text-left">
                    <thead>
                        <tr className="border-b-2 border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                            <th className="py-2 px-2 w-10">St</th>
                            <th className="py-2 px-2">Type</th>
                            <th className="py-2 px-2">Datum</th>
                            <th className="py-2 px-2">Relatie</th>
                            <th className="py-2 px-2 w-16 text-center">Land</th>
                            <th className="py-2 px-2 flex-1">Omschrijving</th>
                            <th className="py-2 px-2 text-right">Grondslag</th>
                            <th className="py-2 px-2 text-right">Btw</th>
                            <th className="py-2 px-2 text-right">Vak</th>
                            <th className="py-2 px-2 w-1/4">Analyse</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-2 text-center">
                                    {item.riskLevel === 'ok' && <CheckCircle2 className="w-4 h-4 text-slate-200" />}
                                    {item.riskLevel === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                                    {item.riskLevel === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                </td>
                                <td className="py-2 px-2 text-slate-700 font-bold">
                                    {item.typeLabel}
                                </td>
                                <td className="py-2 px-2 text-slate-600">
                                    {item.record.entryDate ? item.record.entryDate.toLocaleDateString('nl-NL') : '-'}
                                </td>
                                <td className="py-2 px-2 font-medium text-slate-700 truncate max-w-[150px]">{item.record.relation || '-'}</td>
                                <td className="py-2 px-2 text-center font-bold text-slate-600 bg-slate-50 rounded">
                                    {item.record.country || '-'}
                                </td>
                                <td className="py-2 px-2 text-slate-500 truncate max-w-[200px]">{item.record.description}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-700">
                                    {formatCurrency(item.record.vatBase || item.record.credit || 0, settings.currencyMode)}
                                </td>
                                <td className={`py-2 px-2 text-right font-mono ${(item.record.vatAmount || 0) !== 0 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                                    {formatCurrency(item.record.vatAmount || 0, settings.currencyMode)}
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-slate-500">{item.record.vatBox}</td>
                                <td className="py-2 px-2">
                                     {item.riskMessage ? (
                                         <span className={`inline-block px-2 py-1 rounded font-medium border ${item.riskLevel === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                             {item.riskMessage}
                                         </span>
                                     ) : <span className="text-slate-300">-</span>}
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={10} className="p-8 text-center text-slate-400">
                                    Geen ICP-relevante transacties gevonden in de huidige dataset.
                                </td>
                            </tr>
                        )}
                    </tbody>
                 </table>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 mt-auto">
                 <div className="flex justify-end gap-12">
                     <div className="text-right">
                         <div className="text-xs text-slate-400 uppercase mb-1">Totaal ICP</div>
                         <div className="text-2xl font-mono font-bold text-slate-900">{formatCurrency(totalVolume, settings.currencyMode)}</div>
                     </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default IcpAnalysisView;
