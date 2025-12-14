
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ExactRecord, AppSettings, ThemeColors, FileData, ColumnType } from '../types';
import { formatCurrency } from '../utils';
import { 
  ShoppingCart, BarChart3, 
  TrendingUp, Filter, UploadCloud, FileText, Trash2,
  AlertTriangle, CheckCircle2, XCircle, SlidersHorizontal,
  GripVertical, CheckSquare, Layers,
  Calculator, Globe, ArrowUp, ArrowDown, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface SalesViewProps {
  records: ExactRecord[];
  files: FileData[];
  onUpload: (files: FileList | null) => void;
  onToggleFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  settings: AppSettings;
  theme: ThemeColors;
}

interface SalesColumnDef {
  id: string;
  label: string;
  type: ColumnType | 'percentage';
  visible: boolean;
  order: number;
  accessor: (r: ExactRecord) => any;
}

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

const SalesView: React.FC<SalesViewProps> = ({ records, files, onUpload, onToggleFile, onDeleteFile, settings, theme }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showHiddenRows, setShowHiddenRows] = useState(false);
  
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterJournal, setFilterJournal] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Local state for manual country overrides: RecordID -> CountryCode
  const [manualCountries, setManualCountries] = useState<Record<string, string>>({});

  // Helper to determine effective country
  const getEffectiveCountry = (r: ExactRecord) => {
    // 1. Check manual override
    if (manualCountries[r.id] !== undefined) return manualCountries[r.id];
    
    // 2. Check file data
    if (r.country && r.country.trim() !== '') return r.country;
    
    // 3. Infer from name (Heuristic)
    const name = (r.relation || '').toLowerCase();
    if (name.includes('gmbh')) return 'DE';
    if (name.includes('ltd') || name.includes('limited')) return 'UK';
    if (name.includes('sarl')) return 'FR';
    if (name.includes('bvba') || name.includes('sprl')) return 'BE';
    if (name.includes('inc') || name.includes('corp')) return 'US';
    
    // 4. Default to empty if unknown (Was 'NL')
    return '';
  };

  const handleCountryChange = (id: string, value: string) => {
    setManualCountries(prev => ({
        ...prev,
        [id]: value.toUpperCase()
    }));
  };

  // --- Dynamic Columns State ---
  const [columns, setColumns] = useState<SalesColumnDef[]>([
    { id: 'relationCode', label: 'Klant: Code', type: 'text', visible: true, order: 0, accessor: r => r.relationCode },
    { id: 'relation', label: 'Klant: Naam', type: 'text', visible: true, order: 1, accessor: r => r.relation },
    { id: 'description', label: 'Details', type: 'text', visible: false, order: 2, accessor: r => r.itemDescription || r.description },
    { id: 'grossAmount', label: 'Verkoopwaarde', type: 'accounting', visible: false, order: 3, accessor: r => {
        let net = (r.credit || 0) - (r.debit || 0);
        let gross = r.grossAmount || 0;
        if (gross === 0 && (net !== 0 || r.discountAmount)) gross = net + (r.discountAmount || 0);
        return gross;
    }},
    { id: 'discountAmount', label: 'Kortingsbedrag', type: 'accounting', visible: false, order: 4, accessor: r => r.discountAmount },
    { id: 'discountPercentage', label: 'Korting (%)', type: 'percentage', visible: false, order: 5, accessor: r => {
         // Auto-calc if missing
         if (r.discountPercentage) return r.discountPercentage;
         const net = (r.credit || 0) - (r.debit || 0);
         let gross = r.grossAmount || 0;
         if (gross === 0 && (net !== 0 || r.discountAmount)) gross = net + (r.discountAmount || 0);
         return (r.discountAmount && gross) ? (r.discountAmount / gross) * 100 : 0;
    }},
    { id: 'netAmount', label: 'Verkoopbedrag', type: 'accounting', visible: true, order: 6, accessor: r => (r.credit || 0) - (r.debit || 0) },
    { id: 'country', label: 'Land', type: 'text', visible: true, order: 7, accessor: r => getEffectiveCountry(r) }, // Use accessor for sorting
    { id: 'itemGroup', label: 'Artikelgroep', type: 'text', visible: true, order: 8, accessor: r => r.itemGroup },
    { id: 'itemCode', label: 'Artikel', type: 'text', visible: true, order: 9, accessor: r => r.itemCode },
    { id: 'salesPerson', label: 'Verkoper', type: 'text', visible: true, order: 10, accessor: r => r.salesPerson },
  ]);

  // Handle Drag & Drop for columns
  const [draggedColId, setDraggedColId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
  };

  const handleDragOver = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetColId) return;

    const sourceIndex = columns.findIndex(c => c.id === draggedColId);
    const targetIndex = columns.findIndex(c => c.id === targetColId);

    const newCols = [...columns];
    const [removed] = newCols.splice(sourceIndex, 1);
    newCols.splice(targetIndex, 0, removed);
    
    // Update order props
    newCols.forEach((c, idx) => c.order = idx);
    setColumns(newCols);
  };

  const toggleColumn = (id: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };
  
  const setAllColumns = (visible: boolean) => {
    setColumns(prev => prev.map(c => ({ ...c, visible })));
  };

  const changeColumnType = (id: string, newType: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, type: newType as any } : c));
  };

  const handleSort = (columnId: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === columnId && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key: columnId, direction });
  };

  // --- Data Logic ---

  const companies = useMemo(() => Array.from(new Set(records.map(r => r.company || 'Onbekend'))).sort(), [records]);
  const periods = useMemo(() => Array.from(new Set(records.map(r => `${r.year}-${r.period}`))).sort(), [records]);
  const journals = useMemo(() => Array.from(new Set(records.map(r => r.journal || 'Geen'))).sort(), [records]);

  const salesRecords = useMemo(() => {
    const filtered = records.filter(r => {
      // Toggle logic for hidden rows
      if (r.isTotalLine && !showHiddenRows) return false;
      
      if (filterCompany !== 'all' && (r.company || 'Onbekend') !== filterCompany) return false;
      if (filterPeriod !== 'all' && `${r.year}-${r.period}` !== filterPeriod) return false;
      if (filterJournal !== 'all' && (r.journal || 'Geen') !== filterJournal) return false;
      return true;
    });

    if (sortConfig) {
        const colDef = columns.find(c => c.id === sortConfig.key);
        if (colDef) {
            filtered.sort((a, b) => {
                const aVal = colDef.accessor(a);
                const bVal = colDef.accessor(b);

                if (aVal === bVal) return 0;
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aVal.localeCompare(bVal) 
                        : bVal.localeCompare(aVal);
                }
                
                return sortConfig.direction === 'asc' 
                    ? (aVal < bVal ? -1 : 1) 
                    : (aVal > bVal ? -1 : 1);
            });
        }
    }

    return filtered;
  }, [records, filterCompany, filterPeriod, filterJournal, sortConfig, columns, manualCountries, showHiddenRows]);

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  // --- TOTAL VALIDATION LOGIC ---
  const validationStats = useMemo(() => {
     // 1. Calculate Sum of Rows (Only non-total rows)
     // Use the raw filtered logic but exclude total lines explicitly for calculation
     const calcRows = salesRecords.filter(r => !r.isTotalLine);
     const calculatedNet = calcRows.reduce((s, r) => s + ((r.credit || 0) - (r.debit || 0)), 0);
     
     // 2. Find Imported Total Line
     const importedTotalRecord = records.find(r => r.isTotalLine && (Math.abs(r.grossAmount || 0) > 0 || Math.abs(r.credit || 0) > 0 || Math.abs(r.debit || 0) > 0));
     
     let importedNet = 0;
     let hasImportedTotal = false;

     if (importedTotalRecord) {
         importedNet = (importedTotalRecord.credit || 0) - (importedTotalRecord.debit || 0);
         if (importedNet === 0 && (importedTotalRecord.grossAmount || 0) !== 0) {
             importedNet = importedTotalRecord.grossAmount || 0;
         }
         hasImportedTotal = true;
     }

     const diff = Math.abs(calculatedNet - importedNet);
     const isMatch = hasImportedTotal ? diff < 0.05 : null; 

     return { calculatedNet, importedNet, hasImportedTotal, isMatch, diff };
  }, [salesRecords, records]);


  // --- Render Cell with Validation & Editing ---
  const renderCell = (record: ExactRecord, col: SalesColumnDef) => {
    // Special Handling for Country Edit
    if (col.id === 'country') {
        const countryVal = getEffectiveCountry(record);
        return (
            <div className="relative w-full">
                <input 
                  type="text" 
                  value={countryVal}
                  placeholder="-"
                  onChange={(e) => handleCountryChange(record.id, e.target.value)}
                  className="w-12 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none text-center font-bold text-slate-700 p-0 placeholder-slate-200 focus:border-opacity-50"
                  maxLength={3}
                />
            </div>
        );
    }

    const rawVal = col.accessor(record);
    let displayVal: React.ReactNode = rawVal;
    let isValid = true;
    let errorMsg = '';

    // Type Validation & Formatting
    if (col.type === 'accounting' || col.type === 'number' || col.type === 'percentage') {
       const num = Number(rawVal);
       if (isNaN(num)) {
          isValid = false;
          errorMsg = 'Ongeldig getal';
          displayVal = String(rawVal);
       } else {
          if (col.type === 'accounting') displayVal = formatCurrency(num, settings.currencyMode);
          else if (col.type === 'percentage') displayVal = num === 0 ? '-' : `${num.toFixed(1)}%`;
          else displayVal = num; 
       }
    } else if (col.type === 'date') {
        if (rawVal instanceof Date) {
            displayVal = rawVal.toLocaleDateString('nl-NL');
        } else if (rawVal) {
             isValid = false;
             errorMsg = 'Ongeldige datum';
             displayVal = String(rawVal);
        }
    }

    const validationKeyMap: Record<string, string> = {
        'grossAmount': 'grossAmount',
        'discountAmount': 'discountAmount',
        'entryDate': 'entryDate'
    };
    
    if (validationKeyMap[col.id] && record.validationErrors?.[validationKeyMap[col.id]]) {
        isValid = false;
        errorMsg = record.validationErrors[validationKeyMap[col.id]];
    }

    return (
        <div className={`relative w-full h-full flex items-center ${['accounting','number','percentage'].includes(col.type) ? 'justify-end' : 'justify-start'} ${!isValid ? 'text-red-600 bg-red-50 ring-1 ring-red-300 rounded px-1' : ''}`}>
            <span className="truncate">{displayVal || '-'}</span>
            {!isValid && (
                <div className="group absolute right-0 top-0">
                    <AlertTriangle className="w-3 h-3 text-red-500 cursor-help" />
                    <div className="hidden group-hover:block absolute bottom-full right-0 bg-slate-800 text-white text-xs p-2 rounded shadow-lg z-20 whitespace-nowrap">
                        {errorMsg || 'Ongeldig formaat'}
                    </div>
                </div>
            )}
        </div>
    );
  };

  // --- Charts Data ---
  const revenueOverTime = useMemo(() => {
      const timeMap: Record<string, number> = {};
      salesRecords.forEach(r => {
          if (r.isTotalLine) return; // Exclude totals from chart
          const key = `${r.year}-${r.period}`;
          const net = (r.credit || 0) - (r.debit || 0);
          timeMap[key] = (timeMap[key] || 0) + net;
      });
      return Object.entries(timeMap).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  }, [salesRecords]);

  // Revenue Per Country
  const revenuePerCountry = useMemo(() => {
      const map: Record<string, number> = {};
      salesRecords.forEach(r => {
          if (r.isTotalLine) return; // Exclude totals from chart
          const country = getEffectiveCountry(r);
          // Only count relevant countries (skip empty if you want, or count as 'Onbekend')
          const key = country || 'Onbekend';
          const net = (r.credit || 0) - (r.debit || 0);
          map[key] = (map[key] || 0) + net;
      });
      return Object.entries(map)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value); // Descending order
  }, [salesRecords, manualCountries]);

  // Only count non-total lines for KPIs
  const activeRecords = salesRecords.filter(r => !r.isTotalLine);
  const totalGross = activeRecords.reduce((s, r) => s + (r.grossAmount || 0), 0);
  const totalDiscount = activeRecords.reduce((s, r) => s + (r.discountAmount || 0), 0);
  const totalNet = activeRecords.reduce((s, r) => s + ((r.credit || 0) - (r.debit || 0)), 0);

  // --- Views ---

  if (files.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-auto min-h-[500px] bg-white rounded-lg shadow-sm border border-dashed border-slate-300 animate-in fade-in p-8">
          <div className="p-6 rounded-full mb-6" style={{ backgroundColor: `${theme.primary}10` }}>
            <UploadCloud className="w-12 h-12" style={{ color: theme.primary }} />
          </div>
          <h3 className="text-xl font-bold text-slate-700">Verkoopanalyse Rapportage</h3>
          <p className="text-slate-500 max-w-md text-center mt-2 mb-6 text-sm">
            Upload hier uw specifieke verkooprapportages. 
            Deze module werkt onafhankelijk van uw financiële administratie en analyseert trends, klanten en producten.
          </p>
          
          <div className="max-w-2xl w-full mb-8">
             <div className="border rounded-lg p-4 text-sm space-y-2" style={{ backgroundColor: `${theme.primary}05`, borderColor: `${theme.primary}20`, color: theme.text }}>
                <h4 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4"/> Aparte Module</h4>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                   <li>Data in deze tab blijft gescheiden van het BTW-overzicht.</li>
                   <li>Geoptimaliseerd voor verkooplijsten (Klant, Omzet, Artikel).</li>
                   <li>Ondersteunde kolommen: Klant, Verkoopwaarde, Korting, Land, Artikel, etc.</li>
                </ul>
             </div>
          </div>

          <label 
            className="cursor-pointer px-6 py-3 text-white rounded-lg font-bold hover:opacity-90 transition-colors shadow-lg"
            style={{ backgroundColor: theme.primary }}
          >
           Selecteer Verkoopbestand
           <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onUpload(e.target.files)} />
        </label>
        </div>
      );
  }

  // --- Calculate Column Totals for Footer ---
  const columnTotals = visibleColumns.reduce((acc, col) => {
      if (['accounting', 'number'].includes(col.type) && col.id !== 'discountPercentage') {
          acc[col.id] = activeRecords.reduce((sum, r) => sum + Number(col.accessor(r) || 0), 0);
      }
      return acc;
  }, {} as Record<string, number>);

  // Weighted average for discount percentage
  if (visibleColumns.find(c => c.id === 'discountPercentage')) {
      const gross = columnTotals['grossAmount'] || totalGross; // Fallback
      const disc = columnTotals['discountAmount'] || totalDiscount;
      columnTotals['discountPercentage'] = gross > 0 ? (disc / gross) * 100 : 0;
  }


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* File Management Header */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: theme.primary }} />
                    Bronnen Verkoopanalyse ({files.filter(f => f.active).length})
                </h3>
                <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setShowConfig(!showConfig)}
                       className={`flex items-center gap-2 px-3 py-1 rounded border text-xs font-bold transition-colors`}
                       style={{ 
                         backgroundColor: showConfig ? `${theme.primary}10` : 'white',
                         borderColor: showConfig ? `${theme.primary}30` : '#e2e8f0',
                         color: showConfig ? theme.primary : '#475569'
                       }}
                     >
                       <SlidersHorizontal className="w-3 h-3" />
                       Kolommen & Validatie
                     </button>
                    <label className="text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors border border-transparent hover:bg-slate-50" style={{ color: theme.primary }}>
                        + Bestand Toevoegen
                        <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onUpload(e.target.files)} />
                    </label>
                </div>
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

            {/* Column Configuration Panel */}
            {showConfig && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Kolom Instellingen & Data Types</h4>
                    <p className="text-xs text-slate-400">Sleep om te sorteren. Selecteer type voor validatie.</p>
                  </div>
                  <div className="flex gap-2 text-xs items-center">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded mr-4">
                        <input 
                          type="checkbox" 
                          checked={showHiddenRows} 
                          onChange={(e) => setShowHiddenRows(e.target.checked)}
                          className="rounded"
                          style={{ accentColor: theme.primary }}
                        />
                        <span className="text-slate-700 font-bold">Toon verborgen regels (Totalen)</span>
                    </div>
                    <button onClick={() => setAllColumns(true)} className="hover:underline" style={{ color: theme.primary }}>Alles</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => setAllColumns(false)} className="text-slate-500 hover:underline">Geen</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {columns.map((col, idx) => (
                    <div 
                      key={col.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, col.id)}
                      onDragOver={(e) => handleDragOver(e, col.id)}
                      className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded hover:border-blue-300 transition-colors cursor-move"
                    >
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      <input 
                        type="checkbox" 
                        checked={col.visible} 
                        onChange={() => toggleColumn(col.id)} 
                        className="rounded"
                        style={{ accentColor: theme.primary }}
                      />
                      <span className="text-xs font-bold text-slate-700 flex-1">{col.label}</span>
                      
                      <select 
                        value={col.type} 
                        onChange={(e) => changeColumnType(col.id, e.target.value)}
                        className="text-xs border-none bg-transparent text-slate-500 focus:ring-0 text-right cursor-pointer hover:text-blue-600"
                      >
                        <option value="text">Tekst</option>
                        <option value="number">Getal</option>
                        <option value="accounting">Bedrag</option>
                        <option value="percentage">Percentage</option>
                        <option value="date">Datum</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* KPI Row & Validation Block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <BarChart3 className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase">Bruto Omzet</h3>
                </div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(totalGross, settings.currencyMode)}</div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-xs font-bold uppercase">Kortingen</h3>
                </div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(totalDiscount, settings.currencyMode)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <TrendingUp className="w-4 h-4" style={{ color: theme.primary }} />
                    <h3 className="text-xs font-bold uppercase">Netto Omzet</h3>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalNet, settings.currencyMode)}</div>
            </div>
            
            {/* Automatic Total Validation Card */}
            <div className={`p-4 rounded-lg shadow border ${validationStats.hasImportedTotal ? (validationStats.isMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <Calculator className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase">Totalen Controle</h3>
                </div>
                
                {validationStats.hasImportedTotal ? (
                    <div>
                        <div className="flex items-center gap-2">
                             <div className={`text-xl font-bold ${validationStats.isMatch ? 'text-green-700' : 'text-red-700'}`}>
                                 {validationStats.isMatch ? 'Correct' : 'Verschil'}
                             </div>
                             {validationStats.isMatch 
                                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                : <XCircle className="w-5 h-5 text-red-500" />
                             }
                        </div>
                        {!validationStats.isMatch && (
                            <div className="text-xs text-red-600 mt-1">
                                Bestand: {formatCurrency(validationStats.importedNet, settings.currencyMode)} <br/>
                                Berekend: {formatCurrency(validationStats.calculatedNet, settings.currencyMode)}
                            </div>
                        )}
                        {validationStats.isMatch && (
                             <div className="text-xs text-green-600 mt-1">
                                Geüpload totaal komt overeen met de som van de regels.
                             </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="text-lg font-bold text-slate-400">Geen totaalregel</div>
                        <div className="text-xs text-slate-400 mt-1">Geen 'Totaal' rij gevonden in import.</div>
                    </div>
                )}
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200 space-y-4 print:hidden">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-600">Filters:</span>
                </div>
                
                <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} className="border-slate-300 rounded text-slate-700 focus:ring-opacity-50">
                    <option value="all">Alle Bedrijven</option>
                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="border-slate-300 rounded text-slate-700 focus:ring-opacity-50">
                    <option value="all">Alle Periodes</option>
                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select value={filterJournal} onChange={(e) => setFilterJournal(e.target.value)} className="border-slate-300 rounded text-slate-700 focus:ring-opacity-50">
                    <option value="all">Alle Dagboeken</option>
                    {journals.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
            </div>
        </div>

        {/* Charts Section (Side-by-Side) */}
        {activeRecords.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
                {/* Chart 1: Revenue Over Time */}
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" style={{ color: theme.primary }} />
                        Omzetverloop (Tijd)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueOverTime}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                                <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={(val) => `€${val/1000}k`} />
                                <Tooltip formatter={(val: number) => formatCurrency(val, settings.currencyMode)} />
                                <Bar dataKey="value" fill={theme.primary} radius={[4,4,0,0]} name="Omzet" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Revenue Per Country */}
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-green-600" />
                        Omzet per Land
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenuePerCountry} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" fontSize={10} stroke="#94a3b8" tickFormatter={(val) => `€${val/1000}k`} />
                                <YAxis type="category" dataKey="name" fontSize={10} stroke="#475569" width={40} />
                                <Tooltip formatter={(val: number) => formatCurrency(val, settings.currencyMode)} />
                                <Bar dataKey="value" fill={theme.primary} radius={[0,4,4,0]} barSize={20} name="Omzet">
                                    {revenuePerCountry.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? theme.primary : theme.primary + 'CC'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* Dynamic Table (Flat, Non-Collapsible, Sortable) */}
        <div className="bg-white shadow-2xl print:shadow-none min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight mb-1">Verkoopanalyse</h1>
                    <p className="text-slate-500 text-sm">
                        Financiële visualisatie module • {filterCompany === 'all' ? 'Geconsolideerd' : filterCompany}
                    </p>
                </div>
                <div className="text-right">
                    <div className="font-bold text-slate-900">{settings.appName}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString('nl-NL')}</div>
                </div>
            </div>

            <div className="p-8 flex-1 overflow-x-auto">
                 {/* Table Header */}
                 <div className="border-b-2 border-slate-800 pb-2 mb-4 grid gap-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                    style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}>
                     {visibleColumns.map(col => (
                         <button 
                             key={col.id} 
                             onClick={() => handleSort(col.id)}
                             className={`flex items-center gap-1 transition-colors ${['accounting','number','percentage'].includes(col.type) ? 'justify-end' : 'justify-start'}`}
                         >
                             <span className="hover:text-opacity-80 transition-opacity" style={{ color: sortConfig?.key === col.id ? theme.primary : undefined }}>{col.label}</span>
                             {sortConfig?.key === col.id && (
                                 sortConfig.direction === 'asc' 
                                 ? <ArrowUp className="w-3 h-3" style={{ color: theme.primary }} /> 
                                 : <ArrowDown className="w-3 h-3" style={{ color: theme.primary }} />
                             )}
                         </button>
                     ))}
                 </div>
                 
                 {/* Table Body (Flat List) */}
                 <div className="space-y-1">
                     {salesRecords.map((r, idx) => (
                         <div key={r.id + idx} className={`grid gap-4 py-1 px-2 border-b border-slate-50 hover:bg-slate-50 items-center text-xs ${r.isTotalLine ? 'bg-slate-100 font-bold italic' : ''}`}
                              style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}>
                             {visibleColumns.map(col => (
                                 <div key={col.id} className="truncate">
                                     {renderCell(r, col)}
                                 </div>
                             ))}
                         </div>
                     ))}
                 </div>
            </div>

            {/* Smart Footer with Column Totals & Validation */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-8 shadow-inner mt-auto">
                 <div className="grid gap-4 text-xs font-bold font-mono text-slate-700"
                      style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(0, 1fr))` }}>
                     {visibleColumns.map((col, idx) => {
                         // Only show totals for numeric columns
                         if (['accounting', 'number', 'percentage'].includes(col.type)) {
                             const total = columnTotals[col.id] || 0;
                             
                             // Special coloring logic for Net Amount validation
                             const isNetCol = col.id === 'netAmount';
                             const isValid = isNetCol ? validationStats.isMatch !== false : true; 

                             return (
                                 <div key={col.id} className={`text-right border-t-2 pt-2 ${isNetCol ? (isValid ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700') : 'border-slate-300'}`}>
                                     {col.type === 'percentage' 
                                        ? (total === 0 ? '-' : `${total.toFixed(1)}%`)
                                        : formatCurrency(total, settings.currencyMode)}
                                 </div>
                             );
                         } else if (idx === 0) {
                             return <div key={col.id} className="pt-2 uppercase text-slate-400">Totaal Generaal</div>;
                         }
                         return <div key={col.id}></div>;
                     })}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default SalesView;
