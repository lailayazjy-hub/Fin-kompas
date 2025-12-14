export interface ProjectRecord {
  id: string;
  sourceFile: string;
  projectCode: string;
  projectName: string;
  client: string;
  period: string; // e.g. "2024-Q1" or "Jan 2024"
  year: number;
  
  // Financials
  revenue: number; // Omzet
  laborCosts: number; // Arbeidskosten
  materialCosts: number; // Materiaalkosten
  overheadCosts: number; // Overige kosten / Overhead
  
  // Computed
  totalCosts: number;
  margin: number;
  marginPercent: number;
  status: 'Healthy' | 'Warning' | 'Critical';
}

export interface FileData {
  id: string;
  name: string;
  records: ProjectRecord[];
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
  highRisk: string; // Critical Margin
  mediumRisk: string; // Warning Margin
  lowRisk: string; // Healthy Margin
  primary: string;
  text: string;
  accent?: string;
}

export interface AppSettings {
  currencyMode: CurrencyMode;
  hideSmallProjects: boolean; 
  smallProjectThreshold: number; // Revenue threshold
  theme: ThemeName;
  appName: string;
}
