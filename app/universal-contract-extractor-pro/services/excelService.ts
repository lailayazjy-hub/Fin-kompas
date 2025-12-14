import { read, utils } from "xlsx";
import { ContractData, SourceDocument, FinancialItem } from "../types";

export const processExcelFile = async (file: File): Promise<SourceDocument[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        
        const sources: SourceDocument[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          // Use header:1 to get an array of arrays. This allows direct index access row[i].
          const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) return; // Skip empty sheets

          const items: FinancialItem[] = [];
          let totalVal = 0;

          // Skip header row (index 0), start at 1
          // DATA INTEGRITY: Strict Index Mapping
          for(let i = 1; i < jsonData.length; i++) {
             const row: any = jsonData[i];
             if(!row || row.length === 0) continue;

             // Generate Unique ID based on Sheet + Row Index
             const uniqueRowId = `${sheetName.replace(/\s+/g, '_')}_ROW_${i}`;

             // 1. Description Mapping (Index 0)
             const rawDesc = row[0];
             const description = rawDesc ? String(rawDesc).trim() : `Onbekend Item (Rij ${i})`;

             // 2. Amount Mapping (Heuristic: Index 1, or first number found)
             // We prioritize Index 1 for stability, but fallback if column 1 is text
             let amount = 0;
             let rawAmount = row[1];

             if (typeof rawAmount === 'number') {
                amount = rawAmount;
             } else {
                // Fallback: search for first numeric value in the row to be safe
                const foundAmount = row.find((cell: any) => typeof cell === 'number');
                amount = foundAmount || 0;
             }

             // 3. Category Mapping (Index 2) - Optional
             const category = row[2] ? String(row[2]) : 'Algemeen';

             // VALIDATION LOGIC
             // Determine validity based on data integrity rules
             let status: 'Valid' | 'Review' | 'Invalid' = 'Valid';
             
             if (amount === 0) status = 'Invalid'; // Zero values often indicate empty rows or headers
             else if (!rawDesc) status = 'Review'; // Missing description
             else if (amount < 0) status = 'Review'; // Negative values might be credit notes

             const item: FinancialItem = {
                 description: description,
                 amount: amount,
                 periodicity: 'One-off', 
                 category: category,
                 sourceRowIndex: i,
                 rowId: uniqueRowId,
                 validationStatus: status
             };

             items.push(item);
             
             if (status === 'Valid' || status === 'Review') {
                totalVal += amount;
             }
          }

          if (items.length > 0) {
              const contractData: ContractData = {
                  contractType: 'Excel Import',
                  summary: `Gegevens geïmporteerd van tabblad: ${sheetName}`,
                  language: 'N/A',
                  currency: 'EUR',
                  parties: [{ name: 'Intern Bestand', role: 'Other' }],
                  dates: {
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: '',
                      isAutoRenewal: false,
                      noticePeriodDays: 0
                  },
                  financials: {
                      totalValue: totalVal,
                      paymentTerms: 'N/A',
                      items: items
                  },
                  specifications: [],
                  calculations: [],
                  risks: [],
                  governingLaw: '',
                  terminationClauseSummary: ''
              };

              sources.push({
                  id: `${file.name}-${sheetName}-${Date.now()}`,
                  name: sheetName,
                  type: 'EXCEL_SHEET',
                  data: contractData,
                  isEnabled: true,
                  originalFile: file,
                  sheetName: sheetName
              });
          }
        });

        resolve(sources);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};