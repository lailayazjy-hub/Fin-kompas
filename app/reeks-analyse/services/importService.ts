import * as XLSX from 'xlsx';
import { TransactionEntry } from '../types';

// Keywords to detect columns
const KEYWORDS = {
  date: ['datum', 'date', 'transactiedatum', 'entry date'],
  description: ['omschrijving', 'description', 'toelichting', 'naam'],
  amount: ['bedrag', 'amount', 'waarde', 'saldo'],
  debit: ['debet', 'debit', 'af'],
  credit: ['credit', 'bij'],
  reference: ['boekstuk', 'reference', 'ref', 'factuurnr', 'our ref'],
  relation: ['relatie', 'relation', 'tegenrekening', 'naam relatie', 'counterparty'],
  grootboek: ['grootboek', 'grootboekrekening', 'gl account', 'account'],
  dagboek: ['dagboek', 'journal']
};

interface ColumnMapping {
  date: number;
  description: number;
  amount?: number;
  debit?: number;
  credit?: number;
  reference?: number;
  relation?: number;
  grootboek?: number;
  dagboek?: number;
}

/**
 * Calculates a "confidence score" for a row being the header row.
 * Based on how many expected keywords are found in that row.
 */
const calculateHeaderScore = (row: any[]): number => {
  let score = 0;
  const rowStr = row.map(cell => String(cell).toLowerCase());

  // Check for presence of key terms
  const allKeywords = [
    ...KEYWORDS.date, ...KEYWORDS.description, 
    ...KEYWORDS.amount, ...KEYWORDS.debit, ...KEYWORDS.credit, 
    ...KEYWORDS.reference, ...KEYWORDS.grootboek
  ];

  rowStr.forEach(cellVal => {
    if (allKeywords.some(kw => cellVal.includes(kw))) {
      score++;
    }
  });

  return score;
};

/**
 * Finds the column index for a specific field based on keywords.
 */
const findColumnIndex = (headerRow: any[], keywords: string[]): number => {
  return headerRow.findIndex(cell => {
    const cellStr = String(cell).toLowerCase();
    return keywords.some(kw => cellStr.includes(kw));
  });
};

/**
 * Parses raw Excel data into TransactionEntry objects using Smart Import logic.
 */
export const parseExcelFile = async (file: File): Promise<TransactionEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // Assume first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) {
          resolve([]);
          return;
        }

        // 1. Detect Header Row (Smart Import: Ignore titles/address data)
        let headerRowIndex = 0;
        let maxScore = -1;

        // Scan first 20 rows for the most "header-like" row
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
          const score = calculateHeaderScore(jsonData[i]);
          if (score > maxScore) {
            maxScore = score;
            headerRowIndex = i;
          }
        }

        const headerRow = jsonData[headerRowIndex];
        
        // 2. Map Columns (Index-based mapping)
        const mapping: ColumnMapping = {
          date: findColumnIndex(headerRow, KEYWORDS.date),
          description: findColumnIndex(headerRow, KEYWORDS.description),
          amount: findColumnIndex(headerRow, KEYWORDS.amount),
          debit: findColumnIndex(headerRow, KEYWORDS.debit),
          credit: findColumnIndex(headerRow, KEYWORDS.credit),
          reference: findColumnIndex(headerRow, KEYWORDS.reference),
          relation: findColumnIndex(headerRow, KEYWORDS.relation),
          grootboek: findColumnIndex(headerRow, KEYWORDS.grootboek),
          dagboek: findColumnIndex(headerRow, KEYWORDS.dagboek),
        };

        // Fallback: If no date/desc found, assume col 0 and 1 (generic structure)
        if (mapping.date === -1) mapping.date = 0;
        if (mapping.description === -1) mapping.description = 1;
        // If no amount/debit/credit found, assume col 2
        if (mapping.amount === -1 && mapping.debit === -1 && mapping.credit === -1) mapping.amount = 2;

        // 3. Process Rows
        const transactions: TransactionEntry[] = [];
        const rowsToProcess = jsonData.slice(headerRowIndex + 1);

        rowsToProcess.forEach((row, idx) => {
          // Skip empty rows
          if (row.length === 0 || !row[mapping.date]) return;

          // Date Parsing (Excel cellDates=true returns Date objects usually, else string)
          let dateVal = row[mapping.date];
          let parsedDate = new Date().toISOString(); // Default fallback
          
          if (dateVal instanceof Date) {
            parsedDate = dateVal.toISOString();
          } else if (typeof dateVal === 'number') {
             // Basic Excel serial date handle fallback if option failed
             const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
             parsedDate = date.toISOString();
          } else if (typeof dateVal === 'string') {
             // Try parse string
             const d = new Date(dateVal);
             if (!isNaN(d.getTime())) parsedDate = d.toISOString();
          }

          // Amount Logic
          let amount = 0;
          if (mapping.debit !== -1 && mapping.credit !== -1) {
            const deb = typeof row[mapping.debit!] === 'number' ? row[mapping.debit!] : 0;
            const cred = typeof row[mapping.credit!] === 'number' ? row[mapping.credit!] : 0;
            amount = deb - cred;
          } else if (mapping.amount !== -1) {
            const rawAmt = row[mapping.amount!];
            amount = typeof rawAmt === 'number' ? rawAmt : parseFloat(rawAmt) || 0;
          }

          // Description & Others
          const description = row[mapping.description] ? String(row[mapping.description]) : 'Geen omschrijving';
          const reference = mapping.reference !== -1 ? String(row[mapping.reference!]) : undefined;
          const relation = mapping.relation !== -1 ? String(row[mapping.relation!]) : undefined;
          const grootboek = mapping.grootboek !== -1 ? String(row[mapping.grootboek!]) : undefined;
          const dagboek = mapping.dagboek !== -1 ? String(row[mapping.dagboek!]) : undefined;

          transactions.push({
            id: `imp-${idx}-${Math.random().toString(36).substr(2,9)}`,
            date: parsedDate,
            description,
            amount,
            reference,
            relation,
            grootboek,
            dagboek,
            isMatched: false
          });
        });

        resolve(transactions);

      } catch (error) {
        console.error("Excel parse error", error);
        reject(error);
      }
    };

    reader.readAsBinaryString(file);
  });
};