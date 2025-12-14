
import { CurrencyMode, VatRecord, ExactRecord, ThemeName, ThemeColors } from './types';
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

export const formatCurrency = (value: number, mode: CurrencyMode, decimals: number = 2): string => {
  if (value === 0) return '-';
  
  if (mode === CurrencyMode.THOUSANDS) {
    return `€ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// --- Generic Helper ---

const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const parseDutchNumber = (val: any, separator?: string): number => {
  if (typeof val === 'number') return roundToTwo(val);
  let valStr = String(val || '').trim().replace(/^"|"$/g, '');
  if (!valStr) return 0;
  
  // Clean currency symbols and spaces
  valStr = valStr.replace(/€/g, '').replace(/\s/g, '');

  if (separator === ';') {
     valStr = valStr.replace(/\./g, '').replace(',', '.');
  } else if (separator === ',') {
     valStr = valStr.replace(/,/g, '');
  } else if (valStr.includes(',') && valStr.indexOf(',') > valStr.lastIndexOf('.')) {
     // Looks like Dutch in Excel string "1.200,50"
     valStr = valStr.replace(/\./g, '').replace(',', '.');
  } else if (valStr.endsWith('-')) {
    // Exact Online sometimes puts sign at end: "100-"
    valStr = '-' + valStr.substring(0, valStr.length - 1);
  }

  const res = parseFloat(valStr);
  return isNaN(res) ? 0 : roundToTwo(res);
};

const parseDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  
  // Excel serial date check (roughly > 20000)
  if (typeof val === 'number' && val > 20000) {
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }

  const str = String(val).trim();
  if (!str || str === '..') return null;

  // Support DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD
  const dutchMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dutchMatch) {
    return new Date(parseInt(dutchMatch[3]), parseInt(dutchMatch[2]) - 1, parseInt(dutchMatch[1]));
  }
  
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

// --- VAT Parsing Logic (Legacy) ---
const mapRowsToRecords = (headers: string[], dataRows: any[][], fileName: string, separator?: string): VatRecord[] => {
  const records: VatRecord[] = [];
  const cleanHeaders = headers.map(h => String(h).trim().toLowerCase().replace(/^"|"$/g, ''));

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const getVal = (keyPart: string) => {
      const idx = cleanHeaders.findIndex(h => h.includes(keyPart));
      if (idx === -1 || idx >= row.length) return 0;
      return parseDutchNumber(row[idx], separator);
    };

    const getString = (keyPart: string) => {
      const idx = cleanHeaders.findIndex(h => h.includes(keyPart));
      if (idx === -1 || idx >= row.length) return '';
      return String(row[idx] || '').trim();
    };

    if (cleanHeaders.some(h => h.includes('omzet') || h.includes('btw'))) {
        records.push({
          id: `${fileName}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          sourceFile: fileName,
          company: getString('bedrijf') || 'Onbekend',
          year: parseInt(getString('jaar')) || new Date().getFullYear(),
          period: getString('tijdvak') || 'Q1',
          omzet_nl_hoog: getVal('omzet nl hoog'),
          btw_hoog: getVal('btw hoog'),
          omzet_nl_laag: getVal('omzet nl laag'),
          btw_laag: getVal('btw laag'),
          omzet_overig: getVal('omzet overig'),
          btw_overig: getVal('btw overig'),
          prive_gebruik: getVal('prive'),
          btw_prive: getVal('btw prive'),
          omzet_verlegd: getVal('omzet verlegd'),
          btw_verlegd: getVal('btw verlegd'),
          leveringen_buiten_eu: getVal('leveringen buiten eu'),
          leveringen_eu: getVal('leveringen eu'),
          installatie_eu: getVal('installatie'),
          leveringen_uit_buiten_eu: getVal('verwerving buiten eu'),
          btw_uit_buiten_eu: getVal('btw verwerving buiten eu'),
          leveringen_uit_eu: getVal('verwerving eu'),
          btw_uit_eu: getVal('btw verwerving eu'),
          voorbelasting: getVal('voorbelasting'),
          suppletie: getVal('suppletie'),
          inklaringskosten: getVal('inklaring'),
        });
    }
  }
  return records;
};

// --- Exact Online Parsing Logic (Enhanced) ---

const determineType = (code: string): 'balance' | 'pnl' | 'unknown' => {
  const numCode = parseInt(code.replace(/\D/g, ''));
  if (isNaN(numCode)) return 'unknown';
  if (numCode < 4000) return 'balance';
  return 'pnl';
};

const detectCompanyFromMetadata = (rawRows: any[][]): string => {
  // Scan top 8 rows for "Administratie:", "Bedrijf:", "Company:" or cell A1
  const limit = Math.min(rawRows.length, 8);
  
  for (let i = 0; i < limit; i++) {
    const row = rawRows[i];
    if (!row) continue;
    const rowStr = row.map(c => String(c || '').trim()).join(' ').toLowerCase();

    if (rowStr.includes('administratie:') || rowStr.includes('bedrijf:') || rowStr.includes('company:')) {
      const labelIndex = row.findIndex(c => {
         const s = String(c||'').toLowerCase();
         return s.includes('administratie') || s.includes('bedrijf') || s.includes('company');
      });
      
      if (labelIndex !== -1 && row[labelIndex+1]) {
         return String(row[labelIndex+1]).trim();
      }
      
      const parts = rowStr.split(':');
      if (parts.length > 1 && parts[1].trim().length > 1) {
          const cell = row.find(c => String(c).toLowerCase().includes(':'));
          if (cell) {
             return String(cell).split(':')[1].trim();
          }
      }
    }
  }

  // Fallback: Check A1
  if (rawRows.length > 0 && rawRows[0][0]) {
     const a1 = String(rawRows[0][0]).trim();
     if (a1.length > 3 && !a1.includes('/') && !a1.toLowerCase().includes('overzicht')) {
        return a1;
     }
  }

  return 'Onbekend Bedrijf';
};

// Modified to return detection type
export const parseExactOnlineData = (rawRows: any[][], fileName: string, separator?: string): { records: ExactRecord[], type: 'sales' | 'financial' | 'unknown' } => {
  if (!rawRows || rawRows.length === 0) return { records: [], type: 'unknown' };

  // 1. Detect Company
  const detectedCompany = detectCompanyFromMetadata(rawRows);

  // 2. Automatic Table Detection
  let headerRowIndex = -1;
  let maxScore = 0;
  const searchLimit = Math.min(rawRows.length, 25); 

  // Keywords to detect the header row
  const keywords = [
    // Financial
    'grootboek', 'rekening', 'omschrijving', 'datum', 'debet', 'credit', 'bedrag', 'saldo',
    'dagboek', 'boekstuk', 'aangiftevak', 'btw-code', 'grondslag',
    // Sales Analysis (Specific Exact Online)
    'klant: code', 'klant: naam', 'verkoopwaarde', 'kortingsbedrag', 'korting (%)', 'verkoopbedrag',
    'artikel', 'aantal', 'netto omzet', 'verkoper'
  ];

  for (let i = 0; i < searchLimit; i++) {
    const row = rawRows[i];
    if (!row) continue;
    const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
    
    let score = 0;
    keywords.forEach(kw => { if (rowStr.includes(kw)) score++; });

    // Stronger weighting for specific Sales Analysis headers to override metadata rows
    if (rowStr.includes('klant: code') && rowStr.includes('verkoopwaarde')) score += 5;
    if (rowStr.includes('grootboekrekening') && rowStr.includes('aangiftevak')) score += 5;

    if (score > maxScore && score >= 2) {
      maxScore = score;
      headerRowIndex = i;
    }
  }

  if (headerRowIndex === -1) headerRowIndex = 0;

  // 3. Establish Column Indices
  const headerRow = rawRows[headerRowIndex].map(h => String(h || '').trim().toLowerCase().replace(/^"|"$/g, ''));
  
  const findCol = (terms: string[]) => headerRow.findIndex(h => terms.some(t => h.includes(t) || h === t));

  // Financial Columns
  const idxCode = findCol(['code', 'grootboek', 'gl account', 'rekening']);
  const idxDesc = findCol(['omschrijving', 'naam', 'description', 'product', 'details']); 
  const idxDebet = findCol(['debet', 'debit', 'eindsaldo debet']);
  const idxCredit = findCol(['credit', 'credit', 'eindsaldo credit']);
  const idxAmount = findCol(['bedrag', 'saldo', 'amount', 'balance', 'valuta']);
  const idxDate = findCol(['datum', 'date', 'entry date', 'boekdatum']); 
  const idxCombined = findCol(['code/omschrijving', 'rekening/omschrijving']);
  const idxYear = findCol(['jaar', 'year']);
  const idxPeriod = findCol(['periode', 'period']);
  const idxJournal = findCol(['dagboek', 'journal']);
  const idxRef = findCol(['boekstuk', 'ref', 'entry number', 'stuknr', 'onze ref', 'bkst.nr']);
  const idxVatBox = findCol(['aangiftevak', 'vat box']);
  const idxVatCode = findCol(['btw-code', 'btw code', 'vat code']);
  const idxVatPerc = findCol(['btw %', 'btw percentage', 'vat %', 'vat percentage']);
  const idxVatBase = findCol(['btw-grondslag', 'grondslag', 'btw grondslag', 'vat base', 'base amount']);
  const idxVatAmount = findCol(['btw: bedrag', 'btw bedrag', 'vat amount']);

  // Sales Analysis Specific Columns
  const idxRelCode = findCol(['klant: code', 'klant code', 'relatie code', 'debiteur code']);
  const idxRelation = findCol(['klant: naam', 'klant naam', 'relatie', 'customer name']);
  const idxSalesPerson = findCol(['verkoper', 'sales person']);
  
  // Important: In Exact Sales Analysis:
  // "Verkoopwaarde" = Gross Amount (before discount)
  // "Verkoopbedrag" = Net Amount (Revenue)
  const idxGrossAmt = findCol(['verkoopwaarde', 'bruto', 'gross amount']); 
  const idxNetAmt = findCol(['verkoopbedrag', 'net amount', 'sales amount', 'totaalbedrag']); 
  
  const idxDiscountAmt = findCol(['kortingsbedrag', 'korting bedrag', 'discount amount']);
  const idxDiscountPerc = findCol(['korting (%)', 'korting %', 'discount %']);
  
  const idxItemCode = findCol(['artikel', 'item code']);
  const idxQuantity = findCol(['aantal', 'quantity']);
  const idxCountry = findCol(['land', 'country']);
  const idxItemGroup = findCol(['artikelgroep', 'item group']);
  
  // Extra columns for strict total check
  const idxInvNum = findCol(['factuurnummer', 'invoice number', 'factuurnr']);

  // DETECT TYPE
  const isSalesParams = (
    (idxRelCode !== -1 && idxGrossAmt !== -1) || // Strong signal for Exact Sales Analysis
    idxItemCode !== -1 || 
    idxSalesPerson !== -1 ||
    idxNetAmt !== -1
  );
  
  const isFinancialParams = (idxVatBox !== -1 || idxVatCode !== -1 || (idxCode !== -1 && idxDesc !== -1));
  
  let detectedType: 'sales' | 'financial' | 'unknown' = 'unknown';
  if (isSalesParams) detectedType = 'sales';
  else if (isFinancialParams) detectedType = 'financial';

  const records: ExactRecord[] = [];

  // Determine Row Validation Strictness
  // Sales files can be sparse (empty cols for discount, details, group etc), so we lower the threshold to 1 to catch all rows including Totals
  const minFilledCells = detectedType === 'sales' ? 1 : 5;

  // 4. Process Data Rows
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    // Strict Control: Ignore rows with fewer than threshold filled cells
    const filledCellsCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length;
    if (filledCellsCount < minFilledCells) continue; 

    const validationErrors: Record<string, string> = {};

    // Map fields
    let rawCode = '';
    let description = '';

    if (idxCombined !== -1 && (idxCode === -1 || !row[idxCode])) {
       const combinedVal = String(row[idxCombined]).trim();
       const match = combinedVal.match(/^(\d+)\s+(.*)$/);
       if (match) {
         rawCode = match[1];
         description = match[2];
       } else {
         description = combinedVal;
       }
    } else {
       rawCode = idxCode !== -1 && row[idxCode] ? String(row[idxCode]).trim() : '';
       description = idxDesc !== -1 && row[idxDesc] ? String(row[idxDesc]).trim() : '';
    }
    
    const relationVal = idxRelation !== -1 ? String(row[idxRelation] || '').trim() : '';
    
    // Identify Total lines (refine for Sales vs Financial)
    let isTotal = false;

    if (detectedType === 'sales') {
        const d = description.toLowerCase();
        const r = relationVal.toLowerCase();
        
        // Data existence checks for this row
        const hasItem = idxItemCode !== -1 && row[idxItemCode];
        const hasInv = idxInvNum !== -1 && row[idxInvNum];
        // const hasDate = idxDate !== -1 && row[idxDate]; // Removed date check as Total lines often have dates

        // 1. Explicit End Totals (Always hide)
        if (d.includes('eindtotaal') || r.includes('eindtotaal') || d.includes('totaal generaal') || d === 'totaal' || r === 'totaal') {
            isTotal = true;
        } 
        // 2. Ambiguous "Total" (Check for transaction signals)
        // If row contains "total", it MIGHT be a product (Total Care). 
        // But if it has NO Item Code AND NO Invoice Number, it is certainly a summary line.
        else if (d.includes('totaal') || r.includes('totaal') || d.includes('total')) {
             if (!hasItem && !hasInv) {
                 isTotal = true;
             }
        }
    } else {
        // Standard Financial Logic
        isTotal = 
            rawCode.toLowerCase().includes('totaal') || 
            description.toLowerCase().includes('totaal') || 
            description.toLowerCase().includes('total') ||
            relationVal.toLowerCase().includes('totaal') ||
            (idxCode !== -1 && String(row[idxCode]).toLowerCase() === 'totaal');
    }

    let debet = 0;
    let credit = 0;

    // Amount Logic
    if (idxNetAmt !== -1) {
       // Exact Online Sales Analysis: "Verkoopbedrag" is the net revenue.
       // We map this to Credit for consistency with PnL structure.
       const val = parseDutchNumber(row[idxNetAmt], separator);
       if (!isNaN(val)) {
           if (val >= 0) credit = val; 
           else debet = Math.abs(val);
       } else {
           validationErrors['amount'] = 'Ongeldig getal';
       }
    } else if (idxDebet !== -1 && idxCredit !== -1) {
       debet = parseDutchNumber(row[idxDebet], separator);
       credit = parseDutchNumber(row[idxCredit], separator);
    } else if (idxAmount !== -1) {
       const val = parseDutchNumber(row[idxAmount], separator);
       if (val >= 0) debet = val; else credit = Math.abs(val);
    }

    const year = idxYear !== -1 ? parseInt(row[idxYear]) : new Date().getFullYear();
    const period = idxPeriod !== -1 ? String(row[idxPeriod]) : 'Jaar';
    const dateVal = idxDate !== -1 ? parseDate(row[idxDate]) : null;
    if (idxDate !== -1 && row[idxDate] && !dateVal) {
        validationErrors['entryDate'] = 'Ongeldige datum';
    }
    
    const journal = idxJournal !== -1 ? String(row[idxJournal] || '').trim() : undefined;
    const ref = idxRef !== -1 ? String(row[idxRef] || '').trim() : undefined;
    const relation = relationVal || undefined;
    const relationCode = idxRelCode !== -1 ? String(row[idxRelCode] || '').trim() : undefined;
    
    const invoiceNumber = idxInvNum !== -1 ? String(row[idxInvNum] || '').trim() : undefined;
    const invoiceDate = findCol(['factuurdatum']) !== -1 ? parseDate(row[findCol(['factuurdatum'])]) : null;

    const itemCode = idxItemCode !== -1 ? String(row[idxItemCode] || '').trim() : undefined;
    const quantity = idxQuantity !== -1 ? parseDutchNumber(row[idxQuantity], separator) : undefined;
    
    const country = idxCountry !== -1 ? String(row[idxCountry] || '').trim() : undefined;
    const itemGroup = idxItemGroup !== -1 ? String(row[idxItemGroup] || '').trim() : undefined;
    const salesPerson = idxSalesPerson !== -1 ? String(row[idxSalesPerson] || '').trim() : undefined;

    const vatBox = idxVatBox !== -1 ? String(row[idxVatBox] || '').trim() : undefined;
    const vatCode = findCol(['btw-code']) !== -1 ? String(row[findCol(['btw-code'])] || '').trim() : undefined;
    const vatBase = idxVatBase !== -1 ? parseDutchNumber(row[idxVatBase], separator) : undefined;
    const vatAmount = idxVatAmount !== -1 ? parseDutchNumber(row[idxVatAmount], separator) : undefined;
    
    // Sales Fields
    let discountAmount = 0;
    if (idxDiscountAmt !== -1) {
        discountAmount = Math.abs(parseDutchNumber(row[idxDiscountAmt], separator));
    }
    
    let grossAmount = 0;
    if (idxGrossAmt !== -1) {
        grossAmount = parseDutchNumber(row[idxGrossAmt], separator);
    }
    
    // If we have a gross amount (Verkoopwaarde) but no net credit calculated yet (e.g. only Gross col exists), derive credit
    if (credit === 0 && debet === 0 && grossAmount !== 0) {
        credit = grossAmount - discountAmount;
    }

    records.push({
      id: `${fileName}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      sourceFile: fileName,
      company: detectedCompany || 'Onbekend',
      
      code: rawCode,
      description: description,
      debit: debet,
      credit: credit,
      
      year: year,
      period: period,
      entryDate: dateVal,
      
      journal: journal,
      ref: ref,
      relation: relation,
      relationCode: relationCode,
      
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate,
      
      vatBox: vatBox,
      vatCode: vatCode,
      vatBase: vatBase,
      vatAmount: vatAmount,
      
      itemCode: itemCode,
      itemDescription: description, 
      quantity: quantity,
      itemGroup: itemGroup,
      country: country,
      salesPerson: salesPerson,
      
      discountAmount: discountAmount,
      grossAmount: grossAmount,
      
      type: determineType(rawCode),
      isTotalLine: isTotal,
      validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined
    });
  }

  return { records, type: detectedType };
};

export const parseCSV = (text: string, fileName: string): { vatRecords: VatRecord[], exactRecords: ExactRecord[], type: string } => {
  const rows = text.split('\n').map(row => row.split(';')); // Assume semicolon for Dutch CSV
  // Simple check for comma separator if semi-colon split looks bad (too few cols)
  let separator = ';';
  if (rows[0].length < 2 && text.split('\n')[0].split(',').length > 2) {
     separator = ',';
     // Re-parse
     const commaRows = text.split('\n').map(row => row.split(','));
     const resExact = parseExactOnlineData(commaRows, fileName, ',');
     if (resExact.records.length > 0) return { vatRecords: [], exactRecords: resExact.records, type: resExact.type };
  }
  
  const resExact = parseExactOnlineData(rows, fileName, separator);
  if (resExact.records.length > 0) return { vatRecords: [], exactRecords: resExact.records, type: resExact.type };

  // Fallback to old parser
  const vatRecords = mapRowsToRecords(rows[0], rows.slice(1), fileName, separator);
  return { vatRecords, exactRecords: [], type: 'financial' };
};

export const parseExcel = (buffer: ArrayBuffer, fileName: string): { vatRecords: VatRecord[], exactRecords: ExactRecord[], type: string } => {
  const workbook = read(buffer, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

  const resExact = parseExactOnlineData(rawRows, fileName);
  if (resExact.records.length > 0) return { vatRecords: [], exactRecords: resExact.records, type: resExact.type };

  // Fallback
  const headers = (rawRows[0] || []).map((h:any) => String(h));
  const vatRecords = mapRowsToRecords(headers, rawRows.slice(1), fileName);
  return { vatRecords, exactRecords: [], type: 'financial' };
};

export const generateTemplateXLSX = (): ArrayBuffer => {
  const ws = utils.json_to_sheet([
    {
      "Jaar": 2024, "Tijdvak": "Q1", "Bedrijf": "Mijn Bedrijf BV",
      "Omzet NL Hoog": 10000, "BTW Hoog": 2100,
      "Omzet NL Laag": 5000, "BTW Laag": 450,
      "Voorbelasting": 1500
    }
  ]);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "BTW Template");
  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  return wbout;
};

export const dummyData: VatRecord[] = [
  {
    id: '1', sourceFile: 'Voorbeeld.xlsx', company: 'Demo BV', year: 2024, period: 'Q1',
    omzet_nl_hoog: 50000, btw_hoog: 10500, omzet_nl_laag: 12000, btw_laag: 1080,
    omzet_overig: 0, btw_overig: 0, prive_gebruik: 0, btw_prive: 0,
    omzet_verlegd: 5000, btw_verlegd: 0, leveringen_buiten_eu: 2000, leveringen_eu: 3500,
    installatie_eu: 0, leveringen_uit_buiten_eu: 1000, btw_uit_buiten_eu: 210,
    leveringen_uit_eu: 4000, btw_uit_eu: 840,
    voorbelasting: 8500, suppletie: 0, inklaringskosten: 0
  }
];
