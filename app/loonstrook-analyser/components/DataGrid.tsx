import React, { useState } from 'react';
import { LineItem, LineItemType, AppSettings, Comment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getThemeById } from '../utils/themes';
import { MessageSquare, Plus, ChevronDown, ChevronRight, EyeOff } from 'lucide-react';

interface Props {
  lines: LineItem[];
  settings: AppSettings;
  onUpdateLine: (lineId: string, updates: Partial<LineItem>) => void;
  onAddComment: (lineId: string, text: string) => void;
  isProcessing: boolean;
}

export const DataGrid: React.FC<Props> = ({ lines, settings, onUpdateLine, onAddComment, isProcessing }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  
  const theme = getThemeById(settings.themeId);

  // Filter logic
  const filteredLines = lines.filter(line => {
    if (line.type === LineItemType.NET_PAYOUT) return true; // Always show net payout
    if (!settings.showSmallAmounts && Math.abs(line.amount) < 50) return false;
    return true;
  });

  const incomeLines = filteredLines.filter(l => l.type === LineItemType.INCOME);
  const deductionLines = filteredLines.filter(l => l.type === LineItemType.DEDUCTION);
  const infoLines = filteredLines.filter(l => l.type === LineItemType.INFORMATION);
  const netLines = filteredLines.filter(l => l.type === LineItemType.NET_PAYOUT);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleCommentSubmit = (lineId: string) => {
    if (newCommentText.trim()) {
      onAddComment(lineId, newCommentText);
      setNewCommentText('');
      setActiveCommentId(null);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
        <p className="text-gray-500 animate-pulse">Loonstrook analyseren met AI...</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <p>Geen data beschikbaar. Upload een loonstrook.</p>
      </div>
    );
  }

  const renderSection = (title: string, items: LineItem[], bgColor: string, textColor: string, isDefaultOpen = true) => {
    const isExpanded = expandedGroups[title] ?? isDefaultOpen;
    const hiddenCount = lines.filter(l => l.type === items[0]?.type && Math.abs(l.amount) < 50).length;
    const showHiddenBadge = !settings.showSmallAmounts && hiddenCount > 0;

    return (
      <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <button 
          onClick={() => toggleGroup(title)}
          className={`w-full flex items-center justify-between p-3 border-b border-gray-100 transition-colors hover:bg-opacity-20`}
          style={{ backgroundColor: `${bgColor}15` }}
        >
          <div className="flex items-center gap-2">
             {isExpanded ? <ChevronDown size={18} color={textColor} /> : <ChevronRight size={18} color={textColor} />}
             <span className="font-semibold" style={{ color: textColor }}>{title}</span>
             <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-500 shadow-sm">{items.length} regels</span>
             {showHiddenBadge && (
               <span className="text-xs flex items-center gap-1 text-gray-400 ml-2" title={`${hiddenCount} kleine bedragen verborgen`}>
                 <EyeOff size={12} /> {hiddenCount}
               </span>
             )}
          </div>
        </button>
        
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Omschrijving</th>
                  <th className="px-6 py-3 font-medium">Categorie</th>
                  <th className="px-6 py-3 font-medium text-right">Bedrag</th>
                  {settings.showAiRemarks && <th className="px-6 py-3 font-medium" style={{ color: theme.colors.mediumRisk }}>AI Notitie</th>}
                  <th className="px-6 py-3 font-medium text-center">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-3 font-medium text-gray-900">{item.description}</td>
                      <td className="px-6 py-3 text-gray-500">
                        <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-xs">{item.category}</span>
                      </td>
                      <td 
                        className={`px-6 py-3 text-right font-mono`}
                        style={{ color: item.type === LineItemType.DEDUCTION ? theme.colors.highRisk : theme.colors.lowRisk }}
                      >
                        {item.type === LineItemType.DEDUCTION ? '-' : ''} {formatCurrency(item.amount, settings.currencyMode)}
                      </td>
                      {settings.showAiRemarks && (
                        <td className="px-6 py-3 text-xs italic max-w-xs truncate" style={{ color: theme.colors.mediumRisk }}>
                          {item.aiRemark}
                        </td>
                      )}
                      <td className="px-6 py-3 flex justify-center items-center gap-2">
                         <button 
                           onClick={() => setActiveCommentId(activeCommentId === item.id ? null : item.id)}
                           className={`p-1.5 rounded-full hover:bg-gray-200 transition relative ${item.comments.length > 0 ? 'bg-[var(--color-primary)] bg-opacity-10' : 'text-gray-400'}`}
                           title="Opmerking toevoegen"
                           style={item.comments.length > 0 ? { color: theme.colors.primary } : {}}
                         >
                           <MessageSquare size={16} />
                           {item.comments.length > 0 && (
                             <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full text-[8px] text-white" style={{ backgroundColor: theme.colors.highRisk }}>
                               {item.comments.length}
                             </span>
                           )}
                         </button>
                      </td>
                    </tr>
                    {/* Comments Section */}
                    {(activeCommentId === item.id || item.comments.length > 0) && (
                      <tr className={activeCommentId === item.id ? "bg-gray-50" : "hidden"}>
                        <td colSpan={settings.showAiRemarks ? 5 : 4} className="px-6 py-3 border-b border-gray-100">
                          <div className="space-y-3 pl-8 border-l-2 border-gray-200 ml-4">
                            {item.comments.map(c => (
                              <div key={c.id} className="text-xs">
                                <span className="font-bold text-gray-700">{c.author}</span>
                                <span className="text-gray-400 ml-2">{formatDate(c.date)}</span>
                                <p className="text-gray-600 mt-0.5">{c.text}</p>
                              </div>
                            ))}
                            {activeCommentId === item.id && (
                              <div className="flex gap-2 items-center mt-2">
                                <input 
                                  type="text" 
                                  value={newCommentText}
                                  onChange={(e) => setNewCommentText(e.target.value)}
                                  placeholder="Typ een opmerking..."
                                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none"
                                  style={{ borderColor: 'transparent', boxShadow: `0 0 0 1px ${theme.colors.primary}` }}
                                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(item.id)}
                                  autoFocus
                                />
                                <button 
                                  onClick={() => handleCommentSubmit(item.id)}
                                  className="text-sm font-medium"
                                  style={{ color: theme.colors.primary }}
                                >
                                  Opslaan
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 pb-20">
      {renderSection("Inkomsten & Toeslagen", incomeLines, theme.colors.lowRisk, theme.colors.text, true)}
      {renderSection("Inhoudingen & Belastingen", deductionLines, theme.colors.highRisk, theme.colors.text, true)}
      {infoLines.length > 0 && renderSection("Informatief", infoLines, theme.colors.primary, theme.colors.text, false)}
      
      {/* Net Pay Highlight */}
      {netLines.length > 0 && (
        <div className="mt-8 p-6 rounded-xl border shadow-sm flex justify-between items-center" style={{ backgroundColor: `${theme.colors.primary}10`, borderColor: `${theme.colors.primary}30` }}>
          <div>
            <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>Netto te betalen</h3>
            <p className="text-sm" style={{ color: theme.colors.primary }}>Totaal bedrag volgens loonstrook</p>
          </div>
          <div className="text-4xl font-mono font-bold" style={{ color: theme.colors.primary }}>
            {formatCurrency(netLines[0].amount, settings.currencyMode)}
          </div>
        </div>
      )}
    </div>
  );
};
