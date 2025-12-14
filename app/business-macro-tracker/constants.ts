import { TaskTemplate, CategoryScores } from './types';

export const DEFAULT_SETTINGS = {
  dailyBudgetHours: 8, 
  weeklyBudgetHours: 40,
  targets: {
    control: 0.25,
    reports: 0.25,
    admin: 0.25,
    network: 0.25,
  }
};

// Average "Points per hour" expected. Used to calculate target points based on time budget.
export const BASELINE_POINTS_PER_HOUR = 3;

export const CATEGORY_COLORS = {
  control: 'text-blue-500',
  reports: 'text-rose-400',
  admin: 'text-teal-400',
  network: 'text-emerald-400',
};

export const CATEGORY_BG = {
  control: 'bg-blue-500',
  reports: 'bg-rose-400',
  admin: 'bg-teal-400',
  network: 'bg-emerald-400',
};

export const CATEGORY_LABELS: Record<string, string> = {
  control: 'Controle',
  reports: 'Rapportages',
  admin: 'Projectadmin',
  network: 'Netwerken',
};

export const PLANS: Record<string, CategoryScores> = {
  'Gebalanceerd': { control: 0.25, reports: 0.25, admin: 0.25, network: 0.25 },
  'Maandafsluiting': { control: 0.35, reports: 0.45, admin: 0.15, network: 0.05 },
  'Projectperiode': { control: 0.10, reports: 0.10, admin: 0.70, network: 0.10 },
  'AI/Data Sprint': { control: 0.10, reports: 0.50, admin: 0.30, network: 0.10 },
  'Communicatieweek': { control: 0.10, reports: 0.10, admin: 0.10, network: 0.70 },
};

// Full Finance Controller Library
export const TASK_LIBRARY: TaskTemplate[] = [
  { id: 't1', title: 'Dagelijkse boekhouding', defaultMinutes: 60, scores: { control: 5, reports: 1, admin: 2, network: 1 } },
  { id: 't2', title: 'Maandafsluiting', defaultMinutes: 120, scores: { control: 4, reports: 4, admin: 3, network: 1 } },
  { id: 't3', title: 'Kwartaalafsluiting', defaultMinutes: 240, scores: { control: 4, reports: 5, admin: 3, network: 1 } },
  { id: 't4', title: 'Jaarafsluiting', defaultMinutes: 480, scores: { control: 3, reports: 5, admin: 3, network: 1 } },
  { id: 't5', title: 'Auditvoorbereiding', defaultMinutes: 120, scores: { control: 5, reports: 4, admin: 2, network: 1 } },
  { id: 't6', title: 'Debiteurenbeheer', defaultMinutes: 60, scores: { control: 5, reports: 1, admin: 2, network: 1 } },
  { id: 't7', title: 'Crediteurenbeheer', defaultMinutes: 60, scores: { control: 5, reports: 1, admin: 2, network: 1 } },
  { id: 't8', title: 'Bankverwerking', defaultMinutes: 30, scores: { control: 5, reports: 1, admin: 1, network: 1 } },
  { id: 't9', title: 'BTW / ICP aangiftes', defaultMinutes: 60, scores: { control: 4, reports: 3, admin: 2, network: 1 } },
  { id: 't10', title: 'VPB voorbereiding', defaultMinutes: 120, scores: { control: 3, reports: 5, admin: 2, network: 1 } },
  { id: 't11', title: 'Cashflow monitoring', defaultMinutes: 30, scores: { control: 4, reports: 4, admin: 2, network: 1 } },
  { id: 't12', title: 'Cashflow analyse', defaultMinutes: 60, scores: { control: 3, reports: 4, admin: 2, network: 1 } },
  { id: 't13', title: 'Liquiditeitsforecast', defaultMinutes: 90, scores: { control: 2, reports: 5, admin: 3, network: 1 } },
  { id: 't14', title: 'Projectresultaten controleren', defaultMinutes: 60, scores: { control: 3, reports: 2, admin: 5, network: 1 } },
  { id: 't15', title: 'Projectmarges analyseren', defaultMinutes: 60, scores: { control: 2, reports: 4, admin: 5, network: 1 } },
  { id: 't16', title: 'ERP projectadministratie', defaultMinutes: 60, scores: { control: 2, reports: 2, admin: 5, network: 1 } },
  { id: 't17', title: 'Tijd/kostenallocatie', defaultMinutes: 45, scores: { control: 4, reports: 2, admin: 5, network: 1 } },
  { id: 't18', title: 'Projectfacturatie', defaultMinutes: 60, scores: { control: 3, reports: 1, admin: 5, network: 1 } },
  { id: 't19', title: 'Contractbeheer', defaultMinutes: 45, scores: { control: 2, reports: 2, admin: 4, network: 1 } },
  { id: 't20', title: 'Subsidiebeheer', defaultMinutes: 60, scores: { control: 3, reports: 3, admin: 3, network: 1 } },
  { id: 't21', title: 'Verzekeringen & risicobeheer', defaultMinutes: 60, scores: { control: 3, reports: 2, admin: 3, network: 2 } },
  { id: 't22', title: 'Inkoopanalyses', defaultMinutes: 60, scores: { control: 3, reports: 2, admin: 3, network: 1 } },
  { id: 't23', title: 'Kostprijsberekeningen', defaultMinutes: 90, scores: { control: 2, reports: 4, admin: 4, network: 1 } },
  { id: 't24', title: 'Budgettering', defaultMinutes: 120, scores: { control: 1, reports: 5, admin: 3, network: 2 } },
  { id: 't25', title: 'Forecast cycles', defaultMinutes: 90, scores: { control: 1, reports: 5, admin: 3, network: 2 } },
  { id: 't26', title: 'Rapportages bouwen', defaultMinutes: 90, scores: { control: 1, reports: 5, admin: 2, network: 1 } },
  { id: 't27', title: 'Rapportages standaardiseren', defaultMinutes: 60, scores: { control: 1, reports: 5, admin: 3, network: 1 } },
  { id: 't28', title: 'Data opschonen', defaultMinutes: 60, scores: { control: 3, reports: 3, admin: 3, network: 1 } },
  { id: 't29', title: 'Deep dives analyses', defaultMinutes: 120, scores: { control: 2, reports: 5, admin: 3, network: 2 } },
  { id: 't30', title: 'MT advisering voorbereiden', defaultMinutes: 60, scores: { control: 1, reports: 4, admin: 2, network: 3 } },
  { id: 't31', title: 'Directieadvies', defaultMinutes: 60, scores: { control: 1, reports: 4, admin: 2, network: 4 } },
  { id: 't32', title: 'KPI dashboards', defaultMinutes: 90, scores: { control: 1, reports: 5, admin: 2, network: 1 } },
  { id: 't33', title: 'Procesoptimalisatie', defaultMinutes: 60, scores: { control: 2, reports: 3, admin: 4, network: 2 } },
  { id: 't34', title: 'BI/digitalisering', defaultMinutes: 120, scores: { control: 1, reports: 4, admin: 3, network: 2 } },
  { id: 't35', title: 'Interne overleggen', defaultMinutes: 60, scores: { control: 1, reports: 2, admin: 1, network: 5 } },
  { id: 't36', title: 'Externe overleggen', defaultMinutes: 60, scores: { control: 1, reports: 2, admin: 1, network: 5 } },
  { id: 't37', title: 'Stakeholdermanagement', defaultMinutes: 60, scores: { control: 1, reports: 2, admin: 1, network: 5 } },
  { id: 't38', title: 'Mail afhandelen', defaultMinutes: 30, scores: { control: 2, reports: 1, admin: 1, network: 3 } },
  { id: 't39', title: 'Onboarding personeel', defaultMinutes: 60, scores: { control: 2, reports: 1, admin: 3, network: 3 } },
  { id: 't40', title: 'AO/IC controles', defaultMinutes: 60, scores: { control: 5, reports: 2, admin: 3, network: 2 } },
  { id: 't41', title: 'AO/IC documentatie', defaultMinutes: 60, scores: { control: 4, reports: 2, admin: 4, network: 1 } },
  { id: 't42', title: 'Assetbeheer', defaultMinutes: 30, scores: { control: 3, reports: 2, admin: 3, network: 1 } },
  { id: 't43', title: 'Factuurcontrole', defaultMinutes: 30, scores: { control: 5, reports: 1, admin: 2, network: 1 } },
  { id: 't44', title: 'Spend analyses', defaultMinutes: 60, scores: { control: 2, reports: 3, admin: 4, network: 2 } },
  { id: 't45', title: 'Scenario-analyses', defaultMinutes: 90, scores: { control: 1, reports: 5, admin: 3, network: 2 } },
  { id: 't46', title: 'Tender/offerte ondersteuning', defaultMinutes: 60, scores: { control: 2, reports: 3, admin: 3, network: 4 } },
  { id: 't47', title: 'Benchmarking', defaultMinutes: 60, scores: { control: 1, reports: 4, admin: 3, network: 2 } },
];
