
'use client';

import React from 'react';
import { AppSettings, ThemeColors } from '../types';
import { BookOpen, Calendar, Euro, Info, Megaphone, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface NewsletterViewProps {
  settings: AppSettings;
  theme: ThemeColors;
}

const NewsletterView: React.FC<NewsletterViewProps> = ({ settings, theme }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Hero Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
         <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-white rounded-full shadow-sm" style={{ color: theme.primary }}>
               <Megaphone className="w-10 h-10" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h1 className="text-2xl font-bold text-slate-800 mb-2">Nieuwsbrief & Wetgeving {currentYear}</h1>
               <p className="text-slate-600 max-w-2xl">
                  Blijf op de hoogte van de belangrijkste fiscale wijzigingen voor ondernemers. 
                  In begrijpelijke taal, zonder moeilijke termen.
               </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* News Item 1: KOR */}
         <div className="bg-white p-6 rounded-lg shadow border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <Euro className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-lg text-slate-800">Kleineondernemersregeling (KOR)</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
               Bent u een kleine ondernemer met minder dan € 20.000 omzet per jaar? Dan kunt u kiezen voor de KOR.
               U berekent dan geen btw op uw facturen, maar u mag ook geen btw meer aftrekken.
            </p>
            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700">
               <strong className="block mb-1 text-slate-900">Nieuw vanaf 2025:</strong>
               De regels worden versoepeld voor ondernemers die ook in andere EU-landen zakendoen. 
               Er komt een Europese KOR (EU-KOR) waardoor u ook in het buitenland van btw-vrijstelling gebruik kunt maken.
            </div>
         </div>

         {/* News Item 2: Betalingskorting */}
         <div className="bg-white p-6 rounded-lg shadow border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Calculator className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-lg text-slate-800">Belastingrente Omhoog</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
               Let op: De rente die u betaalt als u te laat bent met uw belastingaangifte is gestegen.
               Het is dus belangrijker dan ooit om uw btw-aangifte op tijd in te dienen en te betalen.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
               <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Aangifte per kwartaal: uiterlijk laatste dag van de volgende maand.</span>
               </li>
               <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                  <span>Tip: Zet uw btw-geld direct opzij om betalingsproblemen te voorkomen.</span>
               </li>
            </ul>
         </div>

         {/* News Item 3: Zonnepanelen */}
         <div className="bg-white p-6 rounded-lg shadow border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                  <Info className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-lg text-slate-800">Btw op Zonnepanelen</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
               Voor zonnepanelen op of bij woningen geldt nog steeds het 0% btw-tarief. 
               U hoeft de btw dus niet meer voor te schieten en terug te vragen; deze staat direct op € 0 op de factuur.
            </p>
            <div className="text-xs text-slate-500 italic">
               Let op: Dit geldt alleen als de panelen een woonfunctie hebben. Voor bedrijfspanden gelden andere regels.
            </div>
         </div>

         {/* News Item 4: Reiskosten */}
         <div className="bg-white p-6 rounded-lg shadow border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <BookOpen className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-lg text-slate-800">Onbelaste Reiskosten</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
               De onbelaste reiskostenvergoeding is verhoogd. U mag uzelf (of uw personeel) nu € 0,23 per zakelijke kilometer vergoeden zonder dat hier belasting over betaald hoeft te worden.
            </p>
            <a href="#" className="inline-flex items-center gap-1 text-sm font-bold hover:underline" style={{ color: theme.primary }}>
               Lees meer op Belastingdienst.nl <ArrowRight className="w-3 h-3" />
            </a>
         </div>

      </div>

      {/* Info Block */}
      <div className="bg-slate-800 rounded-lg shadow-lg text-white p-8 mt-8">
         <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Belangrijke Data {currentYear}
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div>
               <div className="font-bold text-slate-300 uppercase mb-1">Kwartaal 1</div>
               <div className="font-mono text-lg">Uiterlijk 30 april</div>
               <div className="text-slate-400 text-xs mt-1">Aangifte & Betaling</div>
            </div>
            <div>
               <div className="font-bold text-slate-300 uppercase mb-1">Kwartaal 2</div>
               <div className="font-mono text-lg">Uiterlijk 31 juli</div>
               <div className="text-slate-400 text-xs mt-1">Aangifte & Betaling</div>
            </div>
            <div>
               <div className="font-bold text-slate-300 uppercase mb-1">Kwartaal 3</div>
               <div className="font-mono text-lg">Uiterlijk 31 okt</div>
               <div className="text-slate-400 text-xs mt-1">Aangifte & Betaling</div>
            </div>
            <div>
               <div className="font-bold text-slate-300 uppercase mb-1">Kwartaal 4</div>
               <div className="font-mono text-lg">Uiterlijk 31 jan</div>
               <div className="text-slate-400 text-xs mt-1">Aangifte & Betaling</div>
            </div>
         </div>
      </div>
    </div>
  );
};

// Simple Calculator Icon placeholder since Lucide import might need adjustment if not available in context, 
// but Calculator is standard in lucide-react.
const Calculator = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    <path d="M16 10h.01" />
    <path d="M12 10h.01" />
    <path d="M8 10h.01" />
    <path d="M12 14h.01" />
    <path d="M8 14h.01" />
    <path d="M12 18h.01" />
    <path d="M8 18h.01" />
  </svg>
);

export default NewsletterView;
