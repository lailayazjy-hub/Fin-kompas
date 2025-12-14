
'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings, ThemeColors } from '../types';
import { formatCurrency } from '../utils';
import { Calculator, Calendar, Euro, Info, ArrowRight, AlertTriangle, PiggyBank, Clock } from 'lucide-react';

interface TaxInterestViewProps {
  settings: AppSettings;
  theme: ThemeColors;
}

type TaxType = 'btw' | 'vpb' | 'ib';

const TaxInterestView: React.FC<TaxInterestViewProps> = ({ settings, theme }) => {
  const [taxType, setTaxType] = useState<TaxType>('btw');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [interestRate, setInterestRate] = useState<number>(7.5);
  
  const [result, setResult] = useState<{ days: number, interest: number } | null>(null);

  useEffect(() => {
    // Default rates based on 2024/2025 knowledge base
    if (taxType === 'vpb') setInterestRate(10.0);
    else setInterestRate(7.5); // BTW & IB
  }, [taxType]);

  const handleCalculate = () => {
    if (!amount || !dueDate || !paymentDate) return;

    const val = parseFloat(amount);
    if (isNaN(val)) return;

    const start = new Date(dueDate);
    const end = new Date(paymentDate);
    
    // Reset if dates invalid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    if (end <= start) {
      setResult({ days: 0, interest: 0 });
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Simple Interest Formula: Amount * (Rate/100) * (Days/365)
    // Note: Tax authority uses compound logic sometimes for very long periods, but simple is standard for estimation.
    const interest = val * (interestRate / 100) * (diffDays / 365);
    
    setResult({ days: diffDays, interest });
  };

  const getTypeLabel = (t: TaxType) => {
      switch(t) {
          case 'btw': return 'Omzetbelasting (BTW)';
          case 'vpb': return 'Vennootschapsbelasting (VPB)';
          case 'ib': return 'Inkomstenbelasting (IB)';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200 flex items-start gap-4">
        <div className="p-3 rounded-full" style={{ backgroundColor: `${theme.highRisk}10`, color: theme.highRisk }}>
           <Calculator className="w-8 h-8" />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Belastingrente Calculator</h1>
           <p className="text-slate-500 mt-1">
             Bereken de rente die u verschuldigd bent als u een aanslag te laat betaalt.
             <br/><span className="text-xs text-slate-400">Tarieven gebaseerd op regels 2024/2025.</span>
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Input Form */}
          <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
             <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Settings2Icon className="w-4 h-4 text-blue-500" />
                 Gegevens Invoeren
             </h3>

             <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type Belasting</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['btw', 'ib', 'vpb'] as TaxType[]).map(t => (
                           <button
                             key={t}
                             onClick={() => setTaxType(t)}
                             className={`py-2 px-2 text-xs font-bold rounded border transition-colors`}
                             style={{ 
                               backgroundColor: taxType === t ? `${theme.primary}10` : 'white',
                               borderColor: taxType === t ? theme.primary : '#e2e8f0',
                               color: taxType === t ? theme.primary : '#475569'
                             }}
                           >
                             {t.toUpperCase()}
                           </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Te betalen bedrag</label>
                    <div className="relative">
                        <Euro className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="number"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1"
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Uiterste betaaldatum</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                              type="date"
                              value={dueDate}
                              onChange={e => setDueDate(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Werkelijke betaaldatum</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                              type="date"
                              value={paymentDate}
                              onChange={e => setPaymentDate(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 text-sm"
                            />
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rentepercentage (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={e => setInterestRate(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 bg-slate-50 text-slate-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Standaard voor {taxType.toUpperCase()}: {taxType === 'vpb' ? '10%' : '7,5%'}</p>
                 </div>

                 <button 
                   onClick={handleCalculate}
                   className="w-full py-3 text-white font-bold rounded-lg hover:opacity-90 transition-colors shadow-lg mt-2 flex justify-center items-center gap-2"
                   style={{ backgroundColor: theme.primary }}
                 >
                   <Calculator className="w-5 h-5" />
                   Bereken Rente
                 </button>
             </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
              
              {result !== null ? (
                  <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 animate-in zoom-in-50" style={{ borderTopColor: theme.primary }}>
                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PiggyBank className="w-6 h-6" style={{ color: theme.primary }} />
                        Resultaat Berekening
                     </h3>

                     <div className="space-y-4">
                         <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                             <span className="text-slate-500 text-sm">Hoofdsom</span>
                             <span className="font-mono font-bold text-lg">{formatCurrency(Number(amount), settings.currencyMode)}</span>
                         </div>
                         <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                             <span className="text-slate-500 text-sm flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Dagen te laat
                             </span>
                             <span className="font-mono font-bold text-lg" style={{ color: theme.highRisk }}>{result.days} dagen</span>
                         </div>
                         <div className="flex justify-between items-end pt-2">
                             <span className="text-slate-700 font-bold">Verschuldigde Rente</span>
                             <span className="font-mono font-bold text-3xl" style={{ color: theme.primary }}>{formatCurrency(result.interest, settings.currencyMode)}</span>
                         </div>
                     </div>
                     
                     {result.interest < 23 && result.interest > 0 && (
                         <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex items-start gap-2">
                             <Info className="w-5 h-5 shrink-0" />
                             <p>
                                <strong>Goed nieuws:</strong> De Belastingdienst brengt doorgaans geen belastingrente in rekening als het bedrag lager is dan € 23 (drempelbedrag).
                             </p>
                         </div>
                     )}
                     
                     {result.interest >= 23 && (
                         <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-start gap-2">
                             <Info className="w-5 h-5 shrink-0" />
                             <p>
                                Omdat het rentebedrag hoger is dan € 23, zal dit waarschijnlijk volledig in rekening worden gebracht op de aanslag.
                             </p>
                         </div>
                     )}

                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400 text-center">
                      <Calculator className="w-16 h-16 mb-4 opacity-20" />
                      <p>Vul de gegevens in en klik op berekenen om de belastingrente te zien.</p>
                  </div>
              )}
              
              <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                  <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Wanneer betaalt u rente?
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                      <li>Als u te laat aangifte doet of te laat betaalt.</li>
                      <li>Als de Belastingdienst afwijkt van uw aangifte en u moet bijbetalen.</li>
                      <li>
                          <strong>Tip:</strong> Vraag een voorlopige aanslag aan als u verwacht te moeten betalen, om rente te voorkomen.
                      </li>
                  </ul>
              </div>

          </div>

      </div>
    </div>
  );
};

// Icon helper
const Settings2Icon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
);

export default TaxInterestView;
