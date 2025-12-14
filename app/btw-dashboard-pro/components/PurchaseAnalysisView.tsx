
'use client';

import React, { useState, useMemo } from 'react';
import { ExactRecord, AppSettings, ThemeColors, ColumnDefinition, FileData } from '../types';
import { formatCurrency } from '../utils';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ShieldAlert,
  ShieldCheck,
  FileSearch,
  BookOpen,
  Trash2,
  FileText,
  SlidersHorizontal,
  CheckSquare,
  Expand,
  Minimize2,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  CreditCard,
  ArrowRightLeft,
  Globe,
  Filter,
  Layers
} from 'lucide-react';

interface PurchaseAnalysisViewProps {
  records: ExactRecord[];
  files: FileData[];
  onUpload: (files: FileList | null) => void;
  onToggleFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  settings: AppSettings;
  theme: ThemeColors;
}

type RiskLevel = 'ok' | 'warning' | 'error';
type GroupingMode = 'none' | 'relation' | 'journal' | 'period' | 'vatBox';

interface PurchaseRisk {
  record: ExactRecord;
  riskLevel: RiskLevel;
  riskMessage: string;
  category: 'eu' | 'vat_code' | 'calculation' | 'private' | 'none';
}

const PurchaseAnalysisView: React.FC<PurchaseAnalysisViewProps> = ({ records, files, onUpload, onToggleFile, onDeleteFile, settings, theme }) => {
  const [filterText, setFilterText] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'warning' | 'error'>('all');
  const [grouping, setGrouping] = useState<GroupingMode>('none');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showConfig, setShowConfig] = useState(false);

  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { id: 'entryDate', label: 'Datum', type: 'date', visible: true, order: 1 },
    { id: 'journal', label: 'Dagboek', type: 'text', visible: true, order: 2 },
    { id: 'relation', label: 'Crediteur', type: 'text', visible: true, order: 3 },
    { id: 'description', label: 'Omschrijving', type: 'text', visible: true, order: 4 },
    { id: 'vatBase', label: 'Grondslag', type: 'accounting', visible: true, order: 5 },
    { id: 'vatAmount', label: 'Btw Bedrag', type: 'accounting', visible: true, order: 6 },
    { id: 'vatCode', label: 'Btw Code', type: 'text', visible: true, order: 7 },
    { id: 'country', label: 'Land', type: 'text', visible: true, order: 8 },
    { id: 'vatBox', label: 'Vak', type: 'text', visible: true, order: 9 },
  ]);

  // --- ANALYSIS LOGIC ---
  const purchaseData = useMemo(() => {
    const analyzed: PurchaseRisk[] = [];
    
    // Filter logic: Inkoopboek OR Expense with Input VAT OR Expense Debit > 0
    const rawPurchases = records.filter(r => {
        if (r.isTotalLine) return false;
        
        const journal = (r.journal || '').toLowerCase();
        const isPurchaseJournal = journal.includes('inkoop') || journal.includes('purchase') || journal.includes('ink');
        
        const hasInputVat = (r.vatBox || '').includes('5b') || (r.vatBox || '').includes('voorbelasting');
        const isExpense = r.type === 'pnl' && r.debit > 0;
        // Exclude obvious sales revenue
        const isRevenue = r.credit > 0 && r.debit === 0;

        return (isPurchaseJournal || hasInputVat || isExpense) && !isRevenue;
    });

    rawPurchases.forEach(r => {
        let riskLevel: RiskLevel = 'ok';
        let riskMessage = '';
        let category: PurchaseRisk['category'] = 'none';

        const vatBox = (r.vatBox || '').toLowerCase().replace(/[^0-9a-z]/g, '');
        const base = r.vatBase || r.debit || 0; 
        const tax = r.vatAmount || 0;
        
        // 1. Calculation Mismatch
        if (r.vatPercentage && base > 0) {
            const expected = base * (r.vatPercentage / 100);
            if (Math.abs(expected - tax) > 0.05) { // Strict tolerance
                riskLevel = 'warning';
                riskMessage = `Btw afwijking (Verwacht: ${formatCurrency(expected, settings.currencyMode)})`;
                category = 'calculation';
            }
        }

        // 2. Missing VAT Code on Significant Expense
        if (base > 50 && tax === 0 && !r.vatCode && !r.vatBox) {
            // Check descriptions for 'Prive', 'Boete', 'Horeca'
            const desc = (r.description || '').toLowerCase();
            if (desc.includes('prive') || desc.includes('boete') || desc.includes('lunch') || desc.includes('diner')) {
                 riskLevel = 'warning';
                 riskMessage = 'Controleer aftrekbaarheid (Privé/Horeca/Boete?)';
                 category = 'private';
            } else {
                 riskLevel = 'warning';
                 riskMessage = 'Geen Btw-code op kostenpost';
                 category = 'vat_code';
            }
        }

        // 3. EU / ICP Logic
        if (r.country && r.country.toUpperCase() !== 'NL' && r.country.toUpperCase() !== 'NEDERLAND') {
             // If Foreign country
             // If Tax > 0 and no '4' box (Import/Acquisition), implies we paid foreign VAT?
             if (!vatBox.includes('4') && !vatBox.includes('2a') && tax > 0) {
                 riskLevel = 'warning';
                 riskMessage = `Buitenlandse Btw (${r.country})?`;
                 category = 'eu';
             }
             // If 0 Tax and no Reverse Charge code?
             if (tax === 0 && !vatBox.includes('2a') && !vatBox.includes('4')) {
                 // Maybe exempt, but check
                 riskLevel = 'warning';
                 riskMessage = `Buitenlandse factuur zonder verlegging?`;
                 category = 'eu';
             }
        }

        analyzed.push({
            record: r,
            riskLevel,
            riskMessage,
            category
        });
    });

    // Sort by Date
    return analyzed.sort((a, b) => (a.record.entryDate?.getTime() || 0) - (b.record.entryDate?.getTime() || 0));
  }, [records, settings]);

  // --- FILTER & GROUP ---
  const filteredData = useMemo(() => {
      return purchaseData.filter(item => {
          if (riskFilter === 'warning' && item.riskLevel === 'ok') return false;
          if (riskFilter === 'error' && item.riskLevel !== 'error') return false; 
          
          if (filterText) {
              const search = filterText.toLowerCase();
              return (
                  (item.record.description || '').toLowerCase().includes(search) ||
                  (item.record.relation || '').toLowerCase().includes(search) ||
                  (item.record.journal || '').toLowerCase().includes(search)
              );
          }
          return true;
      });
  }, [purchaseData, riskFilter, filterText]);

  const groups = useMemo(() => {
    const grouped: Record<string, PurchaseRisk[]> = {};
    if (grouping === 'none') {
        return { keys: ['__all__'], data: { '__all__': filteredData } };
    }
    
    filteredData.forEach(item => {
        let key = 'Overig';
        if (grouping === 'relation') key = item.record.relation || 'Geen Crediteur';
        if (grouping === 'journal') key = item.record.journal || 'Geen Dagboek';
        if (grouping === 'period') key = `${item.record.year}-${item.record.period}`;
        if (grouping === 'vatBox') key = item.record.vatBox || 'Geen Vak';
        
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });
    
    return { keys: Object.keys(grouped).sort(), data: grouped };
  }, [filteredData, grouping]);

  const stats = useMemo(() => {
     return purchaseData.reduce((acc, item) => {
         const vol = item.record.vatBase || item.record.debit || 0;
         acc.totalVolume += vol;
         acc.totalInputVat += (item.record.vatAmount || 0);
         if (item.riskLevel !== 'ok') acc.riskCount++;
         if (item.category === 'eu') acc.euVolume += vol;
         return acc;
     }, { totalVolume: 0, totalInputVat: 0, riskCount: 0, euVolume: 0 });
  }, [purchaseData]);

  // --- UI HELPERS ---
  const toggleSection = (key: string) => {
    const next = new Set(expandedSections);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedSections(next);
  };
  const expandAll = () => setExpandedSections(new Set(groups.keys));
  const collapseAll = () => setExpandedSections(new Set());
  const toggleColumn = (id: string) => setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  const setAllColumns = (visible: boolean) => setColumns(prev => prev.map(c => ({ ...c, visible })));
  const visibleColumns = columns.filter(c => c.visible).sort((a,b) => a.order - b.order);

  const renderCell = (r: ExactRecord, colId: string) => {
      const val = r[colId as keyof ExactRecord];
      if (colId === 'entryDate' && val instanceof Date) return val.toLocaleDateString('nl-NL');
      if (colId === 'vatBase' || colId === 'vatAmount') return formatCurrency(Number(val || 0), settings.currencyMode);
      return val as string || '-';
  };

  if (files.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-dashed border-slate-300 animate-in fade-in">
           <div className="p-6 rounded-full mb-6" style={{ backgroundColor: `${theme.primary}10` }}>
             <FileSearch className="w-12 h-12" style={{ color: theme.primary }} />
           </div>
           <h3 className="text-xl font-bold text-slate-800">Inkoopanalyse & Risico's</h3>
           <p className="text-slate-500 max-w-md text-center mt-2 mb-6 text-sm">
             Upload hier uw specifieke inkoop- of kostenrapportages.
             Deze module werkt onafhankelijk van de financiële administratie en focust op kostendetails en risico's.
           </p>

           <div className="max-w-2xl w-full mb-8">
             <div className="border rounded-lg p-4 text-sm space-y-2" style={{ backgroundColor: `${theme.primary}05`, borderColor: `${theme.primary}20`, color: theme.text }}>
                <h4 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4"/> Aparte Module</h4>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                   <li>Data in deze tab blijft gescheiden van het BTW-overzicht.</li>
                   <li>Geoptimaliseerd voor inkoopboeken en kostenplaatsen.</li>
                </ul>
             </div>
           </div>

           <label 
             className="cursor-pointer px-6 py-3 text-white rounded-lg font-bold hover:opacity-90 transition-colors shadow-lg"
             style={{ backgroundColor: theme.primary }}
           >
             Selecteer Inkoopbestand
             <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onUpload(e.target.files)} />
          </label>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* File Management */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: theme.primary }} />
                    Bronnen Inkoopanalyse ({files.filter(f => f.active).length})
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

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500"><CreditCard className="w-4 h-4"/><span className="text-xs font-bold uppercase">Grondslag Totaal</span></div>
                <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalVolume, settings.currencyMode)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500"><ArrowRightLeft className="w-4 h-4"/><span className="text-xs font-bold uppercase">Btw Bedrag</span></div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(stats.totalInputVat, settings.currencyMode)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500"><Globe className="w-4 h-4"/><span className="text-xs font-bold uppercase">EU / Buitenland</span></div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(stats.euVolume, settings.currencyMode)}</div>
            </div>
            <div className={`p-4 rounded-lg shadow border ${stats.riskCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                    {stats.riskCount > 0 ? <ShieldAlert className="w-4 h-4 text-orange-500"/> : <ShieldCheck className="w-4 h-4 text-green-500"/>}
                    <span className="text-xs font-bold uppercase">Aandachtspunten</span>
                </div>
                <div className={`text-2xl font-bold ${stats.riskCount > 0 ? 'text-orange-700' : 'text-green-700'}`}>{stats.riskCount}</div>
            </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4 print:hidden">
             <div className="flex flex-col md:flex-row items-center gap-4">
                 <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Zoek op omschrijving, crediteur..." value={filterText} onChange={e => setFilterText(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1" />
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                     <Filter className="w-4 h-4 text-slate-400" />
                     <select value={grouping} onChange={e => setGrouping(e.target.value as GroupingMode)} className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none">
                         <option value="none">Geen (Platte lijst)</option>
                         <option value="relation">Crediteur</option>
                         <option value="journal">Dagboek</option>
                         <option value="period">Periode</option>
                         <option value="vatBox">Aangiftevak</option>
                     </select>
                 </div>
                  <div className="flex bg-slate-100 p-1 rounded">
                     <button 
                       onClick={() => setRiskFilter('all')} 
                       className={`px-3 py-1 text-xs rounded font-medium transition-colors`}
                       style={{ 
                         backgroundColor: riskFilter === 'all' ? 'white' : 'transparent', 
                         color: riskFilter === 'all' ? theme.text : '#64748b',
                         boxShadow: riskFilter === 'all' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                       }}
                     >
                       Alles
                     </button>
                     <button 
                       onClick={() => setRiskFilter('warning')} 
                       className={`px-3 py-1 text-xs rounded font-medium flex gap-1 transition-colors`}
                       style={{ 
                         backgroundColor: riskFilter !== 'all' ? 'white' : 'transparent',
                         color: riskFilter !== 'all' ? '#c2410c' : '#64748b',
                         boxShadow: riskFilter !== 'all' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                       }}
                     >
                       <AlertTriangle className="w-3 h-3"/> Risico
                     </button>
                 </div>
                 <button 
                   onClick={() => setShowConfig(!showConfig)} 
                   className={`p-2 rounded border transition-colors`}
                   style={{ 
                     backgroundColor: showConfig ? `${theme.primary}10` : 'white', 
                     borderColor: showConfig ? `${theme.primary}30` : '#e2e8f0',
                     color: showConfig ? theme.primary : '#475569'
                   }}
                 >
                   <SlidersHorizontal className="w-4 h-4" />
                 </button>
             </div>
             {showConfig && (
                 <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                     {columns.map(col => (
                         <label key={col.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded">
                             <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors`} style={{ backgroundColor: col.visible ? theme.primary : 'white', borderColor: col.visible ? theme.primary : '#cbd5e1' }}>{col.visible && <CheckSquare className="w-3 h-3 text-white"/>}</div>
                             <input type="checkbox" className="hidden" checked={col.visible} onChange={() => toggleColumn(col.id)} />
                             <span className="text-sm text-slate-700">{col.label}</span>
                         </label>
                     ))}
                 </div>
             )}
        </div>

        {/* Paper Report */}
        <div className="bg-white shadow-2xl min-h-[800px] flex flex-col print:shadow-none print:w-full">
            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900">Inkoop & Risico Analyse</h1>
                    <p className="text-slate-500 text-sm">Geavanceerde detectie van BTW-risico's • {filteredData.length} transacties</p>
                </div>
                <div className="text-right">
                    <div className="font-bold text-slate-900">{settings.appName}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString('nl-NL')}</div>
                </div>
            </div>

            <div className="p-8 flex-1 overflow-x-auto">
                 <div className="border-b-2 border-slate-800 pb-2 mb-4 grid gap-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                    style={{ gridTemplateColumns: `40px repeat(${visibleColumns.length}, minmax(0, 1fr)) 1fr` }}>
                     <div>Status</div>
                     {visibleColumns.map(col => <div key={col.id} className={['accounting'].includes(col.type) ? 'text-right' : 'text-left'}>{col.label}</div>)}
                     <div>Analyse</div>
                 </div>

                 {grouping !== 'none' && (
                   <div className="flex justify-end gap-2 text-xs text-slate-500 mb-2 print:hidden">
                     <button onClick={expandAll} className="hover:text-blue-600 flex items-center gap-1"><Expand className="w-3 h-3" /> Uitklappen</button>
                     <button onClick={collapseAll} className="hover:text-blue-600 flex items-center gap-1"><Minimize2 className="w-3 h-3" /> Inklappen</button>
                   </div>
                 )}

                 {groups.keys.map(key => {
                     const isExpanded = expandedSections.has(key) || grouping === 'none';
                     const items = groups.data[key];
                     return (
                         <div key={key}>
                             {grouping !== 'none' && (
                                 <button onClick={() => toggleSection(key)} className="w-full flex items-center justify-between py-2 border-b border-slate-200 bg-slate-50/50 px-2 font-bold text-sm text-slate-800 hover:bg-slate-100">
                                     <div className="flex items-center gap-2">{isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>} {key}</div>
                                     <div className="text-xs font-mono text-slate-400">{items.length}</div>
                                 </button>
                             )}
                             {isExpanded && items.map((item, idx) => (
                                 <div key={idx} className="grid gap-4 py-2 px-2 hover:bg-slate-50 border-b border-dashed border-slate-100 items-center text-sm"
                                      style={{ gridTemplateColumns: `40px repeat(${visibleColumns.length}, minmax(0, 1fr)) 1fr` }}>
                                     <div className="flex justify-center">
                                         {item.riskLevel === 'ok' && <CheckCircle2 className="w-4 h-4 text-slate-200" />}
                                         {item.riskLevel === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                                         {item.riskLevel === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                     </div>
                                     {visibleColumns.map(col => (
                                         <div key={col.id} className={`truncate ${['accounting'].includes(col.type) ? 'text-right font-mono' : ''}`}>
                                             {renderCell(item.record, col.id)}
                                         </div>
                                     ))}
                                     <div className="text-xs">
                                         {item.riskMessage ? (
                                             <span className={`px-2 py-1 rounded font-medium ${item.riskLevel === 'warning' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                                                 {item.riskMessage}
                                             </span>
                                         ) : <span className="text-slate-300">-</span>}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     );
                 })}
            </div>
        </div>
    </div>
  );
};

export default PurchaseAnalysisView;
