
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum MatchingCategory {
  TIMING = 'Tijdsverschil',
  MISSING = 'Factuur ontbreekt',
  ERROR = 'Boekingsfout',
  CORRECTION = 'Correctie nodig',
  TO_CHECK = 'Nader uitzoeken',
  OK = 'Akkoord'
}

// Transaction Entry for GBR/Bank rows
export interface TransactionEntry {
  id: string;
  // Core fields
  date: string;
  description: string;
  amount: number; 
  
  // Extended fields (Exact Online style)
  dagboek?: string;
  grootboek?: string;
  reference?: string; // Boekstuknummer
  relation?: string;  // Relatienaam
  
  // Matching status
  isMatched: boolean;
  matchId?: string;

  // Manual Action fields (inspired by previous module)
  category?: MatchingCategory;
  comment?: string;
}

export interface SuspenseItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountCode: string;
  daysOpen: number;
  risk: RiskLevel;
}

export interface MatchingResult {
  bankUnmatched: TransactionEntry[]; // Set A unmatched
  ledgerUnmatched: TransactionEntry[]; // Set B unmatched
  matchedPairs: { bank: TransactionEntry; ledger: TransactionEntry }[];
  matchPercentage: number;
}

// --- Theme & Config Types ---

export type Language = 'nl' | 'en';

export interface ThemeColors {
  high: string;
  medium: string;
  low: string;
  primary: string;
  text: string;
}

export interface AppTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const THEMES: Record<string, AppTheme> = {
  TERRA_COTTA: {
    id: 'terra_cotta',
    name: 'Terra Cotta Landscape',
    colors: { high: '#D66D6B', medium: '#F3B0A9', low: '#BDD7C6', primary: '#52939D', text: '#242F4D' }
  },
  FOREST_GREEN: {
    id: 'forest_green',
    name: 'Forest Green',
    colors: { high: '#9A6C5A', medium: '#E4F46A', low: '#2E7B57', primary: '#2E7B57', text: '#14242E' }
  },
  AUTUMN_LEAVES: {
    id: 'autumn_leaves',
    name: 'Autumn Leaves',
    colors: { high: '#2E2421', medium: '#B49269', low: '#B1782F', primary: '#B1782F', text: '#8B8F92' }
  }
};

export interface AppConfig {
  appName: string;
  language: Language;
  theme: string; // Key of THEMES
  showDemo: boolean;
  showAI: boolean; 
  showExport: boolean;
  showUsername: boolean; 
  currencyKNotation: boolean;
}