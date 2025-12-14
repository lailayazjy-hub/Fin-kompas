export enum Language {
  NL = 'NL',
  EN = 'EN'
}

export enum DateRangeOption {
  MONTHS_3 = '3M',
  MONTHS_6 = '6M',
  MONTHS_9 = '9M',
  YEAR_1 = '1Y',
  CUSTOM = 'CUSTOM'
}

export interface FinancialRecord {
  id: string;
  date: Date;
  costType: string;
  amount: number;
}

export interface MonthlyAggregatedData {
  month: string; // YYYY-MM
  displayDate: string;
  amount: number;
  costType: string;
  prevYearAmount?: number;
}

export interface Anomaly {
  id: string;
  date: Date;
  costType: string;
  amount: number;
  zScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface Comment {
  id: string;
  recordId: string; // Links to a specific data point or aggregation
  author: string;
  text: string;
  timestamp: Date;
}

export interface AIInsight {
  costType: string;
  insight: string; // Max 15 words, 2 sentences
}

export interface Translations {
  [key: string]: {
    [Language.NL]: string;
    [Language.EN]: string;
  };
}

export interface ThemeColors {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  primary: string;
  text: string;
  accents: string[];
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}
