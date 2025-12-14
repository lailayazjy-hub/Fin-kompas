import { Theme } from '../types';

export const THEMES: Theme[] = [
  {
    id: 'terra-cotta',
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
    id: 'forest-green',
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
    id: 'autumn-leaves',
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
    id: 'citrus-garden',
    name: 'Citrus Garden',
    colors: {
      highRisk: '#F8B24A',
      mediumRisk: '#FDD268',
      lowRisk: '#8FAB56',
      primary: '#4D7B41',
      text: '#242F4D',
      accent1: '#B5E2EA',
      accent2: '#82A179',
    }
  },
  {
    id: 'rustic-cafe',
    name: 'Rustic Café',
    colors: {
      highRisk: '#A65A4E',
      mediumRisk: '#E89A63',
      lowRisk: '#D5B48A',
      primary: '#5BB1B3',
      text: '#1A1D32',
      accent1: '#8BC7C5',
      accent2: '#011B4D',
    }
  },
  {
    id: 'blood-orange',
    name: 'Blood Orange Velvet',
    colors: {
      highRisk: '#B43836',
      mediumRisk: '#F6891F',
      lowRisk: '#E4C18B',
      primary: '#1A2F5E',
      text: '#202530',
      accent1: '#C5C6C9',
    }
  },
  {
    id: 'canyon-heat',
    name: 'Canyon Heat',
    colors: {
      highRisk: '#7A0010',
      mediumRisk: '#B1126F',
      lowRisk: '#EF3D22',
      primary: '#FF7A15',
      text: '#3B1F12',
      accent1: '#FFD11A',
    }
  }
];

export const DEFAULT_THEME = THEMES[3]; // Citrus Garden as default based on "original palette" hint or just a good starting point