export type Category = 'control' | 'reports' | 'admin' | 'network';

export interface CategoryScores {
  control: number; // Scale 1-5
  reports: number; // Scale 1-5
  admin: number;   // Scale 1-5
  network: number; // Scale 1-5
}

export interface TaskTemplate {
  id: string;
  title: string;
  defaultMinutes: number;
  scores: CategoryScores;
}

export interface TaskLog {
  id: string;
  templateId: string;
  title: string;
  minutes: number;
  unit?: string; // e.g., "1 rapport", "1 cycle"
  scores: CategoryScores;
  date: string; // ISO Date string YYYY-MM-DD
  isCompleted: boolean;
}

export interface UserSettings {
  dailyBudgetHours: number;
  weeklyBudgetHours: number;
  targets: CategoryScores; // Target distribution percentages (0.0 - 1.0)
}

export type ViewMode = 'dashboard' | 'week' | 'settings';
