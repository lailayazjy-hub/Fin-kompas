export enum LineItemType {
  INCOME = 'INCOME', // Bruto loon, toeslagen
  DEDUCTION = 'DEDUCTION', // Belastingen, pensioen
  INFORMATION = 'INFORMATION', // Dagen gewerkt, uurloon, etc.
  NET_PAYOUT = 'NET_PAYOUT' // Netto te betalen
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface LineItem {
  id: string;
  description: string;
  amount: number; // Stored as standard float
  currency: string;
  date?: string;
  category: string;
  type: LineItemType;
  aiRemark?: string;
  comments: Comment[];
  sourceId: string;
}

export interface FileMetadata {
  detectedHoursPerWeek?: number; // e.g. 32, 36, 40
  period?: string;
}

export interface SourceFile {
  id: string;
  name: string;
  uploadDate: string;
  lines: LineItem[];
  metadata?: FileMetadata;
  rawText?: string;
  isActive: boolean; // For the checkbox "Tabbladen aan/uitvinken"
  status: 'processing' | 'completed' | 'error';
}

export interface ThemeColors {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  primary: string;
  text: string;
  accent1?: string;
  accent2?: string;
}

export interface AppTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface AppSettings {
  showSmallAmounts: boolean; // < €50 filter
  currencyMode: 'full' | 'k'; // 'EUR 1.000,-' vs '1k'
  showAiRemarks: boolean;
  demoMode: boolean;
  userName: string;
  // New Branding Settings
  appName: string;
  themeId: string;
}
