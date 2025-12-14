
'use client';

import React, { useMemo } from 'react';
import { VatRecord, AppSettings, ThemeColors, ExactRecord } from '../types';
import { formatCurrency } from '../utils';

interface TaxFormViewProps {
  records: VatRecord[];
  exactRecords?: ExactRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const TaxFormView: React.FC<TaxFormViewProps> = ({ records, exactRecords = [], settings, theme }) => {
  // Aggregate all active records
  const totals = useMemo(() => {
    // 1. Initialize with Legacy Records
    const acc = records.reduce((acc, curr) => ({
      omzet_nl_hoog: acc.omzet_nl_hoog + curr.omzet_nl_hoog,
      btw_hoog: acc.btw_hoog + curr.btw_hoog,
      omzet_nl_laag: acc.omzet_nl_laag + curr.omzet_nl_laag,
      btw_laag: acc.btw_laag + curr.btw_laag,
      omzet_overig: acc.omzet_overig + curr.omzet_overig,
      btw_overig: acc.btw_overig + curr.btw_overig,
      prive_gebruik: acc.prive_gebruik + curr.prive_gebruik,
      btw_prive: acc.btw_prive + curr.btw_prive,
      omzet_verlegd: acc.omzet_verlegd + curr.omzet_verlegd,
      btw_verlegd: acc.btw_verlegd + curr.btw_verlegd,
      leveringen_buiten_eu: acc.leveringen_buiten_eu + curr.leveringen_buiten_eu,
      leveringen_eu: acc.leveringen_eu + curr.leveringen_eu,
      installatie_eu: acc.installatie_eu + curr.installatie_eu,
      leveringen_uit_buiten_eu: acc.leveringen_uit_buiten_eu + curr.leveringen_uit_buiten_eu,
      btw_uit_buiten_eu: acc.btw_uit_buiten_eu + curr.btw_uit_buiten_eu,
      leveringen_uit_eu: acc.leveringen_uit_eu + curr.leveringen_uit_eu,
      btw_uit_eu: acc.btw_uit_eu + curr.btw_uit_eu,
      voorbelasting: acc.voorbelasting + curr.voorbelasting,
      suppletie: acc.suppletie + curr.suppletie,
      inklaringskosten: acc.inklaringskosten + curr.inklaringskosten
    }), {
      omzet_nl_hoog: 0, btw_hoog: 0, omzet_nl_laag: 0, btw_laag: 0, omzet_overig: 0, btw_overig: 0,
      prive_gebruik: 0, btw_prive: 0, omzet_verlegd: 0, btw_verlegd: 0,
      leveringen_buiten_eu: 0, leveringen_eu: 0, installatie_eu: 0,
      leveringen_uit_buiten_eu: 0, btw_uit_buiten_eu: 0, leveringen_uit_eu: 0, btw_uit_eu: 0,
      voorbelasting: 0, suppletie: 0, inklaringskosten: 0
    });

    // 2. Add Exact Records based on VAT Box mapping
    exactRecords.forEach(r => {
      // Skip if marked as total line to avoid double counting if using flat list
      if (r.isTotalLine) return;
      
      const box = (r.vatBox || '').toLowerCase().replace(/[^0-9a-z]/g, ''); // normalize '1a'
      const base = r.vatBase || 0;
      const tax = r.vatAmount || 0;

      if (!box) return;

      if (box.includes('1a')) { acc.omzet_nl_hoog += base; acc.btw_hoog += tax; }
      else if (box.includes('1b')) { acc.omzet_nl_laag += base; acc.btw_laag += tax; }
      else if (box.includes('1c')) { acc.omzet_overig += base; acc.btw_overig += tax; }
      else if (box.includes('1d')) { acc.prive_gebruik += base; acc.btw_prive += tax; }
      else if (box.includes('2a')) { acc.omzet_verlegd += base; acc.btw_verlegd += tax; }
      else if (box.includes('3a')) { acc.leveringen_buiten_eu += base; }
      else if (box.includes('3b')) { acc.leveringen_eu += base; }
      else if (box.includes('3c')) { acc.installatie_eu += base; }
      else if (box.includes('4a')) { acc.leveringen_uit_buiten_eu += base; acc.btw_uit_buiten_eu += tax; }
      else if (box.includes('4b')) { acc.leveringen_uit_eu += base; acc.btw_uit_eu += tax; }
      else if (box.includes('5b')) { acc.voorbelasting += tax; }
    });

    return acc;
  }, [records, exactRecords]);

  const subtotal_5a = 
    totals.btw_hoog + totals.btw_laag + totals.btw_overig + totals.btw_prive + 
    totals.btw_verlegd + totals.btw_uit_eu + totals.btw_uit_buiten_eu;

  const total_payable = subtotal_5a - totals.voorbelasting;

  const Row = ({ label, code, col1, col2, sectionHeader = false }: { label: string, code?: string, col1?: number, col2?: number, sectionHeader?: boolean }) => (
    <div className={`grid grid-cols-12 gap-0 border-b border-slate-200 ${sectionHeader ? 'bg-slate-50 font-semibold' : 'bg-white hover:bg-slate-50'}`}>
      <div className="col-span-8 p-2 text-sm text-slate-700 flex items-center">
        {code && <span className="font-mono font-bold text-slate-500 w-8 mr-2">{code}</span>}
        {label}
      </div>
      <div className="col-span-2 p-2 text-right text-sm border-l border-slate-100 font-mono text-slate-600">
        {col1 !== undefined ? formatCurrency(col1, settings.currencyMode) : ''}
      </div>
      <div className="col-span-2 p-2 text-right text-sm border-l border-slate-100 font-mono font-medium" style={{ color: theme.text }}>
        {col2 !== undefined ? formatCurrency(col2, settings.currencyMode) : ''}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-300 max-w-4xl mx-auto">
      <div className="p-4" style={{ backgroundColor: theme.primary, color: '#fff' }}>
        <h2 className="text-xl font-bold">BTW Aangifte</h2>
        <p className="opacity-80 text-sm">Geconsolideerd overzicht (NL Model) o.b.v. {exactRecords.length > 0 ? 'Transacties' : 'geüploade rapportages'}</p>
      </div>

      <div className="border-b border-slate-200 grid grid-cols-12 bg-slate-50 font-bold text-xs text-slate-500 uppercase tracking-wider">
        <div className="col-span-8 p-3">Omschrijving</div>
        <div className="col-span-2 p-3 text-right">Bedrag</div>
        <div className="col-span-2 p-3 text-right">Omzetbelasting</div>
      </div>

      {/* Rubriek 1 */}
      <Row label="Prestaties binnenland" sectionHeader />
      <Row code="1a" label="Leveringen/diensten belast met hoog tarief" col1={totals.omzet_nl_hoog} col2={totals.btw_hoog} />
      <Row code="1b" label="Leveringen/diensten belast met laag tarief" col1={totals.omzet_nl_laag} col2={totals.btw_laag} />
      <Row code="1c" label="Leveringen/diensten overige tarieven" col1={totals.omzet_overig} col2={totals.btw_overig} />
      <Row code="1d" label="Privégebruik" col1={totals.prive_gebruik} col2={totals.btw_prive} />
      <Row code="1e" label="Leveringen/diensten belast met 0% of niet bij u belast" col1={0} />

      {/* Rubriek 2 */}
      <Row label="Verleggingsregelingen binnenland" sectionHeader />
      <Row code="2a" label="Leveringen/diensten waarbij heffing naar u is verlegd" col1={totals.omzet_verlegd} col2={totals.btw_verlegd} />

      {/* Rubriek 3 */}
      <Row label="Prestaties naar of in het buitenland" sectionHeader />
      <Row code="3a" label="Leveringen naar landen buiten de EU (uitvoer)" col1={totals.leveringen_buiten_eu} />
      <Row code="3b" label="Leveringen naar of diensten in landen binnen de EU" col1={totals.leveringen_eu} />
      <Row code="3c" label="Installatie/afstandsverkopen binnen de EU" col1={totals.installatie_eu} />

      {/* Rubriek 4 */}
      <Row label="Prestaties vanuit het buitenland aan u" sectionHeader />
      <Row code="4a" label="Leveringen/diensten uit landen buiten de EU" col1={totals.leveringen_uit_buiten_eu} col2={totals.btw_uit_buiten_eu} />
      <Row code="4b" label="Leveringen/diensten uit landen binnen de EU" col1={totals.leveringen_uit_eu} col2={totals.btw_uit_eu} />

      {/* Rubriek 5 */}
      <Row label="Voorbelasting, kleineondernemersregeling en totaal" sectionHeader />
      <Row code="5a" label="Omzetbelasting (som rubrieken 1 t/m 4)" col2={subtotal_5a} />
      <Row code="5b" label="Voorbelasting" col2={totals.voorbelasting} />
      <Row code="5c" label="Subtotaal (5a min 5b)" col2={total_payable} />
      <Row code="5d" label="Vermindering volgens de kleineondernemersregeling" col2={0} />
      <Row code="5e" label="Schatting vorig aangiftetijdvak" col2={0} />
      <Row code="5f" label="Schatting dit aangiftetijdvak" col2={0} />
      <Row code="5g" label="Totaal te betalen of terug te vragen" col2={total_payable} />

    </div>
  );
};

export default TaxFormView;
