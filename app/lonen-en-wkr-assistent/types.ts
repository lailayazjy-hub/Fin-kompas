
export type WKRCategory = 
  | 'Vrije ruimte'
  | 'Gerichte vrijstelling'
  | 'Nihilwaardering'
  | 'Intermediaire kosten'
  | 'Onbekend';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: WKRCategory;
  aiComment?: string; // Short AI analysis (max 15 words)
  userComment?: string;
  user?: string; // User who made the comment
  isHighRisk?: boolean; // For visual highlighting
}

export interface Employee {
  id: string;
  ref: string;
  name: string;
  contractInfo: string; // Arbeidsverband / Parttime%
  startDate: string; // Datum in dienst
  yearsService: number; // Jaren in dienst
  currentHourlyWage: number; // Huidige uurloon
  jobDescription: string; // Functie-inhoud
  startHourlyWage: number; // Instap uurloon
}

export interface SalaryScaleRow {
  scale: number;
  startSalary: number;
  steps: (number | null)[]; // Array of 12 steps, null if empty
  endSalary: number;
}

export interface Payslip {
  id: string;
  period: string;
  year: number;
  employeeRef: string;
  employeeName: string;
  grossSalary: number; // Brutoloon
  workedHours: number;
  tax: number; // Loonheffing
  zvw: number; // ZVW premie
  netAmount: number; // Netto
  runDate: string; // Datum aanmaak
  tableColor: string; // Wit/Groen
  specialRate: number; // Bijzonder tarief %
  salaryComponents: {
    description: string;
    amount: number;
    type: 'payment' | 'deduction' | 'info';
  }[];
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Negative for outgoing
  iban: string;
}

export interface AuditResult {
  employeeName: string;
  period: string;
  netSalary: number;
  bankAmount: number;
  difference: number;
  status: 'MATCH' | 'MISMATCH' | 'MISSING_BANK' | 'MISSING_SLIP';
  details: string;
}

export interface JournalEntry {
  id: string;
  accountNumber: number;
  accountName: string;
  periodDebet: number;
  periodCredit: number;
  cumulativeDebet: number;
  cumulativeCredit: number;
  period: string; // e.g., 'Mei'
  year: number; // e.g., 2022
}

export interface WageStatementEntry {
  id: string;
  employeeRef: string;
  employeeName: string;
  col3_loonInGeld: number;
  col4_loonNietInGeld: number;
  col5_fooien: number;
  col7_aftrekposten: number;
  col8_loonSv: number;
  col12_loonZvw: number;
  col14_loonLbPh: number;
  col15_ingehoudenLbPh: number;
  col16_ingehoudenZvw: number;
  col17_uitbetaald: number;
  col18_verrekendeArbeidskorting: number;
}

export interface ThemeColors {
  name: string;
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  primary: string;
  text: string;
  background: string;
}

export type ThemeName = 'Terra Cotta' | 'Forest Green' | 'Autumn Leaves';

export interface AppSettings {
  appName: string;
  theme: ThemeName;
  showDemo: boolean;
  showUploadTemplate: boolean;
  showAIAnalysis: boolean;
  showMachineLearning: boolean; // Placeholder for ML feature
  showComments: boolean;
  showUserNames: boolean;
  currencyInThousands: boolean;
  showExportButtons: boolean;
  showDatePeriod: boolean;
  totalWageBill: number; // Loonsom
}

export interface AnalysisStats {
  usedSpace: number;
  totalSpace: number;
  remainingSpace: number;
  percentageUsed: number;
  exceededAmount: number;
  estimatedTax: number; // 80% eindheffing
}
