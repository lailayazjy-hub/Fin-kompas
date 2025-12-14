import React, { useState } from 'react';
import { ProjectRecord, AppSettings, Comment, ThemeColors } from '../types';
import { formatCurrency, formatPercent } from '../utils';
import { ChevronDown, ChevronUp, MessageSquare, PlusCircle, AlertCircle } from 'lucide-react';

interface SummaryViewProps {
  records: ProjectRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const SummaryView: React.FC<SummaryViewProps> = ({ records, settings, theme }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const handleAddComment = (recordId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      recordId,
      text,
      user: 'Manager',
      isManager: true,
      timestamp: new Date()
    };
    setComments([...comments, newComment]);
    setActiveCommentId(null);
  };

  const filteredRecords = records.filter(r => {
    if (settings.hideSmallProjects) {
      return r.revenue > settings.smallProjectThreshold;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return theme.highRisk;
      case 'Warning': return theme.mediumRisk;
      default: return theme.lowRisk;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden pdf-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 font-semibold border-b border-slate-200" style={{ color: theme.text }}>
            <tr>
              <th className="p-4">Info</th>
              <th className="p-4">Project</th>
              <th className="p-4 text-right">Omzet</th>
              <th className="p-4 text-right">Totale Kosten</th>
              <th className="p-4 text-right">Marge (€)</th>
              <th className="p-4 text-right">Marge (%)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map(record => {
              const isExpanded = expandedRows.has(record.id);
              const recordComments = comments.filter(c => c.recordId === record.id);
              const statusColor = getStatusColor(record.status);

              return (
                <React.Fragment key={record.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <button onClick={() => toggleRow(record.id)} className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4" style={{ color: theme.text }}>
                      <div className="font-bold">{record.projectName}</div>
                      <div className="text-xs text-slate-500">{record.projectCode} • {record.client}</div>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      {formatCurrency(record.revenue, settings.currencyMode)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      {formatCurrency(record.totalCosts, settings.currencyMode)}
                    </td>
                    <td className="p-4 text-right font-mono font-medium" style={{ color: record.margin < 0 ? theme.highRisk : theme.text }}>
                      {formatCurrency(record.margin, settings.currencyMode)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold" style={{ color: statusColor }}>
                      {formatPercent(record.marginPercent)}
                    </td>
                    <td className="p-4 text-center">
                       <span 
                         className="px-2 py-1 rounded-full text-xs text-white font-medium"
                         style={{ backgroundColor: statusColor }}
                       >
                         {record.status}
                       </span>
                    </td>
                    <td className="p-4 text-center">
                       <button 
                        onClick={() => setActiveCommentId(activeCommentId === record.id ? null : record.id)}
                        className="text-slate-400 hover:opacity-100 relative"
                        style={{ color: recordComments.length > 0 ? theme.primary : undefined }}
                       >
                         <MessageSquare className="w-4 h-4" />
                         {recordComments.length > 0 && (
                           <span 
                             className="absolute -top-1 -right-1 text-white text-[10px] w-3 h-3 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: theme.primary }}
                           >
                             {recordComments.length}
                           </span>
                         )}
                       </button>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-slate-50">
                      <td colSpan={8} className="p-4 border-b border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                          <div>
                            <strong className="block mb-2 pb-1 border-b border-slate-200" style={{ color: theme.text }}>Kosten Specificatie</strong>
                            <div className="flex justify-between"><span>Arbeid:</span> <span>{formatCurrency(record.laborCosts, settings.currencyMode)}</span></div>
                            <div className="flex justify-between"><span>Materiaal:</span> <span>{formatCurrency(record.materialCosts, settings.currencyMode)}</span></div>
                            <div className="flex justify-between"><span>Overhead:</span> <span>{formatCurrency(record.overheadCosts, settings.currencyMode)}</span></div>
                          </div>
                          <div>
                            <strong className="block mb-2 pb-1 border-b border-slate-200" style={{ color: theme.text }}>Periode Info</strong>
                            <div className="flex justify-between"><span>Jaar:</span> <span>{record.year}</span></div>
                            <div className="flex justify-between"><span>Periode:</span> <span>{record.period}</span></div>
                            <div className="flex justify-between"><span>Bron:</span> <span>{record.sourceFile}</span></div>
                          </div>
                          <div>
                            <strong className="block mb-2 pb-1 border-b border-slate-200" style={{ color: theme.text }}>Ratio's</strong>
                            <div className="flex justify-between"><span>Arbeid/Omzet:</span> <span>{formatPercent(record.revenue ? record.laborCosts/record.revenue : 0)}</span></div>
                            <div className="flex justify-between"><span>Materiaal/Omzet:</span> <span>{formatPercent(record.revenue ? record.materialCosts/record.revenue : 0)}</span></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {activeCommentId === record.id && (
                    <tr className="bg-orange-50/30">
                      <td colSpan={8} className="p-4 border-b border-slate-100">
                        <div className="max-w-xl">
                          <h4 className="font-bold text-xs mb-2" style={{ color: theme.text }}>Notities & Actiepunten</h4>
                          {recordComments.map(c => (
                            <div key={c.id} className="text-xs mb-1 text-slate-700 bg-white p-2 rounded shadow-sm border border-slate-100">
                              <span className="font-bold mr-1">{c.user}:</span> {c.text}
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <input 
                              type="text" 
                              placeholder="Voeg notitie toe..." 
                              className="flex-1 text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1"
                              style={{ borderColor: theme.primary }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(record.id, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            <button className="hover:opacity-80" style={{ color: theme.primary }}>
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
      </div>
    </div>
  );
};

export default SummaryView;
