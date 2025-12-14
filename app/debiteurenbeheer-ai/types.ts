
export interface Invoice {
  id: string;
  entryNumber: string; // Boekstuknummer (Essential for Exact Online style)
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number; // in Euros
  isOpen: boolean;
  debtorId: string;
  comments?: Comment[];
}

export interface Debtor {
  id: string;
  name: string;
  creditLimit: number;
  email: string;
  riskProfile: 'Laag' | 'Gemiddeld' | 'Hoog';
}

export interface WIPItem {
  id: string;
  debtorId: string;
  description: string;
  date: string;
  estimatedAmount: number;
  status: 'Geleverd' | 'In behandeling';
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface AnalysisSummary {
  totalOutstanding: number;
  totalOverdue: number;
  doubtfulProvision: number;
  wipTotal: number;
}

export enum TimeRange {
  THREE_MONTHS = '3m',
  SIX_MONTHS = '6m',
  NINE_MONTHS = '9m',
  ONE_YEAR = '1y',
  CUSTOM = 'custom',
}

export interface ThemePalette {
  id: string;
  name: string;
  colors: {
    highRisk: string;
    mediumRisk: string;
    lowRisk: string;
    primary: string;
    text: string;
    accent?: string;
    secondaryAccent?: string;
  };
}

export interface AppSettings {
  appName: string;
  themeId: string;
}

export interface AppState {
  debtors: Debtor[];
  invoices: Invoice[];
  wipItems: WIPItem[];
  lastAnalysis?: string; // AI summary text
}
