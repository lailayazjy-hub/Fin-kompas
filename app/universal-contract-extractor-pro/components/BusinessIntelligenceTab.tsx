import React from 'react';
import { SourceDocument, Theme } from '../types';
import { 
  Building2, 
  Gavel, 
  Users, 
  Calendar, 
  Boxes, 
  ShieldCheck, 
  ScrollText, 
  Clock,
  Briefcase,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Workflow,
  ListChecks,
  Award,
  Info
} from 'lucide-react';

interface BusinessIntelligenceTabProps {
  sources: SourceDocument[];
  theme: Theme;
}

const BusinessIntelligenceTab: React.FC<BusinessIntelligenceTabProps> = ({ sources, theme }) => {
  const activeSources = sources.filter(s => s.isEnabled);

  if (activeSources.length === 0) return null;

  // Check for demo data to show helper text since App.tsx is read-only and lacks BI demo data
  const isDemoData = activeSources.some(s => s.id.startsWith('demo-'));
  const hasBIData = activeSources.some(s => s.data.businessAnalysis);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {isDemoData && !hasBIData && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                  <h4 className="text-sm font-bold text-blue-800">Demo Modus</h4>
                  <p className="text-xs text-blue-600 mt-1">
                      De huidige demodata bevat geen uitgebreide AI-analyse. Upload een eigen PDF of Excel-bestand om de Business Intelligence functies (Strategie, SWOT, Processen) volledig te ervaren.
                  </p>
              </div>
          </div>
      )}

      {/* HEADER KPI's */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Governance Status */}
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-xs uppercase font-semibold tracking-wider opacity-70 mb-1" style={{ color: theme.colors.text }}>Contractbeheer</p>
                   <h3 className="font-bold text-lg" style={{ color: theme.colors.text }}>
                       {activeSources.filter(s => s.data.governingLaw).length}/{activeSources.length} Gedefinieerd
                   </h3>
                   <p className="text-xs text-gray-500 mt-1">Juridische kaders herkend</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50">
                   <Gavel className="w-5 h-5 text-gray-400" />
                </div>
             </div>
         </div>

         {/* Entity Count */}
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-xs uppercase font-semibold tracking-wider opacity-70 mb-1" style={{ color: theme.colors.text }}>Betrokkenen</p>
                   <h3 className="font-bold text-lg" style={{ color: theme.colors.text }}>
                       {activeSources.reduce((acc, s) => acc + s.data.parties.length, 0)} Partijen
                   </h3>
                   <p className="text-xs text-gray-500 mt-1">Leveranciers & Klanten</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50">
                   <Users className="w-5 h-5 text-gray-400" />
                </div>
             </div>
         </div>

         {/* Operational Specs */}
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-xs uppercase font-semibold tracking-wider opacity-70 mb-1" style={{ color: theme.colors.text }}>Middelen & Specs</p>
                   <h3 className="font-bold text-lg" style={{ color: theme.colors.text }}>
                       {activeSources.reduce((acc, s) => acc + s.data.specifications.length, 0)} Items
                   </h3>
                   <p className="text-xs text-gray-500 mt-1">SLA's, Hardware, Licenties</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50">
                   <Boxes className="w-5 h-5 text-gray-400" />
                </div>
             </div>
         </div>
      </div>

      {/* STRATEGIC CONTEXT (NEW SECTION) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" style={{ color: theme.colors.primary }} />
            <h3 className="font-semibold text-gray-900">Strategische Context</h3>
        </div>
        <div className="p-6 space-y-6">
            {activeSources.map((source, idx) => {
                const bi = source.data.businessAnalysis;
                if (!bi && activeSources.length === 1) return <p key={idx} className="text-gray-400 text-sm italic">Geen strategische analyse beschikbaar. (Upload een document voor AI-extractie).</p>;
                if (!bi) return null;

                return (
                    <div key={idx} className={activeSources.length > 1 ? "pb-6 border-b border-gray-100 last:border-0 last:pb-0" : ""}>
                        {activeSources.length > 1 && <h4 className="font-bold text-sm mb-2">{source.name}</h4>}
                        
                        {/* Introduction */}
                        {bi.introduction && (
                            <div className="mb-4">
                                <p className="text-gray-700 leading-relaxed text-sm italic border-l-4 pl-3" style={{ borderLeftColor: theme.colors.primary }}>
                                    "{bi.introduction}"
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Pros */}
                            <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                                <h5 className="flex items-center gap-2 text-xs font-bold uppercase text-green-700 mb-3">
                                    <ThumbsUp className="w-3.5 h-3.5" /> Voordelen
                                </h5>
                                <ul className="space-y-2">
                                    {(bi.pros || []).length > 0 ? bi.pros?.map((pro, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                                            <span className="text-green-500 mt-1">•</span> {pro}
                                        </li>
                                    )) : <li className="text-xs text-gray-400 italic">Geen specifieke voordelen gedetecteerd.</li>}
                                </ul>
                            </div>

                            {/* Cons */}
                            <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                                <h5 className="flex items-center gap-2 text-xs font-bold uppercase text-red-700 mb-3">
                                    <ThumbsDown className="w-3.5 h-3.5" /> Nadelen & Aandachtspunten
                                </h5>
                                <ul className="space-y-2">
                                    {(bi.cons || []).length > 0 ? bi.cons?.map((con, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                                            <span className="text-red-500 mt-1">•</span> {con}
                                        </li>
                                    )) : <li className="text-xs text-gray-400 italic">Geen specifieke nadelen gedetecteerd.</li>}
                                </ul>
                            </div>
                        </div>

                        {/* Frameworks & Processes */}
                        <div className="mt-4 flex flex-wrap gap-4">
                            {(bi.frameworks || []).length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4 text-gray-400" />
                                    <div className="flex flex-wrap gap-1">
                                        {bi.frameworks?.map((fw, i) => (
                                            <span key={i} className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-200">
                                                {fw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {(bi.processes || []).length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Workflow className="w-4 h-4 text-gray-400" />
                                    <div className="flex flex-wrap gap-1">
                                        {bi.processes?.map((proc, i) => (
                                            <span key={i} className="text-[10px] font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">
                                                {proc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                         
                         {/* Requirements */}
                         {(bi.requirements || []).length > 0 && (
                             <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                 <h5 className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-2">
                                    <ListChecks className="w-3.5 h-3.5" /> Eisen & Behoeften
                                 </h5>
                                 <div className="flex flex-wrap gap-x-4 gap-y-1">
                                     {bi.requirements?.map((req, i) => (
                                         <span key={i} className="text-xs text-gray-600">• {req}</span>
                                     ))}
                                 </div>
                             </div>
                         )}

                    </div>
                );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. CONTRACT GOVERNANCE & LEGAL */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4" style={{ color: theme.colors.primary }} />
                 <h3 className="font-semibold text-gray-900">Juridisch Kader & Beheer</h3>
             </div>
             <div className="divide-y divide-gray-100">
                {activeSources.map((source, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">{source.name}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                            <div>
                                <span className="text-xs text-gray-400 uppercase">Toepasselijk Recht</span>
                                <p className="font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                                    <Gavel className="w-3 h-3 text-gray-400" />
                                    {source.data.governingLaw || 'Niet gespecificeerd'}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 uppercase">Beëindiging</span>
                                <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">
                                    {source.data.terminationClauseSummary || 'Geen samenvatting beschikbaar.'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* 2. STAKEHOLDERS & PARTIES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                 <Building2 className="w-4 h-4" style={{ color: theme.colors.primary }} />
                 <h3 className="font-semibold text-gray-900">Partner & Stakeholder Netwerk</h3>
             </div>
             <div className="p-4 grid gap-4">
                {activeSources.map((source, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">{source.name}</h4>
                        <div className="flex flex-wrap gap-2">
                            {source.data.parties.map((party, pIdx) => (
                                <div key={pIdx} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${party.role === 'Supplier' ? 'bg-blue-50 border-blue-100 text-blue-800' : party.role === 'Customer' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                    {party.role === 'Supplier' ? <Briefcase className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                                    <div className="flex flex-col">
                                        <span className="font-semibold leading-none">{party.name}</span>
                                        <span className="text-[9px] opacity-70 mt-1 uppercase">{party.role === 'Other' ? 'Partner/Overig' : party.role === 'Supplier' ? 'Leverancier' : 'Klant'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* 3. OPERATIONAL SPECIFICATIONS (SLA, Assets) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                 <ScrollText className="w-4 h-4" style={{ color: theme.colors.primary }} />
                 <h3 className="font-semibold text-gray-900">Operationele Data & Specificaties</h3>
             </div>
             <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                        <tr>
                            <th className="px-6 py-3">Bron</th>
                            <th className="px-6 py-3">Categorie</th>
                            <th className="px-6 py-3">Item Omschrijving</th>
                            <th className="px-6 py-3">Waarde / KPI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {activeSources.flatMap(s => s.data.specifications.map(spec => ({...spec, sourceName: s.name}))).map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-xs text-gray-500 font-medium">{item.sourceName}</td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-600">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-800">{item.description}</td>
                                <td className="px-6 py-3 font-mono text-gray-600">
                                    {item.value} <span className="text-xs text-gray-400">{item.unit}</span>
                                </td>
                            </tr>
                        ))}
                        {activeSources.every(s => s.data.specifications.length === 0) && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                                    Geen operationele specificaties gevonden in de huidige selectie.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>

          {/* 4. TIMELINE & RENEWALS */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                 <Calendar className="w-4 h-4" style={{ color: theme.colors.primary }} />
                 <h3 className="font-semibold text-gray-900">Tijdslijnen & Verlengingen</h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeSources.map((source, idx) => (
                    <div key={idx} className="relative p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: theme.colors.primary }}></div>
                        <h4 className="font-bold text-sm text-gray-900 mb-3 ml-2">{source.name}</h4>
                        
                        <div className="space-y-3 ml-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Startdatum</span>
                                <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">{source.data.dates.startDate || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Einddatum</span>
                                <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">{source.data.dates.endDate || 'Onbepaald'}</span>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-200 mt-2">
                                <div className="flex items-start gap-2">
                                    <Clock className={`w-4 h-4 mt-0.5 ${source.data.dates.isAutoRenewal ? 'text-orange-500' : 'text-gray-400'}`} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">
                                            {source.data.dates.isAutoRenewal ? 'Stilzwijgende Verlenging' : 'Eindigt Automatisch'}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            Opzegtermijn: {source.data.dates.noticePeriodDays} dagen
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>

      </div>
    </div>
  );
};

export default BusinessIntelligenceTab;