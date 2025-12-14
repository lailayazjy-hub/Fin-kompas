import React, { useState } from 'react';
import { LedgerRecord, AppSettings, Comment, ThemeColors, TransitoriaStatus } from '../types';
import { formatCurrency } from '../utils';
import { MessageSquare, PlusCircle, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';

interface SummaryViewProps {
  records: LedgerRecord[];
  settings: AppSettings;
  theme: ThemeColors;
  onUpdateRecord: (updatedRecord: LedgerRecord) => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ records, settings, theme, onUpdateRecord }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransitoriaStatus | 'ALL'>('ALL');

  const handleAddComment = (recordId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      recordId,
      text,
      user: 'Controller', 
      isManager: false,
      timestamp: new Date()
    };
    setComments([...comments, newComment]);
    setActiveCommentId(null);
  };

  const updateStatus = (record: LedgerRecord, newStatus: TransitoriaStatus) => {
    onUpdateRecord({ ...record, status: newStatus });
  };

  const filteredRecords = records.filter(r => {
    const matchesText = 
      r.omschrijving.toLowerCase().includes(filterText.toLowerCase()) || 
      r.relatie.toLowerCase().includes(filterText.toLowerCase()) ||
      r.grootboekrekening.includes(filterText);
    
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    
    if (settings.hideSmallAmounts && Math.abs(r.bedrag) < settings.smallAmountThreshold) return false;

    return matchesText && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Filter className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Zoek op omschrijving, relatie of grootboek..."
            className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1"
            style={{ borderColor: theme.primary }}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
             <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${statusFilter === status ? 'bg-white shadow-sm' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`}
               style={{ borderColor: statusFilter === status ? theme.primary : 'transparent', color: statusFilter === status ? theme.primary : undefined }}
             >
               {status === 'ALL' ? 'Alles' : status}
             </button>
           ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 font-semibold border-b border-slate-200" style={{ color: theme.text }}>
            <tr>
              <th className="p-4 w-32">Datum</th>
              <th className="p-4">Omschrijving / Relatie</th>
              <th className="p-4 w-24">GBR</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4">AI Detectie</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map(record => {
              const recordComments = comments.filter(c => c.recordId === record.id);
              const isHighRisk = record.anomalyScore > 0.7;

              return (
                <React.Fragment key={record.id}>
                  <tr className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-mono text-xs text-slate-500">{record.datum}</td>
                    <td className="p-4 font-medium" style={{ color: theme.text }}>
                      <div>{record.omschrijving}</div>
                      <div className="text-xs text-slate-400">{record.relatie}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{record.grootboekrekening}</td>
                    <td className="p-4 text-right font-mono text-slate-700">
                      {formatCurrency(record.bedrag, settings.currencyMode)}
                    </td>
                    <td className="p-4">
                      {isHighRisk && (
                         <div className="flex items-center gap-1 text-xs font-bold" style={{ color: theme.highRisk }}>
                           <AlertCircle className="w-3 h-3" />
                           Check Periode
                         </div>
                      )}
                      <div className="text-xs text-slate-500">
                        {record.suggestedAllocation || '-'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <span 
                         className={`px-2 py-1 rounded-full text-[10px] font-bold border`}
                         style={{ 
                           borderColor: record.status === 'APPROVED' ? theme.lowRisk : record.status === 'REJECTED' ? theme.highRisk : '#cbd5e1',
                           color: record.status === 'APPROVED' ? theme.lowRisk : record.status === 'REJECTED' ? theme.highRisk : '#94a3b8',
                           backgroundColor: record.status === 'APPROVED' ? `${theme.lowRisk}10` : record.status === 'REJECTED' ? `${theme.highRisk}10` : '#f1f5f9'
                         }}
                       >
                         {record.status}
                       </span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                       <button 
                         onClick={() => updateStatus(record, 'APPROVED')}
                         className="p-1 rounded hover:bg-green-50 text-slate-300 hover:text-green-600 transition-colors"
                         title="Goedkeuren"
                       >
                         <CheckCircle className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => updateStatus(record, 'REJECTED')}
                         className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-600 transition-colors"
                         title="Afkeuren / Correctie nodig"
                       >
                         <XCircle className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => setActiveCommentId(activeCommentId === record.id ? null : record.id)}
                        className="p-1 rounded hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-colors relative"
                       >
                         <MessageSquare className="w-4 h-4" />
                         {recordComments.length > 0 && (
                           <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500" />
                         )}
                       </button>
                    </td>
                  </tr>
                  
                  {activeCommentId === record.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="p-4 border-b border-slate-100 shadow-inner">
                        <div className="max-w-xl mx-auto">
                          <h4 className="font-bold text-xs mb-2" style={{ color: theme.text }}>Logboek & Opmerkingen</h4>
                          {recordComments.map(c => (
                            <div key={c.id} className="text-xs mb-1 text-slate-700 bg-white p-2 rounded shadow-sm border border-slate-100">
                              <span className="font-bold mr-1">{c.user}:</span> {c.text}
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <input 
                              type="text" 
                              placeholder="Reden voor afkeuring of notitie..." 
                              className="flex-1 text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1"
                              style={{ borderColor: theme.primary }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(record.id, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            <button 
                              className="hover:opacity-80"
                              style={{ color: theme.primary }}
                            >
                              <PlusCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Geen transacties gevonden. Upload GBR data.
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryView;
