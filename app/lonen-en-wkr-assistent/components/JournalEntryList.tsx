
import React, { useState, useMemo } from 'react';
import { JournalEntry, ThemeColors } from '../types';
import { formatCurrency } from '../services/wkrService';
import { Filter, Download, Printer, AlertTriangle, CheckCircle2, Scale, AlertCircle, Info, FileWarning } from 'lucide-react';

interface JournalEntryListProps {
  entries: JournalEntry[];
  colors: ThemeColors;
}

const JournalEntryList: React.FC<JournalEntryListProps> = ({ entries, colors }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Alle');

  const availablePeriods = useMemo(() => {
    const periods = new Set(entries.map(e => e.period));
    return ['Alle', ...Array.from(periods)];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (selectedPeriod === 'Alle') return entries;
    return entries.filter(e => e.period === selectedPeriod);
  }, [entries, selectedPeriod]);

  // Calculations for Totals row
  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => ({
      periodDebet: acc.periodDebet + curr.periodDebet,
      periodCredit: acc.periodCredit + curr.periodCredit,
      cumulativeDebet: acc.cumulativeDebet + curr.cumulativeDebet,
      cumulativeCredit: acc.cumulativeCredit + curr.cumulativeCredit,
    }), { periodDebet: 0, periodCredit: 0, cumulativeDebet: 0, cumulativeCredit: 0 });
  }, [filteredEntries]);

  // --- Advanced Validations ---
  
  // 1. Balance Check
  const periodDifference = totals.periodDebet - totals.periodCredit;
  const isPeriodBalanced = Math.abs(periodDifference) < 0.01;

  // 2. Fiscal Year Consistency
  const uniqueYears = useMemo(() => Array.from(new Set(filteredEntries.map(e => e.year))), [filteredEntries]);
  const isYearConsistent = uniqueYears.length <= 1;

  // 3. Period Consistency (Only relevant if filtering specific logic, but good to know if mixed)
  const uniquePeriods = useMemo(() => Array.from(new Set(filteredEntries.map(e => e.period))), [filteredEntries]);
  
  // 4. Zero Value Check (Cleanliness)
  const zeroValueEntries = useMemo(() => filteredEntries.filter(e => 
    e.periodDebet === 0 && e.periodCredit === 0 && e.cumulativeDebet === 0 && e.cumulativeCredit === 0
  ), [filteredEntries]);


  const downloadCSV = () => {
     const headers = ['Grootboekrekening', 'Omschrijving', 'Periode Debet', 'Periode Credit', 'Cumulatief Debet', 'Cumulatief Credit', 'Periode', 'Jaar'];
     const rows = filteredEntries.map(e => [
        e.accountNumber,
        `"${e.accountName}"`,
        e.periodDebet.toString().replace('.', ','),
        e.periodCredit.toString().replace('.', ','),
        e.cumulativeDebet.toString().replace('.', ','),
        e.cumulativeCredit.toString().replace('.', ','),
        e.period,
        e.year
     ]);

     const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.download = `journaalposten-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // Determine Overall Status Color
  let statusColor = 'bg-green-50 border-green-200 text-green-800';
  let StatusIcon = CheckCircle2;

  if (!isPeriodBalanced) {
      statusColor = 'bg-red-50 border-red-200 text-red-800';
      StatusIcon = AlertCircle;
  } else if (!isYearConsistent || zeroValueEntries.length > 0) {
      statusColor = 'bg-orange-50 border-orange-200 text-orange-800';
      StatusIcon = AlertTriangle;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <h3 className="font-semibold text-lg" style={{ color: colors.text }}>Journaalposten</h3>
        
        <div className="flex flex-wrap gap-2 items-center">
            {/* Period Filter */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                <Filter size={14} className="text-gray-400 mr-2" />
                <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                >
                    {availablePeriods.map(p => (
                        <option key={p} value={p}>{p === 'Alle' ? 'Alle Perioden' : p}</option>
                    ))}
                </select>
            </div>

            <button onClick={downloadCSV} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="Export CSV">
                <Download size={18} />
            </button>
            <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title="Afdrukken">
                <Printer size={18} />
            </button>
        </div>
      </div>

      {/* Advanced Validation Banner */}
      <div className={`p-4 border-b ${statusColor}`}>
          <div className="flex items-start gap-4">
              <div className="mt-1">
                <StatusIcon size={28} />
              </div>
              
              <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm uppercase tracking-wide">Kwaliteitscontrole Data</h4>
                      <Scale size={20} className="opacity-20" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {/* Check 1: Balance */}
                        <div className="flex items-center gap-2">
                             {isPeriodBalanced ? <CheckCircle2 size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-red-600" />}
                             <span>
                                {isPeriodBalanced 
                                    ? "Journaalpost is in balans." 
                                    : `ONBALANS: Verschil ${formatCurrency(periodDifference, false)}`
                                }
                             </span>
                        </div>

                        {/* Check 2: Fiscal Year */}
                        <div className="flex items-center gap-2">
                            {isYearConsistent ? <CheckCircle2 size={16} className="text-green-600" /> : <AlertTriangle size={16} className="text-orange-600" />}
                            <span>
                                {isYearConsistent 
                                    ? `Boekjaar consistent (${uniqueYears[0] || '-'})` 
                                    : `Let op: Meerdere boekjaren gevonden (${uniqueYears.join(', ')})`
                                }
                            </span>
                        </div>

                        {/* Check 3: Zero Values */}
                        <div className="flex items-center gap-2">
                            {zeroValueEntries.length === 0 ? <CheckCircle2 size={16} className="text-green-600" /> : <Info size={16} className="text-blue-600" />}
                            <span>
                                {zeroValueEntries.length === 0 
                                    ? "Geen lege regels gevonden." 
                                    : `${zeroValueEntries.length} regels zonder waarde (0,00)`
                                }
                            </span>
                        </div>
                        
                         {/* Check 4: Mixed Periods Warning */}
                         {uniquePeriods.length > 1 && selectedPeriod === 'Alle' && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <FileWarning size={16} />
                                <span>Meerdere periodes getoond ({uniquePeriods.length})</span>
                            </div>
                        )}
                  </div>
              </div>
          </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                    <th className="p-3 border-b">Grootboek</th>
                    <th className="p-3 border-b">Omschrijving</th>
                    <th className="p-3 border-b text-right text-gray-600 bg-blue-50/50">Periode Debet</th>
                    <th className="p-3 border-b text-right text-gray-600 bg-blue-50/50 border-r border-blue-100">Periode Credit</th>
                    <th className="p-3 border-b text-right text-gray-600">Cumulatief Debet</th>
                    <th className="p-3 border-b text-right text-gray-600">Cumulatief Credit</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-mono text-gray-500">{entry.accountNumber}</td>
                        <td className="p-3 font-medium text-gray-800 flex items-center gap-2">
                            {entry.accountName}
                            {/* Visual indicator for different years if inconsistent */}
                            {!isYearConsistent && <span className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded">{entry.year}</span>}
                        </td>
                        <td className="p-3 text-right font-mono bg-blue-50/20">{entry.periodDebet !== 0 ? formatCurrency(entry.periodDebet, false) : ''}</td>
                        <td className="p-3 text-right font-mono bg-blue-50/20 border-r border-gray-100">{entry.periodCredit !== 0 ? formatCurrency(entry.periodCredit, false) : ''}</td>
                        <td className="p-3 text-right font-mono">{entry.cumulativeDebet !== 0 ? formatCurrency(entry.cumulativeDebet, false) : ''}</td>
                        <td className="p-3 text-right font-mono">{entry.cumulativeCredit !== 0 ? formatCurrency(entry.cumulativeCredit, false) : ''}</td>
                    </tr>
                ))}
            </tbody>
            {/* Footer Totals */}
            <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <tr className={isPeriodBalanced ? '' : 'bg-red-50'}>
                    <td colSpan={2} className="p-3 text-right text-gray-600">Totaal:</td>
                    <td className={`p-3 text-right font-mono bg-blue-50/50 ${!isPeriodBalanced && 'text-red-600'}`}>
                        {formatCurrency(totals.periodDebet, false)}
                    </td>
                    <td className={`p-3 text-right font-mono bg-blue-50/50 border-r border-blue-200 ${!isPeriodBalanced && 'text-red-600'}`}>
                        {formatCurrency(totals.periodCredit, false)}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-900">{formatCurrency(totals.cumulativeDebet, false)}</td>
                    <td className="p-3 text-right font-mono text-gray-900">{formatCurrency(totals.cumulativeCredit, false)}</td>
                </tr>
            </tfoot>
        </table>
        {entries.length === 0 && (
            <div className="p-8 text-center text-gray-400">
                Geen journaalposten gevonden. Sleep PDF of Excel bestanden in de app.
            </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntryList;
