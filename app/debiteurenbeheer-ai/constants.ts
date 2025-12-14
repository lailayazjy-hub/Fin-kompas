
import { Debtor, Invoice, WIPItem, ThemePalette, AppSettings } from './types';

export const THEMES: ThemePalette[] = [
  {
    id: 'terra_cotta',
    name: 'Terra Cotta Landscape',
    colors: {
      highRisk: '#D66D6B',
      mediumRisk: '#F3B0A9',
      lowRisk: '#BDD7C6',
      primary: '#52939D',
      text: '#242F4D',
    }
  },
  {
    id: 'forest_green',
    name: 'Forest Green',
    colors: {
      highRisk: '#9A6C5A',
      mediumRisk: '#E4F46A',
      lowRisk: '#2E7B57',
      primary: '#2E7B57',
      text: '#14242E',
    }
  },
  {
    id: 'autumn_leaves',
    name: 'Autumn Leaves',
    colors: {
      highRisk: '#2E2421',
      mediumRisk: '#B49269',
      lowRisk: '#B1782F',
      primary: '#B1782F',
      text: '#8B8F92',
    }
  },
  {
    id: 'citrus_garden',
    name: 'Citrus Garden',
    colors: {
      highRisk: '#F8B24A',
      mediumRisk: '#FDD268',
      lowRisk: '#8FAB56',
      primary: '#4D7B41',
      text: '#242F4D',
      accent: '#B5E2EA',
      secondaryAccent: '#82A179'
    }
  },
  {
    id: 'rustic_cafe',
    name: 'Rustic Café',
    colors: {
      highRisk: '#A65A4E',
      mediumRisk: '#E89A63',
      lowRisk: '#D5B48A',
      primary: '#5BB1B3',
      text: '#1A1D32',
      accent: '#8BC7C5',
      secondaryAccent: '#011B4D'
    }
  },
  {
    id: 'blood_orange',
    name: 'Blood Orange Velvet',
    colors: {
      highRisk: '#B43836',
      mediumRisk: '#F6891F',
      lowRisk: '#E4C18B',
      primary: '#1A2F5E',
      text: '#202530',
      accent: '#C5C6C9'
    }
  },
  {
    id: 'canyon_heat',
    name: 'Canyon Heat',
    colors: {
      highRisk: '#7A0010',
      mediumRisk: '#B1126F',
      lowRisk: '#EF3D22',
      primary: '#FF7A15',
      text: '#3B1F12',
      accent: '#FFD11A'
    }
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'DebiteurenBeheer AI',
  themeId: 'citrus_garden'
};

export const MOCK_DEBTORS: Debtor[] = [
  { id: 'd1', name: 'TechSolutions BV', creditLimit: 50000, email: 'finance@techsolutions.nl', riskProfile: 'Laag' },
  { id: 'd2', name: 'BouwGroep Zuid', creditLimit: 20000, email: 'admin@bouwgroepzuid.nl', riskProfile: 'Hoog' },
  { id: 'd3', name: 'Retail Handel NV', creditLimit: 100000, email: 'invoice@retailhandel.nl', riskProfile: 'Gemiddeld' },
  { id: 'd4', name: 'StartUp Creative', creditLimit: 5000, email: 'hello@startup.io', riskProfile: 'Gemiddeld' },
];

// Helper to generate dates relative to today
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const MOCK_INVOICES: Invoice[] = [
  // TechSolutions (Good payer)
  { id: 'inv1', entryNumber: '20240001', invoiceNumber: '2024-001', date: daysAgo(10), dueDate: daysAgo(-20), amount: 15000, isOpen: true, debtorId: 'd1' },
  { id: 'inv2', entryNumber: '20240002', invoiceNumber: '2024-002', date: daysAgo(5), dueDate: daysAgo(-25), amount: 8500, isOpen: true, debtorId: 'd1' },
  
  // BouwGroep Zuid (Bad payer)
  { id: 'inv3', entryNumber: '20230899', invoiceNumber: '2023-899', date: daysAgo(100), dueDate: daysAgo(70), amount: 12000, isOpen: true, debtorId: 'd2' },
  { id: 'inv4', entryNumber: '20230950', invoiceNumber: '2023-950', date: daysAgo(45), dueDate: daysAgo(15), amount: 4000, isOpen: true, debtorId: 'd2' },

  // Retail Handel (Mixed)
  { id: 'inv5', entryNumber: '20240010', invoiceNumber: '2024-010', date: daysAgo(65), dueDate: daysAgo(35), amount: 45000, isOpen: true, debtorId: 'd3' },
  { id: 'inv6', entryNumber: '20240011', invoiceNumber: '2024-011', date: daysAgo(2), dueDate: daysAgo(-28), amount: 12000, isOpen: true, debtorId: 'd3' },

  // StartUp (Over limit)
  { id: 'inv7', entryNumber: '20240015', invoiceNumber: '2024-015', date: daysAgo(40), dueDate: daysAgo(10), amount: 6000, isOpen: true, debtorId: 'd4' },
];

export const MOCK_WIP: WIPItem[] = [
  { id: 'wip1', debtorId: 'd1', description: 'Consultancy uren Q3', date: daysAgo(2), estimatedAmount: 2500, status: 'Geleverd' },
  { id: 'wip2', debtorId: 'd2', description: 'Materialen project X', date: daysAgo(5), estimatedAmount: 8000, status: 'Geleverd' },
  { id: 'wip3', debtorId: 'd4', description: 'Logo ontwerp revisie', date: daysAgo(1), estimatedAmount: 500, status: 'In behandeling' },
];
