
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ExactRecord, AppSettings, ThemeColors, Comment, ColumnDefinition, FileData } from '../types';
import { formatCurrency } from '../utils';
import { 
  FileText, ChevronDown, ChevronRight, MessageSquare, 
  AlertTriangle, SlidersHorizontal, Layers, CheckSquare, Settings2, Building, Expand, Minimize2, UploadCloud, Trash2, AlertOctagon
} from 'lucide-react';

interface ExactOnlineViewProps {
  records: ExactRecord[];
  files: FileData[]; // Passed for management
  onUpload: (files: FileList | null) => void;
  onToggleFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  settings: AppSettings;
  theme: ThemeColors;
}

type GroupingMode = 'none' | 'ledger' | 'journal' | 'period' | 'company' | 'vatBox' | 'vatCode' | 'vatPercentage';

const ExactOnlineView: React.FC<ExactOnlineViewProps> = ({ records, files, onUpload, onToggleFile, onDeleteFile, settings, theme }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  
  // Default grouping set to 'none' (Platte lijst)
  const [grouping, setGrouping] = useState<GroupingMode>('none');
  const [decimals, setDecimals] = useState<number>(2);
  const [showConfig, setShowConfig] = useState(false);

  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { id: 'journal', label: 'Dagboek', type: 'text', visible: true, order: 1 },
    { id: 'ref', label: 'Bkst.nr.', type: 'text', visible: true, order: 2 },
    { id: 'vatBox', label: 'Aangiftevak', type: 'text', visible: true, order: 3 },
    { id: 'vatCode', label: 'Btw-code', type: 'text', visible: true, order: 4 },
    { id: 'vatPercentage', label: 'Btw %', type: 'number', visible: true, order: 5 },
    { id: 'code', label: 'Grootboekrekening', type: 'text', visible: true, order: 6 },
    { id: 'vatBase', label: 'Btw-grondslag', type: 'accounting', visible: true, order: 7 },
    { id: 'vatAmount', label: 'Btw: Bedrag', type: 'accounting', visible: true, order: 8 },
    { id: 'invoiceDate', label: 'Factuurdatum', type: 'date', visible: false, order: 9 },
    { id: 'invoiceNumber', label: 'Factuurnummer', type: 'text', visible: false, order: 10 },
    { id: 'entryDate', label: 'Datum', type: 'date', visible: false, order: 11 },
    { id: 'description', label: 'Omschrijving', type: 'text', visible: false, order: 12 },
    { id: 'relation', label: 'Relatie', type: 'text', visible: false, order: 13 },
    { id: 'debit', label: 'Debet', type: 'accounting', visible: false, order: 14 },
    { id: 'credit', label: 'Credit', type: 'accounting', visible: false, order: 15 },
  ]);

  const companies = useMemo(() => {
    const distinct = new Set(records.map(r => r.company || 'Onbekend'));
    return Array.from(distinct).sort();
  }, [records]);

  useEffect(() => {
    setExpandedSections(new Set());
  }, [grouping, selectedCompany]);

  // -- Helpers --
  const toggleSection = (key: string) => {
    const next = new Set(expandedSections);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedSections(next);
  };

  const expandAll = () => setExpandedSections(new Set(groups.keys));
  const collapseAll = () => setExpandedSections(new Set());

  const addComment = (recordId: string, text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      recordId,
      text,
      user: 'Manager',
      isManager: true,
      timestamp: new Date()
    };
    setLocalComments([...localComments, newComment]);
  };

  const toggleColumn = (id: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };
  
  const setAllColumns = (visible: boolean) => {
    setColumns(prev => prev.map(c => ({ ...c, visible })));
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (r.isTotalLine) return false;
      if (selectedCompany !== 'all' && (r.company || 'Onbekend') !== selectedCompany) return false;
      
      const amount = (r.vatBase || 0) + (r.vatAmount || 0) + Math.abs(r.debit - r.credit);
      if (settings.hideSmallAmounts && amount < settings.smallAmountThreshold && amount > 0) return false;
      return true;
    });
  }, [records, settings.hideSmallAmounts, selectedCompany]);

  const visibleColumns = useMemo(() => columns.filter(c => c.visible).sort((a, b) => a.order - b.order), [columns]);

  const groups = useMemo(() => {
    const grouped: Record<string, ExactRecord[]> = {};
    if (grouping === 'none') {
        const sorted = [...filteredRecords].sort((a, b) => {
            if (a.entryDate && b.entryDate) return a.entryDate.getTime() - b.entryDate.getTime();
            return 0;
        });
        return { keys: ['__all__'], data: { '__all__': sorted } };
    }

    filteredRecords.forEach(r => {
      let key = 'Algemeen';
      if (grouping === 'ledger') key = r.code ? `${r.code} - ${r.description}` : (r.description || 'Onbekend');
      else if (grouping === 'journal') key = r.journal || 'Geen Dagboek';
      else if (grouping === 'period') key = `${r.year} - ${r.period}`;
      else if (grouping === 'company') key = r.company || 'Onbekend Bedrijf';
      else if (grouping === 'vatBox') key = r.vatBox || 'Geen Vak';
      else if (grouping === 'vatCode') key = r.vatCode || 'Geen Code';
      else if (grouping === 'vatPercentage') key = r.vatPercentage != null ? `${r.vatPercentage}%` : '0%';

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const sortedKeys = Object.keys(grouped).sort();
    sortedKeys.forEach(k => {
      grouped[k].sort((a, b) => {
        if (a.entryDate && b.entryDate) return a.entryDate.getTime() - b.entryDate.getTime();
        return 0;
      });
    });

    return { keys: sortedKeys, data: grouped };
  }, [filteredRecords, grouping]);

  const calculateColumnTotal = (colId: string) => {
    return filteredRecords.reduce((sum, r) => sum + (r[colId as keyof ExactRecord] as number || 0), 0);
  };

  // --- ANOMALY DETECTION ---
  const getAnomaly = (r: ExactRecord) => {
     if (r.isTotalLine) return null;

     // 1. VAT Math Mismatch
     // Allow a small tolerance (e.g. 5 cents) for rounding differences
     if (r.vatBase && r.vatAmount && r.vatPercentage != null) {
        const expectedVat = r.vatBase * (r.vatPercentage / 100);
        const diff = Math.abs(expectedVat - r.vatAmount);
        
        // Flag if diff is > 0.05 AND meaningful (> 2% deviation to avoid tiny rounding noise on small amounts)
        if (diff > 0.05 && diff > (Math.abs(expectedVat) * 0.02)) {
            return {
                type: 'warning',
                msg: `Afwijking: Verwacht ${formatCurrency(expectedVat, settings.currencyMode)} op basis van ${r.vatPercentage}%`
            };
        }
     }

     // 2. VAT Amount without Base or Code (Suspicious)
     if (r.vatAmount !== 0 && (!r.vatBase && !r.vatCode)) {
         return {
             type: 'error',
             msg: 'BTW bedrag aanwezig zonder grondslag of code'
         };
     }

     return null;
  };

  const renderCell = (record: ExactRecord, col: ColumnDefinition) => {
    const val = record[col.id as keyof ExactRecord];
    const isError = ['debit', 'credit', 'vatBase'].includes(col.id) && record.validationErrors?.[col.id];
    
    // Check for calculated anomalies specific to the VAT Amount column
    const anomaly = col.id === 'vatAmount' ? getAnomaly(record) : null;

    let content: React.ReactNode = val as string;
    if (col.type === 'date') {
       const dateObj = val as Date | null | undefined;
       content = dateObj instanceof Date ? dateObj.toLocaleDateString('nl-NL') : '';
    } else if (col.type === 'accounting' || col.type === 'number') {
      const num = typeof val === 'number' ? val : 0;
      if (num === 0 && col.type === 'accounting') content = '-';
      else if (col.id === 'vatPercentage') content = num + '%';
      else content = formatCurrency(num, settings.currencyMode, decimals);
    }

    return (
      <div className={`relative flex items-center gap-2 ${['number','accounting'].includes(col.type) ? 'justify-end font-mono' : ''}`}>
        
        <span className={anomaly ? (anomaly.type === 'error' ? 'text-red-600 font-bold' : 'text-orange-600 font-medium') : ''}>
           {content}
        </span>

        {anomaly && (
             <div className="group relative">
                {anomaly.type === 'error' 
                   ? <AlertOctagon className="w-4 h-4 text-red-500 cursor-help" /> 
                   : <AlertTriangle className="w-4 h-4 text-orange-500 cursor-help" />
                }
                <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 p-2 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
                    {anomaly.msg}
                </div>
             </div>
        )}

        {isError && !anomaly && <AlertTriangle className="w-3 h-3 text-red-500 ml-1" />}
      </div>
    );
  };

  // --- RENDER ---

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-dashed border-slate-300 animate-in fade-in">
        <div className="p-6 rounded-full mb-6" style={{ backgroundColor: `${theme.primary}10` }}>
          <UploadCloud className="w-12 h-12" style={{ color: theme.primary }} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Upload Financiële Rapportage</h3>
        <p className="text-slate-500 max-w-md text-center mt-2 mb-6 text-sm">
          Sleep uw financiële transactie export hierheen.
          Alleen bestanden in deze tab worden gebruikt voor deze rapportage.
        </p>
        <label 
          className="cursor-pointer px-6 py-3 text-white rounded-lg font-bold hover:opacity-90 transition-colors shadow-lg"
          style={{ backgroundColor: theme.primary }}
        >
           Selecteer Bestand
           <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onUpload(e.target.files)} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Tab File Management Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
         <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <FileText className="w-4 h-4" style={{ color: theme.primary }} />
               Actieve Bestanden ({files.filter(f => f.active).length})
            </h3>
            <label className="text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors border border-transparent hover:bg-slate-50" style={{ color: theme.primary }}>
               + Bestand Toevoegen
               <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onUpload(e.target.files)} />
            </label>
         </div>
         <div className="flex flex-wrap gap-2">
            {files.map(f => (
               <div key={f.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors`} style={{ backgroundColor: f.active ? `${theme.primary}10` : undefined, borderColor: f.active ? `${theme.primary}30` : undefined, color: f.active ? theme.primary : undefined }}>
                  <input type="checkbox" checked={f.active} onChange={() => onToggleFile(f.id)} className="rounded focus:ring-0" style={{ accentColor: theme.primary }} />
                  <span className="truncate max-w-[150px]">{f.name}</span>
                  <button onClick={() => onDeleteFile(f.id)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
               </div>
            ))}
         </div>
      </div>

      {/* Configuration Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
             <div className="flex items-center gap-2 p-2 rounded border" style={{ backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}20` }}>
               <Building className="w-4 h-4" style={{ color: theme.primary }} />
               <span className="text-xs font-bold uppercase" style={{ color: theme.primary }}>Bedrijf:</span>
               <select 
                 value={selectedCompany} 
                 onChange={(e) => setSelectedCompany(e.target.value)}
                 className="bg-transparent text-sm font-bold focus:outline-none min-w-[150px]"
                 style={{ color: theme.primary }}
               >
                 <option value="all">Alle Bedrijven ({companies.length})</option>
                 {companies.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>

             <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

             <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
               <Layers className="w-4 h-4 text-slate-500" />
               <span className="text-xs font-bold text-slate-500 uppercase">Groeperen:</span>
               <select 
                 value={grouping} 
                 onChange={(e) => setGrouping(e.target.value as GroupingMode)}
                 className="bg-transparent text-sm font-medium focus:outline-none text-slate-700"
               >
                 <option value="none">Geen (Platte lijst)</option>
                 <option value="company">Bedrijf</option>
                 <option value="ledger">Grootboekrekening</option>
                 <option value="journal">Dagboek</option>
                 <option value="period">Periode</option>
                 <option value="vatBox">Aangiftevak</option>
                 <option value="vatCode">Btw-code</option>
                 <option value="vatPercentage">Btw %</option>
               </select>
             </div>

             <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
               <Settings2 className="w-4 h-4 text-slate-500" />
               <span className="text-xs font-bold text-slate-500 uppercase">Decimalen:</span>
               <select 
                 value={decimals} 
                 onChange={(e) => setDecimals(Number(e.target.value))}
                 className="bg-transparent text-sm font-medium focus:outline-none text-slate-700"
               >
                 <option value="0">0 (Gehele getallen)</option>
                 <option value="2">2 (Standaard)</option>
               </select>
             </div>

             <button 
               onClick={() => setShowConfig(!showConfig)}
               className={`flex items-center gap-2 p-2 rounded border transition-colors text-sm`}
               style={{ 
                 backgroundColor: showConfig ? `${theme.primary}10` : undefined, 
                 borderColor: showConfig ? `${theme.primary}30` : undefined,
                 color: showConfig ? theme.primary : undefined 
               }}
             >
               <SlidersHorizontal className="w-4 h-4" />
               Kolommen
             </button>
          </div>
        </div>

        {showConfig && (
          <div className="pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-700">Zichtbare Kolommen</h4>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setAllColumns(true)} className="hover:underline" style={{ color: theme.primary }}>Alles Selecteren</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setAllColumns(false)} className="text-slate-500 hover:underline">Geen</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {columns.map(col => (
                <label key={col.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors`} style={{ backgroundColor: col.visible ? theme.primary : 'white', borderColor: col.visible ? theme.primary : '#cbd5e1' }}>
                    {col.visible && <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={col.visible} onChange={() => toggleColumn(col.id)} />
                  <span className="text-sm text-slate-700 select-none">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Paper Report Container */}
      <div className="max-w-6xl mx-auto bg-white shadow-2xl min-h-[1000px] flex flex-col print:shadow-none print:w-full">
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
           <div>
             <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1 tracking-tight">Transactie Specificatie</h1>
             <p className="text-slate-500 text-sm">
               {selectedCompany !== 'all' ? selectedCompany : 'Geconsolideerd Overzicht'} • {filteredRecords.length} regels
             </p>
           </div>
           <div className="text-right">
             <div className="font-bold text-slate-900">{settings.appName}</div>
             <div className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString('nl-NL')}</div>
           </div>
        </div>

        <div className="p-8 flex-1 overflow-x-auto">
           <div className="border-b-2 border-slate-800 pb-2 mb-4 grid gap-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}>
              {visibleColumns.map(col => (
                <div key={col.id} className={['number','accounting'].includes(col.type) ? 'text-right' : 'text-left'}>
                  {col.label}
                </div>
              ))}
           </div>

           <div className="space-y-6">
             {grouping !== 'none' && (
               <div className="flex justify-end gap-2 text-xs text-slate-500 mb-2 print:hidden">
                 <button onClick={expandAll} className="hover:text-blue-600 flex items-center gap-1"><Expand className="w-3 h-3" /> Alles uitklappen</button>
                 <span>|</span>
                 <button onClick={collapseAll} className="hover:text-blue-600 flex items-center gap-1"><Minimize2 className="w-3 h-3" /> Alles inklappen</button>
               </div>
             )}

             {groups.keys.map(groupKey => {
               const isExpanded = expandedSections.has(groupKey);
               const groupRecords = groups.data[groupKey];
               
               const subTotals: Record<string, number> = {};
               visibleColumns.forEach(c => {
                 if (['accounting', 'number'].includes(c.type) && c.id !== 'vatPercentage') {
                   subTotals[c.id] = groupRecords.reduce((acc, r) => acc + (r[c.id as keyof ExactRecord] as number || 0), 0);
                 }
               });
               
               const isNoneMode = grouping === 'none';
               const showContent = isExpanded || isNoneMode;

               return (
                 <div key={groupKey} className="break-inside-avoid">
                   {!isNoneMode && (
                     <button 
                       onClick={() => toggleSection(groupKey)}
                       className="w-full flex items-center justify-between py-2 border-b border-slate-200 mb-2 group hover:bg-slate-50 transition-colors bg-slate-50/50 px-2 print:bg-slate-100"
                     >
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                          <span className="print:hidden">
                             {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                          {groupKey}
                        </div>
                        <div className="text-xs font-mono text-slate-400">{groupRecords.length}</div>
                     </button>
                   )}

                   <div className={`${!showContent ? 'hidden print:block' : 'block'} space-y-0.5`}>
                       {groupRecords.map(record => {
                         const comments = localComments.filter(c => c.recordId === record.id);
                         const isCommenting = activeCommentId === record.id;
                         return (
                           <div key={record.id} className="group relative break-inside-avoid">
                             <div className="grid gap-4 py-2 px-2 hover:bg-slate-50 rounded transition-colors border-b border-dashed border-slate-100 last:border-0 items-center text-sm"
                                  style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}>
                                {visibleColumns.map(col => (
                                  <div key={col.id} className="truncate">{renderCell(record, col)}</div>
                                ))}
                             </div>
                             
                             <button 
                                onClick={() => setActiveCommentId(isCommenting ? null : record.id)}
                                className={`absolute right-2 top-2 p-1 rounded hover:bg-slate-200 print:hidden ${comments.length > 0 ? 'text-blue-500' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
                              >
                                <MessageSquare className="w-3 h-3" />
                             </button>

                             {(isCommenting || comments.length > 0) && (
                               <div className="ml-8 mr-4 mb-2 p-3 bg-yellow-50 rounded border border-yellow-100 text-sm print:border-slate-200 print:bg-white">
                                  {comments.map(c => (
                                    <div key={c.id} className="mb-2 pb-1 border-b border-yellow-200/50 last:border-0 text-xs">
                                      <span className="font-bold">{c.user}:</span> {c.text}
                                    </div>
                                  ))}
                                  {isCommenting && (
                                    <input 
                                      autoFocus
                                      className="w-full border border-yellow-200 rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400 bg-white"
                                      placeholder="Typ opmerking..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          addComment(record.id, e.currentTarget.value);
                                          e.currentTarget.value = '';
                                        }
                                      }}
                                    />
                                  )}
                               </div>
                             )}
                           </div>
                         );
                       })}
                       
                       {!isNoneMode && Object.keys(subTotals).length > 0 && (
                         <div className={`grid gap-4 pt-2 pb-4 px-2 font-bold text-xs text-slate-400 uppercase tracking-wider break-inside-avoid`}
                              style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}>
                           {visibleColumns.map((col, idx) => {
                             if (idx === 0) return <div key={col.id}>Totaal {groupKey}</div>;
                             if (subTotals[col.id] !== undefined) {
                               return <div key={col.id} className="text-right border-t border-slate-200 pt-1">
                                 {formatCurrency(subTotals[col.id], settings.currencyMode, decimals)}
                               </div>;
                             }
                             return <div key={col.id}></div>;
                           })}
                         </div>
                       )}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-200 mt-auto break-inside-avoid">
           <div className="flex justify-end gap-8 overflow-x-auto">
              {visibleColumns.filter(c => ['accounting'].includes(c.type)).map(col => (
                    <div key={col.id} className="text-right min-w-[120px]">
                      <div className="text-xs text-slate-400 uppercase mb-1">{col.label}</div>
                      <div className="font-mono font-bold text-lg text-slate-900">
                        {formatCurrency(calculateColumnTotal(col.id), settings.currencyMode, decimals)}
                      </div>
                    </div>
                 ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExactOnlineView;
