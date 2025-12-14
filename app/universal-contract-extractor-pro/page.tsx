"use client";

import React, { useState, useEffect } from 'react';
import { analyzeContract } from './services/geminiService';
import { processExcelFile } from './services/excelService';
import { generateExcel, generatePDF, generateWord } from './services/exportService';
import { ContractData, AnalysisSettings, SourceDocument, Theme } from './types';
import FileUpload from './components/FileUpload';
import AnalysisTab from './components/AnalysisTab';
import DocumentViewer from './components/DocumentViewer';
import SettingsBar from './components/SettingsBar';
import WoodpeckerLogo from './components/WoodpeckerLogo';
import { THEMES, DEFAULT_THEME } from './constants/themes';
import { LayoutDashboard, FileText, Plus, ShieldCheck, Copy } from 'lucide-react';

// Dummy data generator for Demo Mode (Localized to Dutch)
const generateDemoData = (): SourceDocument[] => {
  const base: ContractData = {
     contractType: 'SLA Overeenkomst', summary: 'IT Service Level Agreement voor hoofdkantoor infrastructuur.', language: 'Dutch', currency: 'EUR',
     parties: [{name: 'TechSolutions BV', role: 'Supplier'}, {name: 'MijnBedrijf NV', role: 'Customer'}],
     dates: {startDate: '2024-01-01', endDate: '2025-01-01', isAutoRenewal: true, noticePeriodDays: 90},
     financials: {totalValue: 18500, paymentTerms: '30 dagen na factuurdatum', items: [
       {description: 'Maandelijkse Support Fee', amount: 1200, periodicity: 'Monthly', category: 'Operationele Kosten (OPEX)'},
       {description: 'Software Licenties (Per Seat)', amount: 4500, periodicity: 'Yearly', category: 'Licenties & Software'},
       {description: 'On-boarding & Setup', amount: 2500, periodicity: 'One-off', category: 'Implementatie'},
       {description: 'Server Onderhoud', amount: 800, periodicity: 'Monthly', category: 'Operationele Kosten (OPEX)'}
     ]},
     specifications: [
        {category: 'Service Level', description: 'Uptime Garantie', value: '99.9%', unit: '%'},
        {category: 'Hardware', description: 'Server Opslag', value: '4TB', unit: 'SSD'}
     ],
     calculations: [
        {label: 'Jaarlijkse Support Kosten', formula: '12 x 1200 EUR', result: 14400, unit: 'EUR'},
        {label: 'Totale Contractwaarde (Jaar 1)', formula: 'Support + Licenties + Setup', result: 21400, unit: 'EUR'}
     ],
     risks: [
         {description: 'Stilzwijgende verlenging met 12 maanden indien niet tijdig opgezegd.', severity: 'Medium', clauseReference: 'Art. 4.2'},
         {description: 'Boeteclausule bij voortijdige beëindiging is 50% van resterende waarde.', severity: 'High', clauseReference: 'Art. 9.1'}
     ],
     governingLaw: 'Nederlands Recht', terminationClauseSummary: 'Schriftelijke opzegging 3 maanden voor einddatum.'
  };

  const excelLike: ContractData = {
     contractType: 'Budget Specificatie', summary: 'Q1 Marketing Budget Allocatie', language: 'N/A', currency: 'EUR',
     parties: [{name: 'Marketing Afdeling', role: 'Other'}],
     dates: {startDate: '2024-01-01', endDate: '', isAutoRenewal: false, noticePeriodDays: 0},
     financials: {totalValue: 6200, paymentTerms: 'N/A', items: [
       {description: 'Google Ads Campagne Jan', amount: 1500, periodicity: 'One-off', category: 'Online Marketing'},
       {description: 'LinkedIn Campagne Q1', amount: 4500, periodicity: 'One-off', category: 'Online Marketing'},
       {description: 'Kantoorartikelen', amount: 200, periodicity: 'One-off', category: 'Algemene Kosten'}
     ]},
     specifications: [],
     calculations: [],
     risks: [], governingLaw: '', terminationClauseSummary: ''
  };

  return [
    { id: 'demo-1', name: 'SLA TechSolutions', type: 'AI_EXTRACTED', data: base, isEnabled: true },
    { id: 'demo-2', name: 'Marketing Budget', type: 'EXCEL_SHEET', data: excelLike, isEnabled: true }
  ];
};

import './styles.css';

const UniversalContractExtractorPage: React.FC = () => {
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs: 0 = Analysis (Consolidated), 1+ = Individual File (Analysis + Preview)
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0); 
  
  const [settings, setSettings] = useState<AnalysisSettings>({
    showThousands: false,
    hideSmallAmounts: false,
    currencySymbol: '€',
    thresholdAmount: 50,
    showAIComments: false,
    appName: 'Contract Extractor Pro',
    themeId: DEFAULT_THEME.id
  });

  const currentTheme = THEMES.find(t => t.id === settings.themeId) || DEFAULT_THEME;

  // Inject CSS variables for the current theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentTheme.colors.primary);
    root.style.setProperty('--theme-text', currentTheme.colors.text);
    root.style.setProperty('--theme-risk-high', currentTheme.colors.highRisk);
    root.style.setProperty('--theme-risk-medium', currentTheme.colors.mediumRisk);
    root.style.setProperty('--theme-risk-low', currentTheme.colors.lowRisk);
    root.style.setProperty('--theme-bg', '#f9fafb'); // Standard light bg
  }, [currentTheme]);

  const handleFileSelect = async (selectedFile: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Excel Handler
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
         const newSources = await processExcelFile(selectedFile);
         if (newSources.length === 0) {
            setError("Geen geldige data gevonden in Excel bestand.");
         } else {
            setSources(prev => [...prev, ...newSources]);
            if (sources.length === 0) setActiveTabIndex(0);
         }
      } 
      // Image/PDF Handler
      else {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          try {
            // Returns an array of ContractData (handles splits/table detection)
            const results = await analyzeContract(base64Data, selectedFile.type);
            
            const newSources: SourceDocument[] = results.map((result, index) => {
                // If multiple results, append index/type to name
                let displayName = selectedFile.name;
                if (results.length > 1) {
                    if (index === 0) displayName += " (Hoofd)";
                    else displayName += ` (${result.contractType || 'Deel ' + index})`;
                }

                return {
                    id: Date.now().toString() + '-' + index,
                    name: displayName,
                    type: 'AI_EXTRACTED',
                    data: result,
                    isEnabled: true,
                    originalFile: selectedFile // They all point to the same source file
                };
            });

            setSources(prev => [...prev, ...newSources]);
            if (sources.length === 0) setActiveTabIndex(0);
          } catch (err) {
            setError("Kan document niet analyseren. Zorg voor een geldig contract (PDF/Afbeelding).");
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(selectedFile);
        return; // Early return to avoid double setIsProcessing(false)
      }
    } catch (e) {
      setError("Fout bij lezen bestand.");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadDemoData = () => {
      setSources(generateDemoData());
      setActiveTabIndex(0);
  };

  const toggleSource = (id: string) => {
      setSources(prev => prev.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  const handleExportExcel = () => {
    if (sources.length === 0) {
        alert("Geen data om te exporteren.");
        return;
    }
    const activeData = sources.filter(s => s.isEnabled);
    generateExcel(activeData);
  };

  const handleExportPDF = () => {
    if (sources.length === 0) {
        alert("Geen data om te exporteren.");
        return;
    }
    const activeData = sources.filter(s => s.isEnabled);
    generatePDF(activeData, settings, currentTheme);
  };

  const handleExportWord = async () => {
      if (sources.length === 0) {
          alert("Geen data om te exporteren.");
          return;
      }
      const activeData = sources.filter(s => s.isEnabled);
      await generateWord(activeData, settings, currentTheme);
  };

  return (
    <div className="universal-contract-extractor-container min-h-screen text-gray-900 flex flex-col relative transition-colors duration-500" style={{ backgroundColor: '#f3f4f6' }}>
      
      {/* Persistent Logo Watermark */}
      <div className="fixed bottom-4 right-4 pointer-events-none z-0 opacity-5">
        <WoodpeckerLogo className="w-64 h-64 grayscale" />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Small consistent logo in header */}
            <WoodpeckerLogo className="w-10 h-10 opacity-80" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {settings.appName}
            </h1>
          </div>
          
          {/* Quick Stats in Header */}
          <div className="flex items-center gap-6">
             {sources.length > 0 && (
                 <div className="flex items-center gap-2 text-sm text-gray-500">
                     <span className="font-semibold" style={{ color: currentTheme.colors.primary }}>{sources.filter(s => s.isEnabled).length}</span> Actieve Bronnen
                 </div>
             )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 z-10 relative">
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
            {sources.length === 0 ? (
                <div className="max-w-3xl mx-auto text-center mt-12">
                    <h2 className="text-3xl font-bold mb-4" style={{ color: currentTheme.colors.text }}>Financiële Intelligentie voor Projecten</h2>
                    <p className="text-gray-500 mb-8 max-w-xl mx-auto">Upload PDF-contracten of Excel-sheets. Wij reconstrueren ze in tabbladen en bieden geconsolideerde financiële analyses.</p>
                    <FileUpload 
                      onFileSelect={handleFileSelect} 
                      onLoadDemo={loadDemoData} 
                      isProcessing={isProcessing} 
                      error={error} 
                      theme={currentTheme}
                    />
                </div>
            ) : (
                <>
                    {/* Tabs Navigation */}
                    <div className="flex items-end border-b border-gray-200 mb-6 overflow-x-auto">
                        <button 
                            onClick={() => setActiveTabIndex(0)}
                            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap`}
                            style={activeTabIndex === 0 ? {
                                borderColor: currentTheme.colors.primary,
                                color: currentTheme.colors.primary,
                                backgroundColor: `${currentTheme.colors.primary}10`,
                                borderTopLeftRadius: '0.5rem',
                                borderTopRightRadius: '0.5rem'
                            } : {
                                borderColor: 'transparent',
                                color: '#6b7280'
                            }}
                        >
                            <LayoutDashboard className="w-4 h-4" /> 
                            Totaaloverzicht
                        </button>
                        
                        {sources.map((source, idx) => (
                            <div key={source.id} className="group relative flex items-center">
                                <button 
                                    onClick={() => setActiveTabIndex(idx + 1)}
                                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap max-w-[200px]`}
                                    style={activeTabIndex === idx + 1 ? {
                                        borderColor: currentTheme.colors.primary,
                                        color: currentTheme.colors.primary,
                                        backgroundColor: '#fff',
                                        borderTopLeftRadius: '0.5rem',
                                        borderTopRightRadius: '0.5rem'
                                    } : {
                                        borderColor: 'transparent',
                                        color: '#6b7280'
                                    }}
                                >
                                    {/* Icon selection based on type */}
                                    {source.type === 'EXCEL_SHEET' ? (
                                        <FileText className="w-4 h-4 text-green-500" /> 
                                    ) : source.name.includes('(Hoofd)') ? (
                                        <FileText className="w-4 h-4 text-orange-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-blue-400" /> // Icon for split tables
                                    )}
                                    
                                    <span className="truncate">{source.name}</span>
                                </button>
                                {/* Checkbox to enable/disable for consolidated analysis */}
                                <input 
                                    type="checkbox"
                                    checked={source.isEnabled}
                                    onChange={() => toggleSource(source.id)}
                                    className="ml-1 mr-2 cursor-pointer"
                                    style={{ accentColor: currentTheme.colors.primary }}
                                    title="Meenemen in analyse"
                                />
                            </div>
                        ))}
                         
                         {/* Mini Upload Trigger */}
                         <label className="ml-2 cursor-pointer p-2 text-gray-400 hover:text-gray-600 transition-colors">
                             <Plus className="w-5 h-5" />
                             <input type="file" className="hidden" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
                         </label>
                    </div>

                    <SettingsBar 
                        settings={settings} 
                        onUpdateSettings={(newSettings) => setSettings(prev => ({...prev, ...newSettings}))}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                        onExportWord={handleExportWord}
                        currentTheme={currentTheme}
                    />

                    <div className="min-h-[500px]">
                        {activeTabIndex === 0 ? (
                            // Consolidated View: Show all enabled sources
                            <AnalysisTab 
                              sources={sources.filter(s => s.isEnabled)} 
                              settings={settings} 
                              theme={currentTheme}
                            />
                        ) : (
                            // Single File View: Show Document Visual + Analysis for that single file
                            <AnalysisTab 
                              sources={[sources[activeTabIndex - 1]]} 
                              settings={settings}
                              documentVisual={<DocumentViewer source={sources[activeTabIndex - 1]} />}
                              theme={currentTheme}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
};

export default UniversalContractExtractorPage;
