'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Upload, 
  Download, 
  User, 
  Filter,
  RefreshCw,
  FileText,
  FileSpreadsheet, // Added
  ChevronDown,
  AlertCircle,
  Loader2,
  PieChart as PieIcon,
  CheckCircle2,
  GripVertical,
  Landmark,
  Wallet,
  Coins,
  BarChart3,
  Goal,
  Banknote,
  Minus,
  Plus,
  Building2,
  Briefcase,
  Users,
  CheckSquare, 
  Square
} from 'lucide-react';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';

import { AppSettings, ThemeName, ProcessedData, FinancialRecord, ReportSection, ReportItem, KPIItem } from './types';
import { DEFAULT_SETTINGS, THEMES, WoodpeckerLogo, TRANSLATIONS } from './constants';
import SettingsModal from './components/SettingsModal';

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
    ? ['Marketing', 'Inkoopkortingen (algemeen)', 'Kantoorbenodigdheden', 'Reis- en verblijfkosten', 'Verzuimverzekering', 'Werkgeverspremie Zorg']
    : ['Marketing', 'Purchase Discounts', 'Office Supplies', 'Travel Expenses', 'Sick Leave Insurance', 'Healthcare Premium'];
  const recurringCostItems = isNl 
    ? ['Software Abonnement', 'Lease Auto', 'Huur Pand', 'Verzekering Aansprakelijkheid', 'Schoonmaakkosten', 'Klein Onderhoud Kantoor', 'Internet & Telefonie', 'Software Licenties Microsoft', 'Servicekosten', 'Management Fee'] 
    : ['Software Subscription', 'Car Lease', 'Rent Building', 'Liability Insurance', 'Cleaning Costs', 'Small Maintenance Office', 'Internet & Phone', 'Software Licenses', 'Service Charges', 'Management Fee'];
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
    ? ['R/C Pedveg', 'RC Holding', 'RC DGA Prive', 'RC Dochter Amsterdam']
    : ['R/C Pedveg', 'RC Holding', 'RC DGA Private', 'RC Daughter Amsterdam'];

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

  // Generate data for current year and previous year
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
  getItemClass?: (itemName: string, value: number) => string;
}

const ReportTable = ({ id, title, section, currencyFormatter, themeColor, totalLabel, onReorder, onMoveItem, getItemClass }: ReportTableProps) => {
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  if (section.items.length === 0) {
      // Allow dropping into empty table
       return (
        <div 
            className="mb-8 break-inside-avoid min-h-[50px] border-2 border-dashed border-gray-100 rounded flex items-center justify-center bg-gray-50/50"
            style={{ pageBreakInside: 'avoid' }}
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
    <div className="mb-8 break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
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
            const customClass = getItemClass ? getItemClass(item.name, item.value) : '';
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

const FinVisualisatiePage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rawData, setRawData] = useState<FinancialRecord[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  
  const [metaData, setMetaData] = useState<{year?: string, period?: string} | undefined>(undefined);
  const [validationTotals, setValidationTotals] = useState<{name: string, value: number, year?: string}[]>([]);
  
  // Multi-year support
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // Sorting State: Maps section ID -> Array of Item Names
  const [sortOrder, setSortOrder] = useState<Record<string, string[]>>({});
  
  // Category Override State: Maps Item Name -> Section ID (e.g., "Bank" -> "liabilities")
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});

  const [hideSmallAmounts, setHideSmallAmounts] = useState(false);
  const [viewMode, setViewMode] = useState<'pnl' | 'balance' | 'goals'>('pnl');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Goals & KPIs State
  const [kpiAdjustments, setKpiAdjustments] = useState<Record<string, number>>({});
  const [kpiExclusions, setKpiExclusions] = useState<Record<string, string[]>>({}); // Excluded items per KPI ID
  
  const [groupFinancingLimit, setGroupFinancingLimit] = useState<number>(50000); // Default 50k
  const [rcHoldingSelection, setRcHoldingSelection] = useState<string[]>([]); 
  const [rcDgaSelection, setRcDgaSelection] = useState<string[]>([]); // DGA Selection
  const [dgaExternalDebt, setDgaExternalDebt] = useState<number>(0); // Other BV debts
  const [dgaMonthlyWithdrawal, setDgaMonthlyWithdrawal] = useState<number>(5000); // Monthly Prive
  const [personnelMaxLimit, setPersonnelMaxLimit] = useState<number>(40); // Default 40%
  
  // RC Dochter State
  const [rcDochterSelection, setRcDochterSelection] = useState<string[]>([]);
  const [rcDochterLimit, setRcDochterLimit] = useState<number>(50000);
  const [marketInterestRate, setMarketInterestRate] = useState<number>(4.0);

  const [isFreshLoad, setIsFreshLoad] = useState<boolean>(false); 

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

  // --- CORE ANALYZER FUNCTION ---
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
                         // EXCLUDE Labor-related insurances (verzuim, zorg, etc)
                         const isLaborInsurance = lowerDesc.includes('verzuim') || lowerDesc.includes('zorg') || lowerDesc.includes('premie') || lowerDesc.includes('personeel');
                         
                         if (lowerDesc.includes('huur') || lowerDesc.includes('rent ') || lowerDesc.includes('lease') || 
                             lowerDesc.includes('software') || lowerDesc.includes('licentie') || lowerDesc.includes('license') ||
                             ((lowerDesc.includes('verzekering') || lowerDesc.includes('insurance')) && !isLaborInsurance) ||
                             lowerDesc.includes('schoonmaak') || lowerDesc.includes('cleaning') ||
                             lowerDesc.includes('onderhoud') || lowerDesc.includes('maintenance') ||
                             lowerDesc.includes('internet') || lowerDesc.includes('telecom') || lowerDesc.includes('telefoon') ||
                             lowerDesc.includes('servicekosten') || lowerDesc.includes('service charge') ||
                             lowerDesc.includes('management fee') || lowerDesc.includes('managementfee') || lowerDesc.includes('beheerfee')
                         ) {
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

  // --- KPI DATA CALCULATION ---
  const kpiData = useMemo(() => {
      if (!processedData) return null;

      const getAdj = (id: string) => kpiAdjustments[id] || 0;
      const months = processedData.monthCount || 1;

      // Helper to sum items while respecting exclusions
      const getFilteredSum = (items: ReportItem[], kpiId: string): number => {
          const excluded = kpiExclusions[kpiId] || [];
          return items.filter(i => !excluded.includes(i.name)).reduce((sum, i) => sum + i.value, 0);
      };

      // Helper to get filtered item list (for breakdown display)
      const getFilteredItems = (items: ReportItem[], kpiId: string): ReportItem[] => {
         // Return ALL items, but let the UI handle the checked state based on exclusion
         return items;
      };
      
      // 1. LIQUIDITY BUFFER
      const liquidAssetsSum = getFilteredSum(processedData.balanceSheet!.liquidAssets.items, 'liquidity');
      const cash = liquidAssetsSum + getAdj('liquidity-cash');
      
      const laborSum = getFilteredSum(processedData.labor.items, 'liquidity');
      const otherExpSum = getFilteredSum(processedData.otherExpenses.items, 'liquidity');
      const fixedCostsForBuffer = (laborSum + otherExpSum) + getAdj('liquidity-costs');
      
      const avgMonthlyFixed = fixedCostsForBuffer > 0 ? fixedCostsForBuffer / months : 1;
      const liquidityMonths = cash / avgMonthlyFixed;
      
      const fixedCostsItems: ReportItem[] = [
          ...processedData.labor.items,
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
              { label: 'Direct beschikbare middelen', value: liquidAssetsSum, items: processedData.balanceSheet!.liquidAssets.items },
              { label: 'Vaste Kosten (Maandgemiddelde)', value: avgMonthlyFixed * months, items: fixedCostsItems }
          ]
      };

      // 2. AR vs AP
      const arSum = getFilteredSum(processedData.balanceSheet!.accountsReceivable.items, 'arap');
      const apSum = getFilteredSum(processedData.balanceSheet!.accountsPayable.items, 'arap');
      const ar = arSum + getAdj('ar');
      const ap = Math.abs(apSum) + getAdj('ap'); 
      const arApRatio = ap > 0 ? ar / ap : ar > 0 ? 10 : 0;

      const kpiArAp: KPIItem = {
          id: 'arap',
          title: t.arVsAp,
          value: arApRatio,
          target: 1.0,
          targetLabel: '1.0x - 2.0x',
          unit: 'ratio',
          status: (arApRatio >= 1.0 && arApRatio <= 2.0) ? 'good' : (arApRatio > 2.0) ? 'bad' : (arApRatio >= 0.8) ? 'warning' : 'bad',
          formula: 'Debiteuren / Crediteuren',
          breakdown: [
               { label: 'Debiteuren', value: arSum, items: processedData.balanceSheet!.accountsReceivable.items },
               { label: 'Crediteuren', value: apSum, items: processedData.balanceSheet!.accountsPayable.items }
          ]
      };

      // 3. OPEX RATIO
      const opexLabor = getFilteredSum(processedData.labor.items, 'opex');
      const opexOther = getFilteredSum(processedData.otherExpenses.items, 'opex');
      const opexRecurring = getFilteredSum(processedData.recurringCosts.items, 'opex');
      const opexDep = getFilteredSum(processedData.depreciation.items, 'opex');
      
      const opex = (opexLabor + opexOther + opexRecurring + opexDep) + getAdj('opex');
      
      const salesSum = getFilteredSum(processedData.sales.items, 'opex');
      const recRevSum = getFilteredSum(processedData.recurring.items, 'opex');
      const revenue = Math.abs(salesSum + recRevSum) + getAdj('revenue');
      
      const opexRatio = revenue > 0 ? (opex / revenue) * 100 : 0;

      const kpiOpex: KPIItem = {
          id: 'opex',
          title: t.opexRatio,
          value: opexRatio,
          target: 60, 
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
      const recCostsSum = getFilteredSum(processedData.recurringCosts.items, 'reccost');
      const recCosts = recCostsSum + getAdj('recCosts');
      
      const recRevSum2 = getFilteredSum(processedData.sales.items, 'reccost') + getFilteredSum(processedData.recurring.items, 'reccost');
      const revenue2 = Math.abs(recRevSum2); // Re-calc for this KPI context
      
      const recRatio = revenue2 > 0 ? (recCosts / revenue2) * 100 : 0;

      const kpiRecCost: KPIItem = {
          id: 'reccost',
          title: t.recurringCostRatio,
          subtitle: 'maandelijkse contractkosten',
          value: recRatio,
          target: 20, 
          targetLabel: '< 20%',
          unit: 'percent',
          status: recRatio <= 20 ? 'good' : recRatio <= 25 ? 'warning' : 'bad',
          formula: 'Recurring Kosten / Omzet',
          breakdown: [
              { label: 'Recurring Kosten', value: recCosts, items: processedData.recurringCosts.items },
              { label: 'Omzet', value: revenue2 }
          ]
      };

      // 5. PERSONNEL COST RATIO (Personeelskosten/Omzet)
      const laborSum2 = getFilteredSum(processedData.labor.items, 'laborRatio');
      const labor = laborSum2 + getAdj('labor');
      
      const recRevSum3 = getFilteredSum(processedData.sales.items, 'laborRatio') + getFilteredSum(processedData.recurring.items, 'laborRatio');
      const revenue3 = Math.abs(recRevSum3);

      const laborRatio = revenue3 > 0 ? (labor / revenue3) * 100 : 0;

      const kpiPersonnel: KPIItem = {
          id: 'laborRatio',
          title: 'Personeelskosten/Omzet',
          value: laborRatio,
          target: personnelMaxLimit,
          targetLabel: `25% - ${personnelMaxLimit}%`,
          unit: 'percent',
          // Healthy: 25% - Max Limit. Under 25 is Warning (maybe understaffed), Over Limit is Bad.
          status: (laborRatio >= 25 && laborRatio <= personnelMaxLimit) ? 'good' : 
                  (laborRatio < 25) ? 'warning' : 'bad',
          formula: 'Personeelskosten / Omzet',
          breakdown: [
              { label: 'Personeelskosten', value: labor, items: processedData.labor.items },
              { label: 'Omzet', value: revenue3 }
          ]
      };

      const allKPIs = [kpiLiquidity, kpiArAp, kpiOpex, kpiRecCost, kpiPersonnel];

      // --- CASHPOSITIE RATIOS ---
      const quickAssets = processedData.balanceSheet!.accountsReceivable.total + processedData.balanceSheet!.liquidAssets.total;
      const currentLiabilitiesBase = Math.abs(processedData.balanceSheet!.accountsPayable.total) + Math.abs(processedData.balanceSheet!.directObligations.total);
      const quickRatio = currentLiabilitiesBase > 0 ? quickAssets / currentLiabilitiesBase : 0;

      const totalLiabilitiesVal = Math.abs(processedData.balanceSheet!.totalLiabilities);
      const totalAssetsVal = processedData.balanceSheet!.totalAssets;
      const debtRatio = totalAssetsVal > 0 ? totalLiabilitiesVal / totalAssetsVal : 0;

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
              value: debtRatio * 100, 
              target: 80, 
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

      // --- GROEPFINANCIERING ---
      const rcHoldingItems = processedData.balanceSheet!.currentAccounts.items.filter(i => 
          rcHoldingSelection.includes(i.name)
      );
      const rcHoldingVal = Math.abs(rcHoldingItems.reduce((acc, i) => acc + i.value, 0));
      
      const rcInterestItems = processedData.nonOperationalExpenses.items.filter(i => 
          (i.name.toLowerCase().includes('rente') || i.name.toLowerCase().includes('interest')) && 
          (i.name.toLowerCase().includes('r/c') || i.name.toLowerCase().includes('holding') || i.name.toLowerCase().includes('intercompany'))
      );
      const interestToUse = rcInterestItems.length > 0 ? rcInterestItems : 
          processedData.nonOperationalExpenses.items.filter(i => i.name.toLowerCase().includes('rente') || i.name.toLowerCase().includes('interest'));
          
      const rcInterestVal = Math.abs(interestToUse.reduce((acc, i) => acc + i.value, 0));
      const grossMargin = Math.abs(processedData.grossProfit);
      
      const rcLimitUtil = groupFinancingLimit > 0 ? (rcHoldingVal / groupFinancingLimit) * 100 : 0;
      const financingPressure = totalAssetsVal > 0 ? (rcHoldingVal / totalAssetsVal) * 100 : 0;
      const interestImpact = grossMargin > 0 ? (rcInterestVal / grossMargin) * 100 : 0;

      const groupKPIs: KPIItem[] = [
          {
            id: 'rcLimit',
            title: 'RC-limiet benutting',
            value: rcLimitUtil,
            target: 70,
            targetLabel: '< 70%',
            unit: 'percent',
            status: rcLimitUtil < 60 ? 'good' : rcLimitUtil < 70 ? 'warning' : 'bad',
            formula: 'RC Positie / Kredietlimiet',
            breakdown: []
          },
          {
            id: 'finPressure',
            title: 'Interne Financieringsdruk',
            value: financingPressure,
            target: 20,
            targetLabel: '< 20%',
            unit: 'percent',
            status: financingPressure < 15 ? 'good' : financingPressure < 20 ? 'warning' : 'bad',
            formula: 'RC Holding / Totaal Vermogen',
            breakdown: []
          },
          {
            id: 'rcInterest',
            title: 'Rente op RC Holding',
            value: interestImpact,
            target: 5,
            targetLabel: '< 5%',
            unit: 'percent',
            status: interestImpact < 5 ? 'good' : 'bad',
            formula: 'Rente / Bruto Marge',
            breakdown: []
          }
      ];

      // --- RC DGA ---
      const rcDgaItems = processedData.balanceSheet!.currentAccounts.items.filter(i => rcDgaSelection.includes(i.name));
      const rcDgaVal = rcDgaItems.reduce((acc, i) => acc + i.value, 0); 
      const rcDgaPos = rcDgaVal; 
      const totalDgaDebt = rcDgaVal + dgaExternalDebt;
      
      const dgaInterestItems = processedData.nonOperationalExpenses.items.filter(i => 
          (i.name.toLowerCase().includes('rente') || i.name.toLowerCase().includes('interest')) && 
          (i.name.toLowerCase().includes('dga') || i.name.toLowerCase().includes('prive') || i.name.toLowerCase().includes('privé') || i.name.toLowerCase().includes('management'))
      );
      const dgaInterestVal = Math.abs(dgaInterestItems.reduce((acc, i) => acc + i.value, 0));
      
      const dgaMonthlyInterest = dgaInterestVal / months;
      const dgaInterestRatio = dgaMonthlyWithdrawal > 0 ? (dgaMonthlyInterest / dgaMonthlyWithdrawal) * 100 : 0;

      const dgaKPIs: KPIItem[] = [
          {
            id: 'rcDgaMax',
            title: 'Maximale RC DGA-stand',
            value: rcDgaPos,
            target: 5000,
            targetLabel: '< €5.000',
            unit: 'currency',
            status: rcDgaPos < 5000 ? 'good' : 'bad',
            formula: 'RC DGA (Debet Stand)',
            breakdown: []
          },
          {
            id: 'dgaTotalDebt',
            title: 'Fiscale grens (500k)',
            value: totalDgaDebt,
            target: 500000,
            targetLabel: '< €500k',
            unit: 'currency',
            status: totalDgaDebt < 300000 ? 'good' : totalDgaDebt < 500000 ? 'warning' : 'bad',
            formula: 'RC DGA + Overige Schulden',
            breakdown: []
          },
          {
            id: 'dgaInterest',
            title: 'Rente op RC DGA',
            value: dgaInterestRatio,
            target: 5,
            targetLabel: '< 5%',
            unit: 'percent',
            status: dgaInterestRatio < 5 ? 'good' : 'bad',
            formula: 'Rente / Maandelijkse Opnames',
            breakdown: []
          }
      ];

      // --- RC DOCHTER ---
      const rcDochterItems = processedData.balanceSheet!.currentAccounts.items.filter(i => rcDochterSelection.includes(i.name));
      const rcDochterVal = Math.abs(rcDochterItems.reduce((acc, i) => acc + i.value, 0)); 
      
      const rcDochterUtil = rcDochterLimit > 0 ? (rcDochterVal / rcDochterLimit) * 100 : 0;

      const rcDochterInterestItems = processedData.nonOperationalExpenses.items.filter(i => {
           const n = i.name.toLowerCase();
           return (n.includes('rente') || n.includes('interest')) && 
                  (n.includes('dochter') || n.includes('filiaal') || n.includes('deelneming') || n.includes('intercompany') || n.includes('rekening courant'));
      });
      
      const rcDochterInterestVal = Math.abs(rcDochterInterestItems.reduce((acc, i) => acc + i.value, 0));
      const annualizedInterest = rcDochterVal > 0 ? (rcDochterInterestVal / rcDochterVal) * (12 / months) * 100 : 0;
      const targetRate = marketInterestRate + 1.0;

      const dochterKPIs: KPIItem[] = [
          {
              id: 'rcDochterUsage',
              title: 'RC Gebruik door dochter',
              value: rcDochterUtil,
              target: 50,
              targetLabel: '< 50%',
              unit: 'percent',
              status: rcDochterUtil < 50 ? 'good' : 'bad',
              formula: 'RC Dochter / Interne Limiet',
              breakdown: []
          },
          {
              id: 'rcDochterRate',
              title: 'Intercompany rentebalans',
              value: annualizedInterest,
              target: targetRate,
              targetLabel: `< ${targetRate.toFixed(1)}%`,
              unit: 'percent',
              status: annualizedInterest <= targetRate ? 'good' : 'bad',
              formula: 'Berekende rente (geannualiseerd)',
              breakdown: []
          }
      ];

      return {
          general: allKPIs,
          cash: cashKPIs,
          group: groupKPIs,
          dga: dgaKPIs,
          dochter: dochterKPIs
      };
  }, [processedData, kpiAdjustments, groupFinancingLimit, rcHoldingSelection, rcDgaSelection, dgaExternalDebt, dgaMonthlyWithdrawal, rcDochterSelection, rcDochterLimit, marketInterestRate, personnelMaxLimit, kpiExclusions, t, settings.currencyInThousands, settings.language]);

  // Handlers for selection logic
  const toggleKpiExclusion = (kpiId: string, itemName: string) => {
      setKpiExclusions(prev => {
          const current = prev[kpiId] || [];
          if (current.includes(itemName)) {
              return { ...prev, [kpiId]: current.filter(i => i !== itemName) };
          } else {
              return { ...prev, [kpiId]: [...current, itemName] };
          }
      });
  };
  
  const setAllKpiExclusion = (kpiId: string, allItems: string[], exclude: boolean) => {
      setKpiExclusions(prev => ({
          ...prev,
          [kpiId]: exclude ? allItems : []
      }));
  };

  const renderGoalsTab = () => {
      if (!processedData || !kpiData) return null;

      // Unpack KPI Data
      const { general, cash, group, dga, dochter } = kpiData;

      return (
          <div id="goals-content" className="animate-fade-in max-w-6xl mx-auto pb-20 space-y-12">
              
              {/* SECTION 1: General Goals & KPIs */}
              <div>
                <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Goal size={32} className="text-purple-800" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t.goals}</h2>
                            <p className="text-sm text-gray-500">{t.goalsSubtitle}</p>
                        </div>
                    </div>
                    {/* Settings for Personnel Limit */}
                     <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                         <span className="text-xs font-medium text-gray-500 uppercase">Max Personeelskosten</span>
                         <div className="flex items-center gap-1">
                            <input 
                                type="number" 
                                value={personnelMaxLimit}
                                onChange={(e) => setPersonnelMaxLimit(Number(e.target.value))}
                                className="w-12 bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800 focus:outline-none focus:border-purple-500"
                            />
                            <span className="text-gray-400">%</span>
                         </div>
                     </div>
                </div>

                {/* MAIN KPIs GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {general.map(kpi => (
                        <div key={kpi.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                            <div className="p-6 grow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-700">{kpi.title}</h3>
                                        {kpi.subtitle && (
                                            <p className="text-xs text-gray-400 mt-1">{kpi.subtitle}</p>
                                        )}
                                    </div>
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
                                                            kpi.id === 'opex' ? 'opex' :
                                                            kpi.id === 'laborRatio' ? 'labor' : 'recCosts';
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
                                                            kpi.id === 'opex' ? 'opex' :
                                                            kpi.id === 'laborRatio' ? 'labor' : 'recCosts';
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
                                        {/* Global Select All / Deselect All for this KPI */}
                                        <div className="flex gap-2 mb-2 pb-2 border-b border-gray-100">
                                            <button 
                                                onClick={() => {
                                                    const allItems = kpi.breakdown.flatMap(b => b.items || []).map(i => i.name);
                                                    setAllKpiExclusion(kpi.id, [], false); // Empty exclusion = Select All
                                                }}
                                                className="text-[10px] text-blue-600 hover:underline"
                                            >
                                                Alles selecteren
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const allItems = kpi.breakdown.flatMap(b => b.items || []).map(i => i.name);
                                                    setAllKpiExclusion(kpi.id, allItems, true); // Full exclusion = Deselect All
                                                }}
                                                className="text-[10px] text-gray-500 hover:underline"
                                            >
                                                Alles deselecteren
                                            </button>
                                        </div>

                                        {kpi.breakdown.map((bd, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                                                    <span>{bd.label}</span>
                                                    <span>{currencyFormatter(bd.value)}</span>
                                                </div>
                                                {bd.items && bd.items.length > 0 && (
                                                    <div className="pl-2 border-l-2 border-gray-200 space-y-0.5">
                                                        {bd.items.map((item, i) => {
                                                            const isExcluded = (kpiExclusions[kpi.id] || []).includes(item.name);
                                                            return (
                                                                <label key={i} className={`flex justify-between items-center text-[10px] cursor-pointer hover:bg-gray-50 p-0.5 rounded ${isExcluded ? 'text-gray-400 opacity-60' : 'text-gray-600'}`}>
                                                                    <div className="flex items-center gap-2 truncate max-w-[150px]">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={!isExcluded}
                                                                            onChange={() => toggleKpiExclusion(kpi.id, item.name)}
                                                                            className="rounded text-blue-500 focus:ring-0 w-3 h-3"
                                                                        />
                                                                        <span className="truncate">{item.name}</span>
                                                                    </div>
                                                                    <span>{currencyFormatter(item.value)}</span>
                                                                </label>
                                                            );
                                                        })}
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
              </div>

              {/* SECTION 2: CASHPOSITIE SECTION */}
              <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-8 text-white break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                 <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-4">
                    <Banknote size={24} className="text-emerald-400" />
                    <div>
                        <h3 className="text-xl font-bold">Cashpositie & Ratio's</h3>
                        <p className="text-xs text-gray-400">Belangrijke liquiditeits- en solvabiliteitsindicatoren</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {cash.map(ratio => (
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

              {/* NEW SECTIONS: GROEPFINANCIERING */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Groepfinanciering */}
                 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:col-span-3 lg:col-span-2 break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 size={24} className="text-blue-700" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Groepfinanciering</h3>
                                <p className="text-sm text-gray-500">Monitoring van rekening-courant verhoudingen binnen de groep.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                             <span className="text-xs font-medium text-gray-500 uppercase">Interne Kredietlijn</span>
                             <div className="flex items-center gap-1">
                                <span className="text-gray-400">€</span>
                                <input 
                                    type="number" 
                                    value={groupFinancingLimit}
                                    onChange={(e) => setGroupFinancingLimit(Number(e.target.value))}
                                    className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                             </div>
                        </div>
                    </div>

                    {/* NEW SELECTION UI FOR RC ITEMS */}
                    <details className="mb-6 bg-gray-50 rounded-lg border border-gray-200">
                        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between">
                            <span>Selecteer Rekening-Courant Holding ({rcHoldingSelection.length})</span>
                            <ChevronDown size={16} />
                        </summary>
                        <div className="px-4 pb-3 space-y-2 border-t border-gray-200 pt-2">
                             <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={() => setRcHoldingSelection(processedData.balanceSheet!.currentAccounts.items.map(i => i.name))}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Alles selecteren
                                </button>
                                <button 
                                    onClick={() => setRcHoldingSelection([])}
                                    className="text-xs text-gray-500 hover:underline"
                                >
                                    Alles deselecteren
                                </button>
                            </div>
                            {processedData.balanceSheet!.currentAccounts.items.map(item => (
                                <label key={item.name} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                                    <input 
                                        type="checkbox"
                                        checked={rcHoldingSelection.includes(item.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setRcHoldingSelection(prev => [...prev, item.name]);
                                            } else {
                                                setRcHoldingSelection(prev => prev.filter(n => n !== item.name));
                                            }
                                        }}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="grow">{item.name}</span>
                                    <span className="font-mono text-gray-500">{currencyFormatter(item.value)}</span>
                                </label>
                            ))}
                            {processedData.balanceSheet!.currentAccounts.items.length === 0 && (
                                <div className="text-gray-400 italic text-xs">Geen rekening-courant items gevonden in balans.</div>
                            )}
                        </div>
                    </details>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {group.map(kpi => (
                             <div key={kpi.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-bold text-gray-700 text-sm">{kpi.title}</h4>
                                     <div className={`w-3 h-3 rounded-full ${
                                         kpi.status === 'good' ? 'bg-emerald-500' : kpi.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                                     }`}></div>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-2xl font-bold text-gray-800">
                                        {kpi.value.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-gray-400">doel: {kpi.targetLabel}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all ${
                                            kpi.status === 'good' ? 'bg-emerald-500' : kpi.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(kpi.value, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-gray-500">{kpi.formula}</p>
                             </div>
                        ))}
                    </div>
                 </div>

                 {/* RC DGA SECTION */}
                 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:col-span-3 lg:col-span-1 border-t-4 border-t-red-400 break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-red-50 rounded-lg">
                              <Briefcase size={24} className="text-red-700" />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-900">RC DGA</h3>
                              <p className="text-xs text-gray-500">Strikte monitoring ivm fiscus.</p>
                          </div>
                      </div>

                      {/* Manual Inputs DGA */}
                      <div className="space-y-3 mb-4 p-3 bg-red-50 rounded-lg border border-red-100 text-xs">
                          <div>
                              <label className="block font-medium text-gray-700 mb-1">Overige schulden DGA (elders)</label>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">€</span>
                                <input 
                                    type="number" 
                                    value={dgaExternalDebt}
                                    onChange={(e) => setDgaExternalDebt(Number(e.target.value))}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                          </div>
                          <div>
                              <label className="block font-medium text-gray-700 mb-1">Maandelijkse privé-opnames</label>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">€</span>
                                <input 
                                    type="number" 
                                    value={dgaMonthlyWithdrawal}
                                    onChange={(e) => setDgaMonthlyWithdrawal(Number(e.target.value))}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                          </div>
                      </div>

                      {/* Selection UI DGA */}
                      <details className="mb-4 bg-gray-50 rounded-lg border border-gray-200">
                        <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-gray-700 flex items-center justify-between">
                            <span>Selecteer RC DGA ({rcDgaSelection.length})</span>
                            <ChevronDown size={14} />
                        </summary>
                        <div className="px-3 pb-2 space-y-1 border-t border-gray-200 pt-2">
                             <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={() => setRcDgaSelection(processedData.balanceSheet!.currentAccounts.items.map(i => i.name))}
                                    className="text-[10px] text-blue-600 hover:underline"
                                >
                                    Alles selecteren
                                </button>
                                <button 
                                    onClick={() => setRcDgaSelection([])}
                                    className="text-[10px] text-gray-500 hover:underline"
                                >
                                    Alles deselecteren
                                </button>
                            </div>
                            {processedData.balanceSheet!.currentAccounts.items.map(item => (
                                <label key={item.name} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-100 p-1 rounded">
                                    <input 
                                        type="checkbox"
                                        checked={rcDgaSelection.includes(item.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setRcDgaSelection(prev => [...prev, item.name]);
                                            } else {
                                                setRcDgaSelection(prev => prev.filter(n => n !== item.name));
                                            }
                                        }}
                                        className="rounded text-red-600 focus:ring-red-500"
                                    />
                                    <span className="grow truncate">{item.name}</span>
                                    <span className="font-mono text-gray-500">{currencyFormatter(item.value)}</span>
                                </label>
                            ))}
                        </div>
                      </details>

                      <div className="space-y-4">
                         {dga.map(kpi => (
                             <div key={kpi.id} className="pb-3 border-b border-gray-100 last:border-0">
                                 <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-gray-700">{kpi.title}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        kpi.status === 'good' ? 'bg-emerald-100 text-emerald-700' : 
                                        kpi.status === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                    }`}>{kpi.status === 'good' ? 'OK' : 'LET OP'}</span>
                                 </div>
                                 <div className="flex items-baseline gap-2">
                                     <span className={`text-lg font-bold ${
                                         kpi.status === 'good' ? 'text-gray-800' : 'text-red-600'
                                     }`}>
                                         {kpi.unit === 'currency' ? currencyFormatter(kpi.value) : kpi.value.toFixed(1) + '%'}
                                     </span>
                                     <span className="text-xs text-gray-400">doel: {kpi.targetLabel}</span>
                                 </div>
                                 <p className="text-[10px] text-gray-400 italic">{kpi.formula}</p>
                             </div>
                         ))}
                      </div>
                 </div>

                 {/* RC DOCHTER SECTION */}
                 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:col-span-3 break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Users size={24} className="text-indigo-700" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">RC Dochter</h3>
                                <p className="text-sm text-gray-500">Beheer van interne limieten en transfer pricing.</p>
                            </div>
                        </div>
                        
                        {/* Settings for Dochter */}
                        <div className="flex flex-col sm:flex-row gap-3">
                             <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                 <span className="text-xs font-medium text-gray-500 uppercase">Interne Limiet</span>
                                 <div className="flex items-center gap-1">
                                    <span className="text-gray-400">€</span>
                                    <input 
                                        type="number" 
                                        value={rcDochterLimit}
                                        onChange={(e) => setRcDochterLimit(Number(e.target.value))}
                                        className="w-20 bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                                    />
                                 </div>
                             </div>
                             <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                 <span className="text-xs font-medium text-gray-500 uppercase">Marktrente</span>
                                 <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        value={marketInterestRate}
                                        onChange={(e) => setMarketInterestRate(Number(e.target.value))}
                                        step="0.1"
                                        className="w-12 bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-gray-400">%</span>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Selection UI Dochter */}
                    <details className="mb-6 bg-gray-50 rounded-lg border border-gray-200">
                        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between">
                            <span>Selecteer RC Dochter ({rcDochterSelection.length})</span>
                            <ChevronDown size={16} />
                        </summary>
                        <div className="px-4 pb-3 space-y-2 border-t border-gray-200 pt-2">
                            <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={() => setRcDochterSelection(processedData.balanceSheet!.currentAccounts.items.map(i => i.name))}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Alles selecteren
                                </button>
                                <button 
                                    onClick={() => setRcDochterSelection([])}
                                    className="text-xs text-gray-500 hover:underline"
                                >
                                    Alles deselecteren
                                </button>
                            </div>
                            {processedData.balanceSheet!.currentAccounts.items.map(item => (
                                <label key={item.name} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                                    <input 
                                        type="checkbox"
                                        checked={rcDochterSelection.includes(item.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setRcDochterSelection(prev => [...prev, item.name]);
                                            } else {
                                                setRcDochterSelection(prev => prev.filter(n => n !== item.name));
                                            }
                                        }}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="grow">{item.name}</span>
                                    <span className="font-mono text-gray-500">{currencyFormatter(item.value)}</span>
                                </label>
                            ))}
                        </div>
                    </details>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {dochter.map(kpi => (
                             <div key={kpi.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
                                <div className="mb-4 md:mb-0">
                                     <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-bold text-gray-800">{kpi.title}</h4>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            kpi.status === 'good' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {kpi.status === 'good' ? 'OK' : 'Actie'}
                                        </div>
                                     </div>
                                     <p className="text-xs text-gray-500 mb-1">Formule: {kpi.formula}</p>
                                     <span className="text-xs text-indigo-500 font-medium">Doel: {kpi.targetLabel}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-3xl font-bold ${
                                        kpi.status === 'good' ? 'text-gray-900' : 'text-red-600'
                                    }`}>
                                        {kpi.value.toFixed(1)}%
                                    </span>
                                </div>
                             </div>
                        ))}
                    </div>
                 </div>

              </div>
          </div>
      );
  };
  
  // Highlighting Logic for visual feedback
  const getRowClass = (itemName: string, currentSection: string, value: number) => {
      // 1. Updated Rule: AR and AP highlighting based on D/C logic
      if (currentSection === 'accountsReceivable') {
           // Normal is Positive (Debit). If < 0 (Credit) -> Red.
           if (value < 0) return 'bg-red-50 text-red-800 border-l-4 border-red-300 pl-2 font-bold';
           return 'bg-orange-50 text-orange-800 border-l-4 border-orange-300 pl-2';
      }
      if (currentSection === 'accountsPayable') {
           // Normal is Negative (Credit). If > 0 (Debit) -> Red.
           if (value > 0) return 'bg-red-50 text-red-800 border-l-4 border-red-300 pl-2 font-bold';
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

  // Data Processor
  useEffect(() => {
    if (rawData.length === 0) {
      setProcessedData(null);
      return;
    }

    const data = analyzeFinancials(rawData, selectedYear || null);
    setProcessedData(data);
    
    // Auto switch only on initial load
    if (viewMode === 'pnl' && data.balanceSheet && data.balanceSheet.totalAssets > 0 && Math.abs(data.sales.total) === 0 && !processedData) {
        setViewMode('balance');
    }

    // Auto-select RC Holding and DGA defaults (heuristic) if data is loaded AND it's a fresh load
    if (isFreshLoad && data.balanceSheet) {
        // Holding
        const holdingDefaults = data.balanceSheet.currentAccounts.items
            .filter(i => i.name.toLowerCase().includes('holding') || i.name.toLowerCase().includes('moeder'))
            .map(i => i.name);
        setRcHoldingSelection(holdingDefaults);
        
        // DGA
        const dgaDefaults = data.balanceSheet.currentAccounts.items
            .filter(i => {
                const n = i.name.toLowerCase();
                return n.includes('dga') || n.includes('directie') || n.includes('bestuur') || n.includes('prive') || n.includes('privé');
            })
            .map(i => i.name);
        setRcDgaSelection(dgaDefaults);

        // Dochter
        const dochterDefaults = data.balanceSheet.currentAccounts.items
            .filter(i => {
                const n = i.name.toLowerCase();
                return n.includes('dochter') || n.includes('filiaal') || n.includes('deelneming');
            })
            .map(i => i.name);
        setRcDochterSelection(dochterDefaults);
        
        setIsFreshLoad(false);
    }

  }, [rawData, settings.smallAmountFilter, hideSmallAmounts, settings.theme, settings.language, metaData, validationTotals, sortOrder, categoryOverrides, selectedYear, availableYears, isFreshLoad]);

  // Handlers
  const handleLoadDemo = () => {
    setUploadError(null);
    setMetaData(undefined);
    setValidationTotals([]);
    setSortOrder({});
    setCategoryOverrides({});
    setAvailableYears([]);
    setSelectedYear('');
    setRcHoldingSelection([]);
    setRcDgaSelection([]);
    setRcDochterSelection([]);
    
    const mock = generateMockData(settings.language);
    setRawData(mock);
    
    // Set default years from mock
    const years = Array.from(new Set(mock.map(r => r.datum.substring(0, 4)))).sort().reverse();
    setAvailableYears(years);
    setSelectedYear(years[0]);
    setIsFreshLoad(true); // Trigger default selection
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

  const handleExportPDF = async () => {
    // Dynamically select content based on viewMode
    let elementId = 'report-content';
    const isGoals = viewMode === 'goals';
    
    if (isGoals) {
        elementId = 'goals-content';
    }
    
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default || html2pdfModule;

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number], // mm
            filename: `${settings.appName}_${isGoals ? 'KPIs' : 'Rapport'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff', // Ensure white background
                windowWidth: isGoals ? 1400 : 1200 // Force wide layout for goals to keep grid
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: isGoals ? 'landscape' as const : 'portrait' as const
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error("Failed to load html2pdf", error);
        alert("PDF functionaliteit kon niet worden geladen.");
    }
  };

  const handleExportExcel = () => {
      if (!processedData) return;

      const wb = XLSX.utils.book_new();

      if (viewMode === 'goals' && kpiData) {
          // Flatten data for Goals Export
          const rows: any[] = [];
          
          const addSection = (sectionName: string, kpis: KPIItem[]) => {
              kpis.forEach(k => {
                  rows.push({
                      Sectie: sectionName,
                      KPI: k.title,
                      'Huidige Waarde': k.value,
                      'Eenheid': k.unit,
                      'Doel': k.targetLabel,
                      'Status': k.status,
                      'Formule': k.formula,
                      'Onderbouwing': k.breakdown.map(b => `${b.label}: ${Math.round(b.value)}`).join(' | ')
                  });
              });
          };

          addSection('Algemeen', kpiData.general);
          addSection('Cashpositie', kpiData.cash);
          addSection('Groepfinanciering', kpiData.group);
          addSection('RC DGA', kpiData.dga);
          addSection('RC Dochter', kpiData.dochter);

          const ws = XLSX.utils.json_to_sheet(rows);
          // Set column widths for better readability
          ws['!cols'] = [
              { wch: 20 }, // Sectie
              { wch: 30 }, // KPI
              { wch: 15 }, // Waarde
              { wch: 10 }, // Eenheid
              { wch: 15 }, // Doel
              { wch: 10 }, // Status
              { wch: 40 }, // Formule
              { wch: 60 }  // Onderbouwing
          ];
          XLSX.utils.book_append_sheet(wb, ws, "KPI Rapport");

      } else {
          // Full Financial Export (P&L + Balance)
          // 1. P&L Sheet
          const pnlRows: any[] = [];
          
          const addPnlSection = (sectionName: string, section: ReportSection) => {
              pnlRows.push({ Omschrijving: `--- ${sectionName.toUpperCase()} ---` });
              section.items.forEach(i => pnlRows.push({ Omschrijving: i.name, Bedrag: i.value }));
              pnlRows.push({ Omschrijving: `Totaal ${sectionName}`, Bedrag: section.total });
              pnlRows.push({}); // Spacer
          };

          addPnlSection('Omzet', processedData.sales);
          addPnlSection('Recurring Revenue', processedData.recurring);
          addPnlSection('Kostprijs (COGS)', processedData.cogs);
          pnlRows.push({ Omschrijving: 'BRUTO WINST', Bedrag: processedData.grossProfit });
          pnlRows.push({});
          
          addPnlSection('Personeel', processedData.labor);
          addPnlSection('Overige Kosten', processedData.otherExpenses);
          addPnlSection('Recurring Costs', processedData.recurringCosts);
          addPnlSection('Afschrijvingen', processedData.depreciation);
          pnlRows.push({ Omschrijving: 'BEDRIJFSRESULTAAT', Bedrag: processedData.operatingIncome });
          pnlRows.push({});

          addPnlSection('Niet-Operationeel', processedData.nonOperationalExpenses);
          pnlRows.push({ Omschrijving: 'NETTO RESULTAAT', Bedrag: processedData.netIncome });

          const wsPnl = XLSX.utils.json_to_sheet(pnlRows);
          wsPnl['!cols'] = [{ wch: 50 }, { wch: 15 }];
          XLSX.utils.book_append_sheet(wb, wsPnl, "Winst & Verlies");

          // 2. Balance Sheet
          if (processedData.balanceSheet) {
             const balRows: any[] = [];
             const bs = processedData.balanceSheet;

             const addBsSection = (sectionName: string, section: ReportSection) => {
                balRows.push({ Omschrijving: `--- ${sectionName.toUpperCase()} ---` });
                section.items.forEach(i => balRows.push({ Omschrijving: i.name, Bedrag: i.value }));
                balRows.push({ Omschrijving: `Totaal ${sectionName}`, Bedrag: section.total });
                balRows.push({}); 
             };

             balRows.push({ Omschrijving: '=== ACTIVA ===' });
             addBsSection('Investeringen', bs.investments);
             addBsSection('Productie in uitvoering', bs.productionInProgress);
             addBsSection('Overige Activa', bs.assets);
             addBsSection('Debiteuren', bs.accountsReceivable);
             addBsSection('Liquide Middelen', bs.liquidAssets);
             addBsSection('Afschrijving Activa', bs.assetDepreciation);
             balRows.push({ Omschrijving: 'TOTAAL ACTIVA', Bedrag: bs.totalAssets });
             balRows.push({}); 

             balRows.push({ Omschrijving: '=== PASSIVA ===' });
             addBsSection('Eigen Vermogen', bs.equity);
             addBsSection('Langlopende Schulden (Overig)', bs.liabilities);
             addBsSection('Externe Financiering', bs.externalFinancing);
             addBsSection('Crediteuren', bs.accountsPayable);
             addBsSection('Directe Verplichtingen', bs.directObligations);
             addBsSection('Rekening Couranten', bs.currentAccounts);
             balRows.push({ Omschrijving: 'TOTAAL PASSIVA', Bedrag: bs.totalLiabilities + bs.totalEquity });

             const wsBal = XLSX.utils.json_to_sheet(balRows);
             wsBal['!cols'] = [{ wch: 50 }, { wch: 15 }];
             XLSX.utils.book_append_sheet(wb, wsBal, "Balans");
          }
      }

      XLSX.writeFile(wb, `${settings.appName}_Export_${viewMode}.xlsx`);
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
    setRcHoldingSelection([]);
    setRcDgaSelection([]);
    setRcDochterSelection([]);
    
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
      }
      
      setRawData(newRecords);
      setValidationTotals(foundTotals);
      setIsFreshLoad(true); // Trigger default selection
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Fout bij uploaden");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
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
                  <button 
                        onClick={() => setViewMode('goals')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'goals' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                        {t.goals}
                  </button>
               </div>

               <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setHideSmallAmounts(!hideSmallAmounts)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${hideSmallAmounts ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                   >
                     <Filter size={16} />
                     {t.smallFilter}
                   </button>
                   
                   {settings.exportButtons.includes('excel') && (
                     <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                     >
                        <FileSpreadsheet size={16} />
                        Excel
                     </button>
                   )}

                   {settings.exportButtons.includes('pdf') && (
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

            {/* GOALS TAB */}
            {viewMode === 'goals' && renderGoalsTab()}
            
            {/* PAPER REPORT VIEW */}
            {(viewMode === 'pnl' || viewMode === 'balance') && (
            <div id="report-content" className="bg-white shadow-xl rounded-none md:rounded-lg overflow-hidden border border-gray-200 max-w-[210mm] mx-auto min-h-[297mm] p-10 md:p-16 relative">
                 {/* Paper Header */}
                 <div className="text-center mb-12 border-b-2 border-gray-800 pb-8">
                    <h1 className="text-3xl uppercase tracking-widest font-bold text-gray-900 mb-2">{settings.appName}</h1>
                    <div className="flex justify-between items-end mt-8">
                        <div className="text-left">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t.period}</p>
                            <p className="text-lg font-medium">
                                {(metaData && metaData.period ? `${metaData.period} ${metaData.year}` : 
                                     metaData && metaData.year ? metaData.year : 
                                     new Date().getFullYear())
                                }
                            </p>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t.netResult}</p>
                            <p className={`text-2xl font-bold ${processedData.netIncome <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {currencyFormatter(processedData.netIncome)}
                            </p>
                        </div>
                    </div>
                 </div>

                 {/* VISUALS ROW (Chart) - ONLY SHOW ON P&L */}
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
                                    
                                {/* NEW RECURRING COSTS TABLE */}
                                <ReportTable 
                                    id="recurringCosts"
                                    title="Recurring Kosten"
                                    section={processedData.recurringCosts} 
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
                                getItemClass={(name, value) => getRowClass(name, 'investments', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'productionInProgress', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'assets', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'accountsReceivable', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'liquidAssets', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'assetDepreciation', value)}
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
                                themeColor={processedData.balanceSheet!.equity.total > 0 ? '#DC2626' : themeColors.text}
                                totalLabel={t.total}
                                onReorder={handleReorder}
                                onMoveItem={handleMoveItem}
                                getItemClass={(name, value) => getRowClass(name, 'equity', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'liabilities', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'externalFinancing', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'accountsPayable', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'directObligations', value)}
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
                                getItemClass={(name, value) => getRowClass(name, 'currentAccounts', value)}
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
            </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FinVisualisatiePage;
