import React, { useMemo } from 'react';
import { LedgerRecord, AppSettings, ThemeColors } from '../types';
import { formatCurrency } from '../utils';
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Database } from 'lucide-react';

interface PeriodMatrixProps {
  records: LedgerRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

interface GroupedRow {
  key: string;
  name: string;
  relation: string;
  amounts: number[];
  counts: number[]; // Number of transactions per month
  total: number;
  avgAmount: number;
  gaps: number[]; // Indices of missing months
  shifts: number[]; // Indices of shifted months
}

const PeriodMatrixView: React.FC<PeriodMatrixProps> = ({ records, settings, theme }) => {
  
  // Helper to clean descriptions for grouping (removes months, years, numbers)
  const getCleanKey = (relation: string, desc: string): string => {
    const months = [
      'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december',
      'jan', 'feb', 'mrt', 'apr', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'
    ];
    
    let cleanDesc = desc.toLowerCase();
    
    // Remove years (2020-2030)
    cleanDesc = cleanDesc.replace(/\b20[2-3]\d\b/g, '');
    
    // Remove month names
    months.forEach(m => {
      cleanDesc = cleanDesc.replace(new RegExp(`\\b${m}\\b`, 'g'), '');
    });
    
    // Remove numbers and special chars, keep letters
    cleanDesc = cleanDesc.replace(/[^a-z\s]/g, '');
    
    // Normalize spaces
    cleanDesc = cleanDesc.replace(/\s+/g, ' ').trim();
    
    // Fallback if empty
    if (cleanDesc.length < 3) cleanDesc = desc.substring(0, 15);

    return `${relation} | ${cleanDesc}`;
  };

  const processedData = useMemo(() => {
    const groups: Record<string, GroupedRow> = {};

    // 1. Group Data
    records.forEach(r => {
      const groupKey = getCleanKey(r.relatie, r.omschrijving);
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          name: groupKey.split(' | ')[1] || 'Diversen',
          relation: r.relatie,
          amounts: Array(12).fill(0),
          counts: Array(12).fill(0),
          total: 0,
          avgAmount: 0,
          gaps: [],
          shifts: []
        };
      }

      const monthIdx = (r.periode - 1) % 12;
      if (monthIdx >= 0) {
        groups[groupKey].amounts[monthIdx] += r.bedrag;
        groups[groupKey].counts[monthIdx] += 1;
        groups[groupKey].total += r.bedrag;
      }
    });

    // 2. Analyze Patterns (Gaps vs Shifts)
    const rows = Object.values(groups).map(row => {
      const activeMonths = row.counts.filter(c => c > 0).length;
      row.avgAmount = activeMonths > 0 ? row.total / activeMonths : 0;
      
      // Only analyze if it looks recurring (at least 3 months present)
      if (activeMonths >= 3) {
        // Find the range of activity (first month with data to last month with data)
        let firstIdx = -1;
        let lastIdx = -1;
        for (let i = 0; i < 12; i++) {
          if (row.counts[i] > 0) {
            if (firstIdx === -1) firstIdx = i;
            lastIdx = i;
          }
        }

        // Check for gaps within the active range
        for (let i = firstIdx; i <= lastIdx; i++) {
          if (row.counts[i] === 0) {
            // It's a gap. Is it a shift?
            // Check neighbors for double payments/amounts
            const prev = i > 0 ? row.amounts[i-1] : 0;
            const next = i < 11 ? row.amounts[i+1] : 0;
            const threshold = row.avgAmount * 1.8; // roughly double

            const isShiftPrev = Math.abs(prev) > Math.abs(threshold);
            const isShiftNext = Math.abs(next) > Math.abs(threshold);

            if (isShiftPrev || isShiftNext) {
              row.shifts.push(i);
            } else {
              row.gaps.push(i);
            }
          }
        }
      }
      return row;
    });

    // Sort by most gaps (problems first), then name
    return rows.sort((a, b) => {
      if (b.gaps.length !== a.gaps.length) return b.gaps.length - a.gaps.length;
      return a.key.localeCompare(b.key);
    });
  }, [records]);

  const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  const missingItems = processedData.filter(r => r.gaps.length > 0);

  return (
    <div className="space-y-6">
      {/* Alert / Summary Box */}
      {missingItems.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border border-slate-200" style={{ borderLeftColor: theme.highRisk }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: theme.highRisk }} />
            <div>
              <h3 className="font-bold text-slate-800">Mogelijk ontbrekende facturen gevonden</h3>
              <p className="text-sm text-slate-500 mb-2">
                Bij de volgende relaties ontbreken periodieke betalingen die niet verklaard kunnen worden door verschuivingen.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-2">
                {missingItems.slice(0, 6).map(item => (
                  <li key={item.key} className="text-xs flex items-center gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    <span className="font-semibold">{item.relation}</span> 
                    <span className="opacity-75">- {item.name}</span>
                    <span className="text-red-500 font-mono">({item.gaps.map(g => months[g]).join(', ')})</span>
                  </li>
                ))}
                {missingItems.length > 6 && <li className="text-xs text-slate-400 italic">+ {missingItems.length - 6} andere...</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Matrix */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-300">
        <div className="p-4 border-b border-slate-200 flex justify-between items-start" style={{ backgroundColor: theme.primary, color: '#fff' }}>
          <div>
            <h2 className="text-xl font-bold">Periode Allocatie Matrix</h2>
            <p className="opacity-90 text-sm mt-1 max-w-xl leading-relaxed">
              Deze matrix controleert per relatie en omschrijving de spreiding van kosten op basis van de factuurdatum. 
              Hiermee worden gaten in periodieke reeksen direct zichtbaar.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 bg-black/10 rounded text-xs font-medium">
               <Database className="w-3 h-3 opacity-70" />
               {records.length} transacties geladen
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-4 text-xs font-medium bg-white/10 px-3 py-1.5 rounded">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white opacity-20"></div> Geen data</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: theme.lowRisk }}></div> Aanwezig</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: theme.mediumRisk }}></div> Verschuiving</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-red-400 bg-transparent"></div> Ontbrekend</div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
               <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                 <th className="p-3 text-left w-64 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Relatie / Groep</th>
                 {months.map(m => (
                   <th key={m} className="p-3 text-center w-12">{m}</th>
                 ))}
                 <th className="p-3 text-right w-24">Totaal</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedData.map((row, idx) => {
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                     <td className="p-3 sticky left-0 bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                       <div className="font-bold text-slate-700 truncate max-w-[180px]" title={row.relation}>{row.relation}</div>
                       <div className="text-slate-400 truncate max-w-[180px] text-[10px]" title={row.name}>{row.name}</div>
                     </td>
                     
                     {row.amounts.map((amt, i) => {
                       const isGap = row.gaps.includes(i);
                       const isShift = row.shifts.includes(i);
                       const hasData = amt !== 0;

                       return (
                         <td key={i} className="p-1 text-center border-l border-slate-50">
                           {hasData ? (
                             <div 
                               className="w-full h-8 rounded flex flex-col items-center justify-center text-[9px] cursor-help transition-all hover:scale-105"
                               title={`Periode ${i+1}: ${formatCurrency(amt, settings.currencyMode)}`}
                               style={{ 
                                 backgroundColor: Math.abs(amt) > Math.abs(row.avgAmount * 1.5) ? theme.primary : theme.lowRisk, // Highlight spikes
                                 color: '#fff',
                                 opacity: 0.9
                               }}
                             >
                               {settings.currencyMode === 'THOUSANDS' ? (
                                 <span>{Math.round(amt/1000)}k</span>
                               ) : (
                                 <CheckCircle2 className="w-4 h-4" />
                               )}
                             </div>
                           ) : (
                             <div className={`w-full h-8 rounded flex items-center justify-center ${
                               isGap ? 'border-2 border-red-400 bg-red-50 text-red-500 font-bold' : 
                               isShift ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 
                               'bg-slate-50 text-slate-200'
                             }`}>
                               {isGap ? '!' : isShift ? '→' : '·'}
                             </div>
                           )}
                         </td>
                       );
                     })}
                     
                     <td className="p-3 text-right font-mono font-medium text-slate-600">
                       {formatCurrency(row.total, settings.currencyMode)}
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {processedData.length === 0 && (
            <div className="p-10 text-center text-slate-400 italic">
              Geen data om weer te geven. Upload een grootboek bestand.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodMatrixView;
