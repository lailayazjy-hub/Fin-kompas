import React from 'react';
import { LedgerRecord, AppSettings, ThemeColors } from '../types';
import { formatCurrency } from '../utils';
import { ClipboardList, CheckCircle, XCircle } from 'lucide-react';

interface AuditLogViewProps {
  records: LedgerRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ records, settings, theme }) => {
  // Only show processed records
  const processedRecords = records.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <ClipboardList className="w-6 h-6" style={{ color: theme.primary }} />
          <div>
             <h2 className="text-lg font-bold" style={{ color: theme.text }}>Audit Log & Workflow Historie</h2>
             <p className="text-sm text-slate-500">Overzicht van goedgekeurde en afgekeurde posten.</p>
          </div>
        </div>

        {processedRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Nog geen posten verwerkt. Ga naar het overzicht om items goed of af te keuren.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 font-semibold border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3">Status</th>
                  <th className="p-3">Omschrijving</th>
                  <th className="p-3">Relatie</th>
                  <th className="p-3 text-right">Bedrag</th>
                  <th className="p-3">Correctie Advies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      {r.status === 'APPROVED' ? (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                          <CheckCircle className="w-4 h-4" /> Goedgekeurd
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                          <XCircle className="w-4 h-4" /> Afgekeurd
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-700">{r.omschrijving}</td>
                    <td className="p-3 text-slate-500">{r.relatie}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(r.bedrag, settings.currencyMode)}</td>
                    <td className="p-3 text-slate-500 text-xs italic">
                      {r.suggestedAllocation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogView;
