
export interface FinancialItem {
  description: string;
  amount: number;
  periodicity: 'One-off' | 'Monthly' | 'Quarterly' | 'Yearly';
  category: string;
  // Data Integrity Fields
  sourceRowIndex?: number;
  rowId?: string; // Unique combination of Sheet + Index
  validationStatus?: 'Valid' | 'Review' | 'Invalid'; 
}

export interface ContractParty {
  name: string;
  role: 'Supplier' | 'Customer' | 'Other';
  address?: string;
  vatNumber?: string;
}

export interface ContractDates {
  startDate: string;
  endDate: string;
  isAutoRenewal: boolean;
  noticePeriodDays: number;
}

export interface ContractRisk {
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  clauseReference?: string;
}

export interface SpecificationItem {
  category: string;
  description: string;
  value: string;
  unit?: string;
}

export interface CalculationItem {
  label: string;
  formula?: string;
  result: number;
  unit?: string;
}

export interface BusinessAnalysis {
  introduction: string; // Short intro story
  pros: string[];       // Benefits
  cons: string[];       // Drawbacks/Risks
  processes: string[];  // Business processes involved
  requirements: string[]; // Needs and requirements
  frameworks: string[]; // ISO, GDPR, etc.
}

export interface ContractData {
  contractType: string;
  summary: string;
  language: string;
  currency: string;
  parties: ContractParty[];
  dates: ContractDates;
  financials: {
    totalValue: number; // Annualized or Total Contract Value
    paymentTerms: string;
    items: FinancialItem[];
  };
  specifications: SpecificationItem[];
  calculations: CalculationItem[];
  risks: ContractRisk[];
  governingLaw: string;
  terminationClauseSummary: string;
  businessAnalysis?: BusinessAnalysis;
}

// Wrapper for any source (Gemini extracted or Excel imported)
export interface SourceDocument {
  id: string;
  name: string;
  type: 'AI_EXTRACTED' | 'EXCEL_SHEET' | 'MANUAL';
  data: ContractData;
  isEnabled: boolean; // For the checkbox logic
  originalFile?: File;
  sheetName?: string;
}

export interface Theme {
  name: string;
  id: string;
  colors: {
    highRisk: string;
    mediumRisk: string;
    lowRisk: string;
    primary: string;
    text: string;
    accent1?: string;
    accent2?: string;
    accent3?: string;
  };
}

export interface AnalysisSettings {
  showThousands: boolean; // Toggle for 'k' notation
  hideSmallAmounts: boolean; // Filter < 50
  currencySymbol: string;
  thresholdAmount: number; // Default 50
  showAIComments: boolean;
  appName: string;
  themeId: string;
}
