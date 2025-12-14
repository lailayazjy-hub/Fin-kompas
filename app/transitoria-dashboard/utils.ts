import { CurrencyMode, LedgerRecord, ThemeName, ThemeColors, TransitoriaCategory } from './types';
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

// Helper to convert Dutch month names to index (0-11)
const getMonthFromText = (text: string): number | null => {
  const t = text.toLowerCase();
  const months = [
    ['januari', 'jan'], ['februari', 'feb'], ['maart', 'mrt'], 
    ['april', 'apr'], ['mei', 'mei'], ['juni', 'jun'], 
    ['juli', 'jul'], ['augustus', 'aug'], ['september', 'sep'], 
    ['oktober', 'okt'], ['november', 'nov'], ['december', 'dec']
  ];
  
  for (let i = 0; i < months.length; i++) {
    if (months[i].some(m => t.includes(m))) return i;
  }
  return null;
};

// Heuristic to guess category based on description, amount AND date context
const detectCategoryAndScore = (desc: string, amount: number, transactionDate: Date): { category: TransitoriaCategory, score: number, allocation: string } => {
  const d = desc.toLowerCase();
  const transactionYear = transactionDate.getFullYear();
  const transactionMonth = transactionDate.getMonth(); // 0-11

  // 1. Year Mismatch Detection (Strongest Signal)
  const yearMatches = desc.match(/\b(20\d{2})\b/g);
  if (yearMatches) {
    for (const yearStr of yearMatches) {
      const mentionedYear = parseInt(yearStr, 10);
      
      if (mentionedYear > transactionYear) {
        return { category: 'PREPAID_COSTS', score: 0.95, allocation: `Betreft ${mentionedYear} (Toekomst)` };
      } 
      else if (mentionedYear < transactionYear) {
        return { category: 'ACCRUED_EXPENSES', score: 0.85, allocation: `Betreft ${mentionedYear} (Verleden)` };
      }
    }
  }

  // 2. Month Mismatch Detection (Contextual Anomaly)
  const mentionedMonthIdx = getMonthFromText(d);
  if (mentionedMonthIdx !== null) {
    // Calculate difference handling year wrap-around logic roughly
    let diff = mentionedMonthIdx - transactionMonth;
    
    // Case: Description says "Januari" (0), Date is "December" (11) -> Diff = -11. Treat as +1 (Next year)
    if (diff < -6) diff += 12; 
    // Case: Description says "December" (11), Date is "Januari" (0) -> Diff = 11. Treat as -1 (Prev year)
    if (diff > 6) diff -= 12;

    if (diff > 1) {
      // Mentioned month is more than 1 month in future
      return { category: 'PREPAID_COSTS', score: 0.9, allocation: `Betreft maand ${mentionedMonthIdx + 1} (Vooruitbetaald)` };
    } else if (diff < -1) {
      // Mentioned month is more than 1 month in past
      return { category: 'ACCRUED_EXPENSES', score: 0.8, allocation: `Betreft maand ${mentionedMonthIdx + 1} (Late factuur)` };
    }
  }

  // 3. Quarter Logic (Q1..Q4)
  const qMatch = d.match(/q([1-4])/);
  if (qMatch) {
    const q = parseInt(qMatch[1]);
    const currentQ = Math.floor(transactionMonth / 3) + 1;
    if (q > currentQ) return { category: 'PREPAID_COSTS', score: 0.85, allocation: `Betreft Q${q} (Toekomst)` };
    if (q < currentQ) return { category: 'ACCRUED_EXPENSES', score: 0.6, allocation: `Betreft Q${q} (Verleden)` };
  }

  // 4. Correction / Anomaly Keywords
  if (d.includes('correctie') || d.includes('storno') || d.includes('credit')) {
    return { category: 'ACCRUED_EXPENSES', score: 0.5, allocation: 'Correctieboeking Controleren' };
  }

  // 5. Keyword Detection for Transitoria Types
  if (d.includes('vooruit') || d.includes('prepaid') || d.includes('abonnement')) {
    return { category: 'PREPAID_COSTS', score: 0.8, allocation: 'Spreiden over periode' };
  }
  if (d.includes('licentie') || d.includes('verzekering') || d.includes('contributie')) {
    // Often annual
    return { category: 'PREPAID_COSTS', score: 0.6, allocation: 'Mogelijk jaarlijks spreiden' };
  }
  
  if (d.includes('nog te factureren') || d.includes('onderhanden werk') || d.includes('te ontvangen')) {
    return { category: 'ACCRUED_REVENUE', score: 0.9, allocation: 'Nog te factureren' };
  }
  
  if (d.includes('reservering') || d.includes('voorziening') || d.includes('vakantiegeld')) {
    return { category: 'ACCRUED_EXPENSES', score: 0.7, allocation: 'Toevoeging Voorziening' };
  }

  // 6. Large Amount Check (Simple Anomaly)
  // Assuming regular invoices are smaller, huge round numbers often imply annual fees or contracts
  if (Math.abs(amount) > 25000 && amount % 100 === 0) {
     return { category: 'UNKNOWN', score: 0.4, allocation: 'Groot rond bedrag: controleer contract' };
  }
  
  return { category: 'UNKNOWN', score: 0.0, allocation: 'Direct' };
};

const mapRowsToRecords = (headers: string[], dataRows: any[][], fileName: string, separator?: string): LedgerRecord[] => {
  const records: LedgerRecord[] = [];
  
  // Normalize headers
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
      } 
      else if (valStr.includes(',') && valStr.indexOf(',') > valStr.lastIndexOf('.')) {
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

    // Date Parsing Logic
    const dateIdx = cleanHeaders.findIndex(h => h.includes('datum'));
    let dateStr = '';
    let dateObj = new Date();
    
    if (dateIdx !== -1 && dateIdx < row.length) {
       const rawDate = row[dateIdx];
       
       if (rawDate instanceof Date) {
          // Native Date Object (from Excel with cellDates: true)
          dateObj = rawDate;
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
       } 
       else if (typeof rawDate === 'number') {
          // Excel Serial Date fallback (approx)
          dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
       }
       else {
          // String Parsing
          dateStr = String(rawDate || '').trim();
          if (dateStr) {
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) dateObj = new Date(dateStr); // YYYY-MM-DD
                else dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD-MM-YYYY
            }
          }
       }
    }

    if (isNaN(dateObj.getTime())) {
       dateObj = new Date();
    }

    const desc = getString('omschrijving');
    const amount = getVal('bedrag');
    
    // Pass transaction date context to detection logic
    const { category, score, allocation } = detectCategoryAndScore(desc, amount, dateObj);

    records.push({
      id: `${fileName}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      sourceFile: fileName,
      grootboekrekening: getString('grootboek') || getString('rekening') || '9999',
      omschrijving: desc || 'Geen omschrijving',
      relatie: getString('relatie') || getString('crediteur') || getString('debiteur') || 'Diversen',
      datum: dateStr,
      periode: dateObj.getMonth() + 1,
      jaar: dateObj.getFullYear(),
      bedrag: amount,
      detectedCategory: category,
      suggestedAllocation: allocation,
      status: 'PENDING',
      anomalyScore: score
    });
  }
  return records;
};

export const parseCSV = (csvText: string, fileName: string): LedgerRecord[] => {
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

export const parseExcel = (buffer: ArrayBuffer, fileName: string): LedgerRecord[] => {
  const workbook = read(buffer, { type: 'array', cellDates: true });
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
    "Datum", "Grootboekrekening", "Omschrijving", "Relatie", "Bedrag", "Periode", "Jaar"
  ];
  
  const ws = utils.aoa_to_sheet([headers]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Transitoria Template");
  const buf = write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
};

export const dummyData: LedgerRecord[] = [
  {
    id: 'demo-1',
    sourceFile: 'Demo GBR',
    grootboekrekening: '4500',
    omschrijving: 'Huur Kantoor Januari 2024',
    relatie: 'Vastgoed BV',
    datum: '2023-12-28',
    periode: 12,
    jaar: 2023,
    bedrag: 15000,
    detectedCategory: 'PREPAID_COSTS',
    suggestedAllocation: 'Betreft maand 1 (Vooruitbetaald)',
    status: 'PENDING',
    anomalyScore: 0.9
  },
  {
    id: 'demo-2',
    sourceFile: 'Demo GBR',
    grootboekrekening: '4500',
    omschrijving: 'Licentie Salesforce 2024',
    relatie: 'Salesforce',
    datum: '2024-01-15',
    periode: 1,
    jaar: 2024,
    bedrag: 45000,
    detectedCategory: 'PREPAID_COSTS',
    suggestedAllocation: 'Betreft 2024 (Toekomst)',
    status: 'APPROVED',
    anomalyScore: 0.95
  },
  {
    id: 'demo-3',
    sourceFile: 'Demo GBR',
    grootboekrekening: '8000',
    omschrijving: 'Nog te factureren omzet Q4',
    relatie: 'Project X',
    datum: '2024-01-05',
    periode: 1,
    jaar: 2024,
    bedrag: 12500,
    detectedCategory: 'ACCRUED_REVENUE',
    suggestedAllocation: 'Betreft Q4 (Verleden)',
    status: 'PENDING',
    anomalyScore: 0.85 
  },
  {
    id: 'demo-4',
    sourceFile: 'Demo GBR',
    grootboekrekening: '9900',
    omschrijving: 'Correctie voorgaand boekjaar', 
    relatie: 'Memoriaal',
    datum: '2024-02-01',
    periode: 2,
    jaar: 2024,
    bedrag: -2500,
    detectedCategory: 'ACCRUED_EXPENSES',
    suggestedAllocation: 'Correctieboeking Controleren',
    status: 'REJECTED',
    anomalyScore: 0.5
  }
];
