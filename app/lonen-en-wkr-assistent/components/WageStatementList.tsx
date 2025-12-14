import React, { useState, useMemo } from 'react';
import { WageStatementEntry, ThemeColors } from '../types';
import { formatCurrency } from '../services/wkrService';
import { CheckCircle2, AlertTriangle, Printer, Columns, ChevronDown, Check } from 'lucide-react';

interface WageStatementListProps {
  entries: WageStatementEntry[];
  colors: ThemeColors;
}

interface ColumnDef {
  key: keyof WageStatementEntry;
  label: string;
}

const AVAILABLE_COLUMNS: ColumnDef[] = [
  { key: 'col3_loonInGeld', label: '3. Loon in geld' },
  { key: 'col4_loonNietInGeld', label: '4. Niet in geld' },
  { key: 'col5_fooien', label: '5. Fooien' },
  { key: 'col7_aftrekposten', label: '7. Aftrekposten' },
  { key: 'col8_loonSv', label: '8. Loon SV' },
  { key: 'col12_loonZvw', label: '12. Loon Zvw' },
  { key: 'col14_loonLbPh', label: '14. Loon LB/PH' },
  { key: 'col15_ingehoudenLbPh', label: '15. Inh. LB/PH' },
  { key: 'col16_ingehoudenZvw', label: '16. Inh. Zvw' },
  { key: 'col17_uitbetaald', label: '17. Uitbetaald' },
  { key: 'col18_verrekendeArbeidskorting', label: '18. Arb. Korting' },
];

const WageStatementList: React.FC<WageStatementListProps> = ({ entries, colors }) => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'col3_loonInGeld', 
    'col7_aftrekposten', 
    'col15_ingehoudenLbPh', 
    'col16_ingehoudenZvw', 
    'col17_uitbetaald'
  ]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const totals = useMemo(() => {
    return entries.reduce((acc, curr) => {
      const newAcc = { ...acc };
      AVAILABLE_COLUMNS.forEach(col => {
        // @ts-ignore
        newAcc[col.key] = (newAcc[col.key] || 0) + (curr[col.key] || 0);
      });
      return newAcc;
    }, {} as Record<string, number>);
  }, [entries]);

  const validateRow = (entry: WageStatementEntry) => {
    // Formula per PDF screenshot: Uitbetaald (17) = 3 - 7 - 15 - 16
    const calculated = entry.col3_loonInGeld - entry.col7_aftrekposten - entry.col15_ingehoudenLbPh - entry.col16_ingehoudenZvw;
    const diff = Math.abs(calculated - entry.col17_uitbetaald);
    const isValid = diff < 0.05; // allow small rounding diffs
    return { isValid, diff };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in min-h-[500px]">
       {/* Toolbar */}
       <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <h3 className="font-semibold text-lg" style={{ color: colors.text }}>Verzamelloonstaat</h3>
        
        <div className="flex gap-2 relative">
             {/* Column Picker */}
             <div className="relative">
                <button 
                    onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
                >
                    <Columns size={16} />
                    Kolommen
                    <ChevronDown size={14} />
                </button>
                
                {isColumnMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsColumnMenuOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20 max-h-[300px] overflow-y-auto">
                            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Toon kolommen</div>
                            {AVAILABLE_COLUMNS.map((col) => (
                                <button 
                                    key={col.key}
                                    onClick={() => toggleColumn(col.key)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                >
                                    <span>{col.label}</span>
                                    {visibleColumns.includes(col.key) && <Check size={14} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
            >
                <Printer size={14} />
                Afdrukken
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead className="bg-gray-50 font-semibold text-gray-500 uppercase">
                <tr>
                    <th className="p-3 border-b border-r sticky left-0 bg-gray-50 z-10 min-w-[200px]">Ref / Naam</th>
                    
                    {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                         <th key={col.key} className={`p-3 border-b text-right ${col.key === 'col17_uitbetaald' ? 'font-bold bg-blue-50/30 text-blue-800' : ''}`}>
                            {col.label}
                         </th>
                    ))}
                   
                    <th className="p-3 border-b text-center sticky right-0 bg-gray-50 z-10 shadow-sm border-l">Check</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => {
                    const validation = validateRow(entry);
                    return (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 border-r font-medium text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50 border-gray-100">
                                <div className="flex flex-col">
                                    <span>{entry.employeeName}</span>
                                    <span className="text-gray-400 text-[10px]">{entry.employeeRef}</span>
                                </div>
                            </td>

                            {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                                <td 
                                    key={col.key} 
                                    className={`p-3 text-right font-mono ${col.key === 'col17_uitbetaald' ? 'font-bold bg-blue-50/10 text-gray-900' : 'text-gray-600'}`}
                                >
                                    {/* @ts-ignore */}
                                    {formatCurrency(entry[col.key], false)}
                                </td>
                            ))}

                            <td className="p-3 text-center sticky right-0 bg-white group-hover:bg-gray-50 border-l border-gray-100">
                                {validation.isValid ? (
                                    <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                                ) : (
                                    <div className="flex items-center justify-center gap-1 text-red-500" title={`Verschil: ${validation.diff.toFixed(2)}`}>
                                        <AlertTriangle size={16} />
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <tr>
                    <td className="p-3 border-r text-right text-gray-600 sticky left-0 bg-gray-50">Totaal:</td>
                    
                    {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                        <td key={col.key} className="p-3 text-right font-mono text-gray-900">
                            {formatCurrency(totals[col.key] || 0, false)}
                        </td>
                    ))}

                    <td className="sticky right-0 bg-gray-50 border-l"></td>
                </tr>
            </tfoot>
        </table>
        {entries.length === 0 && (
             <div className="p-8 text-center text-gray-400">
                Geen verzamelloonstaat gegevens gevonden.
            </div>
        )}
      </div>
      
      <div className="p-4 bg-yellow-50 text-yellow-800 text-xs border-t border-yellow-100 flex items-start gap-2">
         <AlertTriangle size={14} className="mt-0.5 shrink-0" />
         <p>
            <strong>Controleformule:</strong> Kolom 3 (Loon in geld) - Kolom 7 (Aftrekposten) - Kolom 15 (LB/PVV) - Kolom 16 (Wn-Zvw) = Kolom 17 (Uitbetaald).
            Afwijkingen worden gemarkeerd met een rood icoon.
         </p>
      </div>
    </div>
  );
};

export default WageStatementList;