import { Language, Translations, Theme } from "./types";

export const LABELS: Translations = {
  title: {
    [Language.NL]: "Financieel Dashboard",
    [Language.EN]: "Financial Dashboard"
  },
  upload: {
    [Language.NL]: "Upload Data (CSV/Excel)",
    [Language.EN]: "Upload Data (CSV/Excel)"
  },
  demo: {
    [Language.NL]: "Laad Demo Data",
    [Language.EN]: "Load Demo Data"
  },
  downloadTemplate: {
    [Language.NL]: "Download Sjabloon",
    [Language.EN]: "Download Template"
  },
  analysisPeriod: {
    [Language.NL]: "Analyseperiode",
    [Language.EN]: "Analysis Period"
  },
  customRange: {
    [Language.NL]: "Aangepast Bereik",
    [Language.EN]: "Custom Range"
  },
  startDate: {
    [Language.NL]: "Startdatum",
    [Language.EN]: "Start Date"
  },
  endDate: {
    [Language.NL]: "Einddatum",
    [Language.EN]: "End Date"
  },
  costType: {
    [Language.NL]: "Kostensoort",
    [Language.EN]: "Cost Type"
  },
  anomalies: {
    [Language.NL]: "Gedetecteerde Afwijkingen",
    [Language.EN]: "Detected Anomalies"
  },
  severity: {
    [Language.NL]: "Ernst",
    [Language.EN]: "Severity"
  },
  deviation: {
    [Language.NL]: "Afwijking",
    [Language.EN]: "Deviation"
  },
  aiAnalysis: {
    [Language.NL]: "AI Analyse",
    [Language.EN]: "AI Analysis"
  },
  export: {
    [Language.NL]: "Rapport Exporteren",
    [Language.EN]: "Export Report"
  },
  commentPlaceholder: {
    [Language.NL]: "Voeg een opmerking toe...",
    [Language.EN]: "Add a comment..."
  },
  noData: {
    [Language.NL]: "Geen data beschikbaar. Upload een bestand of gebruik demo data.",
    [Language.EN]: "No data available. Upload a file or use demo data."
  },
  trendAnalysis: {
    [Language.NL]: "Trendanalyse",
    [Language.EN]: "Trend Analysis"
  },
  all: {
    [Language.NL]: "Alle",
    [Language.EN]: "All"
  },
  loading: {
    [Language.NL]: "Laden...",
    [Language.EN]: "Loading..."
  },
  noAnomalies: {
    [Language.NL]: "Geen afwijkingen gedetecteerd in deze periode.",
    [Language.EN]: "No anomalies detected in this period."
  },
  aiInsightLabel: {
    [Language.NL]: "AI Inzicht:",
    [Language.EN]: "AI Insight:"
  },
  settings: {
    [Language.NL]: "Instellingen",
    [Language.EN]: "Settings"
  },
  appName: {
    [Language.NL]: "Applicatienaam",
    [Language.EN]: "Application Name"
  },
  theme: {
    [Language.NL]: "Kleurthema",
    [Language.EN]: "Color Theme"
  },
  close: {
    [Language.NL]: "Sluiten",
    [Language.EN]: "Close"
  },
  save: {
    [Language.NL]: "Opslaan",
    [Language.EN]: "Save"
  }
};

export const THEMES: Record<string, Theme> = {
  TERRA_COTTA: {
    id: 'TERRA_COTTA',
    name: 'Terra Cotta Landscape',
    colors: {
      highRisk: '#D66D6B',
      mediumRisk: '#F3B0A9',
      lowRisk: '#BDD7C6',
      primary: '#52939D',
      text: '#242F4D',
      accents: ['#52939D', '#D66D6B', '#BDD7C6', '#F3B0A9', '#242F4D']
    }
  },
  FOREST_GREEN: {
    id: 'FOREST_GREEN',
    name: 'Forest Green',
    colors: {
      highRisk: '#9A6C5A',
      mediumRisk: '#E4F46A',
      lowRisk: '#2E7B57',
      primary: '#2E7B57',
      text: '#14242E',
      accents: ['#2E7B57', '#9A6C5A', '#E4F46A', '#6B8E23', '#556B2F']
    }
  },
  AUTUMN_LEAVES: {
    id: 'AUTUMN_LEAVES',
    name: 'Autumn Leaves',
    colors: {
      highRisk: '#2E2421',
      mediumRisk: '#B49269',
      lowRisk: '#B1782F',
      primary: '#B1782F',
      text: '#8B8F92',
      accents: ['#B1782F', '#B49269', '#2E2421', '#8B4513', '#CD853F']
    }
  },
  CITRUS_GARDEN: {
    id: 'CITRUS_GARDEN',
    name: 'Citrus Garden',
    colors: {
      highRisk: '#F8B24A',
      mediumRisk: '#FDD268',
      lowRisk: '#8FAB56',
      primary: '#4D7B41',
      text: '#242F4D',
      accents: ['#4D7B41', '#B5E2EA', '#82A179', '#F8B24A', '#FDD268']
    }
  },
  RUSTIC_CAFE: {
    id: 'RUSTIC_CAFE',
    name: 'Rustic Café',
    colors: {
      highRisk: '#A65A4E',
      mediumRisk: '#E89A63',
      lowRisk: '#D5B48A',
      primary: '#5BB1B3',
      text: '#1A1D32',
      accents: ['#5BB1B3', '#8BC7C5', '#011B4D', '#A65A4E', '#E89A63']
    }
  },
  BLOOD_ORANGE: {
    id: 'BLOOD_ORANGE',
    name: 'Blood Orange Velvet',
    colors: {
      highRisk: '#B43836',
      mediumRisk: '#F6891F',
      lowRisk: '#E4C18B',
      primary: '#1A2F5E',
      text: '#202530',
      accents: ['#1A2F5E', '#C5C6C9', '#B43836', '#F6891F', '#E4C18B']
    }
  },
  CANYON_HEAT: {
    id: 'CANYON_HEAT',
    name: 'Canyon Heat',
    colors: {
      highRisk: '#7A0010',
      mediumRisk: '#B1126F',
      lowRisk: '#EF3D22',
      primary: '#FF7A15',
      text: '#3B1F12',
      accents: ['#FF7A15', '#FFD11A', '#EF3D22', '#B1126F', '#7A0010']
    }
  }
};
