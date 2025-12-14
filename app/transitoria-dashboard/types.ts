export type TransitoriaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TransitoriaCategory = 'PREPAID_COSTS' | 'ACCRUED_REVENUE' | 'DEFERRED_REVENUE' | 'ACCRUED_EXPENSES' | 'UNKNOWN';

export interface LedgerRecord {
  id: string;
  sourceFile: string;
  
  // GBR Data
  grootboekrekening: string;
  omschrijving: string;
  relatie: string; // Debtor/Creditor
  datum: string; // YYYY-MM-DD
  periode: number; // 1-12
  jaar: number;
  bedrag: number;
  
  // Analysis Fields
  detectedCategory: TransitoriaCategory;
  suggestedAllocation?: string; // e.g., "Spread 12 months"
  status: TransitoriaStatus;
  anomalyScore: number; // 0-1 (1 is high risk)
  notes?: string;
}

export interface FileData {
  id: string;
  name: string;
  records: LedgerRecord[];
  active: boolean;
}

export interface Comment {
  id: string;
  recordId?: string;
  field?: string;
  user: string;
  text: string;
  timestamp: Date;
  isManager: boolean;
}

export enum CurrencyMode {
  FULL = 'FULL',
  THOUSANDS = 'THOUSANDS' // 'k' notation
}

export type ThemeName = 'terra_cotta' | 'forest_green' | 'autumn_leaves' | 'citrus_garden';

export interface ThemeColors {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  primary: string;
  text: string;
  accent?: string; 
}

export interface AppSettings {
  currencyMode: CurrencyMode;
  hideSmallAmounts: boolean;
  smallAmountThreshold: number;
  theme: ThemeName;
  appName: string;
}
