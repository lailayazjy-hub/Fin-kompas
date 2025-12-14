import { CurrencyMode, ProjectRecord, ThemeName, ThemeColors } from './types';
import { read, utils, write } from 'xlsx';

export const THEMES: Record<ThemeName, ThemeColors> = {
  terra_cotta: {
    highRisk: '#D66D6B',
    mediumRisk: '#F3B0A9',
    lowRisk: '#BDD7C6',
    primary: '#52939D',
    text: '#242F4D'
  },
  forest_green: {
    highRisk: '#9A6C5A',
    mediumRisk: '#E4F46A',
    lowRisk: '#2E7B57',
    primary: '#2E7B57',
    text: '#14242E'
  },
  autumn_leaves: {
    highRisk: '#2E2421',
    mediumRisk: '#B49269',
    lowRisk: '#B1782F',
    primary: '#B1782F',
    text: '#8B8F92'
  },
  citrus_garden: {
    highRisk: '#F8B24A',
    mediumRisk: '#FDD268',
    lowRisk: '#8FAB56',
    primary: '#4D7B41',
    text: '#242F4D',
    accent: '#B5E2EA'
  }
};

export const formatCurrency = (value: number, mode: CurrencyMode): string => {
  if (value === 0) return '-';
  
  if (mode === CurrencyMode.THOUSANDS) {
    return `€ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// Generic helper to map rows to ProjectRecords
const mapRowsToRecords = (headers: string[], dataRows: any[][], fileName: string, separator?: string): ProjectRecord[] => {
  const records: ProjectRecord[] = [];
  
  const cleanHeaders = headers.map(h => String(h).trim().toLowerCase().replace(/^"|"$/g, ''));

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const getVal = (keyPart: string) => {
      const idx = cleanHeaders.findIndex(h => h.includes(keyPart));
      if (idx === -1 || idx >= row.length) return 0;
      
      const rawVal = row[idx];
      if (typeof rawVal === 'number') return rawVal;
      
      let valStr = String(rawVal || '').trim().replace(/^"|"$/g, '');
      if (!valStr) return 0;

      if (separator === ';') {
         valStr = valStr.replace(/\./g, '').replace(',', '.');
      } else if (separator === ',') {
         valStr = valStr.replace(/,/g, '');
      } else if (valStr.includes(',') && valStr.indexOf(',') > valStr.lastIndexOf('.')) {
         valStr = valStr.replace(/\./g, '').replace(',', '.');
      }

      const val = parseFloat(valStr);
      return isNaN(val) ? 0 : val;
    };

    const getString = (keyPart: string) => {
      const idx = cleanHeaders.findIndex(h => h.includes(keyPart));
      if (idx === -1 || idx >= row.length) return '';
      return String(row[idx] || '').trim();
    };

    const revenue = getVal('omzet') || getVal('revenue');
    const labor = getVal('arbeid') || getVal('labor');
    const material = getVal('materiaal') || getVal('material');
    const overhead = getVal('overig') || getVal('overhead');
    
    const totalCosts = labor + material + overhead;
    const margin = revenue - totalCosts;
    const marginPercent = revenue > 0 ? margin / revenue : 0;
    
    let status: 'Healthy' | 'Warning' | 'Critical' = 'Healthy';
    if (marginPercent < 0.05) status = 'Critical';
    else if (marginPercent < 0.15) status = 'Warning';

    records.push({
      id: `${fileName}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      sourceFile: fileName,
      projectCode: getString('code') || `PRJ-${i}`,
      projectName: getString('project') || getString('naam') || 'Onbekend Project',
      client: getString('klant') || getString('client') || 'Onbekend',
      year: parseInt(getString('jaar')) || new Date().getFullYear(),
      period: getString('periode') || getString('maand') || 'Q1',
      revenue,
      laborCosts: labor,
      materialCosts: material,
      overheadCosts: overhead,
      totalCosts,
      margin,
      marginPercent,
      status
    });
  }
  return records;
};

export const parseCSV = (csvText: string, fileName: string): ProjectRecord[] => {
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  const headers = firstLine.split(separator).map(h => h.trim());
  const dataRows = lines.slice(1).map(line => {
    if (!line.trim()) return null;
    return line.split(separator).map(v => v.trim());
  }).filter(r => r !== null) as string[][];

  return mapRowsToRecords(headers, dataRows, fileName, separator);
};

export const parseExcel = (buffer: ArrayBuffer, fileName: string): ProjectRecord[] => {
  const workbook = read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  if (jsonData.length === 0) return [];
  const headers = (jsonData[0] as string[]);
  const dataRows = jsonData.slice(1);
  return mapRowsToRecords(headers, dataRows, fileName, undefined);
};

export const generateTemplateXLSX = (): Uint8Array => {
  const headers = [
    "Project Code", "Project Naam", "Klant", "Jaar", "Periode",
    "Omzet", "Arbeidskosten", "Materiaalkosten", "Overige Kosten"
  ];
  const ws = utils.aoa_to_sheet([headers]);
  ws['!cols'] = headers.map(() => ({ wch: 15 }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Project Template");
  const buf = write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
};

export const dummyData: ProjectRecord[] = [
  {
    id: 'd1',
    sourceFile: 'Demo Projecten',
    projectCode: 'P-2024-001',
    projectName: 'Kantoor Renovatie A',
    client: 'Vastgoed BV',
    year: 2024,
    period: 'Q1',
    revenue: 150000,
    laborCosts: 60000,
    materialCosts: 50000,
    overheadCosts: 10000,
    totalCosts: 120000,
    margin: 30000,
    marginPercent: 0.20,
    status: 'Healthy'
  },
  {
    id: 'd2',
    sourceFile: 'Demo Projecten',
    projectCode: 'P-2024-002',
    projectName: 'Installatie Zonnepanelen',
    client: 'Groen Wonen',
    year: 2024,
    period: 'Q1',
    revenue: 45000,
    laborCosts: 25000,
    materialCosts: 18000,
    overheadCosts: 1000,
    totalCosts: 44000,
    margin: 1000,
    marginPercent: 0.022,
    status: 'Critical'
  },
  {
    id: 'd3',
    sourceFile: 'Demo Projecten',
    projectCode: 'P-2024-003',
    projectName: 'Onderhoudscontract X',
    client: 'Logistiek CV',
    year: 2024,
    period: 'Jan',
    revenue: 12000,
    laborCosts: 4000,
    materialCosts: 2000,
    overheadCosts: 500,
    totalCosts: 6500,
    margin: 5500,
    marginPercent: 0.458,
    status: 'Healthy'
  }
];
