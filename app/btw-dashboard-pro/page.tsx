'use client';

import React, { useState, useEffect } from 'react';
import { FileData, AppSettings, CurrencyMode, ThemeName, ThemeColors } from './types';
import { parseCSV, parseExcel, THEMES } from './utils';
import SummaryView from './components/SummaryView';
import TaxFormView from './components/TaxFormView';
import AnalysisView from './components/AnalysisView';
import CpiView from './components/CpiView';
import ExactOnlineView from './components/ExactOnlineView';
import SalesView from './components/SalesView';
import PrivateUseCalcView from './components/PrivateUseCalcView';
import PurchaseAnalysisView from './components/PurchaseAnalysisView';
import IcpAnalysisView from './components/IcpAnalysisView';
import NewsletterView from './components/NewsletterView';
import TaxInterestView from './components/TaxInterestView';
import EuVatRatesView from './components/EuVatRatesView';
import FiscalUnityView from './components/FiscalUnityView'; // Import new component
import Logo from './components/Logo';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings, 
  PieChart, 
  Clock,
  ShoppingCart,
  Percent,
  Printer,
  FileStack,
  X,
  Edit3,
  Eye,
  EyeOff,
  Calculator,
  FileSearch,
  Globe,
  Newspaper,
  Coins,
  Map,
  Layers,
  LineChart,
  Users
} from 'lucide-react';

const BtwDashboardPage: React.FC = () => {
  // Tabs: 'exact' and 'sales' are the main focuses now
  const [activeTab, setActiveTab] = useState<'dashboard' | 'taxform' | 'analysis' | 'cpi' | 'exact' | 'sales' | 'private_use' | 'purchase' | 'icp' | 'newsletter' | 'tax_interest' | 'eu_rates' | 'fiscal_unity' | string>('exact');
  
  // --- STRICT STATE SEPARATION ---
  // Bucket 1: Financial Reports (General Ledger, VAT, Audit)
  const [financialFiles, setFinancialFiles] = useState<FileData[]>([]);
  // Bucket 2: Sales Analysis (Sales Statistics)
  const [salesFiles, setSalesFiles] = useState<FileData[]>([]);
  // Bucket 3: Purchase Analysis (Input Tax, Costs)
  const [purchaseFiles, setPurchaseFiles] = useState<FileData[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullReportMode, setIsFullReportMode] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    currencyMode: CurrencyMode.FULL,
    hideSmallAmounts: false,
    smallAmountThreshold: 50,
    theme: 'terra_cotta',
    appName: 'BTW Dashboard Pro'
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTheme: ThemeColors = THEMES[settings.theme];

  // --- DATA ACCESSORS (READ ONLY) ---
  const getRecords = (bucket: FileData[]) => {
    return bucket.filter(f => f.active).flatMap(f => f.exactRecords || []);
  };

  const getVatRecords = (bucket: FileData[]) => {
    return bucket.filter(f => f.active).flatMap(f => f.records || []);
  };

  // --- UPLOAD HANDLERS (PER BUCKET) ---
  const handleUpload = async (files: FileList | null, bucketName: 'financial' | 'sales' | 'purchase') => {
    if (!files || files.length === 0) return;
    
    const newFiles: FileData[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      const fileExt = fileName.split('.').pop()?.toLowerCase();
      
      let result;
      if (fileExt === 'csv') {
        const text = await file.text();
        result = parseCSV(text, fileName);
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const buffer = await file.arrayBuffer();
        result = parseExcel(buffer, fileName);
      }

      if (result) {
        // Validation: Prevent Sales files in Financial bucket
        if (bucketName === 'financial' && result.type === 'sales') {
            alert(`Bestand '${fileName}' lijkt een Verkoopanalyse te zijn. Upload dit in de tab 'Verkoopanalyse'.`);
            continue;
        }

        newFiles.push({
          id: `${bucketName}-${Date.now()}-${i}`,
          name: fileName,
          active: true,
          records: result.vatRecords,
          exactRecords: result.exactRecords,
          fileType: bucketName === 'sales' ? 'sales' : 'financial', // Purchase is technically financial structure
          uploadContext: bucketName
        });
      }
    }

    if (bucketName === 'financial') {
      setFinancialFiles(prev => [...prev, ...newFiles]);
    } else if (bucketName === 'sales') {
      setSalesFiles(prev => [...prev, ...newFiles]);
    } else {
      setPurchaseFiles(prev => [...prev, ...newFiles]);
    }
  };

  // --- FILE MANAGEMENT ---
  const toggleFile = (id: string, bucketName: 'financial' | 'sales' | 'purchase') => {
    let updater;
    if (bucketName === 'financial') updater = setFinancialFiles;
    else if (bucketName === 'sales') updater = setSalesFiles;
    else updater = setPurchaseFiles;

    updater(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const removeFile = (id: string, bucketName: 'financial' | 'sales' | 'purchase') => {
    let updater;
    if (bucketName === 'financial') updater = setFinancialFiles;
    else if (bucketName === 'sales') updater = setSalesFiles;
    else updater = setPurchaseFiles;

    updater(prev => prev.filter(f => f.id !== id));
  };

  // --- EXPORT ---
  const triggerPrint = () => window.print();

  const handleFullReportExport = () => {
    setIsFullReportMode(true);
    setTimeout(() => {
        window.print();
    }, 500);
  };

  useEffect(() => {
    const afterPrint = () => setIsFullReportMode(false);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 relative font-sans text-slate-900 print:block" style={{ color: currentTheme.text }}>
      
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05] print:hidden">
        <Logo className="w-[500px] h-[500px]" />
      </div>

      {/* Sidebar - Pure Navigation */}
      <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 shadow-sm print:hidden ${isFullReportMode ? 'hidden' : ''}`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Logo className="w-8 h-8 opacity-90" />
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight" style={{ color: currentTheme.text }}>
              {settings.appName}
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* GROUP 1: FINANCIEEL & BTW */}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">Financieel & BTW</div>
          
          <button 
              onClick={() => setActiveTab('exact')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'exact' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
              style={{ color: activeTab === 'exact' ? currentTheme.primary : currentTheme.text }}
            >
              <PieChart className="w-5 h-5" />
              Btw-overzicht
          </button>

          {[
            { id: 'dashboard', label: 'Verzameloverzicht', icon: LayoutDashboard },
            { id: 'taxform', label: 'BTW Aangifte', icon: FileText },
            { id: 'analysis', label: 'Analyse & AI', icon: BarChart3 },
            { id: 'cpi', label: 'Opgaaf CPI', icon: Calculator },
            { id: 'icp', label: 'ICP/ICL Controle', icon: Globe },
            { id: 'private_use', label: 'Privégebruik', icon: Percent },
            { id: 'fiscal_unity', label: 'Fiscale Eenheid', icon: Users }, // NEW
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
              style={{ color: activeTab === item.id ? currentTheme.primary : currentTheme.text }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}

          {/* GROUP 2: DETAIL ANALYSE (SEPARAAT) */}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-6">Detail Analyse (Separaat)</div>
          
          <button 
              onClick={() => setActiveTab('sales')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'sales' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
              style={{ color: activeTab === 'sales' ? currentTheme.primary : currentTheme.text }}
            >
              <ShoppingCart className="w-5 h-5" />
              Verkoopanalyse
          </button>

          <button 
              onClick={() => setActiveTab('purchase')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'purchase' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
              style={{ color: activeTab === 'purchase' ? currentTheme.primary : currentTheme.text }}
            >
              <FileSearch className="w-5 h-5" />
              Inkoopanalyse
          </button>

          {/* GROUP 3: TOOLS & INFO */}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-6">Tools & Info</div>
           
           <button 
              onClick={() => setActiveTab('tax_interest')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'tax_interest' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
              style={{ color: activeTab === 'tax_interest' ? currentTheme.primary : currentTheme.text }}
            >
              <Coins className="w-5 h-5" />
              Belastingrente
            </button>

           <button 
              onClick={() => setActiveTab('newsletter')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'newsletter' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
              style={{ color: activeTab === 'newsletter' ? currentTheme.primary : currentTheme.text }}
            >
              <Newspaper className="w-5 h-5" />
              Nieuwsbrief
            </button>

           <button 
              onClick={() => setActiveTab('eu_rates')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'eu_rates' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
              style={{ color: activeTab === 'eu_rates' ? currentTheme.primary : currentTheme.text }}
            >
              <Map className="w-5 h-5" />
              BTW Tarieven EU
            </button>

           <button 
              onClick={handleFullReportExport}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 mt-8 border border-dashed border-slate-300 hover:bg-slate-50 text-slate-600"
            >
              <FileStack className="w-5 h-5" />
              Download Rapport
            </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
           >
             <Settings className="w-4 h-4" />
             Instellingen
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`ml-64 flex-1 p-8 z-10 relative print:ml-0 print:p-0 print:w-full ${isFullReportMode ? 'ml-0 w-full' : ''}`}>
        
        {/* Header - Hidden on Print */}
        <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              {isFullReportMode ? 'Compleet Financieel Rapport' : (
                  <>
                  {activeTab === 'dashboard' && 'Verzameloverzicht'}
                  {activeTab === 'exact' && 'Btw-overzicht'}
                  {activeTab === 'sales' && 'Verkoopanalyse'}
                  {activeTab === 'purchase' && 'Inkoopanalyse & Risico\'s'}
                  {activeTab === 'taxform' && 'BTW Aangifte'}
                  {activeTab === 'cpi' && 'Opgaaf CPI'}
                  {activeTab === 'icp' && 'ICP/ICL Controle'}
                  {activeTab === 'analysis' && 'Analyse & AI'}
                  {activeTab === 'private_use' && 'Privégebruik'}
                  {activeTab === 'fiscal_unity' && 'Fiscale Eenheid'}
                  {activeTab === 'tax_interest' && 'Belastingrente Berekening'}
                  {activeTab === 'newsletter' && 'Nieuwsbrief & Wetgeving'}
                  {activeTab === 'eu_rates' && 'BTW Tarieven EU'}
                  </>
              )}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
               {activeTab === 'sales' ? 'Module: Geïsoleerde Verkooprapportage' : (activeTab === 'purchase' ? 'Module: Geïsoleerde Inkooprapportage' : (['newsletter', 'tax_interest', 'eu_rates'].includes(activeTab) ? 'Informatie & Tools' : 'Financiële Module'))}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-sm font-mono text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
               <Clock className="w-3 h-3" />
               <span>{currentTime.toLocaleDateString()} · {currentTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>

            {!isFullReportMode && (
                <button 
                    onClick={triggerPrint} 
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                    <Printer className="w-4 h-4" /> Export PDF
                </button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && !isFullReportMode && (
          <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 print:hidden">
             <div className="col-span-4 flex justify-between items-center border-b border-slate-100 pb-2">
               <h3 className="font-bold">Instellingen</h3>
               <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">App Naam</label>
               <div className="relative">
                  <Edit3 className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={settings.appName}
                    onChange={(e) => setSettings({...settings, appName: e.target.value})}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded"
                  />
               </div>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thema</label>
               <div className="grid grid-cols-4 gap-2">
                 {(Object.keys(THEMES) as ThemeName[]).map(tName => (
                   <button 
                    key={tName}
                    onClick={() => setSettings({...settings, theme: tName})}
                    className={`w-full h-8 rounded-full border-2 ${settings.theme === tName ? 'border-slate-800' : 'border-transparent'}`}
                    style={{ backgroundColor: THEMES[tName].primary }}
                   />
                 ))}
               </div>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filters</label>
                <button 
                  onClick={() => setSettings({...settings, hideSmallAmounts: !settings.hideSmallAmounts})}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-colors`}
                  style={{
                    backgroundColor: settings.hideSmallAmounts ? `${currentTheme.primary}10` : 'white',
                    borderColor: settings.hideSmallAmounts ? currentTheme.primary : '#e2e8f0',
                    color: settings.hideSmallAmounts ? currentTheme.primary : '#475569'
                  }}
                >
                  <span className="flex items-center gap-2">
                    {settings.hideSmallAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    &lt; €{settings.smallAmountThreshold}
                  </span>
                </button>
             </div>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[500px]">
            {activeTab === 'exact' && (
              <ExactOnlineView 
                records={getRecords(financialFiles)} 
                files={financialFiles}
                onUpload={(f) => handleUpload(f, 'financial')}
                onToggleFile={(id) => toggleFile(id, 'financial')}
                onDeleteFile={(id) => removeFile(id, 'financial')}
                settings={settings} 
                theme={currentTheme} 
              />
            )}

            {activeTab === 'sales' && (
              <SalesView 
                records={getRecords(salesFiles)} 
                files={salesFiles}
                onUpload={(f) => handleUpload(f, 'sales')}
                onToggleFile={(id) => toggleFile(id, 'sales')}
                onDeleteFile={(id) => removeFile(id, 'sales')}
                settings={settings} 
                theme={currentTheme} 
              />
            )}

            {activeTab === 'purchase' && (
              <PurchaseAnalysisView 
                records={getRecords(purchaseFiles)} 
                files={purchaseFiles}
                onUpload={(f) => handleUpload(f, 'purchase')}
                onToggleFile={(id) => toggleFile(id, 'purchase')}
                onDeleteFile={(id) => removeFile(id, 'purchase')}
                settings={settings} 
                theme={currentTheme} 
              />
            )}

            {/* Financial Views share the financial bucket */}
            {activeTab === 'dashboard' && <SummaryView exactRecords={getRecords(financialFiles)} settings={settings} theme={currentTheme} />}
            {activeTab === 'taxform' && <TaxFormView records={getVatRecords(financialFiles)} exactRecords={getRecords(financialFiles)} settings={settings} theme={currentTheme} />}
            {activeTab === 'cpi' && <CpiView records={getVatRecords(financialFiles)} exactRecords={getRecords(financialFiles)} settings={settings} theme={currentTheme} />}
            {activeTab === 'icp' && <IcpAnalysisView records={getRecords(financialFiles)} files={financialFiles} onUpload={(f) => handleUpload(f, 'financial')} onToggleFile={(id) => toggleFile(id, 'financial')} onDeleteFile={(id) => removeFile(id, 'financial')} settings={settings} theme={currentTheme} />}
            {activeTab === 'analysis' && <AnalysisView exactRecords={getRecords(financialFiles)} settings={settings} theme={currentTheme} />}
            {activeTab === 'private_use' && <PrivateUseCalcView records={getRecords(financialFiles)} settings={settings} theme={currentTheme} />}
            {activeTab === 'fiscal_unity' && <FiscalUnityView records={getRecords(financialFiles)} settings={settings} theme={currentTheme} />}
            
            {/* Information & Tools */}
            {activeTab === 'tax_interest' && <TaxInterestView settings={settings} theme={currentTheme} />}
            {activeTab === 'newsletter' && <NewsletterView settings={settings} theme={currentTheme} />}
            {activeTab === 'eu_rates' && <EuVatRatesView settings={settings} theme={currentTheme} />}
        </div>
      </main>
    </div>
  );
};

export default BtwDashboardPage;
