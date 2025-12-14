
'use client';

import React, { useState, useMemo } from 'react';
import { ExactRecord, AppSettings, ThemeColors } from '../types';
import { formatCurrency } from '../utils';
import { Calculator, Car, Coffee, Search, CheckSquare, Plus, Trash2, Save } from 'lucide-react';

interface PrivateUseCalcViewProps {
  records: ExactRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

interface ManualCorrection {
  id: string;
  description: string;
  amount: number;
  percentage: number;
}

const PrivateUseCalcView: React.FC<PrivateUseCalcViewProps> = ({ records, settings, theme }) => {
  const [filterText, setFilterText] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  
  // Ledger Calculation State
  const [ledgerCorrectionPercentage, setLedgerCorrectionPercentage] = useState<number>(2.7);
  const [calcMode, setCalcMode] = useState<'vat_correction' | 'mixed_costs'>('vat_correction');

  // Manual Input State
  const [manualCorrections, setManualCorrections] = useState<ManualCorrection[]>([]);
  const [newManualItem, setNewManualItem] = useState({ description: '', amount: '', percentage: '2.7' });

  // --- Filter Logic ---
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (r.isTotalLine) return false;
      if (r.type !== 'pnl' || r.debit <= 0) return false;

      if (!filterText) return true;
      const term = filterText.toLowerCase();
      return (
        (r.description || '').toLowerCase().includes(term) ||
        (r.code || '').toLowerCase().includes(term) ||
        (r.journal || '').toLowerCase().includes(term)
      );
    });
  }, [records, filterText]);

  const toggleRecord = (id: string) => {
    const next = new Set(selectedRecords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRecords(next);
  };

  const selectAllFiltered = () => {
      if (selectedRecords.size === filteredRecords.length && filteredRecords.length > 0) {
          setSelectedRecords(new Set());
      } else {
          setSelectedRecords(new Set(filteredRecords.map(r => r.id)));
      }
  };

  // --- Calculations ---
  
  // 1. Ledger Selection Stats
  const selectionStats = useMemo(() => {
    let totalBase = 0;
    let totalDeductedVat = 0;

    filteredRecords.forEach(r => {
      if (selectedRecords.has(r.id)) {
        totalBase += r.debit; 
        totalDeductedVat += (r.vatAmount || 0);
      }
    });

    return { totalBase, totalDeductedVat };
  }, [filteredRecords, selectedRecords]);

  // 2. Ledger Correction Amount
  const ledgerCorrectionAmount = calcMode === 'vat_correction' 
     ? selectionStats.totalBase * (ledgerCorrectionPercentage / 100) 
     : selectionStats.totalDeductedVat * (ledgerCorrectionPercentage / 100);

  // 3. Manual Correction Amount
  const manualCorrectionTotal = useMemo(() => {
      return manualCorrections.reduce((sum, item) => sum + (item.amount * (item.percentage / 100)), 0);
  }, [manualCorrections]);

  // 4. Grand Total
  const totalCorrectionPayable = ledgerCorrectionAmount + manualCorrectionTotal;


  // --- Handlers ---
  const addManualItem = () => {
      if (!newManualItem.description || !newManualItem.amount) return;
      const amount = parseFloat(newManualItem.amount);
      const perc = parseFloat(newManualItem.percentage);
      if (isNaN(amount) || isNaN(perc)) return;

      setManualCorrections([
          ...manualCorrections, 
          { 
              id: Date.now().toString(), 
              description: newManualItem.description, 
              amount, 
              percentage: perc 
          }
      ]);
      setNewManualItem({ description: '', amount: '', percentage: '2.7' });
  };

  const removeManualItem = (id: string) => {
      setManualCorrections(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header / Intro */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h2 className="text-xl font-bold mb-2" style={{ color: theme.text }}>Privégebruik & Correcties (BTW)</h2>
        <p className="text-sm text-slate-500">
          Combineer selecties uit de boekhouding met handmatige correcties voor een volledig BTW-correctieoverzicht.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT COLUMN: Configuration & Totals */}
         <div className="lg:col-span-1 space-y-6">
            
            {/* Total Card */}
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 ring-1 ring-slate-100">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Totaal Te Betalen Correctie</div>
               <div className="text-4xl font-bold mb-2" style={{ color: theme.highRisk }}>
                  {formatCurrency(totalCorrectionPayable, settings.currencyMode)}
               </div>
               <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2 flex justify-between">
                   <span>Uit Boekhouding:</span>
                   <span className="font-mono">{formatCurrency(ledgerCorrectionAmount, settings.currencyMode)}</span>
               </div>
               <div className="text-xs text-slate-500 flex justify-between">
                   <span>Handmatig:</span>
                   <span className="font-mono">{formatCurrency(manualCorrectionTotal, settings.currencyMode)}</span>
               </div>
            </div>

            {/* Manual Entry Section */}
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Save className="w-4 h-4 text-blue-500" />
                  Handmatige Invoer
               </h3>
               <p className="text-xs text-slate-500 mb-4">
                 Voeg items toe die niet in de grootboekselectie staan (bijv. cataloguswaarde eigen auto).
               </p>

               <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Omschrijving</label>
                    <input 
                      type="text" 
                      placeholder="Bijv. Cataloguswaarde BMW"
                      value={newManualItem.description}
                      onChange={e => setNewManualItem({...newManualItem, description: e.target.value})}
                      className="w-full border border-slate-300 rounded p-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Waarde (€)</label>
                        <input 
                          type="number" 
                          placeholder="0.00"
                          value={newManualItem.amount}
                          onChange={e => setNewManualItem({...newManualItem, amount: e.target.value})}
                          className="w-full border border-slate-300 rounded p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Perc (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="2.7"
                          value={newManualItem.percentage}
                          onChange={e => setNewManualItem({...newManualItem, percentage: e.target.value})}
                          className="w-full border border-slate-300 rounded p-2 text-sm"
                        />
                      </div>
                  </div>
                  <button 
                    onClick={addManualItem}
                    disabled={!newManualItem.description || !newManualItem.amount}
                    className="w-full py-2 text-white font-bold rounded hover:opacity-90 disabled:opacity-50 text-sm flex justify-center items-center gap-2 transition-colors"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Plus className="w-4 h-4" /> Toevoegen
                  </button>
               </div>

               {manualCorrections.length > 0 && (
                   <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                       {manualCorrections.map(item => (
                           <div key={item.id} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded group">
                               <div className="flex-1">
                                   <div className="font-medium text-slate-700">{item.description}</div>
                                   <div className="text-xs text-slate-400">
                                       {formatCurrency(item.amount, settings.currencyMode)} x {item.percentage}%
                                   </div>
                               </div>
                               <div className="text-right font-mono font-medium text-slate-600 mr-3">
                                   {formatCurrency(item.amount * (item.percentage / 100), settings.currencyMode)}
                               </div>
                               <button onClick={() => removeManualItem(item.id)} className="text-slate-400 hover:text-red-500">
                                   <Trash2 className="w-4 h-4" />
                               </button>
                           </div>
                       ))}
                   </div>
               )}
            </div>

            {/* Calculation Settings (Ledger) */}
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-slate-400" />
                  Instellingen Boekhouding
               </h3>

               {/* Mode Selection */}
               <div className="flex bg-slate-100 p-1 rounded mb-4">
                 <button 
                   onClick={() => setCalcMode('vat_correction')}
                   className={`flex-1 py-1.5 text-xs rounded font-medium transition-all`}
                   style={{ 
                     backgroundColor: calcMode === 'vat_correction' ? 'white' : 'transparent', 
                     color: calcMode === 'vat_correction' ? theme.text : '#64748b',
                     boxShadow: calcMode === 'vat_correction' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                   }}
                 >
                   BTW Correctie
                 </button>
                 <button 
                   onClick={() => setCalcMode('mixed_costs')}
                   className={`flex-1 py-1.5 text-xs rounded font-medium transition-all`}
                   style={{ 
                     backgroundColor: calcMode === 'mixed_costs' ? 'white' : 'transparent', 
                     color: calcMode === 'mixed_costs' ? theme.text : '#64748b',
                     boxShadow: calcMode === 'mixed_costs' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                   }}
                 >
                   Gemengde Kosten
                 </button>
               </div>
               
               <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded text-sm text-slate-600">
                       {calcMode === 'vat_correction' ? <Car className="w-4 h-4 mt-0.5" /> : <Coffee className="w-4 h-4 mt-0.5" />}
                       <div>
                         <span className="font-bold">{calcMode === 'vat_correction' ? 'Auto / Forfait' : 'Niet Aftrekbaar'}</span>
                         <p className="opacity-80 text-xs mt-1">
                           {calcMode === 'vat_correction' 
                             ? 'Correctie over de grondslag (cataloguswaarde of werkelijke kosten).'
                             : 'Percentage van de BTW die niet aftrekbaar is.'}
                         </p>
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Percentage (%)</label>
                       <input 
                         type="number" 
                         step="0.1"
                         value={ledgerCorrectionPercentage}
                         onChange={(e) => setLedgerCorrectionPercentage(Number(e.target.value))}
                         className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:outline-none"
                       />
                    </div>
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN: Ledger Selection */}
         <div className="lg:col-span-2 flex flex-col h-[800px] bg-white rounded-lg shadow border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center gap-4">
               <h3 className="font-bold text-slate-700 shrink-0">Selecteer uit Boekhouding</h3>
               <div className="flex-1 relative w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Zoek op 'auto', '4000', 'representatie'..." 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  />
               </div>
            </div>
            
            <div className="bg-slate-50 p-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase flex gap-4 pr-6">
               <div className="w-10 flex justify-center">
                  <button onClick={selectAllFiltered} className="hover:text-blue-600" title="Alles selecteren">
                     <CheckSquare className="w-4 h-4" />
                  </button>
               </div>
               <div className="flex-1">Grootboek / Omschrijving</div>
               <div className="w-24 text-right">Grondslag</div>
               <div className="w-24 text-right">Geboekte BTW</div>
            </div>

            <div className="flex-1 overflow-y-auto">
               {filteredRecords.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => toggleRecord(r.id)}
                    className={`flex items-center gap-4 p-3 border-b border-slate-100 text-sm cursor-pointer hover:bg-slate-50 transition-colors`}
                    style={{ backgroundColor: selectedRecords.has(r.id) ? `${theme.primary}10` : undefined }}
                  >
                     <div className="w-10 flex justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedRecords.has(r.id)} 
                          readOnly
                          className="rounded border-slate-300 focus:ring-0" 
                          style={{ accentColor: theme.primary }}
                        />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-700 truncate">{r.description}</div>
                        <div className="text-xs text-slate-400 flex gap-2">
                           <span className="font-mono bg-slate-100 px-1 rounded">{r.code}</span>
                           <span>{r.year}-{r.period}</span>
                           <span className="truncate max-w-[100px]">{r.company}</span>
                        </div>
                     </div>
                     <div className="w-24 text-right font-mono text-slate-700">
                        {formatCurrency(r.debit, settings.currencyMode)}
                     </div>
                     <div className="w-24 text-right font-mono text-slate-500 text-xs">
                        {r.vatAmount ? formatCurrency(r.vatAmount, settings.currencyMode) : '-'}
                     </div>
                  </div>
               ))}
               {filteredRecords.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                     Geen kostenregels gevonden. Probeer een andere zoekterm.
                  </div>
               )}
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
               <div className="text-xs text-slate-500">{selectedRecords.size} regels geselecteerd</div>
               <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase">Totaal Selectie</div>
                  <div className="font-mono font-bold text-slate-700">
                      {formatCurrency(selectionStats.totalBase, settings.currencyMode)}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PrivateUseCalcView;
