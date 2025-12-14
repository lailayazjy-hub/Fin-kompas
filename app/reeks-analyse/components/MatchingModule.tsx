
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  Upload, Play, AlertCircle, CheckCircle, Search, 
  Copy, Layers, Download, RefreshCw, BrainCircuit, Share2, FileText, ArrowRightLeft,
  X, Filter, Plus, Trash2, Wand2, FileSpreadsheet
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { 
  TransactionEntry, MatchingResult, ThemeColors, Language, MatchingCategory 
} from '../types';
import { formatCurrency } from '../utils/formatters';
import { analyzeMatchingResults } from '../services/geminiService';
import { parseExcelFile } from '../services/importService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface Props {
  themeColors: ThemeColors;
  language: Language;
  useKNotation: boolean;
  showAI: boolean;
}

const LABELS = {
  nl: {
    title: "Transactievergelijking",
    searchPlaceholder: "Zoek op bedrag, relatie of omschrijving...",
    autoSuggest: "Automatisch voorstellen",
    bankTitle: "Reeks A",
    ledgerTitle: "Reeks B",
    colDate: "Datum",
    colDetails: "Relatie | Omschrijving",
    colAmount: "Bedrag",
    footerSelectedBank: "SELECTIE REEKS A",
    footerSelectedLedger: "SELECTIE REEKS B",
    footerDiff: "VERSCHIL",
    btnMatch: "Afletteren",
    uploadTitle: "Sleep bestanden hierheen",
    uploadSubtitle: "Of klik om te selecteren",
    processing: "Verwerken...",
    noData: "Sleep bestand hierheen",
    matchedSuccess: "Succesvol afgeletterd!",
    reset: "Opnieuw beginnen",
    export: "Export Rapport"
  },
  en: {
    title: "Transaction Reconciliation",
    searchPlaceholder: "Search by amount, relation or description...",
    autoSuggest: "Auto Suggest",
    bankTitle: "Set A",
    ledgerTitle: "Set B",
    colDate: "Date",
    colDetails: "Relation | Description",
    colAmount: "Amount",
    footerSelectedBank: "SELECTION SET A",
    footerSelectedLedger: "SELECTION SET B",
    footerDiff: "DIFFERENCE",
    btnMatch: "Reconcile",
    uploadTitle: "Drag files here",
    uploadSubtitle: "Or click to select",
    processing: "Processing...",
    noData: "Drop file here",
    matchedSuccess: "Successfully reconciled!",
    reset: "Start Over",
    export: "Export Report"
  }
};

export const MatchingModule: React.FC<Props> = ({ themeColors, language, useKNotation, showAI }) => {
  const t = LABELS[language];
  
  // Data State (Internally kept as bank/ledger for code stability, but UI shows Reeks A/B)
  const [bankItems, setBankItems] = useState<TransactionEntry[]>([]);
  const [ledgerItems, setLedgerItems] = useState<TransactionEntry[]>([]);
  const [matchedItems, setMatchedItems] = useState<{bank: TransactionEntry[], ledger: TransactionEntry[]}[]>([]);
  
  // Selection State
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<Set<string>>(new Set());
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOverSide, setDragOverSide] = useState<'A' | 'B' | null>(null);
  
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const processFiles = async (files: File[], side: 'A' | 'B') => {
    setIsProcessing(true);
    try {
        const results = await Promise.all(files.map(f => parseExcelFile(f)));
        const flatResults = results.flat();
        
        if (side === 'A') {
            setBankItems(prev => [...prev, ...flatResults]);
        } else {
            setLedgerItems(prev => [...prev, ...flatResults]);
        }
    } catch (err) {
        console.error(err);
        alert("Fout bij inlezen bestanden.");
    } finally {
        setIsProcessing(false);
        setDragOverSide(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
      if (e.target.files?.length) {
          processFiles(Array.from(e.target.files), side);
      }
      // Reset input
      e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent, side: 'A' | 'B') => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSide(null);
      
      if (e.dataTransfer.files?.length) {
          processFiles(Array.from(e.dataTransfer.files), side);
      }
  };

  const handleDragOver = (e: React.DragEvent, side: 'A' | 'B') => {
      e.preventDefault();
      e.stopPropagation();
      if (dragOverSide !== side) setDragOverSide(side);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSide(null);
  };

  const toggleSelection = (id: string, isBank: boolean) => {
    const targetSet = isBank ? new Set(selectedBankIds) : new Set(selectedLedgerIds);
    const setTarget = isBank ? setSelectedBankIds : setSelectedLedgerIds;
    
    if (targetSet.has(id)) {
      targetSet.delete(id);
    } else {
      targetSet.add(id);
    }
    setTarget(targetSet);
  };

  const handleManualMatch = () => {
    // Move selected items from lists to matched
    const selectedBank = bankItems.filter(i => selectedBankIds.has(i.id));
    const selectedLedger = ledgerItems.filter(i => selectedLedgerIds.has(i.id));

    // Create match record
    const matchRecord = {
        bank: selectedBank,
        ledger: selectedLedger
    };

    // Update lists
    setBankItems(prev => prev.filter(i => !selectedBankIds.has(i.id)));
    setLedgerItems(prev => prev.filter(i => !selectedLedgerIds.has(i.id)));
    setMatchedItems(prev => [...prev, matchRecord]);
    
    setSelectedBankIds(new Set());
    setSelectedLedgerIds(new Set());
  };

  const runAutoMatch = () => {
      setIsProcessing(true);
      setTimeout(() => {
          let newBank = [...bankItems];
          let newLedger = [...ledgerItems];
          const newMatches = [];

          // Simple Auto Match Logic: Exact Amount + Date within 7 days
          const matchedBankIds = new Set<string>();
          const matchedLedgerIds = new Set<string>();

          for (const bItem of newBank) {
              if (matchedBankIds.has(bItem.id)) continue;

              const candidateIdx = newLedger.findIndex(lItem => {
                  if (matchedLedgerIds.has(lItem.id)) return false;
                  // Exact amount match
                  if (Math.abs(lItem.amount - bItem.amount) > 0.01) return false;
                  // Date tolerance (7 days)
                  const daysDiff = Math.abs(differenceInDays(new Date(bItem.date), new Date(lItem.date)));
                  return daysDiff <= 7;
              });

              if (candidateIdx !== -1) {
                  const lItem = newLedger[candidateIdx];
                  matchedBankIds.add(bItem.id);
                  matchedLedgerIds.add(lItem.id);
                  newMatches.push({ bank: [bItem], ledger: [lItem] });
              }
          }

          setBankItems(newBank.filter(i => !matchedBankIds.has(i.id)));
          setLedgerItems(newLedger.filter(i => !matchedLedgerIds.has(i.id)));
          setMatchedItems(prev => [...prev, ...newMatches]);
          setIsProcessing(false);
      }, 800);
  };

  // --- Computed Values ---

  const filteredBank = useMemo(() => {
      return bankItems.filter(i => 
          i.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
          i.amount.toString().includes(searchTerm) ||
          (i.relation && i.relation.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [bankItems, searchTerm]);

  const filteredLedger = useMemo(() => {
      return ledgerItems.filter(i => 
          i.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
          i.amount.toString().includes(searchTerm) ||
          (i.relation && i.relation.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [ledgerItems, searchTerm]);

  const selectedBankTotal = useMemo(() => {
      return bankItems.filter(i => selectedBankIds.has(i.id)).reduce((sum, i) => sum + i.amount, 0);
  }, [bankItems, selectedBankIds]);

  const selectedLedgerTotal = useMemo(() => {
      return ledgerItems.filter(i => selectedLedgerIds.has(i.id)).reduce((sum, i) => sum + i.amount, 0);
  }, [ledgerItems, selectedLedgerIds]);

  const difference = selectedBankTotal - selectedLedgerTotal;
  const isMatchable = (selectedBankIds.size > 0 || selectedLedgerIds.size > 0) && Math.abs(difference) < 0.02;

  // --- Render Helpers ---

  const renderDropZone = (side: 'A' | 'B', hasItems: boolean) => {
      const isDragOver = dragOverSide === side;
      const ref = side === 'A' ? fileInputRefA : fileInputRefB;
      
      if (hasItems) return null;

      return (
        <div 
            className={`
                flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer h-full
                ${isDragOver ? 'border-[#52939D] bg-blue-50 scale-[0.98]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
            `}
            onDrop={(e) => handleDrop(e, side)}
            onDragOver={(e) => handleDragOver(e, side)}
            onDragLeave={handleDragLeave}
            onClick={() => ref.current?.click()}
            style={isDragOver ? { borderColor: themeColors.primary } : {}}
        >
            <input 
                type="file" 
                multiple 
                ref={ref} 
                className="hidden" 
                onChange={(e) => handleFileSelect(e, side)} 
                accept=".xlsx,.xls,.csv"
            />
            <div className={`p-4 rounded-full mb-3 ${isDragOver ? 'bg-white shadow-md' : 'bg-slate-200'}`}>
                <Upload size={32} className={isDragOver ? 'text-[#52939D]' : 'text-slate-400'} style={isDragOver ? { color: themeColors.primary } : {}}/>
            </div>
            <p className="font-bold text-slate-700">{t.uploadTitle}</p>
            <p className="text-xs text-slate-500 mt-1">{t.uploadSubtitle}</p>
        </div>
      );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in">
       {/* Top Bar */}
       <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-3 flex-1 w-full">
               <div className="relative flex-1 max-w-lg">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                   />
               </div>
               <div className="h-6 w-px bg-slate-200 mx-2"></div>
               <button 
                  onClick={runAutoMatch}
                  disabled={isProcessing || (bankItems.length === 0 && ledgerItems.length === 0)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap disabled:opacity-50"
               >
                   <Wand2 size={16} /> {t.autoSuggest}
               </button>
           </div>
           
           <div className="flex gap-2">
                <button onClick={() => { setBankItems([]); setLedgerItems([]); setMatchedItems([]); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title={t.reset}>
                    <RefreshCw size={18} />
                </button>
           </div>
       </div>

       {/* Main Split View */}
       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden min-h-0">
           
           {/* Left Pane: Set A */}
           <div 
                className={`flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative transition-colors ${dragOverSide === 'A' ? 'ring-2 ring-blue-500' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'A')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'A')}
           >
               <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                       <FileSpreadsheet size={16} className="text-slate-400" />
                       {t.bankTitle} 
                       {bankItems.length > 0 && <span className="text-slate-400 font-normal">({filteredBank.length})</span>}
                   </h3>
                   <div className="flex gap-2">
                        {bankItems.length > 0 && (
                             <button onClick={() => fileInputRefA.current?.click()} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-200">
                                <Plus size={12}/> Import
                                <input type="file" multiple ref={fileInputRefA} className="hidden" onChange={(e) => handleFileSelect(e, 'A')} accept=".xlsx,.xls,.csv" />
                             </button>
                        )}
                        {selectedBankIds.size > 0 && (
                            <button onClick={() => setSelectedBankIds(new Set())} className="text-xs text-red-500 hover:text-red-600 font-medium">
                                Wissen ({selectedBankIds.size})
                            </button>
                        )}
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar p-2 h-full">
                   {bankItems.length === 0 ? (
                       renderDropZone('A', false)
                   ) : (
                       <div className="space-y-2">
                           {filteredBank.map(item => (
                               <TransactionCard 
                                   key={item.id} 
                                   item={item} 
                                   selected={selectedBankIds.has(item.id)} 
                                   onToggle={() => toggleSelection(item.id, true)}
                                   themeColors={themeColors}
                               />
                           ))}
                           {filteredBank.length === 0 && <div className="text-center text-slate-400 mt-10">Geen zoekresultaten</div>}
                       </div>
                   )}
               </div>
           </div>

           {/* Right Pane: Set B */}
           <div 
                className={`flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative transition-colors ${dragOverSide === 'B' ? 'ring-2 ring-blue-500' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'B')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'B')}
           >
               <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                       <FileSpreadsheet size={16} className="text-slate-400" />
                       {t.ledgerTitle} 
                       {ledgerItems.length > 0 && <span className="text-slate-400 font-normal">({filteredLedger.length})</span>}
                   </h3>
                   <div className="flex gap-2">
                        {ledgerItems.length > 0 && (
                             <button onClick={() => fileInputRefB.current?.click()} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-200">
                                <Plus size={12}/> Import
                                <input type="file" multiple ref={fileInputRefB} className="hidden" onChange={(e) => handleFileSelect(e, 'B')} accept=".xlsx,.xls,.csv" />
                             </button>
                        )}
                        {selectedLedgerIds.size > 0 && (
                            <button onClick={() => setSelectedLedgerIds(new Set())} className="text-xs text-red-500 hover:text-red-600 font-medium">
                                Wissen ({selectedLedgerIds.size})
                            </button>
                        )}
                   </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-2 h-full">
                   {ledgerItems.length === 0 ? (
                       renderDropZone('B', false)
                   ) : (
                       <div className="space-y-2">
                           {filteredLedger.map(item => (
                               <TransactionCard 
                                   key={item.id} 
                                   item={item} 
                                   selected={selectedLedgerIds.has(item.id)} 
                                   onToggle={() => toggleSelection(item.id, false)}
                                   themeColors={themeColors}
                               />
                           ))}
                           {filteredLedger.length === 0 && <div className="text-center text-slate-400 mt-10">Geen zoekresultaten</div>}
                       </div>
                   )}
               </div>
           </div>
       </div>

       {/* Sticky Footer */}
       <div className="mt-4 bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-4">
           <div className="flex gap-8 text-sm">
               <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.footerSelectedBank}</div>
                   <div className="text-lg font-bold text-slate-700">{formatCurrency(selectedBankTotal, false)}</div>
               </div>
               <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.footerSelectedLedger}</div>
                   <div className="text-lg font-bold text-slate-700">{formatCurrency(selectedLedgerTotal, false)}</div>
               </div>
               <div className="w-px bg-slate-200 h-10 hidden md:block"></div>
               <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.footerDiff}</div>
                   <div className={`text-lg font-bold ${Math.abs(difference) < 0.02 ? 'text-green-600' : 'text-red-500'}`}>
                       {formatCurrency(difference, false)}
                   </div>
               </div>
           </div>

           <button
               onClick={handleManualMatch}
               disabled={!isMatchable}
               className={`
                   px-8 py-3 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2
                   ${isMatchable 
                       ? 'bg-[#52939D] text-white hover:brightness-110 transform hover:scale-105' 
                       : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
               `}
               style={isMatchable ? { backgroundColor: themeColors.primary } : {}}
           >
               <CheckCircle size={20} />
               {t.btnMatch}
           </button>
       </div>
    </div>
  );
};

// --- Subcomponent: Transaction Card ---

interface TransactionCardProps {
    item: TransactionEntry;
    selected: boolean;
    onToggle: () => void;
    themeColors: ThemeColors;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ item, selected, onToggle, themeColors }) => {
    return (
        <div 
            onClick={onToggle}
            className={`
                relative p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                ${selected 
                    ? 'bg-slate-50 border-[#52939D] shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}
            `}
            style={selected ? { borderColor: themeColors.primary } : {}}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox Visual */}
                <div className={`
                    mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${selected ? 'bg-[#52939D] border-[#52939D]' : 'bg-white border-slate-300 group-hover:border-slate-400'}
                `}
                style={selected ? { backgroundColor: themeColors.primary, borderColor: themeColors.primary } : {}}
                >
                    {selected && <CheckCircle size={12} className="text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-slate-400">
                            {format(new Date(item.date), 'dd-MM-yyyy')} 
                            {item.reference ? ` • ${item.reference}` : ''}
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-700">
                            {formatCurrency(item.amount, false)}
                        </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800 truncate pr-2 mt-0.5" title={item.description}>
                        {item.description}
                    </div>
                    {(item.relation || item.grootboek) && (
                        <div className="flex gap-2 mt-1.5">
                            {item.relation && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{item.relation}</span>}
                            {item.grootboek && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{item.grootboek}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
