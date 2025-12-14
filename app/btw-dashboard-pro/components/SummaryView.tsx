
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { ExactRecord, AppSettings, ThemeColors } from '../types';
import { formatCurrency } from '../utils';
import { ChevronDown, ChevronRight, Search, TrendingUp, TrendingDown, Building2, Filter, Calculator, PiggyBank, Info, Globe, Percent, User, Package, ArrowDownRight, ArrowUpRight, Scale, AlertOctagon } from 'lucide-react';

interface BreakdownItem {
  [label: string]: number;
}

interface PeriodData {
  turnover: number;
  outputVat: number;
  inputVat: number;
  payable: number;
  count: number;
  
  // New specific breakdowns (Base Amounts / Volume)
  turnoverHigh: number;   // 1a
  turnoverLow: number;    // 1b
  turnoverPrivate: number;// 1d
  exportVolume: number;   // 3a + 3b
  importVolume: number;   // 4a + 4b

  // Detail Breakdowns for tooltip
  turnoverDetails: BreakdownItem;
  outputVatDetails: BreakdownItem;
  inputVatDetails: BreakdownItem;
}

interface CompanyData extends PeriodData {
  byPeriod: Record<string, PeriodData>;
}

interface SummaryViewProps {
  exactRecords: ExactRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const SummaryView: React.FC<SummaryViewProps> = ({ exactRecords, settings, theme }) => {
  const [filterText, setFilterText] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  
  // Tooltip State
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    items: { label: string; value: number }[];
  } | null>(null);

  // Toggle company expansion
  const toggleCompany = (company: string) => {
    const next = new Set(expandedCompanies);
    if (next.has(company)) next.delete(company);
    else next.add(company);
    setExpandedCompanies(next);
  };

  // --- Filter Logic ---
  const filteredRecords = useMemo(() => {
    return exactRecords.filter(r => {
      // 1. Text Filter (Dynamic Search)
      if (filterText) {
        const lowerFilter = filterText.toLowerCase();
        const matches = 
          (r.description || '').toLowerCase().includes(lowerFilter) ||
          (r.code || '').toLowerCase().includes(lowerFilter) ||
          (r.ref || '').toLowerCase().includes(lowerFilter) ||
          (r.journal || '').toLowerCase().includes(lowerFilter);
        
        if (!matches) return false;
      }

      // 2. Hide Small Amounts
      // We check if the line has significant financial impact
      if (settings.hideSmallAmounts) {
         const val = Math.abs((r.vatBase || 0) + (r.vatAmount || 0) + (r.debit || 0) + (r.credit || 0));
         if (val < settings.smallAmountThreshold && val > 0) return false;
      }

      // 3. Ignore total lines for aggregation to avoid double counting
      if (r.isTotalLine) return false;

      return true;
    });
  }, [exactRecords, filterText, settings]);

  // --- Aggregation Logic (Financial) ---
  const aggregatedData = useMemo((): Record<string, CompanyData> => {
    const byCompany: Record<string, CompanyData> = {};

    const createEmptyData = (): PeriodData => ({
        turnover: 0, outputVat: 0, inputVat: 0, payable: 0, count: 0,
        turnoverHigh: 0, turnoverLow: 0, turnoverPrivate: 0, exportVolume: 0, importVolume: 0,
        turnoverDetails: {}, outputVatDetails: {}, inputVatDetails: {}
    });

    const updateDetails = (obj: BreakdownItem, label: string, amount: number) => {
        if (!amount) return;
        obj[label] = (obj[label] || 0) + amount;
    };

    filteredRecords.forEach(r => {
      const company = r.company || 'Onbekend Bedrijf';
      const period = r.year && r.period ? `${r.year} - ${r.period}` : 'Overig';
      
      // --- Smart Recognition Logic ---
      let turnover = 0;
      let outputVat = 0;
      let inputVat = 0;

      // Category breakdown
      let catHigh = 0;
      let catLow = 0;
      let catPrivate = 0;
      let catExport = 0;
      let catImport = 0;

      const vatBox = (r.vatBox || '').toLowerCase().replace(/[^0-9a-z]/g, '');
      const vatBase = r.vatBase || 0;
      const vatAmount = r.vatAmount || 0;

      // Label Logic for breakdown
      let label = '';
      if (r.vatBox) label = `Vak ${r.vatBox}`;
      else if (r.code) label = `GB ${r.code} ${r.description ? '- ' + r.description.substring(0, 15) + '...' : ''}`;
      else label = r.description || 'Onbekend';

      // Classification Logic
      let isTurnover = false;
      let isOutputVat = false;
      let isInputVat = false;

      // Logic 1: Based on VAT Box (Most accurate for Exact Online VAT Overview)
      if (vatBox) {
          // Turnover = Boxes 1, 2, 3
          if (['1', '2', '3'].some(k => vatBox.startsWith(k))) {
              turnover += vatBase;
              outputVat += vatAmount;
              isTurnover = true;
              isOutputVat = true;

              // Specific Category Mapping
              if (vatBox.startsWith('1a')) catHigh += vatBase;
              else if (vatBox.startsWith('1b')) catLow += vatBase;
              else if (vatBox.startsWith('1d')) catPrivate += vatBase;
              else if (vatBox.startsWith('3')) catExport += vatBase; // 3a + 3b
          }
          // Acquisitions = Box 4 (Not Turnover, but adds to Output VAT)
          else if (vatBox.startsWith('4')) {
              outputVat += vatAmount;
              catImport += vatBase; // 4a + 4b
              isOutputVat = true;
          }
          // Input VAT = Box 5b or explicit 'voorbelasting'
          else if (vatBox.includes('5b') || vatBox.includes('voorbelasting')) {
              inputVat += vatAmount;
              isInputVat = true;
          }
      } 
      // Logic 2: Fallback based on Ledger Type and Debit/Credit
      else {
          if (r.type === 'pnl') {
             // If Credit on P&L -> Revenue
             if (r.credit > 0) {
                 turnover += r.credit; 
                 isTurnover = true;
                 if (vatAmount > 0) {
                     outputVat += vatAmount;
                     isOutputVat = true;
                 }
                 // Default fallback to High if unknown
                 catHigh += r.credit;
             }
          }
          
          if (r.debit > 0 && vatAmount > 0) {
              inputVat += vatAmount;
              isInputVat = true;
          }
      }

      const payable = outputVat - inputVat;

      // Init Structure
      if (!byCompany[company]) {
        byCompany[company] = { ...createEmptyData(), byPeriod: {} };
      }
      if (!byCompany[company].byPeriod[period]) {
        byCompany[company].byPeriod[period] = createEmptyData();
      }

      // Helper to update a data object
      const updateDataObj = (d: PeriodData) => {
          d.turnover += turnover;
          d.outputVat += outputVat;
          d.inputVat += inputVat;
          d.payable += payable;
          d.count += 1;
          
          d.turnoverHigh += catHigh;
          d.turnoverLow += catLow;
          d.turnoverPrivate += catPrivate;
          d.exportVolume += catExport;
          d.importVolume += catImport;

          if (isTurnover) updateDetails(d.turnoverDetails, label, turnover);
          if (isOutputVat) updateDetails(d.outputVatDetails, label, outputVat);
          if (isInputVat) updateDetails(d.inputVatDetails, label, inputVat);
      };

      updateDataObj(byCompany[company]);
      updateDataObj(byCompany[company].byPeriod[period]);
    });

    return byCompany;
  }, [filteredRecords]);

  // Global Totals
  const globalStats = (Object.values(aggregatedData) as CompanyData[]).reduce((acc, curr) => {
    const merge = (a: BreakdownItem, b: BreakdownItem) => {
        const res = { ...a };
        Object.entries(b).forEach(([k, v]) => {
            res[k] = (res[k] || 0) + v;
        });
        return res;
    };

    return {
        turnover: acc.turnover + curr.turnover,
        outputVat: acc.outputVat + curr.outputVat,
        inputVat: acc.inputVat + curr.inputVat,
        payable: acc.payable + curr.payable,
        count: acc.count + curr.count,
        turnoverHigh: acc.turnoverHigh + curr.turnoverHigh,
        turnoverLow: acc.turnoverLow + curr.turnoverLow,
        turnoverPrivate: acc.turnoverPrivate + curr.turnoverPrivate,
        exportVolume: acc.exportVolume + curr.exportVolume,
        importVolume: acc.importVolume + curr.importVolume,
        turnoverDetails: merge(acc.turnoverDetails, curr.turnoverDetails),
        outputVatDetails: merge(acc.outputVatDetails, curr.outputVatDetails),
        inputVatDetails: merge(acc.inputVatDetails, curr.inputVatDetails)
    };
  }, { 
      turnover: 0, outputVat: 0, inputVat: 0, payable: 0, count: 0, 
      turnoverHigh: 0, turnoverLow: 0, turnoverPrivate: 0, exportVolume: 0, importVolume: 0,
      turnoverDetails: {}, outputVatDetails: {}, inputVatDetails: {} 
  } as PeriodData);

  const companyKeys = Object.keys(aggregatedData).sort();

  // --- Suppletie Check Logic ---
  const suppletieLimit = 1000;
  const needsSuppletie = Math.abs(globalStats.payable) > suppletieLimit;
  
  // Consistency Check (Theoretical VAT vs Actual)
  // Simple check: Is Output VAT High roughly 21% of Turnover High?
  const theoreticalHighVat = globalStats.turnoverHigh * 0.21;
  // Note: This details lookup is heuristic. Better to check global output VAT if dominant. 
  // Let's check Total Output VAT vs (High*0.21 + Low*0.09)
  const theoreticalTotalVat = (globalStats.turnoverHigh * 0.21) + (globalStats.turnoverLow * 0.09);
  // Only meaningful if we have substantial turnover
  const vatGap = Math.abs(globalStats.outputVat - theoreticalTotalVat);
  const showVatGapWarning = globalStats.turnover > 0 && vatGap > 500; // Warning if gap > 500


  // --- Tooltip Handler ---
  const handleMouseEnter = (e: React.MouseEvent, title: string, breakdown: BreakdownItem) => {
    const items = Object.entries(breakdown)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value) // Sort descending
        .filter(i => Math.abs(i.value) > 0.01); // Filter empty

    if (items.length === 0) return;

    setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        title,
        items
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const BreakdownCard = ({ title, value, icon: Icon, color, subText }: { title: string, value: number, icon: any, color: string, subText?: string }) => (
    <div className={`flex flex-col p-3 rounded-lg border bg-white ${value === 0 ? 'opacity-50' : ''}`} style={{ borderColor: `${color}40` }}>
        <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md`} style={{ backgroundColor: `${color}20`, color: color }}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">{title}</span>
        </div>
        <div className="text-lg font-mono font-bold text-slate-700">
            {formatCurrency(value, settings.currencyMode)}
        </div>
        {subText && <div className="text-[10px] text-slate-400 mt-1">{subText}</div>}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Tooltip Popup */}
      {tooltip && tooltip.visible && (
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-3 text-sm pointer-events-none min-w-[200px]"
            style={{ 
                left: tooltip.x + 15, 
                top: tooltip.y + 15,
                animation: 'fadeIn 0.15s ease-out'
            }}
          >
              <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 mb-2">{tooltip.title}</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                  {tooltip.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between gap-4 text-xs">
                          <span className="text-slate-500 truncate max-w-[150px]">{item.label}</span>
                          <span className="font-mono font-medium text-slate-700">
                              {formatCurrency(item.value, settings.currencyMode)}
                          </span>
                      </div>
                  ))}
                  <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between gap-4 font-bold text-xs">
                      <span>Totaal</span>
                      <span>{formatCurrency(tooltip.items.reduce((s, i) => s + i.value, 0), settings.currencyMode)}</span>
                  </div>
              </div>
          </div>
      )}

      {/* 1. Dynamic Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow border border-slate-200 flex items-center gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Filter op grootboek, omschrijving, dagboek..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
            />
         </div>
         <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            <span>
              {filteredRecords.length} regels geanalyseerd
            </span>
         </div>
      </div>

      {/* 2. KPI Cards (Financial) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
               <TrendingUp className="w-4 h-4 text-slate-600" />
               <span className="text-xs font-bold uppercase">Totale Omzet</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
               {formatCurrency(globalStats.turnover, settings.currencyMode)}
            </div>
         </div>

         <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
               <Building2 className="w-4 h-4" />
               <span className="text-xs font-bold uppercase">BTW Afdracht (Uit)</span>
            </div>
            <div className="text-2xl font-bold text-slate-700">
               {formatCurrency(globalStats.outputVat, settings.currencyMode)}
            </div>
         </div>

         <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
               <TrendingDown className="w-4 h-4" />
               <span className="text-xs font-bold uppercase">Voorbelasting (In)</span>
            </div>
            <div className="text-2xl font-bold text-slate-700">
               {formatCurrency(globalStats.inputVat, settings.currencyMode)}
            </div>
         </div>

         <div className="bg-white p-4 rounded-lg shadow border border-slate-200 relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2 text-slate-500">
               <PiggyBank className="w-4 h-4" style={{ color: theme.primary }} />
               <span className="text-xs font-bold uppercase">Te Betalen / Ontvangen</span>
            </div>
            <div className={`text-2xl font-bold ${globalStats.payable >= 0 ? 'text-blue-700' : 'text-green-600'}`}>
               {formatCurrency(globalStats.payable, settings.currencyMode)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
                {globalStats.payable >= 0 ? 'Af te dragen aan belastingdienst' : 'Terug te vragen'}
            </div>
             <div className="absolute right-0 top-0 p-4 opacity-5">
               <Calculator className="w-16 h-16" />
            </div>
         </div>
      </div>

      {/* 3. NEW: Suppletie & Risk Signals */}
      {exactRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Suppletie Check */}
              <div className={`p-4 rounded-lg shadow border flex items-start gap-4 ${needsSuppletie ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                  <div className={`p-2 rounded-full ${needsSuppletie ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                      <h4 className={`font-bold text-sm ${needsSuppletie ? 'text-orange-800' : 'text-green-800'}`}>
                          Suppletie Grens (€ 1.000)
                      </h4>
                      <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                          Totaal te betalen/ontvangen dit jaar is <strong>{formatCurrency(globalStats.payable, settings.currencyMode)}</strong>. 
                          {needsSuppletie 
                              ? " Omdat dit bedrag groter is dan € 1.000, moet u waarschijnlijk een suppletie-aangifte indienen als dit afwijkt van uw eerdere aangiften."
                              : " Het bedrag valt binnen de € 1.000 marge. Kleine correcties mogen vaak in de eerstvolgende aangifte worden verwerkt."}
                      </p>
                  </div>
              </div>

              {/* Theoretical VAT Check */}
              <div className="bg-white p-4 rounded-lg shadow border border-slate-200 flex items-start gap-4">
                  <div className={`p-2 rounded-full ${showVatGapWarning ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      <Scale className="w-5 h-5" />
                  </div>
                  <div>
                      <h4 className="font-bold text-sm text-slate-700">BTW Consistentie Check</h4>
                      <div className="flex gap-4 mt-2 text-xs">
                          <div>
                              <div className="text-slate-400 uppercase">Theoretisch (21%/9%)</div>
                              <div className="font-mono font-medium">{formatCurrency(theoreticalTotalVat, settings.currencyMode)}</div>
                          </div>
                          <div>
                              <div className="text-slate-400 uppercase">Geboekt</div>
                              <div className={`font-mono font-medium ${showVatGapWarning ? 'text-red-600' : 'text-slate-700'}`}>
                                  {formatCurrency(globalStats.outputVat, settings.currencyMode)}
                              </div>
                          </div>
                      </div>
                      {showVatGapWarning && (
                          <p className="text-xs text-red-500 mt-2 font-medium">
                              Let op: Er is een aanzienlijk verschil tussen theoretische en geboekte BTW. Controleer boekingen op 0% tarief of correcties.
                          </p>
                      )}
                  </div>
              </div>
          </div>
      )}


      {/* 4. Aggregated Table (Financial) */}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
         <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Financieel Dashboard per Bedrijf</h3>
            <span className="text-xs text-slate-500 bg-white px-2 py-1 border rounded flex items-center gap-2">
               <Info className="w-3 h-3" />
               Klik op een bedrijf voor details & periodes
            </span>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-sm">
               <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-white">
                     <th className="text-left p-4 font-bold uppercase text-xs w-1/3">Bedrijf</th>
                     <th className="text-right p-4 font-bold uppercase text-xs">Omzet</th>
                     <th className="text-right p-4 font-bold uppercase text-xs">BTW Afdracht</th>
                     <th className="text-right p-4 font-bold uppercase text-xs">Voorbelasting</th>
                     <th className="text-right p-4 font-bold uppercase text-xs">Te Betalen</th>
                  </tr>
               </thead>
               <tbody>
                  {companyKeys.map(company => {
                     const data = aggregatedData[company];
                     const isExpanded = expandedCompanies.has(company);
                     const periods = Object.keys(data.byPeriod).sort();

                     return (
                        <React.Fragment key={company}>
                           {/* Company Row */}
                           <tr 
                              className={`hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                              onClick={() => toggleCompany(company)}
                           >
                              <td className="p-4 flex items-center gap-2 font-medium text-slate-800">
                                 {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                 {company}
                              </td>
                              <td className="p-4 text-right font-mono text-slate-600">
                                {formatCurrency(data.turnover, settings.currencyMode)}
                              </td>
                              <td className="p-4 text-right font-mono text-slate-600">
                                {formatCurrency(data.outputVat, settings.currencyMode)}
                              </td>
                              <td className="p-4 text-right font-mono text-slate-600">
                                {formatCurrency(data.inputVat, settings.currencyMode)}
                              </td>
                              <td className={`p-4 text-right font-mono font-bold ${data.payable >= 0 ? 'text-blue-700' : 'text-green-600'}`}>
                                 {formatCurrency(data.payable, settings.currencyMode)}
                              </td>
                           </tr>

                           {/* Detailed Breakdown Section */}
                           {isExpanded && (
                             <tr className="bg-slate-50/50">
                                <td colSpan={5} className="p-0 border-b border-slate-200">
                                   <div className="p-4 space-y-4">
                                      {/* Specific Analysis Strip */}
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                         <BreakdownCard 
                                            title="Omzet Hoog" 
                                            value={data.turnoverHigh} 
                                            icon={ArrowUpRight} 
                                            color="#3b82f6" 
                                            subText="Hoog tarief (1a)"
                                         />
                                         <BreakdownCard 
                                            title="Omzet Laag" 
                                            value={data.turnoverLow} 
                                            icon={ArrowDownRight} 
                                            color="#0ea5e9" 
                                            subText="Laag tarief (1b)"
                                         />
                                         <BreakdownCard 
                                            title="Privé" 
                                            value={data.turnoverPrivate} 
                                            icon={User} 
                                            color="#64748b" 
                                            subText="Privégebruik (1d)"
                                         />
                                         <BreakdownCard 
                                            title="Export" 
                                            value={data.exportVolume} 
                                            icon={Globe} 
                                            color="#a855f7" 
                                            subText="EU + Non-EU (3a/3b)"
                                         />
                                         <BreakdownCard 
                                            title="Import" 
                                            value={data.importVolume} 
                                            icon={Package} 
                                            color="#f97316" 
                                            subText="EU + Non-EU (4a/4b)"
                                         />
                                      </div>

                                      {/* Periods Table */}
                                      <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                        <div className="px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                                            Periodes
                                        </div>
                                        <table className="w-full text-xs">
                                           <tbody>
                                            {periods.map(period => {
                                                const pData = data.byPeriod[period];
                                                return (
                                                    <tr key={`${company}-${period}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                        <td className="p-3 pl-4 font-mono text-slate-600 w-1/3">{period}</td>
                                                        <td 
                                                            className="p-3 text-right font-mono text-slate-500 cursor-help"
                                                            onMouseEnter={(e) => handleMouseEnter(e, `Omzet: ${period}`, pData.turnoverDetails)}
                                                            onMouseLeave={handleMouseLeave}
                                                        >
                                                            {formatCurrency(pData.turnover, settings.currencyMode)}
                                                        </td>
                                                        <td 
                                                            className="p-3 text-right font-mono text-slate-500 cursor-help"
                                                            onMouseEnter={(e) => handleMouseEnter(e, `Afdracht: ${period}`, pData.outputVatDetails)}
                                                            onMouseLeave={handleMouseLeave}
                                                        >
                                                            {formatCurrency(pData.outputVat, settings.currencyMode)}
                                                        </td>
                                                        <td 
                                                            className="p-3 text-right font-mono text-slate-500 cursor-help"
                                                            onMouseEnter={(e) => handleMouseEnter(e, `Voorbelasting: ${period}`, pData.inputVatDetails)}
                                                            onMouseLeave={handleMouseLeave}
                                                        >
                                                            {formatCurrency(pData.inputVat, settings.currencyMode)}
                                                        </td>
                                                        <td className={`p-3 text-right font-mono ${pData.payable >= 0 ? 'text-blue-700' : 'text-green-600'}`}>
                                                        {formatCurrency(pData.payable, settings.currencyMode)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                           </tbody>
                                        </table>
                                      </div>
                                   </div>
                                </td>
                             </tr>
                           )}
                        </React.Fragment>
                     );
                  })}

                  {companyKeys.length === 0 && (
                     <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                           Geen financiële data gevonden. Upload een BTW-overzicht of Exact Rapportage.
                        </td>
                     </tr>
                  )}
               </tbody>
               {companyKeys.length > 0 && (
                  <tfoot className="bg-slate-100 border-t border-slate-200">
                     <tr>
                        <td className="p-4 font-bold text-slate-700">Totaal Generaal</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-700">{formatCurrency(globalStats.turnover, settings.currencyMode)}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-700">{formatCurrency(globalStats.outputVat, settings.currencyMode)}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-700">{formatCurrency(globalStats.inputVat, settings.currencyMode)}</td>
                        <td className={`p-4 text-right font-mono font-bold ${globalStats.payable >= 0 ? 'text-blue-700' : 'text-green-700'}`}>
                           {formatCurrency(globalStats.payable, settings.currencyMode)}
                        </td>
                     </tr>
                  </tfoot>
               )}
            </table>
         </div>
      </div>
    </div>
  );
};

export default SummaryView;
