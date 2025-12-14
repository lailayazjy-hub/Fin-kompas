'use client';

import './styles.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, 
  Upload, 
  Download, 
  Calendar, 
  User, 
  MessageSquare,
  TrendingUp,
  Filter,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  PieChart as PieIcon,
  Columns,
  CheckCircle2,
  XCircle,
  GripVertical,
  ArrowRightLeft,
  Landmark,
  Wallet,
  Coins,
  BarChart3,
  Activity,
  Calculator,
  Info,
  Save as SaveIcon,
  Plus,
  Minus,
  Goal,
  ShieldCheck,
  Banknote
} from 'lucide-react';
import { TargetIcon } from './components/TargetIcon';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip, 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

import { AppSettings, ThemeName, ProcessedData, FinancialRecord, ReportSection, ReportItem, NBASettings, RiskProfile, MaterialityBenchmark, KPIItem, CustomGoal } from './types';
import { DEFAULT_SETTINGS, THEMES, WoodpeckerLogo, TRANSLATIONS } from './constants';
import SettingsModal from './components/SettingsModal';
import { generateFinancialAnalysis } from './services/geminiService';

// --- SPARKLINE COMPONENT ---
const Sparkline = ({ val1, val2, color }: { val1: number, val2: number, color: string }) => {
  const height = 24;
  const width = 48;
  const padding = 3;
  
  const min = Math.min(val1, val2);
  const max = Math.max(val1, val2);
  const diff = max - min;
  
  // Prevent divide by zero if values are equal
  const range = diff === 0 ? 1 : diff;
  
  // Calculate Y positions (inverted because SVG 0 is top)
  // If values are equal, center them
  const y1 = diff === 0 
    ? height / 2 
    : height - padding - ((val1 - min) / range) * (height - (padding * 2));
    
  const y2 = diff === 0 
    ? height / 2 
    : height - padding - ((val2 - min) / range) * (height - (padding * 2));

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <circle cx={padding} cy={y1} r="2" fill={color} />
      <line 
        x1={padding} 
        y1={y1} 
        x2={width - padding} 
        y2={y2} 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <circle cx={width - padding} cy={y2} r="2" fill={color} />
    </svg>
  );
};

// --- MOCK DATA GENERATOR ---
const generateMockData = (lang: 'nl' | 'en'): FinancialRecord[] => {
  const records: FinancialRecord[] = [];
  const isNl = lang === 'nl';

  // P&L Items
  const revenueItems = isNl 
    ? ['Verkoop Eten', 'Verkoop Drank', 'Wijn', 'Bier', 'Abonnementen Dienst', 'Service Abonnement']
    : ['Food Sales', 'Beverage Sales', 'Wine', 'Beer', 'Subscription Service', 'Recurring Plan'];
  const cogsItems = isNl
    ? ['Inkoop Eten', 'Inkoop Drank']
    : ['Food Cost', 'Beverage Cost'];
  const expenseItems = isNl
    ? ['Huur', 'Gas/Water/Licht', 'Marketing', 'Onderhoud', 'Inkoopkortingen (algemeen)']
    : ['Rent', 'Utilities', 'Marketing', 'Repairs & Maintenance', 'Purchase Discounts'];
  const recurringCostItems = isNl 
    ? ['Software Abonnement', 'Lease Auto', 'Huur Pand'] 
    : ['Software Subscription', 'Car Lease', 'Rent Building'];
  const depItems = isNl
    ? ['Afschrijving Inventaris', 'Afschrijving Verbouwing']
    : ['Depreciation Inventory', 'Depreciation Improvements'];
  const nonOpItems = isNl
    ? ['Rentelasten Bank', 'Bankkosten', 'Rente R/C', 'Vennootschapsbelasting 2024'] 
    : ['Interest Expense', 'Bank Charges', 'Interest R/C', 'Corporate Tax 2024'];

  // Balance Sheet Items (Mocking with 0xxx, 1xxx, 2xxx)
  // Include specific keywords for Investments test: inventaris, vervoermiddelen
  const assetItems = isNl 
    ? ['Computers']
    : ['Computers'];

  const investmentItems = isNl 
    ? ['Inventaris Keuken', 'Vervoermiddelen']
    : ['Inventory Kitchen', 'Transport Vehicles'];

  const prodInProgressItems = isNl
    ? ['Voorraad Grondstoffen', 'Onderhanden Werk Projecten']
    : ['Raw Materials Inventory', 'Work in Progress Projects'];

  const assetDepreciationItems = isNl
    ? ['Afschrijving Inventaris Keuken', 'Afschrijving Vervoermiddelen']
    : ['Depreciation Inventory Kitchen', 'Depreciation Transport Vehicles'];
  
  const arItems = isNl
    ? ['Debiteuren', 'Te ontvangen posten']
    : ['Accounts Receivable', 'Receivables'];

  // Mock Liquid Assets
  const liquidItems = isNl
    ? ['Bankgarantie', 'Lunchpas', 'Kas', 'Credietcard', 'NL66INGB0001234567']
    : ['Bank Guarantee', 'Lunch Pass', 'Cash', 'Credit Card', 'NL66INGB0001234567'];
    
  // External Financing Mock
  const financingItems = isNl
    ? ['Lening Rabobank', 'Financial Lease Auto', 'Hypotheek']
    : ['Loan Rabobank', 'Financial Lease Car', 'Mortgage'];

  const liabilityItems = isNl
    ? ['Overige Schulden']
    : ['Other Liabilities'];

  const apItems = isNl
    ? ['Crediteuren', 'Te betalen kosten']
    : ['Accounts Payable', 'Payables'];

  // New Direct Obligations
  const directObligationItems = isNl
    ? ['Netto salaris personeel', 'Af te dragen BTW', 'Af te dragen loonheffing']
    : ['Net Salary', 'VAT Payable', 'Wage Tax Payable'];

  const rcItems = isNl
    ? ['R/C Pedveg', 'RC Holding']
    : ['R/C Pedveg', 'RC Holding'];

  const equityItems = isNl
    ? ['Aandelenkapitaal', 'Winstreserve', 'Onverwerkt Resultaat']
    : ['Share Capital', 'Retained Earnings', 'Undistributed Result'];
  
  // Specific requested items
  const resultItems = isNl
    ? ['Resultaat', 'Resultaat geselecteerde perioden: 1 - 12']
    : ['Result', 'Result selected periods: 1 - 12'];

  const today = new Date();
  const currentYear = today.getFullYear();

  const addRecord = (desc: string, min: number, max: number, glPrefix: string, type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity' | 'result', yearOffset = 0) => {
    const val = Math.floor(Math.random() * (max - min)) + min;
    
    let debet = 0;
    let credit = 0;

    // Determine typical D/C nature
    if (type === 'revenue' || type === 'liability' || type === 'equity') {
        credit = val;
    } else {
        debet = val;
    }
    
    // Asset Depreciation is typically Credit balance
    if (desc.includes('Afschrijving Inventaris Keuken') || desc.includes('Afschrijving Vervoermiddelen')) {
        debet = 0;
        credit = val;
    }

    // Distribute data over months for better demo of "Annual" logic
    // Create 12 entries for each item type to simulate full year data
    for(let m = 0; m < 12; m++) {
        const month = String(m + 1).padStart(2, '0');
        records.push({
            id: Math.random().toString(36).substr(2, 9),
            datum: `${currentYear - yearOffset}-${month}-15`, 
            grootboek: glPrefix + Math.floor(Math.random() * 99).toString().padStart(2, '0'),
            omschrijving: desc,
            debet: debet / 12, // Split value
            credit: credit / 12,
            type: debet > 0 ? 'debet' : 'credit'
        });
    }
  };

  // Generate data for current year and previous year for comparison
  [0, 1].forEach(offset => {
      revenueItems.forEach(i => addRecord(i, 15000, 35000, '80', 'revenue', offset));
      cogsItems.forEach(i => addRecord(i, 5000, 10000, '70', 'expense', offset));
      expenseItems.forEach(i => addRecord(i, 1000, 3000, '40', 'expense', offset));
      recurringCostItems.forEach(i => addRecord(i, 500, 2000, '41', 'expense', offset));
      depItems.forEach(i => addRecord(i, 500, 1500, '48', 'expense', offset));
      nonOpItems.forEach(i => addRecord(i, 500, 2000, '90', 'expense', offset));

      // Balance Sheet Data
      investmentItems.forEach(i => addRecord(i, 20000, 50000, '02', 'asset', offset));
      prodInProgressItems.forEach(i => addRecord(i, 5000, 20000, '03', 'asset', offset));
      assetDepreciationItems.forEach(i => addRecord(i, 5000, 15000, '02', 'asset', offset));
      assetItems.forEach(i => addRecord(i, 5000, 10000, '01', 'asset', offset)); 
      arItems.forEach(i => addRecord(i, 2000, 15000, '13', 'asset', offset));
      liquidItems.forEach(i => addRecord(i, 1000, 15000, '11', 'asset', offset)); 
      
      financingItems.forEach(i => addRecord(i, 5000, 30000, '16', 'liability', offset));
      liabilityItems.forEach(i => addRecord(i, 2000, 20000, '16', 'liability', offset)); 
      apItems.forEach(i => addRecord(i, 1000, 10000, '16', 'liability', offset));
      directObligationItems.forEach(i => addRecord(i, 2000, 8000, '15', 'liability', offset));
      rcItems.forEach(i => addRecord(i, 1000, 5000, '17', 'liability', offset));
      equityItems.forEach(i => addRecord(i, 10000, 100000, '05', 'equity', offset)); 
      
      resultItems.forEach(i => addRecord(i, 5000, 5000, '99', 'result', offset));
  });

  return records;
};

// --- COMPONENTS ---

interface ReportTableProps {
  id: string; // Unique ID for the section to track sorting
  title: string;
  section: ReportSection;
  currencyFormatter: (v: number) => string;
  themeColor: string;
  totalLabel: string;
  onReorder: (sectionId: string, newOrder: string[]) => void;
  onMoveItem: (itemName: string, fromSection: string, toSection: string) => void;
  getItemClass?: (itemName: string) => string;
}

const ReportTable = ({ id, title, section, currencyFormatter, themeColor, totalLabel, onReorder, onMoveItem, getItemClass }: ReportTableProps) => {
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  if (section.items.length === 0) {
      // Allow dropping into empty table
       return (
        <div 
            className="mb-8 break-inside-avoid min-h-[50px] border-2 border-dashed border-gray-100 rounded flex items-center justify-center bg-gray-50/50"
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
                e.preventDefault();
                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    if (data && data.fromSection !== id) {
                        onMoveItem(data.item, data.fromSection, id);
                    }
                } catch (err) { console.error(err); }
            }}
        >
             <div className="text-center text-gray-300 text-xs py-2">
                <p className="font-bold text-gray-400">{title}</p>
                <p>Leeg (Sleep items hierheen)</p>
            </div>
        </div>
       );
  }

  const handleDragStart = (e: React.DragEvent, item: ReportItem) => {
    e.dataTransfer.effectAllowed = "move";
    // Send data to identify item and source section
    e.dataTransfer.setData("application/json", JSON.stringify({ item: item.name, fromSection: id }));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
    setDraggedOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDraggedOverIndex(null);

    try {
        const dataStr = e.dataTransfer.getData("application/json");
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        
        // CASE 1: Moving from another section
        if (data.fromSection !== id) {
            onMoveItem(data.item, data.fromSection, id);
            return;
        }

        // CASE 2: Reordering within same section
        const draggedItemName = data.item;
        
        // Find current index of dragged item
        const currentIndex = section.items.findIndex(i => i.name === draggedItemName);
        if (currentIndex === -1 || currentIndex === targetIndex) return;

        const newItems = [...section.items];
        const itemToMove = newItems[currentIndex];
        
        newItems.splice(currentIndex, 1);
        newItems.splice(targetIndex, 0, itemToMove);

        // Notify parent
        const newOrder = newItems.map(i => i.name);
        onReorder(id, newOrder);

    } catch (err) {
        console.error("Drop error", err);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };
  
  return (
    <div className="mb-8 break-inside-avoid">
      <h4 className="font-bold text-sm uppercase border-b-2 border-gray-800 pb-1 mb-3 flex justify-between items-end">
        <span>{title}</span>
      </h4>
      <table className="w-full text-sm">
        <tbody
            onDragOver={(e) => {
                 // Allow dropping at end of table (if missed a row)
                 e.preventDefault();
                 e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
                 // Handle drop on table body (append to end) if not dropped on specific row
                 e.preventDefault();
                 try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    if (data && data.fromSection !== id) {
                        onMoveItem(data.item, data.fromSection, id);
                    }
                 } catch (err) {}
            }}
        >
          {section.items.map((item, idx) => {
            const customClass = getItemClass ? getItemClass(item.name) : '';
            return (
              <tr 
                key={item.name} 
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => {
                    e.stopPropagation(); // Stop bubbling to tbody
                    handleDrop(e, idx);
                }}
                onDragLeave={handleDragLeave}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-move group 
                  ${draggedOverIndex === idx ? 'bg-blue-50 border-t-2 border-blue-400' : ''} 
                  ${customClass}
                `}
              >
                <td className="w-6 py-2 text-gray-300 group-hover:text-gray-500">
                    <GripVertical size={14} />
                </td>
                <td className="py-2 text-gray-600 truncate max-w-[200px]">{item.name}</td>
                <td className="py-2 text-right font-medium text-gray-800">{currencyFormatter(item.value)}</td>
              </tr>
            );
          })}
          <tr className="border-t border-gray-300 font-bold">
            <td colSpan={2} className="py-3 uppercase text-xs tracking-wide text-gray-500">{totalLabel}</td>
            <td className="py-3 text-right text-base" style={{ color: themeColor }}>{currencyFormatter(section.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// MATCHERS
const isLiquidItem = (name: string) => {
    const n = name.toLowerCase();
    // Strict Liquid Assets keywords
    return /lunchpas/i.test(n) || 
           /credietcard/i.test(n) ||
           /creditcard/i.test(n) || 
           /bankgarantie/i.test(n) ||
           /liquide middelen/i.test(n) ||
           /[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{4,}/.test(name); // IBAN
};

const isRCItem = (name: string) => {
    const n = name.toLowerCase();
    return n.includes('r/c') || n.includes('rc ');
};

const isDirectObligation = (name: string) => {
    const n = name.toLowerCase();
    // Exclude explicit costs to avoid stealing P&L items like "BTW kosten"
    if (n.includes('kosten') && n.includes('btw')) return false;
    
    return n.includes('netto salaris') || 
           n.includes('btw') || 
           n.includes('af te dragen');
}

export default function FinVisualisatiePage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rawData, setRawData] = useState<FinancialRecord[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  
  const [metaData, setMetaData] = useState<{year?: string, period?: string} | undefined>(undefined);
  const [validationTotals, setValidationTotals] = useState<{name: string, value: number, year?: string}[]>([]);
  
  // Multi-year support
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // Comparison State
  const [compareYear1, setCompareYear1] = useState<string>('');
  const [compareYear2, setCompareYear2] = useState<string>('');

  // Sorting State: Maps section ID -> Array of Item Names
  const [sortOrder, setSortOrder] = useState<Record<string, string[]>>({});
  
  // Category Override State: Maps Item Name -> Section ID (e.g., "Bank" -> "liabilities")
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [hideSmallAmounts, setHideSmallAmounts] = useState(false);
  const [viewMode, setViewMode] = useState<'pnl' | 'balance' | 'ai' | 'compare' | 'nba' | 'goals' | 'checks'>('pnl');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Calculation Basis State for AI Tab
  const [isAnnualMode, setIsAnnualMode] = useState<boolean>(true);

  // NBA Materiality State
  const [nbaSettings, setNbaSettings] = useState<NBASettings>({
      benchmark: 'revenue',
      percentage: 1.0,
      riskProfile: 'medium',
      isSaved: false
  });

  // Goals & KPIs State
  const [kpiAdjustments, setKpiAdjustments] = useState<Record<string, number>>({});

  const themeColors = THEMES[settings.theme];
  const t = TRANSLATIONS[settings.language];

  // Helper to apply sort order
  const applySort = (items: ReportItem[], sectionKey: string): ReportItem[] => {
    const order = sortOrder[sectionKey];
    
    // If no manual order, return items as they are (preserving file/insertion order)
    if (!order || order.length === 0) {
        return items;
    }

    // Split into sorted (those in 'order') and unsorted (rest)
    const sortedItems: ReportItem[] = [];
    const unsortedItems: ReportItem[] = [];
    
    // Map for fast lookup
    const itemMap = new Map(items.map(i => [i.name, i]));
    
    // 1. Add items specified in 'order'
    order.forEach(name => {
        const item = itemMap.get(name);
        if (item) {
            sortedItems.push(item);
            itemMap.delete(name); 
        }
    });
    
    // 2. Add remaining items in their original relative order
    items.forEach(item => {
        if (itemMap.has(item.name)) {
            unsortedItems.push(item);
        }
    });

    return [...sortedItems, ...unsortedItems];
  };

  // --- CORE ANALYZER FUNCTION ---
  // Extracted so it can be used for any year selection
  const analyzeFinancials = (records: FinancialRecord[], targetYear: string | null): ProcessedData => {
      let filtered = [...records];

      // Filter by target year if provided
      if (targetYear) {
          filtered = filtered.filter(r => r.datum.startsWith(targetYear));
      }

      if (hideSmallAmounts) {
        // Filter based on net impact
        filtered = filtered.filter(r => Math.abs(r.debet - r.credit) >= settings.smallAmountFilter);
      }

      // Buckets
      const buckets: Record<string, ReportItem[]> = {
          sales: [],
          recurring: [], 
          cogs: [],
          labor: [],
          otherExpenses: [],
          recurringCosts: [], // New for Recurring Cost KPI
          depreciation: [],
          nonOperationalExpenses: [],
          resultsAdjustments: [],
          investments: [],
          productionInProgress: [], // New: Productie in uitvoering
          assetDepreciation: [], 
          liquidAssets: [],
          accountsReceivable: [],
          assets: [],
          accountsPayable: [], 
          liabilities: [],
          externalFinancing: [], // New bucket
          currentAccounts: [], 
          directObligations: [],
          equity: []
      };

      let vpbAccumulator = 0;
      const monthlyStats: Record<string, { revenue: number, costs: number }> = {};
      const uniqueMonths = new Set<string>();

      filtered.forEach(record => {
        const glStr = record.grootboek.replace(/[^0-9]/g, '');
        const gl = parseInt(glStr || '0');
        const desc = record.omschrijving;
        const lowerDesc = desc.toLowerCase();
        const monthKey = record.datum ? record.datum.substring(0, 7) : 'Unknown';

        if (monthKey !== 'Unknown') {
            uniqueMonths.add(monthKey);
        }

        // STRICT LOGIC: Amount = Debet - Credit
        const amount = record.debet - record.credit;

        // Specific Logic: Calculate VPB for AI analysis
        if (lowerDesc.includes('vennootschapsbelasting') || lowerDesc.includes('vpb ')) {
            // Usually a cost (debit), so amount is positive.
            vpbAccumulator += amount;
        }

        // Determine bucket
        let targetBucket = '';

        // 1. Check Overrides first
        if (categoryOverrides[desc]) {
            targetBucket = categoryOverrides[desc];
        }
        else {
            // 2. STRICT OVERRIDES (Fixed positions based on description)
            if (lowerDesc === 'resultaat' || lowerDesc.includes('resultaat geselecteerde perioden')) {
                targetBucket = 'resultsAdjustments';
            }
            else if (lowerDesc.includes('onverwerkt') || lowerDesc.includes('onverdeeld') || 
                    lowerDesc.includes('winstverdeling')) {
                targetBucket = 'equity';
            }
            // 3. SPECIAL RULES: DISCOUNTS TO OTHER EXPENSES
            else if (lowerDesc.includes('inkoopkorting') || lowerDesc.includes('verkoopkorting')) {
                targetBucket = 'otherExpenses';
            }
            // 4. SPECIAL RULES: RECURRING REVENUE
            else if (lowerDesc.includes('abonnement') || lowerDesc.includes('subscription') || lowerDesc.includes('recurring') || lowerDesc.includes('contributie')) {
                targetBucket = 'recurring';
            }
            else {
                const isBalanceSheetGL = gl > 0 && gl < 4000;
                
                if (isBalanceSheetGL) {
                    if (isLiquidItem(desc)) {
                        targetBucket = 'liquidAssets';
                    }
                    else if (lowerDesc.includes('afschrijving')) {
                        // Priority: Balance Sheet Depreciation
                        targetBucket = 'assetDepreciation';
                    }
                    else if (lowerDesc.includes('inventaris') || lowerDesc.includes('vervoermiddelen')) {
                        // Strict check: if it also has "afschrijving", it was caught above. 
                        // If here, it is the asset itself.
                        targetBucket = 'investments';
                    }
                    else if (lowerDesc.includes('voorraad') || lowerDesc.includes('onderhanden werk')) {
                        // New: Productie in uitvoering
                        targetBucket = 'productionInProgress';
                    }
                    else if (isDirectObligation(desc)) {
                        targetBucket = 'directObligations';
                    }
                    else if (isRCItem(desc)) {
                        targetBucket = 'currentAccounts';
                    }
                    // NEW: Crediteuren / Debiteuren Detection
                    else if (lowerDesc.includes('crediteuren') || lowerDesc.includes('payables')) {
                        targetBucket = 'accountsPayable';
                    }
                    else if (lowerDesc.includes('debiteuren') || lowerDesc.includes('receivables')) {
                        targetBucket = 'accountsReceivable';
                    }
                    // NEW: External Financing - Uitsluitend Passiva (GL >= 1400)
                    else if (
                        gl >= 1400 && 
                        (lowerDesc.includes('lening') || lowerDesc.includes('financiering') || lowerDesc.includes('hypotheek') || lowerDesc.includes('krediet') || lowerDesc.includes('lease'))
                    ) {
                        targetBucket = 'externalFinancing';
                    }
                    else {
                        if (gl < 500 || (gl >= 1000 && gl < 1400)) {
                             targetBucket = 'assets';
                         } else if (gl >= 500 && gl < 1000) {
                             targetBucket = 'equity';
                         } else {
                             targetBucket = 'liabilities';
                         }
                    }

                } else {
                    if (lowerDesc.includes('bankkosten') || lowerDesc.includes('kosten bank') || 
                        lowerDesc.includes('rentelasten') || lowerDesc.includes('rente r/c') || 
                        lowerDesc.includes('rente') || lowerDesc.includes('interest') || 
                        lowerDesc.includes('belasting') || lowerDesc.includes('tax') || 
                        lowerDesc.includes('vpb') || lowerDesc.includes('vennootschap') || 
                        lowerDesc.includes('btw')) {
                        targetBucket = 'nonOperationalExpenses';
                    } 
                    else if (lowerDesc.includes('afschrijving') || lowerDesc.includes('amorti') || lowerDesc.includes('afschr')) {
                        targetBucket = 'depreciation';
                    }
                    else if (gl >= 8000) {
                        targetBucket = 'sales';
                    } else if (gl >= 7000) {
                        targetBucket = 'cogs';
                    } else {
                         // Check for Recurring Costs (OPEX)
                         if (lowerDesc.includes('huur') || lowerDesc.includes('rent ') || lowerDesc.includes('lease') || lowerDesc.includes('software')) {
                             targetBucket = 'recurringCosts';
                         } else {
                             const laborKeywords = [
                                 'salaris', 'loon', 'wage', 'personeel', 'staff',
                                 'pensioen', 'lunch', 'reis', 'verzuim', 'wbso',
                                 'premie', 'zorg', 'verblijf', 'vakantie',
                                 'opleiding', 'kantine', 'vergoeding', 'recruitment',
                                 'werving', 'bijdrage'
                             ];
    
                             if (laborKeywords.some(k => lowerDesc.includes(k))) {
                                targetBucket = 'labor';
                             } else {
                                targetBucket = 'otherExpenses';
                             }
                         }
                    }
                }
            }
        }

        if (buckets[targetBucket]) {
            buckets[targetBucket].push({ name: desc, value: amount });
        }

        if (gl >= 4000 && targetBucket !== 'resultsAdjustments' && targetBucket !== 'equity' && targetBucket !== 'assets' && targetBucket !== 'liabilities' && targetBucket !== 'liquidAssets' && targetBucket !== 'currentAccounts' && targetBucket !== 'directObligations' && targetBucket !== 'investments' && targetBucket !== 'productionInProgress' && targetBucket !== 'assetDepreciation' && targetBucket !== 'accountsReceivable' && targetBucket !== 'accountsPayable' && targetBucket !== 'externalFinancing') {
             if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { revenue: 0, costs: 0 };
             if (targetBucket === 'sales' || targetBucket === 'recurring') {
                 monthlyStats[monthKey].revenue += amount;
             } else {
                 monthlyStats[monthKey].costs += amount;
             }
        }
      });

      const groupItems = (items: ReportItem[]) => {
        const map = new Map<string, number>();
        items.forEach(i => map.set(i.name, (map.get(i.name) || 0) + i.value));
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
      };

      const finalSales = applySort(groupItems(buckets.sales), 'sales');
      const finalRecurring = applySort(groupItems(buckets.recurring), 'recurring');
      const finalCogs = applySort(groupItems(buckets.cogs), 'cogs'); 
      const finalLabor = applySort(groupItems(buckets.labor), 'labor');
      const finalOther = applySort(groupItems(buckets.otherExpenses), 'otherExpenses');
      const finalRecurringCosts = applySort(groupItems(buckets.recurringCosts), 'recurringCosts');
      const finalDepreciation = applySort(groupItems(buckets.depreciation), 'depreciation');
      const finalNonOperational = applySort(groupItems(buckets.nonOperationalExpenses), 'nonOperationalExpenses');
      const finalResultsAdjustments = applySort(groupItems(buckets.resultsAdjustments), 'resultsAdjustments');
      
      const finalLiquidAssets = applySort(groupItems(buckets.liquidAssets), 'liquidAssets');
      const finalInvestments = applySort(groupItems(buckets.investments), 'investments');
      const finalProductionInProgress = applySort(groupItems(buckets.productionInProgress), 'productionInProgress');
      const finalAssetDepreciation = applySort(groupItems(buckets.assetDepreciation), 'assetDepreciation');
      const finalAR = applySort(groupItems(buckets.accountsReceivable), 'accountsReceivable');
      const finalAssets = applySort(groupItems(buckets.assets), 'assets');
      const finalAP = applySort(groupItems(buckets.accountsPayable), 'accountsPayable');
      const finalExternalFinancing = applySort(groupItems(buckets.externalFinancing), 'externalFinancing');
      const finalLiabilities = applySort(groupItems(buckets.liabilities), 'liabilities');
      const finalDirectObligations = applySort(groupItems(buckets.directObligations), 'directObligations');
      const finalCurrentAccounts = applySort(groupItems(buckets.currentAccounts), 'currentAccounts');
      const finalEquity = applySort(groupItems(buckets.equity), 'equity');

      const totalStandardSales = finalSales.reduce((sum, i) => sum + i.value, 0);
      const totalRecurring = finalRecurring.reduce((sum, i) => sum + i.value, 0);
      // Total Sales includes recurring for Gross Profit Calc
      const totalSales = totalStandardSales + totalRecurring;

      const totalCogs = finalCogs.reduce((sum, i) => sum + i.value, 0);
      const totalLabor = finalLabor.reduce((sum, i) => sum + i.value, 0);
      const totalOther = finalOther.reduce((sum, i) => sum + i.value, 0);
      const totalRecurringCosts = finalRecurringCosts.reduce((sum, i) => sum + i.value, 0);
      const totalDepreciation = finalDepreciation.reduce((sum, i) => sum + i.value, 0);
      const totalNonOperational = finalNonOperational.reduce((sum, i) => sum + i.value, 0);
      const totalResultsAdjustments = finalResultsAdjustments.reduce((sum, i) => sum + i.value, 0);
      
      const totalLiquidAssets = finalLiquidAssets.reduce((sum, i) => sum + i.value, 0);
      const totalInvestments = finalInvestments.reduce((sum, i) => sum + i.value, 0);
      const totalProductionInProgress = finalProductionInProgress.reduce((sum, i) => sum + i.value, 0);
      const totalAssetDepreciation = finalAssetDepreciation.reduce((sum, i) => sum + i.value, 0);
      const totalAR = finalAR.reduce((sum, i) => sum + i.value, 0);
      const totalAssets = finalAssets.reduce((sum, i) => sum + i.value, 0) + totalLiquidAssets + totalInvestments + totalProductionInProgress + totalAssetDepreciation + totalAR;
      
      const totalDirectObligations = finalDirectObligations.reduce((sum, i) => sum + i.value, 0);
      const totalCurrentAccounts = finalCurrentAccounts.reduce((sum, i) => sum + i.value, 0);
      const totalExternalFinancing = finalExternalFinancing.reduce((sum, i) => sum + i.value, 0);
      const totalAP = finalAP.reduce((sum, i) => sum + i.value, 0);
      const totalLiabilities = finalLiabilities.reduce((sum, i) => sum + i.value, 0) + totalCurrentAccounts + totalDirectObligations + totalAP + totalExternalFinancing;
      const totalEquity = finalEquity.reduce((sum, i) => sum + i.value, 0);

      const grossProfit = totalSales + totalCogs;
      // Operating Income now implies subtracting recurring costs too (they are OPEX)
      const operatingIncome = grossProfit + totalLabor + totalOther + totalRecurringCosts + totalDepreciation;
      const netIncome = operatingIncome + totalNonOperational; 
      
      // Total Operational Other now includes Recurring OPEX for simplicity in display, or keep separate?
      // Lets keep separate in buckets, but for "total expenses" sum them up.
      const totalOperationalOtherExpenses = totalOther + totalRecurringCosts + totalDepreciation;
      const totalExpenses = totalLabor + totalOther + totalRecurringCosts + totalDepreciation + totalNonOperational;

      const expenseDistribution = [
        { name: settings.language === 'nl' ? 'Kostprijs' : 'COGS', value: totalCogs, color: themeColors.primary },
        { name: settings.language === 'nl' ? 'Personeel' : 'Labor', value: totalLabor, color: themeColors.mediumRisk },
        { name: settings.language === 'nl' ? 'Huur/Lease/Software' : 'Recurring Costs', value: totalRecurringCosts, color: themeColors.lowRisk },
        { name: settings.language === 'nl' ? 'Overig' : 'Other', value: totalOther, color: themeColors.highRisk },
        { name: settings.language === 'nl' ? 'Afschrijving' : 'Depreciation', value: totalDepreciation, color: '#9CA3AF' },
      ].filter(d => d.value > 0);

       const monthlyData = Object.entries(monthlyStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month,
          revenue: Math.abs(data.revenue),
          costs: data.costs,
          result: data.revenue + data.costs
        }));

      return {
        records: filtered,
        meta: metaData,
        availableYears,
        validationTotals,
        netIncome,
        grossProfit,
        operatingIncome,
        totalOperationalOtherExpenses,
        totalExpenses,
        vpbAmount: vpbAccumulator,
        monthCount: uniqueMonths.size || 1,
        sales: { items: finalSales, total: totalStandardSales },
        recurring: { items: finalRecurring, total: totalRecurring },
        cogs: { items: finalCogs, total: totalCogs },
        labor: { items: finalLabor, total: totalLabor },
        otherExpenses: { items: finalOther, total: totalOther },
        recurringCosts: { items: finalRecurringCosts, total: totalRecurringCosts },
        depreciation: { items: finalDepreciation, total: totalDepreciation },
        nonOperationalExpenses: { items: finalNonOperational, total: totalNonOperational },
        resultsAdjustments: { items: finalResultsAdjustments, total: totalResultsAdjustments },
        balanceSheet: {
            investments: { items: finalInvestments, total: totalInvestments },
            productionInProgress: { items: finalProductionInProgress, total: totalProductionInProgress },
            assetDepreciation: { items: finalAssetDepreciation, total: totalAssetDepreciation },
            liquidAssets: { items: finalLiquidAssets, total: totalLiquidAssets },
            accountsReceivable: { items: finalAR, total: totalAR },
            assets: { items: finalAssets, total: totalAssets - totalLiquidAssets - totalInvestments - totalProductionInProgress - totalAssetDepreciation - totalAR }, 
            accountsPayable: { items: finalAP, total: totalAP },
            liabilities: { items: finalLiabilities, total: totalLiabilities - totalCurrentAccounts - totalDirectObligations - totalAP - totalExternalFinancing},
            externalFinancing: { items: finalExternalFinancing, total: totalExternalFinancing },
            currentAccounts: { items: finalCurrentAccounts, total: totalCurrentAccounts },
            directObligations: { items: finalDirectObligations, total: totalDirectObligations },
            equity: { items: finalEquity, total: totalEquity },
            totalAssets,
            totalLiabilities,
            totalEquity
        },
        expenseDistribution,
        monthlyData
      };
  };

  const renderGoalsTab = () => {
      if (!processedData) return null;

      // --- CALCULATE KPIs ---
      
      const getAdj = (id: string) => kpiAdjustments[id] || 0;
      const months = processedData.monthCount || 1;
      
      // 1. LIQUIDITY BUFFER
      // Target: 2 months
      // Formula: Direct beschikbare middelen / (Personeelskosten+ Algemene Kosten)
      // Note: "Algemene Kosten" corresponds to 'otherExpenses' bucket.
      const cash = processedData.balanceSheet!.liquidAssets.total + getAdj('liquidity-cash');
      const fixedCostsForBuffer = (processedData.labor.total + processedData.otherExpenses.total) + getAdj('liquidity-costs');
      const avgMonthlyFixed = fixedCostsForBuffer > 0 ? fixedCostsForBuffer / months : 1; // Prevent div/0
      const liquidityMonths = cash / avgMonthlyFixed;
      
      // Construct breakdown items: Labor as one item, then other expenses individually
      const fixedCostsItems: ReportItem[] = [
          { name: 'Personeelskosten (Totaal)', value: processedData.labor.total },
          ...processedData.otherExpenses.items
      ];

      const kpiLiquidity: KPIItem = {
          id: 'liquidity',
          title: t.liquidityBuffer,
          value: liquidityMonths,
          target: 2.0,
          targetLabel: '> 2 mnd',
          unit: 'number',
          status: liquidityMonths >= 2.0 ? 'good' : liquidityMonths >= 1.0 ? 'warning' : 'bad',
          formula: 'Cash / (Personeel + Algemene Kosten)',
          breakdown: [
              { label: 'Direct beschikbare middelen', value: processedData.balanceSheet!.liquidAssets.total, items: processedData.balanceSheet!.liquidAssets.items },
              { label: 'Vaste Kosten (Maandgemiddelde)', value: avgMonthlyFixed * months, items: fixedCostsItems }
          ]
      };

      // 2. AR vs AP
      // Target: Minimaal 1
      // Formula: Debiteuren / Crediteuren
      const ar = processedData.balanceSheet!.accountsReceivable.total + getAdj('ar');
      const ap = Math.abs(processedData.balanceSheet!.accountsPayable.total) + getAdj('ap'); // AP is credit (negative), use abs
      const arApRatio = ap > 0 ? ar / ap : ar > 0 ? 10 : 0;

      const kpiArAp: KPIItem = {
          id: 'arap',
          title: t.arVsAp,
          value: arApRatio,
          target: 1.0,
          targetLabel: '> 1.0x',
          unit: 'ratio',
          status: arApRatio >= 1.0 ? 'good' : arApRatio >= 0.8 ? 'warning' : 'bad',
          formula: 'Debiteuren / Crediteuren',
          breakdown: [
               { label: 'Debiteuren', value: processedData.balanceSheet!.accountsReceivable.total, items: processedData.balanceSheet!.accountsReceivable.items },
               { label: 'Crediteuren', value: processedData.balanceSheet!.accountsPayable.total, items: processedData.balanceSheet!.accountsPayable.items }
          ]
      };

      // 3. OPEX RATIO
      // Target: Max 60-70%
      // Formula: Total OPEX / Revenue
      // OPEX = Labor + Other + Recurring + Depreciation
      const opex = (processedData.labor.total + processedData.otherExpenses.total + processedData.recurringCosts.total + processedData.depreciation.total) + getAdj('opex');
      const revenue = Math.abs(processedData.sales.total + processedData.recurring.total) + getAdj('revenue');
      const opexRatio = revenue > 0 ? (opex / revenue) * 100 : 0;

      const kpiOpex: KPIItem = {
          id: 'opex',
          title: t.opexRatio,
          value: opexRatio,
          target: 60, // Max
          targetLabel: '< 60%',
          unit: 'percent',
          status: opexRatio <= 60 ? 'good' : opexRatio <= 70 ? 'warning' : 'bad',
          formula: 'Totale OPEX / Omzet',
          breakdown: [
              { label: 'Totale OPEX', value: opex, items: [...processedData.labor.items, ...processedData.otherExpenses.items, ...processedData.recurringCosts.items, ...processedData.depreciation.items] },
              { label: 'Omzet Totaal', value: revenue, items: [...processedData.sales.items, ...processedData.recurring.items] }
          ]
      };

      // 4. RECURRING COST RATIO
      // Target: Max 20%
      // Formula: Recurring Costs / Revenue
      const recCosts = processedData.recurringCosts.total + getAdj('recCosts');
      const recRatio = revenue > 0 ? (recCosts / revenue) * 100 : 0;

      const kpiRecCost: KPIItem = {
          id: 'reccost',
          title: t.recurringCostRatio,
          value: recRatio,
          target: 20, // Max
          targetLabel: '< 20%',
          unit: 'percent',
          status: recRatio <= 20 ? 'good' : recRatio <= 25 ? 'warning' : 'bad',
          formula: 'Recurring Kosten / Omzet',
          breakdown: [
              { label: 'Recurring Kosten', value: recCosts, items: processedData.recurringCosts.items },
              { label: 'Omzet', value: revenue }
          ]
      };

      const allKPIs = [kpiLiquidity, kpiArAp, kpiOpex, kpiRecCost];

      // --- CASHPOSITIE RATIOS ---
      // 1. Quick Ratio: (Debiteuren + Direct beschikbare middelen) / (Crediteuren + Directe verplichtingen)
      // Note: Creditors/DirectObs are liabilities (negative), use Abs.
      const quickAssets = processedData.balanceSheet!.accountsReceivable.total + processedData.balanceSheet!.liquidAssets.total;
      const currentLiabilitiesBase = Math.abs(processedData.balanceSheet!.accountsPayable.total) + Math.abs(processedData.balanceSheet!.directObligations.total);
      const quickRatio = currentLiabilitiesBase > 0 ? quickAssets / currentLiabilitiesBase : 0;

      // 2. Debt Ratio: Totaal vreemd vermogen / Totaal vermogen (Assets)
      // Totaal Vreemd Vermogen = Total Liabilities (everything except Equity)
      const totalLiabilitiesVal = Math.abs(processedData.balanceSheet!.totalLiabilities);
      const totalAssetsVal = processedData.balanceSheet!.totalAssets;
      const debtRatio = totalAssetsVal > 0 ? totalLiabilitiesVal / totalAssetsVal : 0;

      // 3. Current Ratio: (Debiteuren + Productie in uitvoering + Direct beschikbare middelen) / (Crediteuren + Directe verplichtingen)
      const currentAssets = quickAssets + processedData.balanceSheet!.productionInProgress.total;
      const currentRatio = currentLiabilitiesBase > 0 ? currentAssets / currentLiabilitiesBase : 0;

      const cashKPIs: KPIItem[] = [
          {
              id: 'quickRatio',
              title: 'Quick Ratio',
              value: quickRatio,
              target: 1.0,
              targetLabel: '> 1.0x',
              unit: 'ratio',
              status: quickRatio >= 1.0 ? 'good' : 'bad',
              formula: '(Debiteuren + Cash) / (Crediteuren + Verplichtingen)',
              breakdown: []
          },
          {
              id: 'debtRatio',
              title: 'Debt Ratio',
              value: debtRatio * 100, // Display as % often clearer, or keep ratio 0.x
              target: 80, // < 80% is comfortable
              targetLabel: '< 80%',
              unit: 'percent',
              status: (debtRatio * 100) <= 80 ? 'good' : 'warning',
              formula: 'Vreemd Vermogen / Totaal Vermogen',
              breakdown: []
          },
          {
              id: 'currentRatio',
              title: 'Current Ratio',
              value: currentRatio,
              target: 1.5,
              targetLabel: '> 1.5x',
              unit: 'ratio',
              status: currentRatio >= 1.5 ? 'good' : currentRatio >= 1.2 ? 'warning' : 'bad',
              formula: '(Debiteuren + Voorraad + Cash) / Kort Vreemd Vermogen',
              breakdown: []
          }
      ];

      return (
          <div className="animate-fade-in max-w-6xl mx-auto pb-20">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-purple-100 rounded-lg">
                      <Goal size={32} className="text-purple-800" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold text-gray-900">{t.goals}</h2>
                      <p className="text-sm text-gray-500">{t.goalsSubtitle}</p>
                  </div>
              </div>

              {/* MAIN KPIs GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {allKPIs.map(kpi => (
                      <div key={kpi.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                          <div className="p-6 flex-grow">
                              <div className="flex justify-between items-start mb-4">
                                  <h3 className="font-bold text-gray-700">{kpi.title}</h3>
                                  <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                      kpi.status === 'good' ? 'bg-emerald-100 text-emerald-700' :
                                      kpi.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                                      'bg-red-100 text-red-700'
                                  }`}>
                                      {kpi.status === 'good' ? 'OK' : kpi.status === 'warning' ? 'Check' : 'Action'}
                                  </div>
                              </div>
                              
                              <div className="flex items-baseline gap-2 mb-2">
                                  <span className={`text-3xl font-bold ${
                                      kpi.status === 'good' ? 'text-gray-900' : 
                                      kpi.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                                  }`}>
                                      {kpi.unit === 'currency' ? currencyFormatter(kpi.value) : 
                                       kpi.unit === 'percent' ? `${kpi.value.toFixed(1)}%` :
                                       kpi.unit === 'ratio' ? `${kpi.value.toFixed(2)}x` :
                                       `${kpi.value.toFixed(1)} ${t.monthShort}`}
                                  </span>
                                  <span className="text-xs text-gray-400">doel: {kpi.targetLabel}</span>
                              </div>

                              {/* Progress Bar for Percentages/Ratios */}
                              {(kpi.unit === 'percent' || kpi.unit === 'ratio' || kpi.unit === 'number') && (
                                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                                      <div 
                                          className={`h-full rounded-full transition-all duration-500 ${
                                              kpi.status === 'good' ? 'bg-emerald-500' : 
                                              kpi.status === 'warning' ? 'bg-orange-400' : 'bg-red-500'
                                          }`}
                                          style={{ width: kpi.unit === 'percent' ? `${Math.min(kpi.value, 100)}%` : '100%' }}
                                      ></div>
                                  </div>
                              )}
                              
                              <div className="text-xs text-gray-400 italic mb-4">
                                  Formule: {kpi.formula}
                              </div>

                              {/* MANUAL ADJUSTMENTS */}
                              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mb-4">
                                  <span className="text-xs font-medium text-gray-600">{t.adjust}</span>
                                  <div className="flex items-center gap-2">
                                      <button 
                                          onClick={() => {
                                              const key = kpi.id === 'liquidity' ? 'liquidity-cash' :
                                                          kpi.id === 'arap' ? 'ar' :
                                                          kpi.id === 'opex' ? 'opex' : 'recCosts';
                                              setKpiAdjustments(p => ({ ...p, [key]: (p[key] || 0) - 1000 }));
                                          }}
                                          className="p-1 hover:bg-white rounded border border-gray-200"
                                      >
                                          <Minus size={12} />
                                      </button>
                                      <button 
                                          onClick={() => {
                                              const key = kpi.id === 'liquidity' ? 'liquidity-cash' :
                                                          kpi.id === 'arap' ? 'ar' :
                                                          kpi.id === 'opex' ? 'opex' : 'recCosts';
                                              setKpiAdjustments(p => ({ ...p, [key]: (p[key] || 0) + 1000 }));
                                          }}
                                          className="p-1 hover:bg-white rounded border border-gray-200"
                                      >
                                          <Plus size={12} />
                                      </button>
                                  </div>
                              </div>

                              {/* USED DATA DROPDOWN */}
                              <details className="group border-t border-gray-100 pt-2">
                                  <summary className="text-xs font-medium text-blue-600 cursor-pointer flex items-center gap-1 hover:text-blue-800 transition-colors list-none">
                                      <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                      {t.usedData}
                                  </summary>
                                  <div className="mt-2 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                      {kpi.breakdown.map((bd, idx) => (
                                          <div key={idx}>
                                              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                                                  <span>{bd.label}</span>
                                                  <span>{currencyFormatter(bd.value)}</span>
                                              </div>
                                              {bd.items && bd.items.length > 0 && (
                                                  <div className="pl-2 border-l-2 border-gray-200 space-y-0.5">
                                                      {bd.items.slice(0, 10).map((item, i) => (
                                                          <div key={i} className="flex justify-between text-[10px] text-gray-500">
                                                              <span className="truncate max-w-[150px]">{item.name}</span>
                                                              <span>{currencyFormatter(item.value)}</span>
                                                          </div>
                                                      ))}
                                                      {bd.items.length > 10 && (
                                                          <div className="text-[10px] text-gray-400 italic">+ {bd.items.length - 10} more...</div>
                                                      )}
                                                  </div>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              </details>
                          </div>
                      </div>
                  ))}
              </div>

              {/* NEW: CASHPOSITIE SECTION */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-8 text-white">
                 <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-4">
                    <Banknote size={24} className="text-emerald-400" />
                    <div>
                        <h3 className="text-xl font-bold">Cashpositie & Ratio's</h3>
                        <p className="text-xs text-gray-400">Belangrijke liquiditeits- en solvabiliteitsindicatoren</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {cashKPIs.map(ratio => (
                         <div key={ratio.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-emerald-500/50 transition-colors">
                             <div className="flex justify-between items-start mb-4">
                                 <h4 className="font-bold text-gray-200">{ratio.title}</h4>
                                 <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                                     ratio.status === 'good' ? 'bg-emerald-900 text-emerald-400' : 
                                     ratio.status === 'warning' ? 'bg-orange-900 text-orange-400' : 'bg-red-900 text-red-400'
                                 }`}>
                                     {ratio.status === 'good' ? 'Healthy' : ratio.status === 'warning' ? 'Risk' : 'Critical'}
                                 </span>
                             </div>

                             <div className="flex items-end gap-2 mb-2">
                                 <span className={`text-3xl font-bold ${
                                     ratio.status === 'good' ? 'text-white' : 
                                     ratio.status === 'warning' ? 'text-orange-400' : 'text-red-400'
                                 }`}>
                                     {ratio.unit === 'percent' ? ratio.value.toFixed(1) + '%' : ratio.value.toFixed(2) + 'x'}
                                 </span>
                                 <span className="text-xs text-gray-500 mb-1">doel: {ratio.targetLabel}</span>
                             </div>

                             <div className="w-full bg-gray-700 rounded-full h-1.5 mb-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all ${
                                        ratio.status === 'good' ? 'bg-emerald-500' : 
                                        ratio.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: ratio.unit === 'percent' ? `${Math.min(ratio.value, 100)}%` : '100%' }}
                                ></div>
                            </div>

                             <p className="text-[10px] text-gray-400 font-mono">
                                 {ratio.formula}
                             </p>
                         </div>
                     ))}
                 </div>
              </div>
          </div>
      );
  };
  
  // Highlighting Logic for visual feedback
  const getRowClass = (itemName: string, currentSection: string) => {
      // 1. New Rule: Always highlight AR and AP
      if (currentSection === 'accountsReceivable' || currentSection === 'accountsPayable') {
           return 'bg-orange-50 text-orange-800 border-l-4 border-orange-300 pl-2';
      }

      // 2. Liquid Asset in Liabilities (Orange)
      const isLiab = ['liabilities', 'equity', 'currentAccounts', 'directObligations', 'externalFinancing'].includes(currentSection);
      if (isLiab && isLiquidItem(itemName)) {
          return 'bg-orange-50 text-orange-800 border-l-4 border-orange-300 pl-2';
      }

      // 3. R/C in Assets (Purple)
      const isAsset = ['assets', 'liquidAssets', 'investments', 'productionInProgress'].includes(currentSection);
      if (isAsset && isRCItem(itemName)) {
          return 'bg-purple-50 text-purple-800 border-l-4 border-purple-300 pl-2';
      }

      return '';
  };

  const renderChecksTab = () => {
    // We need two years selected
    const data1 = analyzeFinancials(rawData, compareYear1); // Year 1
    const data2 = analyzeFinancials(rawData, compareYear2); // Year 2

    // Logic:
    // 1. Calculate change in Asset Depreciation in Balance Sheet (Year 2 - Year 1)
    // Asset Depreciation is typically a Credit (negative) on the Asset side.
    // e.g. Year 1: -10,000. Year 2: -15,000.
    // Movement = Abs(-15,000) - Abs(-10,000) = 5,000 increase in accumulated depreciation.
    const balDep1 = Math.abs(data1.balanceSheet?.assetDepreciation.total || 0);
    const balDep2 = Math.abs(data2.balanceSheet?.assetDepreciation.total || 0);
    const depMovement = balDep2 - balDep1; // Expected Expense based on Balance Sheet movement

    // 2. Get P&L Depreciation Expense for Year 2
    const pnlDep = data2.depreciation.total || 0;

    // 3. Difference
    // Ideally should be 0.
    const diff = Math.abs(depMovement - pnlDep);
    const isMatch = diff < 5; // Tolerance for rounding

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-teal-100 rounded-lg">
                    <ShieldCheck size={32} className="text-teal-800" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t.checks}</h2>
                    <p className="text-sm text-gray-500">{t.checksSubtitle}</p>
                </div>
            </div>

            {/* Year Selectors */}
            <div className="flex justify-center gap-4 mb-10 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1">{t.selectYear1}</label>
                    <select 
                        value={compareYear1}
                        onChange={(e) => setCompareYear1(e.target.value)}
                        className="border border-gray-300 rounded p-1.5 text-sm bg-white"
                    >
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex items-center text-gray-400 mt-5">
                    <ArrowRightLeft size={20} />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1">{t.selectYear2}</label>
                    <select 
                        value={compareYear2}
                        onChange={(e) => setCompareYear2(e.target.value)}
                        className="border border-gray-300 rounded p-1.5 text-sm bg-white"
                    >
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Check Card: Depreciation */}
            <div className={`bg-white rounded-xl border-l-4 shadow-sm p-6 ${isMatch ? 'border-emerald-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{t.depCheck}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Vergelijk mutatie balans ({t.assetDepreciation}) met kosten W&V ({t.depreciation}).
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {isMatch ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {isMatch ? t.match : t.mismatch}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">{t.depMovement}</div>
                        <div className="text-2xl font-bold text-gray-800">{currencyFormatter(depMovement)}</div>
                        <div className="text-xs text-gray-400 mt-1">
                             {compareYear2} ({currencyFormatter(balDep2)}) - {compareYear1} ({currencyFormatter(balDep1)})
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center text-gray-400 font-bold text-xl">
                        vs
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">{t.pnlDepValue}</div>
                        <div className="text-2xl font-bold text-gray-800">{currencyFormatter(pnlDep)}</div>
                        <div className="text-xs text-gray-400 mt-1">
                             Uit W&V {compareYear2}
                        </div>
                    </div>
                </div>
                
                {!isMatch && (
                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                         <span className="text-red-600 font-bold bg-red-50 px-4 py-2 rounded-lg">
                             {t.checkDifference}: {currencyFormatter(diff)}
                         </span>
                    </div>
                )}
            </div>
        </div>
    );
  };

  // Data Processor
  useEffect(() => {
    if (rawData.length === 0) {
      setProcessedData(null);
      return;
    }

    const data = analyzeFinancials(rawData, selectedYear || null);
    setProcessedData(data);
    
    // Always default to annual mode (Standard Annual Figures)
    setIsAnnualMode(true);

    // Auto switch only on initial load
    if (viewMode === 'pnl' && data.balanceSheet && data.balanceSheet.totalAssets > 0 && Math.abs(data.sales.total) === 0 && !processedData) {
        setViewMode('balance');
    }
    
    if (settings.showAIAnalysis) {
      setIsLoadingAi(true);
      generateFinancialAnalysis(data, settings.language)
        .then(setAiAnalysis)
        .finally(() => setIsLoadingAi(false));
    }

  }, [rawData, settings.smallAmountFilter, hideSmallAmounts, settings.theme, settings.language, metaData, validationTotals, sortOrder, categoryOverrides, selectedYear, availableYears]);

  // Memoize Previous Year Data for Delta Calculations in AI View
  const prevYear = availableYears.length >= 2 ? availableYears[1] : null;
  const prevYearData = useMemo(() => {
      if (!prevYear || !rawData.length) return null;
      return analyzeFinancials(rawData, prevYear);
  }, [rawData, prevYear, settings.smallAmountFilter]);


  // Handlers
  const handleLoadDemo = () => {
    setUploadError(null);
    setMetaData(undefined);
    setValidationTotals([]);
    setSortOrder({});
    setCategoryOverrides({});
    setAvailableYears([]);
    setSelectedYear('');
    setCompareYear1('');
    setCompareYear2('');
    
    const mock = generateMockData(settings.language);
    setRawData(mock);
    
    // Set default years from mock
    const years = Array.from(new Set(mock.map(r => r.datum.substring(0, 4)))).sort().reverse();
    setAvailableYears(years);
    setSelectedYear(years[0]);
    if (years.length >= 2) {
        setCompareYear1(years[1]);
        setCompareYear2(years[0]);
    }
  };

  const handleReorder = (sectionId: string, newOrder: string[]) => {
    setSortOrder(prev => ({
        ...prev,
        [sectionId]: newOrder
    }));
  };

  const handleMoveItem = (itemName: string, fromSection: string, toSection: string) => {
      setCategoryOverrides(prev => ({
          ...prev,
          [itemName]: toSection
      }));
  };

  const handleExportPDF = () => {
    // Dynamically select content based on viewMode
    let elementId = 'report-content';
    if (viewMode === 'nba') elementId = 'nba-content';
    
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // @ts-ignore
    if (html2pdf) {
        const opt = {
            margin: 10,
            filename: `${settings.appName}_${viewMode === 'nba' ? 'Materiality' : 'Report'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // @ts-ignore
        html2pdf().set(opt).from(element).save();
    } else {
        alert("PDF functionaliteit is nog aan het laden. Probeer het over enkele seconden opnieuw.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setValidationTotals([]);
    setCategoryOverrides({}); 
    setAvailableYears([]);
    setSelectedYear('');
    setCompareYear1('');
    setCompareYear2('');
    
    const newRecords: FinancialRecord[] = [];
    const foundTotals: {name: string, value: number, year?: string}[] = [];
    const foundYears = new Set<string>();

    // Row processing helper
    const processRow = (datum: any, gl: any, desc: any, debet: number, credit: number, index: number, yearOverride?: string) => {
      let finalDate = yearOverride ? `${yearOverride}-12-31` : new Date().toISOString().split('T')[0];
      
      if (!yearOverride && datum) {
        if (typeof datum === 'number' && (datum as number) > 20000) {
           const d = new Date(Math.round(((datum as number) - 25569)*86400*1000));
           finalDate = d.toISOString().split('T')[0];
        } else {
           const dStr = String(datum);
           if (dStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
             const parts = dStr.split('-');
             finalDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
           } else if (dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
             finalDate = dStr;
           }
        }
      }

      // Handle combined GL - Desc
      let finalGL = String(gl || '');
      let finalDesc = String(desc || 'Onbekend');

      const combinedPattern = /^(\d{3,})\s*-\s*(.*)/;
      const glMatch = finalGL.match(combinedPattern);
      if (glMatch) {
          finalGL = glMatch[1];
          if (finalDesc === 'Onbekend' || finalDesc === '') {
              finalDesc = glMatch[2];
          }
      } else {
          const descMatch = finalDesc.match(combinedPattern);
          if (descMatch) {
              finalGL = descMatch[1];
              finalDesc = descMatch[2];
          }
      }
      
      // If still no GL but we have description and value, try to infer or keep it if description has digits
      if (!finalGL || finalGL === 'undefined') {
          // If description starts with numbers, treat as GL
          const startsWithNum = finalDesc.match(/^(\d{4})\s/);
          if (startsWithNum) {
              finalGL = startsWithNum[1];
          }
      }

      finalGL = finalGL.replace(/[^0-9]/g, '');

      // Fallback: If no GL but we have description and value, use a dummy GL based on row index to ensure it is added
      if (!finalGL && finalDesc !== 'Onbekend' && (debet !== 0 || credit !== 0)) {
           if (!finalDesc.toLowerCase().includes('totaal') && !finalDesc.toLowerCase().includes('balance')) {
               finalGL = '9999'; // Assign to Other/Unknown
           }
      }

      if (finalGL && (debet !== 0 || credit !== 0)) {
        newRecords.push({
          id: `row-${index}-${yearOverride || 'single'}`,
          datum: finalDate,
          grootboek: finalGL,
          omschrijving: finalDesc,
          debet: debet,
          credit: credit,
          type: debet > 0 ? 'debet' : 'credit'
        });
        if (yearOverride) foundYears.add(yearOverride);
      }
    };

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) throw new Error("Bestand is leeg");

        // Metadata scan
        let detectedYear = new Date().getFullYear().toString();
        let detectedPeriod = '';
        
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
           const rowStr = jsonData[i].join(' ').toLowerCase();
           const yearMatch = rowStr.match(/(?:boekjaar|jaar|year|bookyear)\s*[:]?\s*(\d{4})/);
           if (yearMatch) detectedYear = yearMatch[1];
           const periodMatch = rowStr.match(/(?:periode|period)\s*[:]?\s*(\d{1,2}(?:\s*-\s*\d{1,2})?|\d{4})/);
           if (periodMatch) detectedPeriod = periodMatch[1];
        }
        
        setMetaData({ year: detectedYear, period: detectedPeriod });

        // HEADER DETECTION
        let headerRowIndex = -1;
        let maxScore = 0;
        const keywords = ['grootboek', 'code', 'nr', 'omschrijving', 'naam', 'balans', 'bedrag', 'debet', 'credit', 'eindsaldo'];
        
        // Scan for header
        for (let i = 0; i < Math.min(jsonData.length, 25); i++) {
            const row = jsonData[i];
            if (!row || !Array.isArray(row)) continue;
            let score = 0;
            const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
            
            // Avoid metadata rows being detected as headers
            if (rowStr.includes('boekjaar') && !rowStr.includes('bedrag')) continue;

            keywords.forEach(k => { if (rowStr.includes(k)) score++; });
            
            // Year columns count as score
            const yearsInRow = row.filter(c => String(c).match(/\b20\d{2}\b/)).length;
            score += yearsInRow;

            if (score > maxScore && score >= 1) { // Relaxed score requirement
                maxScore = score;
                headerRowIndex = i;
            }
        }

        if (headerRowIndex !== -1) {
            const headerRow = jsonData[headerRowIndex].map(h => String(h).toLowerCase());
            
            // Basic Columns
            let idxGL = headerRow.findIndex(h => h.includes('grootboek') || h.includes('code') || h.includes('nr'));
            let idxDesc = headerRow.findIndex(h => h.includes('omschrijving') || h.includes('naam'));
            if (idxGL === -1 && idxDesc !== -1) idxGL = idxDesc; 
            if (idxDesc === -1) idxDesc = 0; // Fallback

            let idxDate = headerRow.findIndex(h => h.includes('datum') || h.includes('date'));
            
            // Amount Columns (Single or Split)
            let idxDebet = headerRow.findIndex(h => h.includes('debet'));
            let idxCredit = headerRow.findIndex(h => h.includes('credit'));
            let idxAmount = -1;

            if (idxDebet === -1 || idxCredit === -1) {
                idxAmount = headerRow.findIndex(h => h.includes('bedrag') || h.includes('amount') || h.includes('saldo'));
            }

            // Year Columns Detection (e.g. "Eindsaldo 2023", "2022")
            const yearCols: {index: number, year: string}[] = [];
            headerRow.forEach((h, idx) => {
                const yMatch = h.match(/\b(20\d{2})\b/);
                if (yMatch) {
                    yearCols.push({ index: idx, year: yMatch[1] });
                }
            });

            const parseVal = (v: any) => {
                if (typeof v === 'number') return v;
                if (!v) return 0;
                let s = String(v).trim();
                
                let isNegative = false;
                if (s.endsWith('-')) {
                    isNegative = true;
                    s = s.substring(0, s.length - 1);
                }

                const hasComma = s.includes(',');
                const hasDot = s.includes('.');

                if (hasComma && hasDot) {
                   if (s.indexOf('.') < s.indexOf(',')) {
                      s = s.replace(/\./g, '').replace(',', '.');
                   } else {
                      s = s.replace(/,/g, '');
                   }
                } else if (hasComma) {
                   s = s.replace(',', '.');
                }
                
                const val = parseFloat(s);
                return isNaN(val) ? 0 : (isNegative ? -val : val);
            };

            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;
                
                // VALIDATION TOTALS PARSING
                const rowStr = row.join(' ').toLowerCase();
                if (rowStr.includes('totaal') || rowStr.includes('total')) {
                    if (yearCols.length > 0) {
                        yearCols.forEach(yc => {
                            const val = parseVal(row[yc.index]);
                            if (val !== 0) {
                                foundTotals.push({ 
                                    name: String(row[idxDesc] || 'Totaal'), 
                                    value: val, // Keep absolute check later
                                    year: yc.year 
                                });
                            }
                        });
                    } else {
                        // Single year total
                        let val = 0;
                        if (idxDebet !== -1 && idxCredit !== -1) {
                            val = parseVal(row[idxDebet]) - parseVal(row[idxCredit]);
                        } else if (idxAmount !== -1) {
                            val = parseVal(row[idxAmount]);
                        } else {
                            for (let c = 0; c < row.length; c++) {
                                if (typeof row[c] === 'number') { val = row[c]; break; }
                            }
                        }
                        if (val !== 0) foundTotals.push({ name: String(row[idxDesc] || 'Totaal'), value: val });
                    }
                    continue; // Skip processing as record
                }

                // 1. MULTI-YEAR LOOP
                if (yearCols.length > 0) {
                    yearCols.forEach(yc => {
                         const val = parseVal(row[yc.index]);
                         if (val !== 0) {
                             // Logic: Positive = Debet, Negative = Credit
                             const d = val > 0 ? val : 0;
                             const c = val < 0 ? Math.abs(val) : 0;
                             
                             processRow(null, row[idxGL], row[idxDesc], d, c, i, yc.year);
                         }
                    });
                } 
                // 2. SPLIT COLUMNS (Debet / Credit)
                else if (idxDebet !== -1 && idxCredit !== -1) {
                    let d = parseVal(row[idxDebet]);
                    let c = parseVal(row[idxCredit]);
                    
                    if (d < 0) { c += Math.abs(d); d = 0; }
                    if (c < 0) { d += Math.abs(c); c = 0; }

                    processRow(row[idxDate], row[idxGL], row[idxDesc], d, c, i);
                } 
                // 3. SINGLE COLUMN (Amount)
                else if (idxAmount !== -1) {
                    const val = parseVal(row[idxAmount]);
                    const d = val > 0 ? val : 0;
                    const c = val < 0 ? Math.abs(val) : 0;
                    processRow(row[idxDate], row[idxGL], row[idxDesc], d, c, i);
                }
            }
        }
      }
      
      if (newRecords.length === 0) throw new Error("Geen geldige transactieregels gevonden in het bestand.");

      // Setup available years
      const years = Array.from(foundYears).sort().reverse();
      setAvailableYears(years);
      if (years.length > 0) {
          setSelectedYear(years[0]);
          if (years.length >= 2) {
              setCompareYear1(years[1]); // Older year
              setCompareYear2(years[0]); // Newer year
          }
      }
      
      setRawData(newRecords);
      setValidationTotals(foundTotals);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Fout bij uploaden");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const currencyFormatter = (value: number) => {
    const absVal = Math.abs(value);
    const displayVal = settings.currencyInThousands ? absVal / 1000 : absVal;
    
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: settings.currencyInThousands ? 0 : 2,
        maximumFractionDigits: settings.currencyInThousands ? 1 : 2,
    };

    let formatted = displayVal.toLocaleString(settings.language === 'nl' ? 'nl-NL' : 'en-US', options);
    
    if (settings.currencyInThousands) {
        formatted += 'k';
    }

    return value < 0 ? `-${formatted}` : formatted;
  };

  const renderValidation = (sectionName: string, calcValue: number) => {
      const match = validationTotals.find(t => {
          if (selectedYear && t.year && t.year !== selectedYear) return false;
          const n = t.name.toLowerCase();
          if (sectionName === 'Activa' && n.includes('activa') && !n.includes('vaste')) return true;
          if (sectionName === 'Passiva' && n.includes('passiva')) return true;
          if (sectionName === 'Eigen Vermogen' && n.includes('eigen vermogen')) return true;
          if (sectionName === 'Resultaat' && (n.includes('resultaat') || n.includes('winst'))) return true;
          return false;
      });

      if (match) {
          const diff = Math.abs(Math.abs(match.value) - Math.abs(calcValue));
          const isMatch = diff < 1; 

          return (
              <div className={`mt-2 text-xs flex items-center gap-1 ${isMatch ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {isMatch ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                  <span>Bron validatie: {currencyFormatter(match.value)} {isMatch ? 'OK' : '(Verschil)'}</span>
              </div>
          );
      }
      return null;
  };

  // --- EXPORT FUNCTIONS ---

  const handleCompareExport = () => {
      if (!compareYear1 || !compareYear2) return;
      
      const data1 = analyzeFinancials(rawData, compareYear1);
      const data2 = analyzeFinancials(rawData, compareYear2);

      const buildRows = (sections: {title: string, key: string, isCredit: boolean}[]) => {
          const exportRows: any[] = [];
          
          sections.forEach(s => {
              const res = renderComparisonSection(s.title, s.key, data1, data2, s.isCredit);
              // Use dynamic translations for headers
              const headerObj = { 
                  [t.description || 'Omschrijving']: s.title.toUpperCase(), 
                  [compareYear1]: '', 
                  [compareYear2]: '', 
                  [t.diff]: '', 
                  [t.diffPct]: '' 
              };
              exportRows.push(headerObj); 
              
              res.rows.forEach(r => {
                  exportRows.push({
                      [t.description || 'Omschrijving']: r.name,
                      [`${compareYear1}`]: r.val1,
                      [`${compareYear2}`]: r.val2,
                      [t.diff]: r.diff,
                      [t.diffPct]: r.diffPct / 100 // Excel formatting
                  });
              });

              exportRows.push({
                  [t.description || 'Omschrijving']: `Totaal ${s.title}`,
                  [`${compareYear1}`]: res.totals.val1,
                  [`${compareYear2}`]: res.totals.val2,
                  [t.diff]: res.totals.diff,
                  [t.diffPct]: res.totals.diffPct / 100
              });
              exportRows.push({}); // Spacer
          });
          return exportRows;
      };

      const pnlSections = [
          { title: t.salesTitle, key: 'sales', isCredit: true },
          { title: t.recurringTitle, key: 'recurring', isCredit: true },
          { title: t.cogs, key: 'cogs', isCredit: false },
          { title: t.labor, key: 'labor', isCredit: false },
          { title: t.generalExpenses, key: 'otherExpenses', isCredit: false },
          { title: t.depreciation, key: 'depreciation', isCredit: false },
          { title: t.nonOperational, key: 'nonOperationalExpenses', isCredit: false },
      ];

      const balanceSections = [
        { title: t.investments, key: 'investments', isCredit: false },
        { title: t.productionInProgress, key: 'productionInProgress', isCredit: false },
        { title: 'Overige Activa', key: 'assets', isCredit: false },
        { title: t.liquidAssets, key: 'liquidAssets', isCredit: false },
        { title: t.assetDepreciation, key: 'assetDepreciation', isCredit: false }, 
        { title: t.equity, key: 'equity', isCredit: true },
        { title: t.liabilities, key: 'liabilities', isCredit: true },
        { title: t.externalFinancing, key: 'externalFinancing', isCredit: true }, // New
        { title: t.directObligations, key: 'directObligations', isCredit: true },
        { title: t.currentAccounts, key: 'currentAccounts', isCredit: true },
      ];

      const wb = XLSX.utils.book_new();
      
      const wsPnl = XLSX.utils.json_to_sheet(buildRows(pnlSections));
      const wsBal = XLSX.utils.json_to_sheet(buildRows(balanceSections));

      XLSX.utils.book_append_sheet(wb, wsPnl, `W&V ${compareYear1}-${compareYear2}`);
      XLSX.utils.book_append_sheet(wb, wsBal, `Balans ${compareYear1}-${compareYear2}`);
      
      XLSX.writeFile(wb, `${settings.appName}_Comparison_${compareYear1}_${compareYear2}.xlsx`);
  };

  const handleNbaExcelExport = () => {
      if (!processedData) return;
      
      let baseValue = 0;
      if (nbaSettings.benchmark === 'revenue') {
          baseValue = Math.abs(processedData.sales.total + processedData.recurring.total);
      } else if (nbaSettings.benchmark === 'assets') {
          baseValue = processedData.balanceSheet?.totalAssets || 0;
      } else if (nbaSettings.benchmark === 'result') {
          baseValue = Math.abs(processedData.netIncome);
      }
      
      const initialMateriality = baseValue * (nbaSettings.percentage / 100);
      let riskModifier = 0;
      if (nbaSettings.riskProfile === 'low') riskModifier = -0.10;
      if (nbaSettings.riskProfile === 'high') riskModifier = 0.10;
      const adjustedMateriality = initialMateriality * (1 + riskModifier);
      const tolerableError = adjustedMateriality * 0.50;

      const rows = [
          { Parameter: t.benchmark, Value: nbaSettings.benchmark === 'revenue' ? t.revenue : nbaSettings.benchmark === 'assets' ? t.assets : t.result },
          { Parameter: 'Grondslag Waarde', Value: baseValue },
          { Parameter: t.percentage, Value: `${nbaSettings.percentage}%` },
          { Parameter: 'Initiële Materialiteit', Value: initialMateriality },
          { Parameter: t.riskProfile, Value: nbaSettings.riskProfile },
          { Parameter: 'Risico Correctie', Value: `${(riskModifier * 100)}%` },
          { Parameter: '---', Value: '---' },
          { Parameter: t.materiality, Value: adjustedMateriality },
          { Parameter: t.tolerableError, Value: tolerableError },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      // Auto width
      ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(wb, ws, "NBA Berekening");
      XLSX.writeFile(wb, `${settings.appName}_NBA_Materiality.xlsx`);
  };

  const handleAiExcelExport = () => {
    if (!processedData) return;
    
    // Financial Key Overview Data
    const months = isAnnualMode ? 12 : (processedData.monthCount || 1);
    const totalRev = Math.abs(processedData.sales.total + processedData.recurring.total);
    const avgRev = totalRev / months;
    const avgCost = processedData.totalExpenses / months;
    
    let investments = processedData.balanceSheet?.investments.total || 0;
    if (prevYearData) {
        investments = (investments - (prevYearData.balanceSheet?.investments.total || 0)) / months;
    }
    const cash = (processedData.balanceSheet?.liquidAssets.total || 0) + (processedData.balanceSheet?.directObligations.total || 0);

    const kpiRows = [
        { Metric: t.finOverview, Value: '' },
        { Metric: t.avgRevMonth, Value: avgRev },
        { Metric: t.avgCostMonth, Value: avgCost },
        { Metric: t.totalInvestments, Value: investments },
        { Metric: t.availableCash, Value: cash },
        { Metric: '', Value: '' }
    ];

    const aiTextRows = [
        { Metric: 'AI Analyse Tekst', Value: '' },
        { Metric: aiAnalysis.replace(/\n/g, ' '), Value: '' },
        { Metric: '', Value: '' }
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([...kpiRows, ...aiTextRows], {skipHeader: true});
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "AI Analyse");
    XLSX.writeFile(wb, `${settings.appName}_AI_Analysis.xlsx`);
  };

  // --- COMPARISON RENDERER ---
  const renderComparisonSection = (
      title: string, 
      sectionKey: keyof ProcessedData['sales'] | string, 
      data1: ProcessedData, 
      data2: ProcessedData,
      isCreditNature: boolean = false
  ) => {
     let items1: ReportItem[] = [];
     let items2: ReportItem[] = [];
     let total1 = 0;
     let total2 = 0;

     // Access dynamic path safely
     if (sectionKey in data1) {
         // @ts-ignore
         items1 = data1[sectionKey].items || [];
         // @ts-ignore
         total1 = data1[sectionKey].total || 0;
     } else if (sectionKey in data1.balanceSheet!) {
         // @ts-ignore
         items1 = data1.balanceSheet[sectionKey].items || [];
         // @ts-ignore
         total1 = data1.balanceSheet[sectionKey].total || 0;
     }

     if (sectionKey in data2) {
         // @ts-ignore
         items2 = data2[sectionKey].items || [];
         // @ts-ignore
         total2 = data2[sectionKey].total || 0;
     } else if (sectionKey in data2.balanceSheet!) {
         // @ts-ignore
         items2 = data2.balanceSheet[sectionKey].items || [];
         // @ts-ignore
         total2 = data2.balanceSheet[sectionKey].total || 0;
     }

     // Combine all unique item names
     const allNames = Array.from(new Set([...items1.map(i => i.name), ...items2.map(i => i.name)])).sort();

     // Invert sign for Credit nature items (Sales, Liabilities) so they show as positive and diff logic works intuitively
     const sign = isCreditNature ? -1 : 1;

     const rows = allNames.map(name => {
         const val1 = (items1.find(i => i.name === name)?.value || 0) * sign;
         const val2 = (items2.find(i => i.name === name)?.value || 0) * sign;
         const diff = val2 - val1;
         const diffPct = val1 !== 0 ? (diff / Math.abs(val1)) * 100 : 0;
         return { name, val1, val2, diff, diffPct };
     });

     const safeTotal1 = total1 * sign;
     const safeTotal2 = total2 * sign;
     const totalDiff = safeTotal2 - safeTotal1;
     const totalDiffPct = safeTotal1 !== 0 ? (totalDiff / Math.abs(safeTotal1)) * 100 : 0;

     return {
         title,
         rows,
         totals: { val1: safeTotal1, val2: safeTotal2, diff: totalDiff, diffPct: totalDiffPct }
     };
  };

  const renderComparisonTable = (title: string, sectionKey: string, isCredit: boolean, goodDirection: 'up' | 'down') => {
      const data1 = analyzeFinancials(rawData, compareYear1);
      const data2 = analyzeFinancials(rawData, compareYear2);
      
      const { rows, totals } = renderComparisonSection(title, sectionKey, data1, data2, isCredit);

      if (rows.length === 0) return null;

      return (
          <div className="mb-8">
              <h4 className="font-bold text-sm uppercase border-b-2 border-gray-800 pb-1 mb-3">{title}</h4>
              <table className="w-full text-sm">
                  <thead>
                      <tr className="text-gray-500 text-xs text-right">
                          <th className="text-left pb-2 w-1/4">Omschrijving</th>
                          <th className="pb-2 hidden sm:table-cell">Trend</th>
                          <th className="pb-2">{compareYear1}</th>
                          <th className="pb-2">{compareYear2}</th>
                          <th className="pb-2">{t.diff}</th>
                          <th className="pb-2">%</th>
                      </tr>
                  </thead>
                  <tbody>
                      {rows.map((row, idx) => {
                          // Determine if change is beneficial or detrimental
                          // row.diff is (Year2 - Year1) of Positive Magnitude.
                          // if goodDirection is 'up', then Increase (diff > 0) is Good (Green).
                          // if goodDirection is 'down', then Decrease (diff < 0) is Good (Green).
                          
                          const isIncrease = row.diff > 0;
                          const isBeneficial = goodDirection === 'up' ? isIncrease : !isIncrease;
                          
                          let colorClass = 'text-gray-800';
                          let trendColor = '#9CA3AF'; // Default Gray
                          
                          if (Math.abs(row.diff) > 0.01) { // Floating point tolerance
                              if (isBeneficial) {
                                  colorClass = 'text-emerald-600';
                                  trendColor = '#059669'; // Emerald 600
                              } else {
                                  colorClass = 'text-red-600';
                                  trendColor = '#DC2626'; // Red 600
                              }
                          }

                          // Background Highlight Logic
                          // Mark large differences (>20%) with a subtle background color
                          let rowBgClass = '';
                          if (Math.abs(row.diffPct) > 20 && Math.abs(row.val1) > 0) { // Ensure comparison base exists
                             rowBgClass = isBeneficial ? 'bg-emerald-50' : 'bg-red-50';
                          }

                          return (
                              <tr key={idx} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${rowBgClass}`}>
                                  <td className="py-2 pl-2 text-gray-700 truncate font-medium">{row.name}</td>
                                  <td className="py-2 text-right hidden sm:table-cell h-8">
                                      <Sparkline val1={row.val1} val2={row.val2} color={trendColor} />
                                  </td>
                                  <td className="py-2 text-right text-gray-500">{currencyFormatter(row.val1)}</td>
                                  <td className="py-2 text-right font-medium">{currencyFormatter(row.val2)}</td>
                                  <td className={`py-2 text-right ${colorClass}`}>{currencyFormatter(row.diff)}</td>
                                  <td className={`py-2 text-right pr-2 ${colorClass}`}>{row.diffPct.toFixed(1)}%</td>
                              </tr>
                          );
                      })}
                      <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                          <td className="py-2 pl-2">Totaal</td>
                          <td className="hidden sm:table-cell"></td>
                          <td className="py-2 text-right">{currencyFormatter(totals.val1)}</td>
                          <td className="py-2 text-right">{currencyFormatter(totals.val2)}</td>
                          <td className="py-2 text-right">{currencyFormatter(totals.diff)}</td>
                          <td className="py-2 text-right pr-2">{totals.diffPct.toFixed(1)}%</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      );
  };

  const renderNbaMateriality = () => {
    if (!processedData) return null;

    // 1. Determine Base Value
    let baseValue = 0;
    if (nbaSettings.benchmark === 'revenue') {
        baseValue = Math.abs(processedData.sales.total + processedData.recurring.total);
    } else if (nbaSettings.benchmark === 'assets') {
        baseValue = processedData.balanceSheet?.totalAssets || 0;
    } else if (nbaSettings.benchmark === 'result') {
        baseValue = Math.abs(processedData.netIncome);
    }

    // 2. Initial Materiality
    const initialMateriality = baseValue * (nbaSettings.percentage / 100);

    // 3. Risk Adjustment
    let riskModifier = 0;
    if (nbaSettings.riskProfile === 'low') riskModifier = -0.10;
    if (nbaSettings.riskProfile === 'high') riskModifier = 0.10;

    const adjustedMateriality = initialMateriality * (1 + riskModifier);

    // 4. Tolerable Error (50%)
    const tolerableError = adjustedMateriality * 0.50;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto" id="nba-content">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-100 rounded-lg">
                    <Calculator size={32} className="text-blue-800" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t.nbaMateriality}</h2>
                    <p className="text-sm text-gray-500">{t.matExplanation}</p>
                </div>
                
                <div className="ml-auto flex items-center gap-2">
                    <button 
                         onClick={handleNbaExcelExport}
                         className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                         <FileText size={16} /> Excel
                    </button>
                    <button 
                         onClick={handleExportPDF}
                         className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                         <FileText size={16} /> PDF
                    </button>
                    {nbaSettings.isSaved && (
                        <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 animate-fade-in">
                            <CheckCircle2 size={16} />
                            {t.saved}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* SETTINGS PANEL */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-1 h-fit">
                    <h3 className="font-bold text-lg mb-6 text-gray-800 border-b pb-2">{t.settings}</h3>
                    
                    <div className="space-y-6">
                        {/* Benchmark Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.benchmark}</label>
                            <select 
                                value={nbaSettings.benchmark}
                                onChange={(e) => {
                                    setNbaSettings(p => ({ ...p, benchmark: e.target.value as MaterialityBenchmark, isSaved: false }));
                                }}
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="revenue">{t.revenue} ({currencyFormatter(Math.abs(processedData.sales.total + processedData.recurring.total))})</option>
                                <option value="assets">{t.assets} ({currencyFormatter(processedData.balanceSheet?.totalAssets || 0)})</option>
                                <option value="result">{t.result} ({currencyFormatter(Math.abs(processedData.netIncome))})</option>
                            </select>
                        </div>

                        {/* Percentage Slider */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.percentage}: <span className="text-blue-600 font-bold">{nbaSettings.percentage.toFixed(1)}%</span>
                            </label>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="5.0" 
                                step="0.1"
                                value={nbaSettings.percentage}
                                onChange={(e) => setNbaSettings(p => ({ ...p, percentage: parseFloat(e.target.value), isSaved: false }))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>0.1%</span>
                                <span>2.0%</span>
                                <span>5.0%</span>
                            </div>
                        </div>

                        {/* Risk Profile */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.riskProfile}</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button 
                                    onClick={() => setNbaSettings(p => ({ ...p, riskProfile: 'low', isSaved: false }))}
                                    className={`px-3 py-2 rounded-lg text-sm text-left border flex justify-between items-center transition-all ${nbaSettings.riskProfile === 'low' ? 'bg-green-50 border-green-300 text-green-800 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {t.low}
                                    {nbaSettings.riskProfile === 'low' && <CheckCircle2 size={16}/>}
                                </button>
                                <button 
                                    onClick={() => setNbaSettings(p => ({ ...p, riskProfile: 'medium', isSaved: false }))}
                                    className={`px-3 py-2 rounded-lg text-sm text-left border flex justify-between items-center transition-all ${nbaSettings.riskProfile === 'medium' ? 'bg-gray-100 border-gray-300 text-gray-800 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {t.medium}
                                    {nbaSettings.riskProfile === 'medium' && <CheckCircle2 size={16}/>}
                                </button>
                                <button 
                                    onClick={() => setNbaSettings(p => ({ ...p, riskProfile: 'high', isSaved: false }))}
                                    className={`px-3 py-2 rounded-lg text-sm text-left border flex justify-between items-center transition-all ${nbaSettings.riskProfile === 'high' ? 'bg-red-50 border-red-300 text-red-800 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {t.high}
                                    {nbaSettings.riskProfile === 'high' && <CheckCircle2 size={16}/>}
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setNbaSettings(p => ({ ...p, isSaved: true }))}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                            <SaveIcon size={18} />
                            {t.saveCalculation}
                        </button>
                    </div>
                </div>

                {/* RESULTS PANEL */}
                <div className="md:col-span-2 space-y-6">
                    {/* Materiality Card */}
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Activity size={120} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{t.materiality}</h4>
                        <div className="text-4xl font-bold text-blue-900 mb-2">
                            {currencyFormatter(adjustedMateriality)}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                             <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                {((adjustedMateriality / baseValue) * 100).toFixed(2)}%
                             </span>
                             <span>van {nbaSettings.benchmark === 'revenue' ? t.revenue : nbaSettings.benchmark === 'assets' ? t.assets : t.result}</span>
                        </div>
                    </div>

                    {/* Tolerable Error Card */}
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-md relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TargetIcon size={120} />
                        </div>
                         <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{t.tolerableError} (50%)</h4>
                        <div className="text-4xl font-bold text-emerald-800 mb-2">
                            {currencyFormatter(tolerableError)}
                        </div>
                        <div className="text-sm text-gray-600">
                            Gehanteerd voor uitvoering van controles.
                        </div>
                    </div>

                    {/* Calculation Details */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-sm">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Info size={16} /> Calculation Breakdown
                        </h4>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex justify-between">
                                <span>Base Amount ({nbaSettings.benchmark}):</span>
                                <span className="font-mono">{currencyFormatter(baseValue)}</span>
                            </li>
                             <li className="flex justify-between">
                                <span>Percentage:</span>
                                <span className="font-mono">{nbaSettings.percentage.toFixed(1)}%</span>
                            </li>
                             <li className="flex justify-between border-b border-gray-300 pb-2">
                                <span>Initial:</span>
                                <span className="font-mono">{currencyFormatter(initialMateriality)}</span>
                            </li>
                             <li className="flex justify-between pt-1">
                                <span>Risk Adjustment ({nbaSettings.riskProfile}):</span>
                                <span className={`font-mono ${riskModifier > 0 ? 'text-green-600' : riskModifier < 0 ? 'text-red-600' : ''}`}>
                                    {riskModifier > 0 ? '+' : ''}{riskModifier * 100}%
                                </span>
                            </li>
                            <li className="flex justify-between font-bold pt-2 text-gray-900 border-t border-gray-300 mt-1">
                                <span>Final Materiality:</span>
                                <span className="font-mono">{currencyFormatter(adjustedMateriality)}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className={`min-h-screen text-gray-800 pb-20`} style={{ fontFamily: 'Inter, sans-serif' }}>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdateSettings={setSettings}
      />
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <WoodpeckerLogo className="h-8 w-8" />
              <span className="font-bold text-lg tracking-tight" style={{ color: themeColors.text }}>{settings.appName}</span>
              {metaData && (
                 <span className="ml-4 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500 font-medium border border-gray-200">
                    {metaData.year ? `${t.year} ${metaData.year}` : ''} {metaData.period ? `(${t.period} ${metaData.period})` : ''}
                 </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500 mr-2 hidden sm:block">
                {new Date().toLocaleDateString(settings.language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              
              {availableYears.length > 0 && settings.showPeriodSelector && (
                 <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="border border-gray-300 rounded-md text-sm px-2 py-1.5 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-1"
                 >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              )}

              {settings.showDemo && (
                <button onClick={handleLoadDemo} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full" title={t.loadDemo}>
                  <RefreshCw size={20} />
                </button>
              )}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <Settings size={20} />
              </button>
              {settings.showUser && (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 border border-white shadow-sm">
                  <User size={16} className="text-gray-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Section (if no data) */}
        {!processedData && (
          <div className="max-w-xl mx-auto mt-20 text-center">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.startAnalysis}</h2>
              <p className="text-gray-500 mb-8">{t.startAnalysisSub}</p>
              
              {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                      <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                      <span className="text-sm text-gray-500">Processing file...</span>
                  </div>
              ) : (
                <div className="relative group cursor-pointer">
                    <input 
                    type="file" 
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all">
                    <p className="font-medium text-gray-700">{t.uploadText}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.uploadSubtext}</p>
                    </div>
                </div>
              )}
              
              {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center gap-2">
                      <AlertCircle size={16} />
                      {uploadError}
                  </div>
              )}

              {settings.showUploadTemplate && (
                 <div className="mt-6 pt-6 border-t border-gray-100">
                    <button className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto">
                        <Download size={14} />
                        {t.template}
                    </button>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard (if data) */}
        {processedData && (
          <div className="animate-fade-in space-y-8">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg flex-wrap">
                  <button 
                    onClick={() => setViewMode('pnl')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'pnl' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {t.profitAndLoss}
                  </button>
                  {processedData.balanceSheet && processedData.balanceSheet.totalAssets > 0 && (
                    <button 
                        onClick={() => setViewMode('balance')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'balance' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t.balanceSheet}
                    </button>
                  )}
                  {availableYears.length >= 2 && (
                    <button 
                        onClick={() => setViewMode('compare')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'compare' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t.comparison}
                    </button>
                  )}
                  <button 
                        onClick={() => setViewMode('goals')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'goals' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                        {t.goals}
                  </button>
                  <button 
                        onClick={() => setViewMode('checks')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'checks' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                        {t.checks}
                  </button>
                  <button 
                        onClick={() => setViewMode('nba')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'nba' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                        {t.nbaMateriality}
                  </button>
                  {settings.showAIAnalysis && (
                     <button 
                        onClick={() => setViewMode('ai')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'ai' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        {t.aiTab}
                     </button>
                  )}
               </div>

               <div className="flex items-center gap-3">
                   {viewMode === 'compare' && (
                       <button
                           onClick={handleCompareExport}
                           className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                       >
                           <FileText size={16} />
                           {t.exportComparison}
                       </button>
                   )}
                   {viewMode === 'ai' && (
                       <button
                           onClick={handleAiExcelExport}
                           className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                       >
                           <FileText size={16} /> Excel Export
                       </button>
                   )}

                   <button 
                     onClick={() => setHideSmallAmounts(!hideSmallAmounts)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${hideSmallAmounts ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                   >
                     <Filter size={16} />
                     {t.smallFilter}
                   </button>
                   
                   {settings.exportButtons.includes('pdf') && (viewMode === 'pnl' || viewMode === 'balance' || viewMode === 'ai') && (
                     <button 
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                     >
                        <FileText size={16} />
                        PDF
                     </button>
                   )}
                   
                   <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                      <Upload size={16} />
                      <span className="hidden sm:inline">Nieuw Bestand</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
                   </label>
               </div>
            </div>

            {/* NBA MATERIALITY TAB */}
            {viewMode === 'nba' && renderNbaMateriality()}
            
            {/* GOALS TAB */}
            {viewMode === 'goals' && renderGoalsTab()}
            
            {/* CHECKS TAB */}
            {viewMode === 'checks' && renderChecksTab()}

            {/* PAPER REPORT VIEW */}
            {(viewMode === 'pnl' || viewMode === 'balance' || viewMode === 'compare' || viewMode === 'ai') && (
            <div id="report-content" className="bg-white shadow-xl rounded-none md:rounded-lg overflow-hidden border border-gray-200 max-w-[210mm] mx-auto min-h-[297mm] p-10 md:p-16 relative">
                 {/* Paper Header */}
                 <div className="text-center mb-12 border-b-2 border-gray-800 pb-8">
                    <h1 className="text-3xl uppercase tracking-widest font-bold text-gray-900 mb-2">{settings.appName}</h1>
                    <div className="flex justify-between items-end mt-8">
                        <div className="text-left">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t.period}</p>
                            <p className="text-lg font-medium">
                                {viewMode === 'compare' ? 
                                    `${compareYear1} vs ${compareYear2}` : 
                                    (metaData && metaData.period ? `${metaData.period} ${metaData.year}` : 
                                     metaData && metaData.year ? metaData.year : 
                                     new Date().getFullYear())
                                }
                            </p>
                        </div>
                        {viewMode !== 'compare' && (
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t.netResult}</p>
                                <p className={`text-2xl font-bold ${processedData.netIncome <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {currencyFormatter(processedData.netIncome)}
                                </p>
                            </div>
                        )}
                    </div>
                 </div>

                 {/* VISUALS ROW (Chart) - ONLY SHOW ON P&L (Health Indicator removed) */}
                 {viewMode === 'pnl' && (
                    <div className="mb-12 flex justify-center">
                        {/* Pie Chart Centered */}
                        <div className="h-48 w-full max-w-md relative flex items-center justify-center">
                             <ResponsiveContainer width="50%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={processedData.expenseDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {processedData.expenseDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val: number) => currencyFormatter(val)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                             </ResponsiveContainer>
                             {/* Legend on the right of pie */}
                             <div className="ml-4 flex flex-col justify-center gap-1 text-xs">
                                 {processedData.expenseDistribution.map(d => {
                                     // Calculate %
                                     const pct = (d.value / processedData.totalExpenses) * 100;
                                     return (
                                         <div key={d.name} className="flex items-center gap-2">
                                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                                             <span className="text-gray-600 font-medium w-24 truncate">{d.name}</span>
                                             <span className="text-gray-400">{pct.toFixed(0)}%</span>
                                         </div>
                                     );
                                 })}
                             </div>
                        </div>
                    </div>
                 )}

                 {viewMode === 'pnl' && (
                     // PROFIT & LOSS VIEW
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                        {/* LEFT COLUMN: Sales & COGS */}
                        <div>
                            <ReportTable 
                                id="sales"
                                title={t.salesTitle} 
                                section={processedData.sales} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={`${t.total} ${t.revenue}`}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />
                            
                            {/* RECURRING REVENUE SECTION - Under Sales */}
                            <ReportTable 
                                id="recurring"
                                title={t.recurringTitle} 
                                section={processedData.recurring} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />

                            <ReportTable 
                                id="cogs"
                                title={t.cogs} 
                                section={processedData.cogs} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={`${t.total} ${t.cogs}`}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />

                            <div className="mt-8 pt-4 border-t-2 border-gray-800 flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wide text-gray-900">{t.grossProfit}</span>
                                <span className="text-xl font-bold" style={{ color: themeColors.primary }}>
                                    {currencyFormatter(processedData.grossProfit)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 italic">{t.grossProfitDesc}</p>
                        </div>

                        {/* RIGHT COLUMN: Expenses */}
                        <div>
                            <ReportTable 
                                id="labor"
                                title={t.labor} 
                                section={processedData.labor} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />

                            {/* OTHER EXPENSES BLOCK - FLATTENED */}
                            <div className="mb-8">
                                <h4 className="font-bold text-sm uppercase border-b-2 border-gray-800 pb-1 mb-4">
                                    {t.otherExpenses}
                                </h4>
                                
                                <ReportTable 
                                    id="otherExpenses"
                                    title={t.generalExpenses} 
                                    section={processedData.otherExpenses} 
                                    currencyFormatter={currencyFormatter}
                                    themeColor={themeColors.text}
                                    totalLabel={t.total}
                                    onReorder={handleReorder}
                                    onMoveItem={handleMoveItem}
                                />
                                    
                                <ReportTable 
                                    id="depreciation"
                                    title={t.depreciation} 
                                    section={processedData.depreciation} 
                                    currencyFormatter={currencyFormatter}
                                    themeColor={themeColors.text}
                                    totalLabel={t.total}
                                    onReorder={handleReorder}
                                    onMoveItem={handleMoveItem}
                                />
                                
                                {/* Subtotal Operational Other - Clean line */}
                                <div className="flex justify-between items-center py-2 border-t border-gray-800 font-bold text-sm text-gray-700 mb-6">
                                    <span>{t.totalOperationalOther}</span>
                                    <span>{currencyFormatter(processedData.totalOperationalOtherExpenses)}</span>
                                </div>

                                {/* OPERATING INCOME - Distinct Block */}
                                <div className="py-4 border-y-2 border-gray-800 mb-8 flex justify-between items-center">
                                        <span className="font-bold uppercase text-gray-900">{t.operatingResult}</span>
                                        <span className={`text-lg font-bold ${processedData.operatingIncome <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {currencyFormatter(processedData.operatingIncome)}
                                        </span>
                                </div>

                                {/* Non-Operational */}
                                <ReportTable 
                                    id="nonOperationalExpenses"
                                    title={t.nonOperational} 
                                    section={processedData.nonOperationalExpenses} 
                                    currencyFormatter={currencyFormatter}
                                    themeColor={themeColors.text}
                                    totalLabel={t.total}
                                    onReorder={handleReorder}
                                    onMoveItem={handleMoveItem}
                                />

                                <div className="mt-4 pt-2 border-t-2 border-gray-800 flex justify-between items-center font-bold text-lg">
                                    <span>{t.totalExpenses} (Incl. Niet-Op)</span>
                                    <span>{currencyFormatter(processedData.totalExpenses)}</span>
                                </div>
                            </div>

                            {/* RESULTS & ADJUSTMENTS */}
                             <ReportTable 
                                id="resultsAdjustments"
                                title={t.resultsAdjustments} 
                                section={processedData.resultsAdjustments} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                            />

                        </div>
                     </div>
                 )}

                 {viewMode === 'balance' && (
                     // BALANCE SHEET VIEW
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 relative">
                         {/* Vertical Divider Line */}
                         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 hidden md:block transform -translate-x-1/2"></div>

                         {/* ASSETS */}
                         <div>
                             <h3 className="text-xl font-bold mb-6 text-gray-900 border-b-4 border-gray-900 pb-2 inline-block">{t.assets}</h3>
                             
                             {/* INVESTMENTS (TOP OF ASSETS) */}
                             <ReportTable 
                                id="investments"
                                title={t.investments} 
                                section={processedData.balanceSheet!.investments} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'investments')}
                            />

                             {/* PRODUCTION IN PROGRESS (NEW) */}
                             <ReportTable 
                                id="productionInProgress"
                                title={t.productionInProgress} 
                                section={processedData.balanceSheet!.productionInProgress} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'productionInProgress')}
                            />

                             {/* REMAINING ASSETS */}
                             <ReportTable 
                                id="assets"
                                title="Overige Activa" 
                                section={processedData.balanceSheet!.assets} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'assets')}
                            />

                             {/* DEBITEUREN / AR */}
                             <ReportTable 
                                id="accountsReceivable"
                                title="Debiteuren" 
                                section={processedData.balanceSheet!.accountsReceivable} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'accountsReceivable')}
                            />
                             
                             {/* LIQUID ASSETS (Moved to Bottom) */}
                             <ReportTable 
                                id="liquidAssets"
                                title={t.liquidAssets} 
                                section={processedData.balanceSheet!.liquidAssets} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'liquidAssets')}
                            />

                            {/* ASSET DEPRECIATION (MOVED TO BOTTOM AS REQUESTED) */}
                             <ReportTable 
                                id="assetDepreciation"
                                title={t.assetDepreciation} 
                                section={processedData.balanceSheet!.assetDepreciation} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'assetDepreciation')}
                            />
                             
                             <div className="mt-8 pt-4 border-t-4 border-gray-900 flex justify-between items-center">
                                <span className="font-bold text-lg uppercase tracking-wide">Total {t.assets}</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {currencyFormatter(processedData.balanceSheet!.totalAssets)}
                                </span>
                            </div>
                            {renderValidation('Activa', processedData.balanceSheet!.totalAssets)}
                         </div>

                         {/* LIABILITIES & EQUITY */}
                         <div>
                             <h3 className="text-xl font-bold mb-6 text-gray-900 border-b-4 border-gray-900 pb-2 inline-block">{t.liabilities} & {t.equity}</h3>
                             
                             <ReportTable 
                                id="equity"
                                title={t.equity} 
                                section={processedData.balanceSheet!.equity} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'equity')}
                            />
                             {renderValidation('Eigen Vermogen', processedData.balanceSheet!.totalEquity)}

                             <div className="my-8"></div>

                             <ReportTable 
                                id="liabilities"
                                title={t.liabilities} 
                                section={processedData.balanceSheet!.liabilities} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'liabilities')}
                            />

                            {/* EXTERNAL FINANCING (NEW) */}
                            <ReportTable 
                                id="externalFinancing"
                                title={t.externalFinancing} 
                                section={processedData.balanceSheet!.externalFinancing} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'externalFinancing')}
                            />

                             {/* CREDITEUREN / AP */}
                             <ReportTable 
                                id="accountsPayable"
                                title="Crediteuren" 
                                section={processedData.balanceSheet!.accountsPayable} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'accountsPayable')}
                            />

                             {/* DIRECT OBLIGATIONS (NEW) */}
                             <ReportTable 
                                id="directObligations"
                                title={t.directObligations} 
                                section={processedData.balanceSheet!.directObligations} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'directObligations')}
                            />

                             {/* CURRENT ACCOUNTS (R/C) */}
                             <ReportTable 
                                id="currentAccounts"
                                title={t.currentAccounts} 
                                section={processedData.balanceSheet!.currentAccounts} 
                                currencyFormatter={currencyFormatter}
                                themeColor={themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name) => getRowClass(name, 'currentAccounts')}
                            />

                             {renderValidation('Passiva', processedData.balanceSheet!.totalLiabilities + processedData.balanceSheet!.totalEquity)}

                             <div className="mt-8 pt-4 border-t-4 border-gray-900 flex justify-between items-center">
                                <span className="font-bold text-lg uppercase tracking-wide">Total {t.liabilities}</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {currencyFormatter(processedData.balanceSheet!.totalLiabilities + processedData.balanceSheet!.totalEquity)}
                                </span>
                            </div>
                         </div>
                     </div>
                 )}
                 
                 {viewMode === 'compare' && (
                     <div className="animate-fade-in">
                        <div className="flex justify-center gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-500 mb-1">{t.selectYear1}</label>
                                <select 
                                    value={compareYear1}
                                    onChange={(e) => setCompareYear1(e.target.value)}
                                    className="border border-gray-300 rounded p-1 text-sm bg-white"
                                >
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center text-gray-400 mt-4">
                                <ArrowRightLeft size={20} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-500 mb-1">{t.selectYear2}</label>
                                <select 
                                    value={compareYear2}
                                    onChange={(e) => setCompareYear2(e.target.value)}
                                    className="border border-gray-300 rounded p-1 text-sm bg-white"
                                >
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-16">
                            {/* P&L Block */}
                            <div className="w-full">
                                <h3 className="text-xl font-bold mb-6 border-b border-gray-300 pb-2 text-gray-800">{t.profitAndLoss}</h3>
                                {renderComparisonTable(t.salesTitle, 'sales', true, 'up')}
                                {renderComparisonTable(t.recurringTitle, 'recurring', true, 'up')}
                                {renderComparisonTable(t.cogs, 'cogs', false, 'down')}
                                {renderComparisonTable(t.labor, 'labor', false, 'down')}
                                {renderComparisonTable(t.generalExpenses, 'otherExpenses', false, 'down')}
                                {renderComparisonTable(t.depreciation, 'depreciation', false, 'down')}
                                {renderComparisonTable(t.nonOperational, 'nonOperationalExpenses', false, 'down')}
                            </div>
                            
                            {/* Balance Sheet Block */}
                            <div className="w-full">
                                <h3 className="text-xl font-bold mb-6 border-b border-gray-300 pb-2 text-gray-800">{t.balanceSheet}</h3>
                                {renderComparisonTable(t.investments, 'investments', false, 'up')}
                                {renderComparisonTable(t.productionInProgress, 'productionInProgress', false, 'up')}
                                {renderComparisonTable('Overige Activa', 'assets', false, 'up')}
                                {renderComparisonTable(t.liquidAssets, 'liquidAssets', false, 'up')}
                                {renderComparisonTable(t.assetDepreciation, 'assetDepreciation', false, 'down')}
                                {renderComparisonTable(t.equity, 'equity', true, 'up')}
                                {renderComparisonTable(t.liabilities, 'liabilities', true, 'down')}
                                {renderComparisonTable(t.externalFinancing, 'externalFinancing', true, 'down')}
                                {renderComparisonTable(t.directObligations, 'directObligations', true, 'down')}
                                {renderComparisonTable(t.currentAccounts, 'currentAccounts', true, 'down')}
                            </div>
                        </div>
                     </div>
                 )}

                 {viewMode === 'ai' && (
                     // AI ANALYSIS VIEW
                     <div className="animate-fade-in">
                         <div className="flex items-center gap-4 mb-8">
                             <div className="p-3 bg-gray-100 rounded-lg">
                                 <MessageSquare size={32} className="text-gray-800" />
                             </div>
                             <div>
                                 <h2 className="text-2xl font-bold text-gray-900">{t.aiReportTitle}</h2>
                                 <p className="text-sm text-gray-500">Gegenereerd door Google Gemini AI</p>
                             </div>
                         </div>

                         {/* FINANCIAL KEY OVERVIEW (NEW) */}
                         <div className="mb-10 bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-2 mb-6 gap-4">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    <Activity size={20} className="text-blue-600" />
                                    {t.finOverview}
                                </h3>
                                
                                {/* TOGGLE FOR CALCULATION BASIS */}
                                <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <span className="text-gray-500 font-medium">{t.calcBasis}</span>
                                    <div className="flex bg-white rounded border border-gray-200 overflow-hidden">
                                        <button 
                                            onClick={() => setIsAnnualMode(true)}
                                            className={`px-3 py-1 transition-colors ${isAnnualMode ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {t.annualBasis}
                                        </button>
                                        <div className="w-px bg-gray-200"></div>
                                        <button 
                                            onClick={() => setIsAnnualMode(false)}
                                            className={`px-3 py-1 transition-colors ${!isAnnualMode ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {t.actualBasis} ({processedData.monthCount} {t.months})
                                        </button>
                                    </div>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                 {/* 1. Avg Revenue/Month */}
                                 <div className="group relative p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-emerald-200 transition-colors cursor-help">
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 text-center">
                                         Formule: (Omzet + Recurring) / Aantal maanden
                                         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                                     </div>
                                     <div className="flex items-center gap-2 mb-2">
                                         <Coins size={16} className="text-emerald-600" />
                                         <span className="text-xs font-bold text-gray-500 uppercase">{t.avgRevMonth}</span>
                                     </div>
                                     <span className="text-xl font-bold text-gray-900">
                                         {(() => {
                                             const months = isAnnualMode ? 12 : (processedData.monthCount || 1);
                                             const totalRev = Math.abs(processedData.sales.total + processedData.recurring.total);
                                             return currencyFormatter(totalRev / months);
                                         })()}
                                     </span>
                                 </div>
                                 
                                 {/* 2. Avg Costs/Month */}
                                 <div className="group relative p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-red-200 transition-colors cursor-help">
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 text-center">
                                         Formule: Totale Kosten / Aantal maanden
                                         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                                     </div>
                                     <div className="flex items-center gap-2 mb-2">
                                         <BarChart3 size={16} className="text-red-600" />
                                          <span className="text-xs font-bold text-gray-500 uppercase">{t.avgCostMonth}</span>
                                     </div>
                                     <span className="text-xl font-bold text-gray-900">
                                         {(() => {
                                             const months = isAnnualMode ? 12 : (processedData.monthCount || 1);
                                             return currencyFormatter(processedData.totalExpenses / months);
                                         })()}
                                     </span>
                                 </div>

                                 {/* 3. Investments (Fixed Assets) */}
                                 <div className="group relative p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors cursor-help">
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 text-center">
                                         Formule: {prevYearData ? '(Huidige Investeringen - Vorige Investeringen) / Maanden' : 'Totale Investeringen'}
                                         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                                     </div>
                                     <div className="flex items-center gap-2 mb-2">
                                         <Landmark size={16} className="text-blue-600" />
                                          <span className="text-xs font-bold text-gray-500 uppercase">{t.totalInvestments}</span>
                                     </div>
                                     <span className="text-xl font-bold text-gray-900">
                                         {(() => {
                                             // If comparison data is available, calculate flow (Current - Prev) / Months
                                             if (prevYearData) {
                                                const currentTotal = processedData.balanceSheet?.investments.total || 0;
                                                const prevTotal = prevYearData.balanceSheet?.investments.total || 0;
                                                const diff = currentTotal - prevTotal;
                                                const months = isAnnualMode ? 12 : (processedData.monthCount || 1);
                                                return currencyFormatter(diff / months);
                                             }

                                             // Fallback to stock total if no comparison
                                             return currencyFormatter(processedData.balanceSheet?.investments.total || 0);
                                         })()}
                                     </span>
                                 </div>

                                 {/* 4. Available Cash */}
                                 <div className="group relative p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-help">
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 text-center">
                                         Formule: Liquide Middelen minus Directe Verplichtingen
                                         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                                     </div>
                                     <div className="flex items-center gap-2 mb-2">
                                         <Wallet size={16} className="text-purple-600" />
                                          <span className="text-xs font-bold text-gray-500 uppercase">{t.availableCash}</span>
                                     </div>
                                     <span className="text-xl font-bold text-gray-900">
                                         {(() => {
                                             const liquid = processedData.balanceSheet?.liquidAssets.total || 0;
                                             // Liabilities are negative (Credit). Adding them reduces the net cash.
                                             const obligations = processedData.balanceSheet?.directObligations.total || 0;
                                             
                                             // Creditors removed from this calculation as requested
                                             
                                             return currencyFormatter(liquid + obligations);
                                         })()}
                                     </span>
                                 </div>
                             </div>
                         </div>

                         {/* 2-FACTOR HEALTH INDICATOR + TAX CARD */}
                         <div className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                <TrendingUp size={20} />
                                {t.healthCheck2Factor}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Factor 1: Profitability (Net Margin) */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{t.profitability} ({t.marginLabel})</span>
                                        <span className="font-bold">
                                            {(() => {
                                                const rev = Math.abs(processedData.sales.total + processedData.recurring.total);
                                                const profit = processedData.netIncome * -1; // Convert to positive for logic
                                                const pct = rev !== 0 ? (profit / rev) * 100 : 0;
                                                return `${pct.toFixed(1)}%`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                        {/* Scale: -20% (Loss) to +40% (Profit). Range = 60. 0 is at 20/60 = 33% */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10" style={{ left: '33.33%' }}></div>
                                        {(() => {
                                             const rev = Math.abs(processedData.sales.total + processedData.recurring.total);
                                             const profit = processedData.netIncome * -1;
                                             const pct = rev !== 0 ? (profit / rev) * 100 : 0;
                                             // Map pct to 0-100 scale where -20 is 0% and 40 is 100%
                                             // Position = (pct - (-20)) / 60 * 100
                                             const leftPos = Math.max(0, Math.min(100, ((pct + 20) / 60) * 100));
                                             
                                             return (
                                                 <div 
                                                    className={`absolute top-1 bottom-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${pct >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    style={{ left: `calc(${leftPos}% - 6px)` }}
                                                 ></div>
                                             );
                                        })()}
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>-20%</span>
                                        <span>0%</span>
                                        <span>+40%</span>
                                    </div>
                                </div>

                                {/* Factor 2: Cost Structure */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{t.costStructure} ({t.costLabel})</span>
                                        <span className="font-bold">
                                            {(() => {
                                                const rev = Math.abs(processedData.sales.total + processedData.recurring.total);
                                                const costs = processedData.totalExpenses;
                                                const pct = rev !== 0 ? (costs / rev) * 100 : 0;
                                                return `${pct.toFixed(1)}%`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                        {/* Scale: 0% to 120%. Target < 80%. */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10" style={{ left: '66.66%' }}></div> {/* 80% mark approx */}
                                         {(() => {
                                             const rev = Math.abs(processedData.sales.total + processedData.recurring.total);
                                             const costs = processedData.totalExpenses;
                                             const pct = rev !== 0 ? (costs / rev) * 100 : 0;
                                             const leftPos = Math.max(0, Math.min(100, (pct / 120) * 100));
                                             
                                             return (
                                                 <div 
                                                    className={`absolute top-1 bottom-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${pct <= 90 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    style={{ left: `calc(${leftPos}% - 6px)` }}
                                                 ></div>
                                             );
                                        })()}
                                    </div>
                                     <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>0%</span>
                                        <span>80%</span>
                                        <span>120%</span>
                                    </div>
                                </div>

                                {/* Factor 3: Assessment Zone */}
                                <div className="flex flex-col justify-center items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                     <span className="text-xs font-bold text-gray-500 uppercase mb-2">Status</span>
                                     {(() => {
                                          const profit = processedData.netIncome * -1;
                                          if (profit > 0) {
                                              return <div className="text-emerald-600 font-bold text-lg bg-emerald-50 px-3 py-1 rounded-full">{t.zoneHealthy}</div>;
                                          } else if (profit > -5000) {
                                              return <div className="text-orange-600 font-bold text-lg bg-orange-50 px-3 py-1 rounded-full">{t.zoneRisk}</div>;
                                          } else {
                                              return <div className="text-red-600 font-bold text-lg bg-red-50 px-3 py-1 rounded-full">{t.zoneCritical}</div>;
                                          }
                                     })()}
                                </div>
                            </div>
                         </div>
                        
                        {/* TAX IMPACT CARD */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-800">{t.taxImpact}</h3>
                                {processedData.vpbAmount > 0 && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                        Detected
                                    </span>
                                )}
                             </div>
                             
                             <div className="flex items-center gap-6">
                                 <div className="p-4 bg-blue-50 rounded-full">
                                     <Landmark size={24} className="text-blue-600" />
                                 </div>
                                 <div>
                                     <p className="text-sm text-gray-500 mb-1">{t.taxLabel}</p>
                                     <div className="flex items-baseline gap-2">
                                         <span className="text-2xl font-bold text-gray-900">
                                             {(() => {
                                                 // Tax is usually debit (positive). Result can be profit (negative credit) or loss (positive debit).
                                                 // AI context: Result > 0 is profit.
                                                 // Here: processedData.netIncome is Credit(neg)=Profit.
                                                 
                                                 const profit = processedData.netIncome * -1; // Convert to human readable
                                                 const tax = processedData.vpbAmount;
                                                 
                                                 if (profit <= 0) return 'N/A (Loss)';
                                                 if (tax <= 0) return '0.0%';
                                                 
                                                 // Tax % of Pre-Tax Profit? Or Net?
                                                 // Usually Tax / (Profit + Tax) if Profit is Net.
                                                 // Let's assume netIncome is after tax.
                                                 const preTax = profit + tax;
                                                 const pct = preTax !== 0 ? (tax / preTax) * 100 : 0;
                                                 return `${pct.toFixed(1)}%`;
                                             })()}
                                         </span>
                                         <span className="text-sm text-gray-400">
                                            ({currencyFormatter(processedData.vpbAmount)})
                                         </span>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* AI Text Analysis */}
                        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                            <h3 className="font-bold text-lg text-blue-900 mb-2 flex items-center gap-2">
                                <MessageSquare size={18} />
                                Gemini Summary
                            </h3>
                             {isLoadingAi ? (
                                 <div className="flex items-center gap-2 text-blue-700">
                                     <Loader2 className="animate-spin" size={16} />
                                     {t.aiLoading}
                                 </div>
                             ) : (
                                 <p className="text-blue-900 leading-relaxed">
                                     {aiAnalysis}
                                 </p>
                             )}
                        </div>
                     </div>
                 )}
            </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
