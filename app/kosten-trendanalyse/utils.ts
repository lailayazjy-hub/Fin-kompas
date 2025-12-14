import { FinancialRecord, Anomaly, MonthlyAggregatedData, Language } from './types';
import { format, parse, subMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// Currency formatting: 1500 -> 1.5k
export const formatCurrency = (amount: number): string => {
  const value = amount / 1000;
  return `EUR ${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
};

// Date formatting
export const formatDate = (date: Date, lang: Language): string => {
  return format(date, 'dd MMM yyyy', { locale: lang === Language.NL ? nl : enUS });
};

// Statistical Anomaly Detection (Z-Score)
export const detectAnomalies = (data: FinancialRecord[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  const groupedByType: Record<string, number[]> = {};

  // Group amounts by cost type to calculate stats
  data.forEach(record => {
    if (!groupedByType[record.costType]) {
      groupedByType[record.costType] = [];
    }
    groupedByType[record.costType].push(record.amount);
  });

  // Calculate Mean and StdDev per type
  const stats: Record<string, { mean: number; stdDev: number }> = {};
  Object.keys(groupedByType).forEach(type => {
    const values = groupedByType[type];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    stats[type] = { mean, stdDev: Math.sqrt(variance) };
  });

  // Identify anomalies
  data.forEach(record => {
    const { mean, stdDev } = stats[record.costType];
    if (stdDev === 0) return;

    const zScore = (record.amount - mean) / stdDev;
    
    // Threshold > 2 Standard Deviations
    if (Math.abs(zScore) > 2) {
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (Math.abs(zScore) > 4) severity = 'HIGH';
      else if (Math.abs(zScore) > 3) severity = 'MEDIUM';

      anomalies.push({
        id: record.id,
        date: record.date,
        costType: record.costType,
        amount: record.amount,
        zScore,
        severity,
        description: zScore > 0 ? 'Ongebruikelijke Piek' : 'Ongebruikelijke Daling'
      });
    }
  });

  return anomalies.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Dummy Data Generator for Demo based on Exact Online Structure
export const generateDemoData = (): FinancialRecord[] => {
  const records: FinancialRecord[] = [];
  
  // Mapping Grootboekrekening -> Kostendragers based on user input
  const mapping: Record<string, string[]> = {
    'Verzekeringskosten': ['Beroepsaansprakelijkheid', 'Aansprakelijkheid', 'Pensioenverzekering', 'Mobiliteit'],
    'Automatiseringskosten': ['Freshdesk', 'Align today', 'TransIP Cpanel', 'Previder Rack space', 'Stuff testplatform', 'Digidentity', 'Browserstack', 'Afas', 'Productboard', 'Jetbrains Resharper', 'Teamviewer', 'Exact Online', 'ChatGPT'],
    'Telecommunicatiekosten': ['Penzias (Hello) telefonie', 'HDL Internet', 'Totaalnet domein'],
    'Huisvestingskosten': ['Huurkosten', 'Servicekosten', 'Ambius Groenvoorziening', 'Gevelreclame', 'Schoonmaak'],
    'Marketingkosten': ['Cambanigh', 'Tooling & Website', 'Positionering & Branding'],
    'Werving en selectie': ['Wervingsfee recruiters', 'Arbeidsmarktcommunicatie'],
    'Opleidingskosten': ['Opleiding', 'R&D', 'Sales & Marketing']
  };

  const today = new Date();

  // Generate 24 months of data
  for (let i = 0; i < 24; i++) {
    const monthDate = subMonths(today, i);
    
    Object.keys(mapping).forEach((grootboek) => {
      const kostendragers = mapping[grootboek];
      
      // Select 1 to 3 random kostendragers per month for this ledger to simulate transactions
      const activeDragers = kostendragers.filter(() => Math.random() > 0.3); // 70% chance of occurring

      if (activeDragers.length === 0 && kostendragers.length > 0) {
        activeDragers.push(kostendragers[0]); // Ensure at least one
      }

      activeDragers.forEach(drager => {
        let baseAmount = 0;
        // Assign realistic base amounts based on ledger type
        switch (grootboek) {
          case 'Automatiseringskosten': baseAmount = 150 + Math.random() * 800; break;
          case 'Huisvestingskosten': baseAmount = 2500; break;
          case 'Werving en selectie': baseAmount = 5000; break;
          default: baseAmount = 500 + Math.random() * 1000;
        }

        // Add variance
        let amount = baseAmount + (Math.random() * baseAmount * 0.1);

        // Inject specific anomalies
        if (grootboek === 'Werving en selectie' && Math.random() > 0.8) amount *= 3; // Occasional high recruiting fees
        if (grootboek === 'Automatiseringskosten' && Math.random() > 0.95) amount *= 1.5; // Occasional software upgrade

        records.push({
          id: `${i}-${grootboek}-${drager}`,
          date: monthDate,
          costType: grootboek, // We analyze on Grootboekrekening level
          amount: Math.round(amount)
        });
      });
    });
  }
  return records;
};

// Generate Excel Template with Exact Online structure
export const downloadTemplate = () => {
  const headers = ['Boekstuknummer', 'Relatie', 'Dagboek', 'Grootboekrekening', 'Kostendrager', 'Datum', 'Bedrag'];
  const rows = [
    ['2024001', 'KPN Zakelijk', 'INK', 'Telecommunicatiekosten', 'Telefonie', '2024-01-15', 45.50],
    ['2024002', 'Freshworks', 'BANK', 'Automatiseringskosten', 'Freshdesk', '2024-01-18', 120.00],
    ['2024003', 'Verhuurder BV', 'INK', 'Huisvestingskosten', 'Huur', '2024-01-01', 2500.00],
    ['2024004', 'Google Ireland', 'BANK', 'Marketingkosten', 'Tooling & Website', '2024-01-20', 450.00]
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Auto-width columns
  const wscols = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, "Exact Online Export");
  XLSX.writeFile(wb, "finfocus_exact_template.xlsx");
};
