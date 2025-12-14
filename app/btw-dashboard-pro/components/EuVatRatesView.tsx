
'use client';

import React, { useState, useMemo } from 'react';
import { AppSettings, ThemeColors } from '../types';
import { Search, Map, Info, ExternalLink, Globe, ArrowUpRight } from 'lucide-react';

interface EuVatRatesViewProps {
  settings: AppSettings;
  theme: ThemeColors;
}

interface VatRate {
  country: string;
  code: string;
  standard: number;
  reduced: string;
  parking?: number;
  note?: string;
}

// Reference Data (Approximate 2024/2025 rates)
const VAT_RATES: VatRate[] = [
  { country: 'Nederland', code: 'NL', standard: 21, reduced: '9' },
  { country: 'België', code: 'BE', standard: 21, reduced: '6 / 12', parking: 12 },
  { country: 'Duitsland', code: 'DE', standard: 19, reduced: '7' },
  { country: 'Frankrijk', code: 'FR', standard: 20, reduced: '5.5 / 10', note: 'Corsica heeft afwijkende tarieven' },
  { country: 'Spanje', code: 'ES', standard: 21, reduced: '10 / 4' },
  { country: 'Italië', code: 'IT', standard: 22, reduced: '5 / 10 / 4' },
  { country: 'Ierland', code: 'IE', standard: 23, reduced: '13.5 / 9 / 4.8', parking: 13.5 },
  { country: 'Denemarken', code: 'DK', standard: 25, reduced: '-' },
  { country: 'Zweden', code: 'SE', standard: 25, reduced: '6 / 12' },
  { country: 'Finland', code: 'FI', standard: 24, reduced: '10 / 14' },
  { country: 'Oostenrijk', code: 'AT', standard: 20, reduced: '10 / 13', parking: 13 },
  { country: 'Portugal', code: 'PT', standard: 23, reduced: '6 / 13', note: 'Madeira/Azoren hebben lagere tarieven' },
  { country: 'Griekenland', code: 'GR', standard: 24, reduced: '6 / 13', note: 'Eilanden kunnen 30% lager tarief hebben' },
  { country: 'Luxemburg', code: 'LU', standard: 17, reduced: '8 / 14 / 3' },
  { country: 'Polen', code: 'PL', standard: 23, reduced: '5 / 8' },
  { country: 'Tsjechië', code: 'CZ', standard: 21, reduced: '12' },
  { country: 'Hongarije', code: 'HU', standard: 27, reduced: '5 / 18' },
  { country: 'Slowakije', code: 'SK', standard: 20, reduced: '10 / 5' },
  { country: 'Slovenië', code: 'SI', standard: 22, reduced: '9.5 / 5' },
  { country: 'Kroatië', code: 'HR', standard: 25, reduced: '5 / 13' },
  { country: 'Roemenië', code: 'RO', standard: 19, reduced: '5 / 9' },
  { country: 'Bulgarije', code: 'BG', standard: 20, reduced: '9' },
  { country: 'Estland', code: 'EE', standard: 22, reduced: '9 / 5' },
  { country: 'Letland', code: 'LV', standard: 21, reduced: '12 / 5' },
  { country: 'Litouwen', code: 'LT', standard: 21, reduced: '9 / 5' },
  { country: 'Malta', code: 'MT', standard: 18, reduced: '5 / 7' },
  { country: 'Cyprus', code: 'CY', standard: 19, reduced: '5 / 9' },
];

const EuVatRatesView: React.FC<EuVatRatesViewProps> = ({ settings, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRates = useMemo(() => {
    return VAT_RATES.filter(r => 
        r.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.country.localeCompare(b.country));
  }, [searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200 flex flex-col md:flex-row items-center gap-6">
         <div className="p-4 rounded-full shrink-0" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>
            <Globe className="w-10 h-10" />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">BTW Tarieven Europese Unie</h1>
            <p className="text-slate-600 max-w-2xl text-sm">
               Actueel overzicht van de standaard en verlaagde BTW-tarieven in alle EU-lidstaten. 
               Gebruik deze gegevens voor uw facturatie bij intracommunautaire prestaties of afstandsverkopen.
            </p>
         </div>
      </div>

      {/* Search & Disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 relative">
             <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
             <input 
               type="text" 
               placeholder="Zoek land of code (bijv. Duitsland of DE)..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm"
             />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800 flex items-start gap-2">
             <Info className="w-5 h-5 shrink-0" />
             <p>
               Tarieven kunnen wijzigen. Controleer voor grote transacties altijd de officiële bron van de lokale belastingdienst of de VIES-database.
             </p>
          </div>
      </div>

      {/* Rates Table */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-xs">
                     <tr>
                         <th className="px-6 py-4 w-16">Code</th>
                         <th className="px-6 py-4">Land</th>
                         <th className="px-6 py-4 text-center">Standaard</th>
                         <th className="px-6 py-4 text-center">Verlaagd</th>
                         <th className="px-6 py-4">Opmerkingen</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {filteredRates.map(rate => (
                         <tr key={rate.code} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                                 <span className="font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                     {rate.code}
                                 </span>
                             </td>
                             <td className="px-6 py-4 font-bold text-slate-700">
                                 {rate.country}
                             </td>
                             <td className="px-6 py-4 text-center">
                                 <div className="inline-flex items-center justify-center px-3 py-1 rounded-full font-bold border" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary, borderColor: `${theme.primary}30` }}>
                                     {rate.standard}%
                                 </div>
                             </td>
                             <td className="px-6 py-4 text-center text-slate-600 font-medium">
                                 {rate.reduced}%
                             </td>
                             <td className="px-6 py-4 text-xs text-slate-500 italic">
                                 {rate.note && (
                                     <div className="flex items-center gap-1">
                                         <Info className="w-3 h-3" />
                                         {rate.note}
                                     </div>
                                 )}
                                 {rate.parking !== undefined && (
                                     <div className="mt-1 text-slate-400">
                                         Parkeertarief: {rate.parking}%
                                     </div>
                                 )}
                             </td>
                         </tr>
                     ))}
                     {filteredRates.length === 0 && (
                         <tr>
                             <td colSpan={5} className="p-8 text-center text-slate-400">
                                 Geen landen gevonden.
                             </td>
                         </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </div>
      
      {/* Footer / Links */}
      <div className="flex justify-end">
          <a 
            href="https://europa.eu/youreurope/business/taxation/vat/vat-rules-rates/index_nl.htm" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold hover:underline"
            style={{ color: theme.primary }}
          >
             Bron: Europa.eu <ExternalLink className="w-3 h-3" />
          </a>
      </div>

    </div>
  );
};

export default EuVatRatesView;
