

export enum ThemeName {
  TERRA_COTTA = 'Terra Cotta Landscape',
  FOREST_GREEN = 'Forest Green',
  AUTUMN_LEAVES = 'Autumn Leaves',
}

export interface ThemeColors {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  primary: string;
  text: string;
  name: string;
}

export interface FinancialRecord {
  id: string;
  boekstuknummer?: string; // Exact Online
  relatie?: string; // Exact Online
  dagboek?: string;
  grootboek: string; // Account Code
  omschrijving: string;
  datum: string; // YYYY-MM-DD
  debet: number;
  credit: number;
  type: 'debet' | 'credit'; // For validation/metadata
}

export type RiskProfile = 'low' | 'medium' | 'high';
export type MaterialityBenchmark = 'revenue' | 'assets' | 'result';

export interface NBASettings {
  benchmark: MaterialityBenchmark;
  percentage: number; // 0.5 to 2.0 usually
  riskProfile: RiskProfile;
  isSaved: boolean;
}

export interface AppSettings {
  appName: string;
  language: 'nl' | 'en';
  theme: ThemeName;
  showDemo: boolean;
  showUploadTemplate: boolean;
  showPeriodSelector: boolean;
  showAIAnalysis: boolean;
  showMachineLearning: boolean;
  showComments: boolean;
  showUser: boolean;
  exportButtons: ('pdf' | 'excel' | 'csv')[];
  currencyInThousands: boolean;
  smallAmountFilter: number; // Default 50
  analysisPeriod: number | 'custom'; // Months, or custom
  customStartDate?: string;
  customEndDate?: string;
}

export interface ReportItem {
  name: string;
  value: number;
}

export interface ReportSection {
  items: ReportItem[];
  total: number;
}

export interface ProcessedData {
  records: FinancialRecord[];
  meta?: {
    year?: string;
    period?: string;
  };
  availableYears?: string[]; // List of years found in the upload
  validationTotals?: { name: string; value: number; year?: string }[];
  
  // High level P&L
  netIncome: number;
  grossProfit: number;
  operatingIncome: number; // Bedrijfsresultaat
  totalOperationalOtherExpenses: number; // Totaal Operationele Overige Kosten
  totalExpenses: number;
  vpbAmount: number; // Vennootschapsbelasting specific amount
  monthCount: number; // Number of unique months detected

  // P&L Sections
  sales: ReportSection;
  recurring: ReportSection; // New Recurring section
  cogs: ReportSection;
  labor: ReportSection;
  otherExpenses: ReportSection;
  recurringCosts: ReportSection; // New: Recurring Costs (Opex)
  depreciation: ReportSection; // Afschrijvingen (P&L)
  nonOperationalExpenses: ReportSection;
  resultsAdjustments: ReportSection; // Resultaat gbr & Onverwerkt verleden

  // Balance Sheet Sections
  balanceSheet?: {
    investments: ReportSection; // New Investments section
    productionInProgress: ReportSection; // New: Productie in uitvoering
    assetDepreciation: ReportSection; // New: Afschrijvingen (Activa)
    liquidAssets: ReportSection; // Liquide Middelen
    accountsReceivable: ReportSection; // Debiteuren
    assets: ReportSection; // Overige Activa
    accountsPayable: ReportSection; // Crediteuren
    liabilities: ReportSection;
    externalFinancing: ReportSection; // New: Externe Financiering
    directObligations: ReportSection; // Directe Verplichtingen (Netto salaris, BTW)
    currentAccounts: ReportSection; // Rekening Couranten (R/C)
    equity: ReportSection;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };

  // Charting
  expenseDistribution: { name: string; value: number; color: string }[];
  monthlyData: { month: string; revenue: number; costs: number; result: number }[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  type?: 'income' | 'expense' | 'asset' | 'liability';
}

// KPI Interfaces
export interface KPIItem {
  id: string;
  title: string;
  value: number;
  target: number;
  targetLabel: string;
  unit: 'currency' | 'percent' | 'ratio' | 'number';
  status: 'good' | 'warning' | 'bad';
  formula: string;
  breakdown: { label: string; value: number; items?: ReportItem[] }[];
}

export interface CustomGoal {
  id: string;
  title: string;
  current: number;
  target: number;
}
