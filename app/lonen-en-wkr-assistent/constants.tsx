
import React from 'react';
import { ThemeColors, ThemeName, SalaryScaleRow, Payslip, BankTransaction, JournalEntry, WageStatementEntry } from './types';

export const THEMES: Record<ThemeName, ThemeColors> = {
  'Terra Cotta': {
    name: 'Terra Cotta Landscape',
    highRisk: '#D66D6B',
    mediumRisk: '#F3B0A9',
    lowRisk: '#BDD7C6',
    primary: '#52939D',
    text: '#242F4D',
    background: '#FFFFFF',
  },
  'Forest Green': {
    name: 'Forest Green',
    highRisk: '#9A6C5A',
    mediumRisk: '#E4F46A',
    lowRisk: '#2E7B57',
    primary: '#2E7B57',
    text: '#14242E',
    background: '#FFFFFF',
  },
  'Autumn Leaves': {
    name: 'Autumn Leaves',
    highRisk: '#2E2421',
    mediumRisk: '#B49269',
    lowRisk: '#B1782F',
    primary: '#B1782F',
    text: '#8B8F92',
    background: '#FFFFFF',
  },
};

export const DEFAULT_SETTINGS = {
  appName: 'WKR Dashboard',
  theme: 'Terra Cotta' as ThemeName,
  showDemo: true,
  showUploadTemplate: true,
  showAIAnalysis: true,
  showMachineLearning: false,
  showComments: true,
  showUserNames: true,
  currencyInThousands: false,
  showExportButtons: true,
  showDatePeriod: true,
  totalWageBill: 450000,
};

// Subtle Woodpecker Logo as described
export const WoodpeckerLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="App Logo"
  >
    <circle cx="50" cy="50" r="48" fill="#F0F0F0" />
    {/* Tree Trunk */}
    <path d="M70 100L65 5L85 5L90 100H70Z" fill="#A89F91" opacity="0.6"/>
    {/* Woodpecker Body */}
    <path d="M55 45 C 50 40, 45 45, 45 55 C 45 65, 55 65, 58 55" fill="#2C2C2C" />
    <path d="M55 45 L 53 40 L 58 38 Z" fill="#2C2C2C" />
    {/* White Chest */}
    <path d="M55 48 Q 50 50, 52 58" stroke="white" strokeWidth="3" fill="none" />
    {/* Red Spot */}
    <circle cx="57" cy="39" r="1.5" fill="#D66D6B" />
  </svg>
);

export const MOCK_EXPENSES = [
  { id: '1', date: '2024-01-15', description: 'Kerstpakketten 2023 nalevering', amount: 3500, category: 'Vrije ruimte', aiComment: 'Traditionele geschenken vallen in vrije ruimte.', isHighRisk: false },
  { id: '2', date: '2024-02-10', description: 'OV-kaarten woon-werk', amount: 1200, category: 'Gerichte vrijstelling', aiComment: 'OV voor woon-werk is gericht vrijgesteld.', isHighRisk: false },
  { id: '3', date: '2024-03-05', description: 'Luxe lunch externe locatie', amount: 450, category: 'Vrije ruimte', aiComment: 'Maaltijden buiten kantine zijn deels belast.', isHighRisk: true },
  { id: '4', date: '2024-03-20', description: 'Cursus Boekhouden', amount: 2500, category: 'Gerichte vrijstelling', aiComment: 'Opleiding voor beroep is vrijgesteld.', isHighRisk: false },
  { id: '5', date: '2024-04-02', description: 'Koffie op kantoor', amount: 150, category: 'Nihilwaardering', aiComment: 'Consumpties op werkplek zijn nihil.', isHighRisk: false },
  { id: '6', date: '2024-04-15', description: 'Cadeaubon verjaardag', amount: 25, category: 'Vrije ruimte', aiComment: 'Kleine geschenken zijn vrije ruimte.', isHighRisk: false },
] as const;

export const MOCK_EMPLOYEES = [
  { id: '1', ref: 'EMP001', name: 'J. de Vries', contractInfo: '40u / 100%', startDate: '2018-05-01', yearsService: 6, currentHourlyWage: 28.50, jobDescription: 'Financieel Analist', startHourlyWage: 22.00 },
  { id: '2', ref: 'EMP002', name: 'S. Bakker', contractInfo: '32u / 80%', startDate: '2020-01-15', yearsService: 4, currentHourlyWage: 24.75, jobDescription: 'HR Medewerker', startHourlyWage: 21.50 },
  { id: '3', ref: 'EMP003', name: 'M. Jansen', contractInfo: '40u / 100%', startDate: '2015-11-01', yearsService: 8, currentHourlyWage: 35.00, jobDescription: 'Teamleider IT', startHourlyWage: 26.00 },
];

export const MOCK_SALARY_SCALES: SalaryScaleRow[] = [
  { scale: 1, startSalary: 1500.00, endSalary: 1800.00, steps: [1525.00, 1550.00, 1575.00, 1600.00, 1625.00, 1650.00, 1675.00, 1700.00, 1725.00, null, 1775.00, 1800.00] },
  { scale: 2, startSalary: 1800.00, endSalary: 2100.00, steps: [1825.00, 1850.00, 1875.00, 1900.00, 1925.00, 1950.00, 1975.00, 2000.00, 2025.00, null, 2075.00, 2100.00] },
  { scale: 3, startSalary: 2100.00, endSalary: 2400.00, steps: [2125.00, 2150.00, 2175.00, 2200.00, 2225.00, 2250.00, 2275.00, 2300.00, 2325.00, null, 2375.00, 2400.00] },
  { scale: 4, startSalary: 2400.00, endSalary: 2700.00, steps: [2425.00, 2450.00, 2475.00, 2500.00, 2525.00, 2550.00, 2575.00, 2600.00, 2625.00, null, 2675.00, 2700.00] },
  { scale: 5, startSalary: 2700.00, endSalary: 3000.00, steps: [2725.00, 2750.00, 2775.00, 2800.00, 2825.00, 2850.00, 2875.00, 2900.00, 2925.00, null, 2975.00, 3000.00] },
  { scale: 6, startSalary: 3000.00, endSalary: 3300.00, steps: [3025.00, 3050.00, 3075.00, 3100.00, 3125.00, 3150.00, 3175.00, 3200.00, 3225.00, null, 3275.00, 3300.00] },
  { scale: 7, startSalary: 3300.00, endSalary: 3600.00, steps: [3325.00, 3350.00, 3375.00, 3400.00, 3425.00, 3450.00, 3475.00, 3500.00, 3525.00, null, 3575.00, 3600.00] },
  { scale: 8, startSalary: 3600.00, endSalary: 3900.00, steps: [3625.00, 3650.00, 3675.00, 3700.00, 3725.00, 3750.00, 3775.00, 3800.00, 3825.00, null, 3875.00, 3900.00] },
  { scale: 9, startSalary: 3900.00, endSalary: 4200.00, steps: [3925.00, 3950.00, 3975.00, 4000.00, 4025.00, 4050.00, 4075.00, 4100.00, 4125.00, null, 4175.00, 4200.00] },
  { scale: 10, startSalary: 4200.00, endSalary: 4500.00, steps: [4225.00, 4250.00, 4275.00, 4300.00, 4325.00, 4350.00, 4375.00, 4400.00, 4425.00, null, 4475.00, 4500.00] },
  { scale: 11, startSalary: 4500.00, endSalary: 4800.00, steps: [4525.00, 4550.00, 4575.00, 4600.00, 4625.00, 4650.00, 4675.00, 4700.00, 4725.00, null, 4775.00, 4800.00] },
  { scale: 12, startSalary: 4800.00, endSalary: 5100.00, steps: [4825.00, 4850.00, 4875.00, 4900.00, 4925.00, 4950.00, 4975.00, 5000.00, 5025.00, null, 5075.00, 5100.00] },
  { scale: 13, startSalary: 5100.00, endSalary: 5400.00, steps: [5125.00, 5150.00, 5175.00, 5200.00, 5225.00, 5250.00, 5275.00, 5300.00, 5325.00, null, 5375.00, 5400.00] },
  { scale: 14, startSalary: 5400.00, endSalary: 5700.00, steps: [5425.00, 5450.00, 5475.00, 5500.00, 5525.00, 5550.00, 5575.00, 5600.00, 5625.00, null, 5675.00, 5700.00] },
];

export const MOCK_PAYSLIPS: Payslip[] = [
  { 
    id: '1', 
    period: 'Juni', 
    year: 2024,
    employeeRef: 'EMP001', 
    employeeName: 'J. de Vries', 
    grossSalary: 4000.00, 
    workedHours: 160,
    tax: 1200.00,
    zvw: 0.00, // Often paid by employer, visible on slip for info
    netAmount: 2850.00,
    runDate: '24-06-2024',
    tableColor: 'Wit',
    specialRate: 49.50,
    salaryComponents: [
      { description: 'Salaris (uit uren)', amount: 4000.00, type: 'payment' },
      { description: 'Reiskostenvergoeding', amount: 50.00, type: 'payment' },
      { description: 'Loonheffing', amount: -1200.00, type: 'deduction' }
    ]
  },
  { 
    id: '2', 
    period: 'Juni', 
    year: 2024,
    employeeRef: 'EMP002', 
    employeeName: 'S. Bakker', 
    grossSalary: 2900.00, 
    workedHours: 128,
    tax: 750.00,
    zvw: 0.00,
    netAmount: 2150.00,
    runDate: '24-06-2024',
    tableColor: 'Wit',
    specialRate: 37.10,
    salaryComponents: [
        { description: 'Salaris', amount: 2900.00, type: 'payment' },
        { description: 'Loonheffing', amount: -750.00, type: 'deduction' }
    ]
  },
  { 
    id: '3', 
    period: 'Juni', 
    year: 2024,
    employeeRef: 'EMP003', 
    employeeName: 'M. Jansen', 
    grossSalary: 4800.00, 
    workedHours: 160,
    tax: 1599.50,
    zvw: 0.00,
    netAmount: 3200.50,
    runDate: '24-06-2024',
    tableColor: 'Wit',
    specialRate: 49.50,
    salaryComponents: [
        { description: 'Salaris', amount: 4800.00, type: 'payment' },
        { description: 'Loonheffing', amount: -1599.50, type: 'deduction' }
    ]
  },
];

export const MOCK_BANK_TRANSACTIONS: BankTransaction[] = [
  { id: 'b1', date: '2024-03-25', description: 'Salaris maart J. de Vries EMP001', amount: 2850.00, iban: 'NL01BANK0123456789' },
  { id: 'b2', date: '2024-03-25', description: 'Salaris maart S. Bakker', amount: 2100.00, iban: 'NL02BANK9876543210' }, // Intentional mismatch (50 euro less)
  { id: 'b3', date: '2024-03-25', description: 'Salaris maart M. Jansen', amount: 3200.50, iban: 'NL03BANK0000111122' },
];

// Generic Journal Entries (Mock Data)
export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  { id: 'j1', accountNumber: 4000, accountName: 'Brutoloon', periodDebet: 50000.00, periodCredit: 0.00, cumulativeDebet: 250000.00, cumulativeCredit: 0.00, period: 'Mei', year: 2024 },
  { id: 'j2', accountNumber: 4005, accountName: 'Vakantiegeld', periodDebet: 4000.00, periodCredit: 0.00, cumulativeDebet: 20000.00, cumulativeCredit: 0.00, period: 'Mei', year: 2024 },
  { id: 'j3', accountNumber: 4030, accountName: 'Sociale lasten', periodDebet: 7500.00, periodCredit: 0.00, cumulativeDebet: 37500.00, cumulativeCredit: 0.00, period: 'Mei', year: 2024 },
  { id: 'j4', accountNumber: 4034, accountName: 'Pensioenpremie', periodDebet: 6000.00, periodCredit: 0.00, cumulativeDebet: 30000.00, cumulativeCredit: 0.00, period: 'Mei', year: 2024 },
  { id: 'j5', accountNumber: 4064, accountName: 'Onbel. vergoeding', periodDebet: 500.00, periodCredit: 0.00, cumulativeDebet: 2500.00, cumulativeCredit: 0.00, period: 'Mei', year: 2024 },
  { id: 'j6', accountNumber: 1810, accountName: 'TB Loonheffing', periodDebet: 0.00, periodCredit: 15000.00, cumulativeDebet: 0.00, cumulativeCredit: 75000.00, period: 'Mei', year: 2024 },
  { id: 'j7', accountNumber: 2000, accountName: 'Netto lonen', periodDebet: 0.00, periodCredit: 38000.00, cumulativeDebet: 0.00, cumulativeCredit: 190000.00, period: 'Mei', year: 2024 },
  { id: 'j8', accountNumber: 2099, accountName: 'Kruisposten', periodDebet: 53000.00, periodCredit: 53000.00, cumulativeDebet: 265000.00, cumulativeCredit: 265000.00, period: 'Mei', year: 2024 },
];

// Generic Wage Statement Data (Mock Data)
export const MOCK_WAGE_STATEMENT_DATA: WageStatementEntry[] = [
  { id: 'w1', employeeRef: 'MED-001', employeeName: 'Medewerker A', col3_loonInGeld: 3200.00, col4_loonNietInGeld: 0.00, col5_fooien: 0.00, col7_aftrekposten: 0.00, col8_loonSv: 3200.00, col12_loonZvw: 3200.00, col14_loonLbPh: 3200.00, col15_ingehoudenLbPh: 850.00, col16_ingehoudenZvw: 0.00, col17_uitbetaald: 2350.00, col18_verrekendeArbeidskorting: 300.00 },
  { id: 'w2', employeeRef: 'MED-002', employeeName: 'Medewerker B', col3_loonInGeld: 4500.00, col4_loonNietInGeld: 0.00, col5_fooien: 0.00, col7_aftrekposten: 100.00, col8_loonSv: 4400.00, col12_loonZvw: 4400.00, col14_loonLbPh: 4400.00, col15_ingehoudenLbPh: 1400.00, col16_ingehoudenZvw: 0.00, col17_uitbetaald: 3000.00, col18_verrekendeArbeidskorting: 250.00 },
  { id: 'w3', employeeRef: 'MED-003', employeeName: 'Medewerker C', col3_loonInGeld: 2800.00, col4_loonNietInGeld: 0.00, col5_fooien: 0.00, col7_aftrekposten: 0.00, col8_loonSv: 2800.00, col12_loonZvw: 2800.00, col14_loonLbPh: 2800.00, col15_ingehoudenLbPh: 600.00, col16_ingehoudenZvw: 0.00, col17_uitbetaald: 2200.00, col18_verrekendeArbeidskorting: 320.00 },
  { id: 'w4', employeeRef: 'MED-004', employeeName: 'Medewerker D', col3_loonInGeld: 5200.00, col4_loonNietInGeld: 200.00, col5_fooien: 0.00, col7_aftrekposten: 0.00, col8_loonSv: 5400.00, col12_loonZvw: 5400.00, col14_loonLbPh: 5400.00, col15_ingehoudenLbPh: 1800.00, col16_ingehoudenZvw: 0.00, col17_uitbetaald: 3400.00, col18_verrekendeArbeidskorting: 200.00 },
  { id: 'w5', employeeRef: 'MED-005', employeeName: 'Medewerker E', col3_loonInGeld: 2100.00, col4_loonNietInGeld: 0.00, col5_fooien: 0.00, col7_aftrekposten: 50.00, col8_loonSv: 2050.00, col12_loonZvw: 2050.00, col14_loonLbPh: 2050.00, col15_ingehoudenLbPh: 350.00, col16_ingehoudenZvw: 0.00, col17_uitbetaald: 1700.00, col18_verrekendeArbeidskorting: 350.00 },
];
