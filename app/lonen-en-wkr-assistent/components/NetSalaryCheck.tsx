import React, { useMemo } from 'react';
import { Payslip, BankTransaction, AuditResult, ThemeColors } from '../types';
import { formatCurrency } from '../services/wkrService';
import { CheckCircle2, AlertOctagon, HelpCircle, Download, Printer, ShieldCheck, AlertTriangle } from 'lucide-react';

interface NetSalaryCheckProps {
  payslips: Payslip[];
  transactions: BankTransaction[];
  colors: ThemeColors;
}

const NetSalaryCheck: React.FC<NetSalaryCheckProps> = ({ payslips, transactions, colors }) => {

  // Auto-calculation logic is reactive to props
  const auditResults: AuditResult[] = useMemo(() => {
    const results: AuditResult[] = [];
    const usedTransactions = new Set<string>();

    // 1. Iterate over Payslips to find matching Bank Transactions
    payslips.forEach(slip => {
      // Logic: Find transaction with exact amount AND (name match OR ref match)
      // For this demo, we assume the bank description contains the name or ref
      const match = transactions.find(t => {
        if (usedTransactions.has(t.id)) return false;
        
        const nameMatch = t.description.toLowerCase().includes(slip.employeeName.toLowerCase().split(' ')[1]?.toLowerCase() || 'xxxxx'); // Simple surname check
        const refMatch = t.description.includes(slip.employeeRef);
        
        // Match if Name/Ref matches. We check amount later for discrepancy.
        return nameMatch || refMatch;
      });

      if (match) {
        usedTransactions.add(match.id);
        const difference = match.amount - slip.netAmount;
        results.push({
          employeeName: slip.employeeName,
          period: slip.period,
          netSalary: slip.netAmount,
          bankAmount: match.amount,
          difference: difference,
          status: Math.abs(difference) < 0.01 ? 'MATCH' : 'MISMATCH',
          details: Math.abs(difference) < 0.01 ? 'Correct' : 'Bedrag wijkt af'
        });
      } else {
        results.push({
          employeeName: slip.employeeName,
          period: slip.period,
          netSalary: slip.netAmount,
          bankAmount: 0,
          difference: -slip.netAmount,
          status: 'MISSING_BANK',
          details: 'Geen betaling gevonden'
        });
      }
    });

    return results;
  }, [payslips, transactions]);

  const mismatchCount = auditResults.filter(r => r.status === 'MISMATCH').length;
  const missingCount = auditResults.filter(r => r.status === 'MISSING_BANK').length;
  const totalDiscrepancy = auditResults.reduce((acc, curr) => acc + Math.abs(curr.difference), 0);

  const getStatusIcon = (status: AuditResult['status']) => {
    switch (status) {
      case 'MATCH': return <CheckCircle2 size={18} className="text-green-500" />;
      case 'MISMATCH': return <AlertOctagon size={18} className="text-red-500" />;
      case 'MISSING_BANK': return <HelpCircle size={18} className="text-orange-500" />;
      default: return <HelpCircle size={18} className="text-gray-400" />;
    }
  };

  const downloadAuditCSV = () => {
    const headers = ['Medewerker', 'Periode', 'Netto Loon', 'Betaald Bank', 'Verschil', 'Status', 'Details'];
    const rows = auditResults.map(r => [
      `"${r.employeeName}"`,
      r.period,
      r.netSalary.toString().replace('.', ','),
      r.bankAmount.toString().replace('.', ','),
      r.difference.toString().replace('.', ','),
      r.status,
      `"${r.details}"`
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salaris-audit-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
       <div className="p-4 border-b border-gray-100 flex justify-between items-center no-print">
        <h3 className="font-semibold text-lg" style={{ color: colors.text }}>Netto Loon Controle</h3>
        
        <div className="flex gap-2">
            <button 
                onClick={downloadAuditCSV}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
            >
                <Download size={14} />
                Excel / CSV
            </button>
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
            >
                <Printer size={14} />
                Afdrukken
            </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        {mismatchCount === 0 && missingCount === 0 && auditResults.length > 0 ? (
            <div className="flex items-center gap-3 text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200 w-full">
                <ShieldCheck size={24} />
                <div>
                    <span className="font-bold block">Controle Geslaagd</span>
                    <span className="text-sm">Alle {auditResults.length} loonstroken matchen met banktransacties.</span>
                </div>
            </div>
        ) : auditResults.length > 0 ? (
             <div className="flex items-center gap-3 text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200 w-full shadow-sm">
                <AlertTriangle size={24} />
                <div>
                    <span className="font-bold block">Aandacht Vereist</span>
                    <span className="text-sm">
                        {mismatchCount} verschillen en {missingCount} ontbrekende betalingen gevonden. 
                        Totaal verschil: <strong>{formatCurrency(totalDiscrepancy, false)}</strong>.
                    </span>
                </div>
            </div>
        ) : (
            <div className="text-sm text-gray-500 italic">Upload gegevens om analyse te starten.</div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-4 border-b">Medewerker</th>
              <th className="p-4 border-b">Periode</th>
              <th className="p-4 border-b text-right">Netto (Loonstrook)</th>
              <th className="p-4 border-b text-right">Betaald (Bank)</th>
              <th className="p-4 border-b text-right">Verschil</th>
              <th className="p-4 border-b">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {auditResults.map((row, idx) => (
              <tr 
                key={idx} 
                className={`transition-colors ${
                    row.status === 'MISMATCH' 
                        ? 'bg-red-50/70 hover:bg-red-100 border-l-4 border-l-red-500' 
                        : row.status === 'MISSING_BANK' 
                            ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400'
                            : 'hover:bg-gray-50'
                }`}
              >
                <td className="p-4 font-medium text-gray-800">{row.employeeName}</td>
                <td className="p-4 text-gray-600">{row.period}</td>
                <td className="p-4 text-right font-mono text-gray-700">{formatCurrency(row.netSalary, false)}</td>
                <td className="p-4 text-right font-mono text-gray-700">{row.bankAmount > 0 ? formatCurrency(row.bankAmount, false) : '-'}</td>
                <td className={`p-4 text-right font-mono font-bold ${Math.abs(row.difference) < 0.01 ? 'text-gray-400' : 'text-red-600'}`}>
                  {formatCurrency(row.difference, false)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(row.status)}
                    <span className={`text-xs font-medium ${row.status === 'MATCH' ? 'text-green-700' : 'text-red-700'}`}>
                      {row.details}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {auditResults.length === 0 && (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <HelpCircle size={48} className="mb-2 opacity-20" />
                <p>Geen data om te vergelijken.</p>
                <p className="text-sm">Sleep loonstrook-bestanden en bankafschriften naar de app om te starten.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default NetSalaryCheck;