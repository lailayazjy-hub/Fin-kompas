
'use client';

import React, { useState, useMemo } from 'react';
import { VatRecord, AppSettings, ThemeColors, ExactRecord, CurrencyMode } from '../types';
import { formatCurrency } from '../utils';
import { AlertTriangle, Info, Calculator, ArrowRightLeft, Plus, Trash2, Save, FilePlus } from 'lucide-react';

interface CpiViewProps {
  records: VatRecord[];
  exactRecords?: ExactRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

interface ManualCpiEntry {
  id: string;
  description: string;
  amount: number;
  type: '3b' | '3c' | '2a'; // 3b=Goods, 3c=Services, 2a=Domestic Reverse
}

const CpiView: React.FC<CpiViewProps> = ({ records, exactRecords = [], settings, theme }) => {
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  
  // Manual Input State
  const [manualEntries, setManualEntries] = useState<ManualCpiEntry[]>([]);
  const [newEntry, setNewEntry] = useState<{description: string, amount: string, type: '3b'|'3c'|'2a'}>({
    description: '', amount: '', type: '3b'
  });

  // Helper to normalize ExactRecord to a shape similar to VatRecord for CPI calculation
  const normalizedRecords = React.useMemo(() => {
    // 1. Start with Legacy records
    const list = [...records];

    // 2. Map ExactRecords to temporary aggregation objects
    if (exactRecords.length > 0) {
        const grouped = exactRecords.reduce((acc, r) => {
            if (r.isTotalLine) return acc;
            const key = `${r.company || 'Onbekend'}|${r.year}|${r.period}`;
            if (!acc[key]) {
                acc[key] = {
                    id: key,
                    sourceFile: r.sourceFile,
                    company: r.company || 'Onbekend',
                    year: r.year || new Date().getFullYear(),
                    period: r.period || 'Onbekend',
                    prive_gebruik: 0,
                    btw_prive: 0,
                    omzet_verlegd: 0,
                    btw_verlegd: 0,
                    leveringen_eu: 0,
                    leveringen_uit_eu: 0,
                    btw_uit_eu: 0,
                    omzet_nl_hoog: 0, btw_hoog: 0, omzet_nl_laag: 0, btw_laag: 0, omzet_overig: 0, btw_overig: 0, leveringen_buiten_eu: 0, installatie_eu: 0, leveringen_uit_buiten_eu: 0, btw_uit_buiten_eu: 0, voorbelasting: 0, suppletie: 0, inklaringskosten: 0
                };
            }

            const box = (r.vatBox || '').toLowerCase().replace(/[^0-9a-z]/g, '');
            const base = r.vatBase || 0;
            const tax = r.vatAmount || 0;

            if (box.includes('1d')) { acc[key].prive_gebruik += base; acc[key].btw_prive += tax; }
            else if (box.includes('2a')) { acc[key].omzet_verlegd += base; acc[key].btw_verlegd += tax; }
            else if (box.includes('3b')) { acc[key].leveringen_eu += base; }
            else if (box.includes('4b')) { acc[key].leveringen_uit_eu += base; acc[key].btw_uit_eu += tax; }

            return acc;
        }, {} as Record<string, VatRecord>);
        
        list.push(...Object.values(grouped));
    }
    return list;
  }, [records, exactRecords]);

  // Derive unique filter options
  const companies = Array.from(new Set(normalizedRecords.map(r => r.company)));
  const years = Array.from(new Set(normalizedRecords.map(r => r.year.toString())));

  // Filter Logic
  const filteredRecords = normalizedRecords.filter(r => {
    if (filterCompany !== 'all' && r.company !== filterCompany) return false;
    if (filterYear !== 'all' && r.year.toString() !== filterYear) return false;
    return true;
  });

  // Calculation Logic per record
  const calculatedRows = filteredRecords.map(r => {
    const priveBase = r.prive_gebruik;
    const priveVat = r.btw_prive;
    const priveWarning = priveBase > 0 && priveVat === 0;

    const icDomestic = r.omzet_verlegd; // 2a
    const icEuDelivery = r.leveringen_eu; // 3b
    const icEuAcquisition = r.leveringen_uit_eu; // 4b
    const icTotalVolume = icDomestic + icEuDelivery + icEuAcquisition;
    const icVatImpact = r.btw_verlegd + r.btw_uit_eu; 

    return {
      ...r,
      priveBase,
      priveVat,
      priveWarning,
      icDomestic,
      icEuDelivery,
      icEuAcquisition,
      icTotalVolume,
      icVatImpact
    };
  });

  // Manual Totals
  const manualStats = useMemo(() => {
    return manualEntries.reduce((acc, curr) => {
       if (curr.type === '3b') acc.icEuDelivery += curr.amount;
       else if (curr.type === '3c') acc.icEuDelivery += curr.amount; // 3c also counts towards EU Supply volume usually, or strictly services. 
       // For simple KPI we group 3b/3c as EU Delivery/Service volume
       else if (curr.type === '2a') acc.icDomestic += curr.amount;
       return acc;
    }, { icEuDelivery: 0, icDomestic: 0 });
  }, [manualEntries]);

  // Grand Totals (File + Manual)
  const totalPriveBase = calculatedRows.reduce((sum, r) => sum + r.priveBase, 0);
  const totalPriveVat = calculatedRows.reduce((sum, r) => sum + r.priveVat, 0);
  
  const fileDomestic = calculatedRows.reduce((sum, r) => sum + r.icDomestic, 0);
  const fileEuDelivery = calculatedRows.reduce((sum, r) => sum + r.icEuDelivery, 0);
  const fileEuAcquisition = calculatedRows.reduce((sum, r) => sum + r.icEuAcquisition, 0);

  const totalDomestic = fileDomestic + manualStats.icDomestic;
  const totalEuDelivery = fileEuDelivery + manualStats.icEuDelivery;
  // Acquisitions (4b) are usually automatic, manual entry for 'supply' focused.
  
  const totalIcVolume = totalDomestic + totalEuDelivery + fileEuAcquisition;
  const totalIcVatNotional = calculatedRows.reduce((sum, r) => sum + r.icVatImpact, 0); // Manual entries assumed 0% VAT impact for now

  // Handlers
  const addManualEntry = () => {
    if (!newEntry.description || !newEntry.amount) return;
    const amount = parseFloat(newEntry.amount);
    if (isNaN(amount)) return;

    setManualEntries([...manualEntries, {
        id: Date.now().toString(),
        description: newEntry.description,
        amount,
        type: newEntry.type
    }]);
    setNewEntry({ description: '', amount: '', type: '3b' });
  };

  const removeManualEntry = (id: string) => {
    setManualEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5" style={{ color: theme.primary }} />
            <h3 className="text-sm font-medium text-slate-500">Correctie Privégebruik (Totaal)</h3>
          </div>
          <div className="flex justify-between items-end">
             <div>
                <p className="text-2xl font-bold" style={{ color: theme.text }}>
                  {formatCurrency(totalPriveVat, settings.currencyMode)}
                </p>
                <p className="text-xs text-slate-400">BTW over {formatCurrency(totalPriveBase, settings.currencyMode)} basis</p>
             </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-5 h-5" style={{ color: theme.primary }} />
            <h3 className="text-sm font-medium text-slate-500">Totaal Prestaties (ICP/Verlegd)</h3>
          </div>
           <div className="flex justify-between items-end">
             <div>
                <p className="text-2xl font-bold" style={{ color: theme.text }}>
                  {formatCurrency(totalIcVolume, settings.currencyMode)}
                </p>
                <div className="flex gap-2 text-xs text-slate-400 mt-1">
                   <span>Bestand: {formatCurrency(fileDomestic + fileEuDelivery + fileEuAcquisition, CurrencyMode.THOUSANDS)}</span>
                   <span>+</span>
                   <span>Handmatig: {formatCurrency(manualStats.icDomestic + manualStats.icEuDelivery, CurrencyMode.THOUSANDS)}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
           <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5" style={{ color: theme.primary }} />
            <h3 className="text-sm font-medium text-slate-500">Netto Impact (Notioneel)</h3>
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.text }}>
            {formatCurrency(totalPriveVat + totalIcVatNotional, settings.currencyMode)}
          </p>
          <p className="text-xs text-slate-400">Privé BTW + Verlegde BTW componenten</p>
        </div>
      </div>

      {/* Manual Input Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
         <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
             <FilePlus className="w-4 h-4 text-blue-500" />
             Handmatige Correcties & Aanvullingen
         </h3>
         <p className="text-sm text-slate-500 mb-4">
             Voeg hier ontbrekende prestaties toe die niet in de geüploade bestanden staan (bijv. correcties of specifieke verleggingen).
             Deze worden opgeteld bij de totalen in het rapport.
         </p>

         <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4 bg-slate-50 p-3 rounded border border-slate-100">
            <div className="md:col-span-5">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Omschrijving</label>
               <input 
                 type="text" 
                 placeholder="Bijv. Correctie levering Duitsland Q1"
                 value={newEntry.description}
                 onChange={e => setNewEntry({...newEntry, description: e.target.value})}
                 className="w-full border border-slate-300 rounded p-2 text-sm"
               />
            </div>
            <div className="md:col-span-3">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type Prestatie</label>
               <select 
                 value={newEntry.type}
                 onChange={e => setNewEntry({...newEntry, type: e.target.value as any})}
                 className="w-full border border-slate-300 rounded p-2 text-sm"
               >
                   <option value="3b">Leveringen EU (3b)</option>
                   <option value="3c">Diensten EU (3c)</option>
                   <option value="2a">Verlegd NL (2a)</option>
               </select>
            </div>
            <div className="md:col-span-3">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bedrag (€)</label>
               <input 
                 type="number" 
                 placeholder="0.00"
                 value={newEntry.amount}
                 onChange={e => setNewEntry({...newEntry, amount: e.target.value})}
                 className="w-full border border-slate-300 rounded p-2 text-sm"
               />
            </div>
            <div className="md:col-span-1">
               <button 
                 onClick={addManualEntry}
                 disabled={!newEntry.description || !newEntry.amount}
                 className="w-full py-2 text-white rounded hover:opacity-90 disabled:opacity-50 flex justify-center items-center"
                 style={{ backgroundColor: theme.primary }}
               >
                 <Plus className="w-5 h-5" />
               </button>
            </div>
         </div>

         {/* Manual Entries List */}
         {manualEntries.length > 0 && (
             <div className="border border-slate-200 rounded overflow-hidden mb-4">
                 <table className="w-full text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                         <tr>
                             <th className="px-4 py-2 text-left">Omschrijving</th>
                             <th className="px-4 py-2 text-left">Type</th>
                             <th className="px-4 py-2 text-right">Bedrag</th>
                             <th className="px-4 py-2 w-10"></th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {manualEntries.map(entry => (
                             <tr key={entry.id} className="hover:bg-slate-50">
                                 <td className="px-4 py-2">{entry.description}</td>
                                 <td className="px-4 py-2 text-slate-500">
                                     {entry.type === '3b' && 'Levering EU (3b)'}
                                     {entry.type === '3c' && 'Dienst EU (3c)'}
                                     {entry.type === '2a' && 'Verlegd NL (2a)'}
                                 </td>
                                 <td className="px-4 py-2 text-right font-mono font-medium">{formatCurrency(entry.amount, settings.currencyMode)}</td>
                                 <td className="px-4 py-2 text-center">
                                     <button onClick={() => removeManualEntry(entry.id)} className="text-slate-400 hover:text-red-500">
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-slate-200 flex gap-4 print:hidden">
        <select 
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1"
          style={{ borderColor: theme.primary }}
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
        >
          <option value="all">Alle Bedrijven</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1"
          style={{ borderColor: theme.primary }}
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="all">Alle Jaren</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-lg" style={{ color: theme.text }}>Intracommunautaire prestaties</h2>
          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            Geconsolideerd Overzicht (Exclusief handmatige invoer)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 font-semibold border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">Bedrijf / Periode</th>
                <th className="p-3 text-right bg-slate-50/50">Privé Grondslag</th>
                <th className="p-3 text-right bg-slate-50/50">Privé BTW</th>
                <th className="p-3 text-right">IC Binnenland (2a)</th>
                <th className="p-3 text-right">IC EU Lev (3b)</th>
                <th className="p-3 text-right">IC EU Verw (4b)</th>
                <th className="p-3 text-right font-bold">Subtotaal CPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedRows.map((row, idx) => (
                <tr key={`${row.id}-${idx}`} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium text-slate-700">{row.company}</div>
                    <div className="text-xs text-slate-400">{row.year} - {row.period}</div>
                  </td>
                  
                  {/* Private Use Section */}
                  <td className="p-3 text-right font-mono text-slate-600 bg-slate-50/30">
                     {formatCurrency(row.priveBase, settings.currencyMode)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600 bg-slate-50/30">
                    <div className="flex items-center justify-end gap-2">
                       {row.priveWarning && (
                         <div className="group relative">
                           <AlertTriangle className="w-4 h-4 text-orange-400 cursor-help" />
                           <span className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                             Let op: Grondslag &gt; 0 maar geen BTW ingevuld.
                           </span>
                         </div>
                       )}
                       <span style={{ color: row.priveVat > 0 ? theme.primary : undefined }}>
                         {formatCurrency(row.priveVat, settings.currencyMode)}
                       </span>
                    </div>
                  </td>

                  {/* Intercompany / Verlegd Section */}
                  <td className="p-3 text-right font-mono text-slate-600 border-l border-slate-100">
                    {formatCurrency(row.icDomestic, settings.currencyMode)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {formatCurrency(row.icEuDelivery, settings.currencyMode)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    {formatCurrency(row.icEuAcquisition, settings.currencyMode)}
                  </td>

                  {/* Summary */}
                  <td className="p-3 text-right font-mono font-bold border-l border-slate-100" style={{ color: theme.text }}>
                    {formatCurrency(row.priveVat + row.icVatImpact, settings.currencyMode)}
                  </td>
                </tr>
              ))}
              {calculatedRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Geen data gevonden voor de geselecteerde filters. Upload een financieel bestand.
                  </td>
                </tr>
              )}
            </tbody>
            {calculatedRows.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200" style={{ color: theme.text }}>
                <tr>
                  <td className="p-3">Totaal (Uit bestanden)</td>
                  <td className="p-3 text-right">{formatCurrency(totalPriveBase, settings.currencyMode)}</td>
                  <td className="p-3 text-right">{formatCurrency(totalPriveVat, settings.currencyMode)}</td>
                  <td className="p-3 text-right border-l border-slate-200">{formatCurrency(fileDomestic, settings.currencyMode)}</td>
                  <td className="p-3 text-right">{formatCurrency(fileEuDelivery, settings.currencyMode)}</td>
                  <td className="p-3 text-right">{formatCurrency(fileEuAcquisition, settings.currencyMode)}</td>
                  <td className="p-3 text-right border-l border-slate-200">{formatCurrency(totalPriveVat + totalIcVatNotional, settings.currencyMode)}</td>
                </tr>
                {manualEntries.length > 0 && (
                    <tr className="bg-blue-50/50 text-blue-800">
                        <td className="p-3 flex items-center gap-2">
                            <FilePlus className="w-3 h-3"/> Totaal Handmatig
                        </td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right border-l border-blue-100">{formatCurrency(manualStats.icDomestic, settings.currencyMode)}</td>
                        <td className="p-3 text-right">{formatCurrency(manualStats.icEuDelivery, settings.currencyMode)}</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right border-l border-blue-100">-</td>
                    </tr>
                )}
                <tr className="bg-slate-100 text-lg border-t-2 border-slate-300">
                     <td className="p-3">Totaal Generaal</td>
                     <td className="p-3 text-right">{formatCurrency(totalPriveBase, settings.currencyMode)}</td>
                     <td className="p-3 text-right">{formatCurrency(totalPriveVat, settings.currencyMode)}</td>
                     <td className="p-3 text-right border-l border-slate-300">{formatCurrency(totalDomestic, settings.currencyMode)}</td>
                     <td className="p-3 text-right">{formatCurrency(totalEuDelivery, settings.currencyMode)}</td>
                     <td className="p-3 text-right">{formatCurrency(fileEuAcquisition, settings.currencyMode)}</td>
                     <td className="p-3 text-right border-l border-slate-300">{formatCurrency(totalPriveVat + totalIcVatNotional, settings.currencyMode)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default CpiView;
