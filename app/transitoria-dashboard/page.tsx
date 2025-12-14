'use client';

import React, { useState } from 'react';
import { FileData, AppSettings, CurrencyMode, LedgerRecord, ThemeName, ThemeColors } from './types';
import { parseCSV, parseExcel, generateTemplateXLSX, dummyData, THEMES } from './utils';
import SummaryView from './components/SummaryView';
import PeriodMatrixView from './components/TaxFormView';
import AnalysisView from './components/AnalysisView';
import AuditLogView from './components/CpiView';
import Logo from './components/Logo';
import ExportManager from './components/ExportManager';
import { 
  LayoutDashboard, 
  CalendarRange, 
  BarChart3, 
  UploadCloud, 
  Settings, 
  Download, 
  FileSpreadsheet, 
  X,
  PlayCircle,
  Eye,
  EyeOff,
  Edit3,
  ClipboardCheck
} from 'lucide-react';

const TransitoriaDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'analysis' | 'audit' | string>('dashboard');
  const [files, setFiles] = useState<FileData[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currencyMode: CurrencyMode.FULL,
    hideSmallAmounts: false,
    smallAmountThreshold: 50,
    theme: 'terra_cotta',
    appName: 'Transitoria Dashboard'
  });
  const [showSettings, setShowSettings] = useState(false);

  // Get current theme definition
  const currentTheme: ThemeColors = THEMES[settings.theme];

  // Computed: All active records for calculation
  const allActiveRecords = files
    .filter(f => f.active)
    .flatMap(f => f.records);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: FileData[] = [];
    const filesArray: File[] = Array.from(uploadedFiles);
    
    for (const file of filesArray) {
      let records: LedgerRecord[] = [];
      try {
        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          const buffer = await file.arrayBuffer();
          records = parseExcel(buffer, file.name);
        } else {
          const text = await file.text();
          records = parseCSV(text, file.name);
        }

        newFiles.push({
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          records,
          active: true
        });
      } catch (error) {
        console.error("Error processing file:", file.name, error);
        alert(`Kon bestand niet verwerken: ${file.name}`);
      }
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  const loadDemoData = () => {
    setFiles([{
      id: 'demo-file',
      name: 'Demo GBR 2024',
      records: dummyData,
      active: true
    }]);
  };

  const downloadTemplate = () => {
    const buffer = generateTemplateXLSX();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transitoria_template.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleFileActive = (id: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const updateRecord = (updatedRecord: LedgerRecord) => {
    setFiles(prevFiles => prevFiles.map(file => {
      // Check if this file contains the record
      const recordIndex = file.records.findIndex(r => r.id === updatedRecord.id);
      if (recordIndex === -1) return file;
      
      const newRecords = [...file.records];
      newRecords[recordIndex] = updatedRecord;
      return { ...file, records: newRecords };
    }));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative font-sans text-slate-900" style={{ color: currentTheme.text }}>
      
      {/* Subtle Logo Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05]">
        <Logo className="w-[500px] h-[500px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Logo className="w-8 h-8 opacity-90" />
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight" style={{ color: currentTheme.text }}>
              {settings.appName}
            </h1>
            <p className="text-[10px] text-slate-400">Overlopende Activa/Passiva</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Hoofdmenu</div>
          
          {[
            { id: 'dashboard', label: 'Transitoria Lijst', icon: LayoutDashboard },
            { id: 'matrix', label: 'Periode Matrix', icon: CalendarRange },
            { id: 'analysis', label: 'Analyse & Shifts', icon: BarChart3 },
            { id: 'audit', label: 'Audit Logboek', icon: ClipboardCheck }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}
              style={{
                backgroundColor: activeTab === item.id ? currentTheme.primary : 'transparent',
                color: activeTab === item.id ? '#ffffff' : currentTheme.text,
                opacity: activeTab === item.id ? 1 : 0.7
              }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}

          <div className="mt-8">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex justify-between items-center">
              <span>Brondata (GBR)</span>
              <span 
                className="text-[10px] px-1.5 rounded text-white"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {files.length}
              </span>
            </div>
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-slate-50 rounded group">
                <input 
                  type="checkbox" 
                  checked={file.active} 
                  onChange={() => toggleFileActive(file.id)}
                  className="rounded border-slate-300"
                  style={{ color: currentTheme.primary }}
                />
                <span className={`truncate flex-1 ${!file.active && 'opacity-50 line-through'}`}>{file.name}</span>
                <button 
                  onClick={() => setFiles(files.filter(f => f.id !== file.id))}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <label 
              className="flex items-center gap-2 px-3 py-2 mt-2 text-sm cursor-pointer border border-dashed border-slate-300 rounded hover:bg-slate-50 transition-colors"
              style={{ color: currentTheme.primary }}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Excel/CSV</span>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
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
      <main className="ml-64 flex-1 p-8 z-10 relative">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              {activeTab === 'dashboard' && 'Transitoria Overzicht'}
              {activeTab === 'matrix' && 'Periode Allocatie Matrix'}
              {activeTab === 'analysis' && 'Analyse & Trends'}
              {activeTab === 'audit' && 'Workflow Logboek'}
            </h2>
            <p className="text-slate-500">
              {files.length > 0 
                ? `${allActiveRecords.length} transacties geladen.` 
                : 'Geen data geladen. Upload een GBR export.'}
            </p>
          </div>
          <div className="flex gap-3">
             {files.length === 0 && (
               <button onClick={loadDemoData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium">
                 <PlayCircle className="w-4 h-4" /> Demo
               </button>
             )}
             <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium">
               <FileSpreadsheet className="w-4 h-4" /> Template.xlsx
             </button>
             <button 
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow text-sm font-medium hover:opacity-90"
              style={{ backgroundColor: currentTheme.primary }}
             >
               <Download className="w-4 h-4" /> Export PDF
             </button>
          </div>
        </header>

        {showSettings && (
          <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4">
             <div className="col-span-1 md:col-span-2 lg:col-span-4 border-b border-slate-100 pb-4 mb-2">
               <h3 className="font-bold text-lg mb-1" style={{ color: currentTheme.text }}>App Configuratie</h3>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">App Naam</label>
               <div className="flex gap-2">
                 <div className="relative flex-1">
                    <Edit3 className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={settings.appName}
                      onChange={(e) => setSettings({...settings, appName: e.target.value})}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                 </div>
               </div>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kleur Thema</label>
               <div className="space-y-2">
                 {(Object.keys(THEMES) as ThemeName[]).map((t) => (
                    <button 
                      key={t}
                      onClick={() => setSettings({...settings, theme: t})}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded border flex items-center justify-between transition-all ${settings.theme === t ? 'border-slate-400 bg-slate-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                    >
                      <span className="capitalize">{t.replace('_', ' ')}</span>
                      <div className="flex gap-1">
                         <div className="w-3 h-3 rounded-full" style={{ background: THEMES[t].primary }}></div>
                         <div className="w-3 h-3 rounded-full" style={{ background: THEMES[t].highRisk }}></div>
                      </div>
                    </button>
                 ))}
               </div>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filters</label>
               <button 
                 onClick={() => setSettings({...settings, hideSmallAmounts: !settings.hideSmallAmounts})}
                 className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded border text-left ${settings.hideSmallAmounts ? 'bg-slate-100 border-slate-300 font-medium' : 'bg-white border-slate-200'}`}
               >
                 {settings.hideSmallAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 Verberg {`<`} €{settings.smallAmountThreshold}
               </button>
             </div>
          </div>
        )}

        <div className="min-h-[500px]">
          {activeTab === 'dashboard' && (
            <SummaryView 
              records={allActiveRecords} 
              settings={settings} 
              theme={currentTheme} 
              onUpdateRecord={updateRecord}
            />
          )}
          {activeTab === 'matrix' && <PeriodMatrixView records={allActiveRecords} settings={settings} theme={currentTheme} />}
          {activeTab === 'analysis' && <AnalysisView records={allActiveRecords} settings={settings} theme={currentTheme} />}
          {activeTab === 'audit' && <AuditLogView records={allActiveRecords} settings={settings} theme={currentTheme} />}
        </div>

        <ExportManager />

      </main>
    </div>
  );
};

export default TransitoriaDashboardPage;
