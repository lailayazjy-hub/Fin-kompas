"use client";

import React, { useState, useEffect } from 'react';
import { SourceFile, AppSettings, Comment } from './types';
import { parsePayslip } from './services/geminiService';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { DataGrid } from './components/DataGrid';
import { WoodpeckerLogo } from './components/WoodpeckerLogo';
import { APP_THEMES, DEFAULT_THEME_ID, getThemeById } from './utils/themes';
import { FileText, Plus, Settings, Download, Trash2, CheckCircle2, Circle, Eye, EyeOff, Coins, Sparkles, LayoutDashboard, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const LoonstrookAnalyserPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Analysis, 1+ = Files
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    showSmallAmounts: true,
    currencyMode: 'full',
    showAiRemarks: false,
    demoMode: false,
    userName: 'Manager',
    appName: 'LoonStrook Analyser',
    themeId: DEFAULT_THEME_ID
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Apply Theme CSS Variables
  const currentTheme = getThemeById(settings.themeId);
  
  const rootStyle = {
    '--color-primary': currentTheme.colors.primary,
    '--color-high-risk': currentTheme.colors.highRisk,
    '--color-medium-risk': currentTheme.colors.mediumRisk,
    '--color-low-risk': currentTheme.colors.lowRisk,
    '--color-text': currentTheme.colors.text,
  } as React.CSSProperties;

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles: File[] = Array.from(e.target.files);

    setIsProcessing(true);
    
    // Create placeholder entries first
    const newFileEntries: SourceFile[] = uploadedFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      uploadDate: new Date().toISOString(),
      lines: [],
      isActive: true,
      status: 'processing'
    }));

    setFiles(prev => [...prev, ...newFileEntries]);

    // Process each file with Gemini
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const sourceId = newFileEntries[i].id;

      try {
        const result = await parsePayslip(file, sourceId);
        
        setFiles(prev => prev.map(f => 
          f.id === sourceId ? { 
            ...f, 
            lines: result.lines, 
            metadata: result.metadata,
            status: 'completed' 
          } : f
        ));
      } catch (error) {
        console.error("Processing error:", error);
        setFiles(prev => prev.map(f => 
          f.id === sourceId ? { ...f, status: 'error' } : f
        ));
      }
    }
    setIsProcessing(false);
  };

  // Demo Mode
  const loadDemoData = () => {
    const demoId = 'demo-1';
    const demoFile: SourceFile = {
      id: demoId,
      name: 'Loonstrook_Jan_2024_DEMO.pdf',
      uploadDate: new Date().toISOString(),
      isActive: true,
      status: 'completed',
      metadata: {
        detectedHoursPerWeek: 32
      },
      lines: [
        { id: '1', description: 'Periodesalaris', amount: 3500.00, currency: 'EUR', category: 'Salaris', type: 'INCOME', aiRemark: 'Conform marktgemiddelde', comments: [], sourceId: demoId },
        { id: '2', description: 'Vakantietoeslag reservering', amount: 280.00, currency: 'EUR', category: 'Reserveringen', type: 'INFORMATION', comments: [], sourceId: demoId },
        { id: '3', description: 'Reiskostenvergoeding', amount: 145.50, currency: 'EUR', category: 'Vergoedingen', type: 'INCOME', aiRemark: 'Onbelaste vergoeding', comments: [], sourceId: demoId },
        { id: '4', description: 'Loonheffing', amount: 890.25, currency: 'EUR', category: 'Belastingen', type: 'DEDUCTION', comments: [], sourceId: demoId },
        { id: '5', description: 'Pensioenpremie werknemer', amount: 125.00, currency: 'EUR', category: 'Pensioen', type: 'DEDUCTION', comments: [], sourceId: demoId },
        { id: '6', description: 'WGA Hiaat', amount: 8.50, currency: 'EUR', category: 'Verzekering', type: 'DEDUCTION', comments: [], sourceId: demoId },
        { id: '7', description: 'Personeelsvereniging', amount: 2.50, currency: 'EUR', category: 'Overig', type: 'DEDUCTION', aiRemark: '', comments: [], sourceId: demoId },
        { id: '8', description: 'Netto Loon', amount: 2619.25, currency: 'EUR', category: 'Netto', type: 'NET_PAYOUT', comments: [], sourceId: demoId },
      ] as any
    };
    setFiles([demoFile]);
    setActiveTab(0); // Go to dashboard
  };

  // Export to Excel
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const activeFiles = files.filter(f => f.isActive);
    const allLines = activeFiles.flatMap(f => f.lines.map(l => ({
      Bron: f.name,
      Omschrijving: l.description,
      Categorie: l.category,
      Bedrag: l.amount,
      Type: l.type,
      AI_Opmerking: l.aiRemark,
      Opmerkingen_Manager: l.comments.map(c => c.text).join('; ')
    })));

    const ws = XLSX.utils.json_to_sheet(allLines);
    XLSX.utils.book_append_sheet(wb, ws, "Overzicht");
    
    XLSX.writeFile(wb, "Loonstrook_Analyse.xlsx");
  };

  const handleAddComment = (lineId: string, text: string) => {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: settings.userName,
      text: text,
      date: new Date().toISOString()
    };

    setFiles(prev => prev.map(f => ({
      ...f,
      lines: f.lines.map(l => l.id === lineId ? { ...l, comments: [...l.comments, newComment] } : l)
    })));
  };

  const toggleFileActive = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden" style={rootStyle}>
      
      {/* Watermark Logo - Always specific opacity 5% */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05]">
        <WoodpeckerLogo size={600} />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 pl-12 md:pl-0">
            <WoodpeckerLogo size={36} />
            <h1 className="text-xl font-bold tracking-tight" style={{ color: currentTheme.colors.text }}>
              {settings.appName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Toolbar */}
             <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                <button 
                  onClick={() => setSettings(s => ({...s, showSmallAmounts: !s.showSmallAmounts}))}
                  className={`p-2 rounded-md text-xs font-medium flex items-center gap-2 transition ${!settings.showSmallAmounts ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Verberg bedragen onder €50"
                >
                  {settings.showSmallAmounts ? <Eye size={16}/> : <EyeOff size={16} />}
                  Klein grut
                </button>
                <button 
                  onClick={() => setSettings(s => ({...s, currencyMode: s.currencyMode === 'k' ? 'full' : 'k'}))}
                  className={`p-2 rounded-md text-xs font-medium flex items-center gap-2 transition ${settings.currencyMode === 'k' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Coins size={16} />
                  {settings.currencyMode === 'k' ? '1k' : '1.000'}
                </button>
                <button 
                  onClick={() => setSettings(s => ({...s, showAiRemarks: !s.showAiRemarks}))}
                  className={`p-2 rounded-md text-xs font-medium flex items-center gap-2 transition ${settings.showAiRemarks ? 'text-purple-800' : 'text-gray-500 hover:text-gray-700'}`}
                  style={settings.showAiRemarks ? { backgroundColor: `${currentTheme.colors.primary}20` } : {}}
                >
                  <Sparkles size={16} style={settings.showAiRemarks ? { color: currentTheme.colors.primary } : {}} />
                  AI Inzichten
                </button>
             </div>

             <button 
               onClick={handleExport} 
               className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition"
               style={{ color: currentTheme.colors.text }}
             >
               <Download size={16} /> Export
             </button>

             <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition"
             >
               <Settings size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-12 gap-6 relative z-10">
        
        {/* Sidebar / File List */}
        <aside className="col-span-12 md:col-span-3 space-y-6">
           {/* Upload Area */}
           <div 
             className="bg-white p-6 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 transition-colors text-center cursor-pointer relative group"
             style={{ borderColor: `var(--color-primary)` }}
           >
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*, .png, .jpg, .jpeg, .pdf, application/pdf"
              />
              <div className="flex flex-col items-center text-gray-500 group-hover:text-[var(--color-primary)]">
                <Plus size={32} className="mb-2" style={{ color: currentTheme.colors.primary }} />
                <span className="font-medium">Nieuw Bestand</span>
                <span className="text-xs mt-1 text-gray-400">Sleep of klik (PDF of Afbeelding)</span>
              </div>
           </div>

           {/* Source List */}
           <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm flex justify-between items-center" style={{ color: currentTheme.colors.text }}>
                Bronnen
                {files.length === 0 && <button onClick={loadDemoData} className="text-xs hover:underline" style={{ color: currentTheme.colors.primary }}>Laad Demo</button>}
             </div>
             <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {files.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm italic">Nog geen bestanden</div>
                ) : (
                  files.map((file, idx) => (
                    <div key={file.id} className={`p-3 flex items-center gap-3 hover:bg-gray-50 transition ${activeTab === idx + 1 ? 'border-l-4' : ''}`}
                        style={activeTab === idx + 1 ? { borderLeftColor: currentTheme.colors.primary, backgroundColor: `${currentTheme.colors.primary}10` } : {}}
                    >
                      <input 
                        type="checkbox" 
                        checked={file.isActive} 
                        onChange={() => toggleFileActive(file.id)}
                        className="rounded border-gray-300 focus:ring-opacity-50"
                        style={{ color: currentTheme.colors.primary }}
                      />
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setActiveTab(idx + 1)}
                      >
                        <p className={`text-sm truncate font-medium ${activeTab === idx + 1 ? '' : 'text-gray-700'}`} style={activeTab === idx + 1 ? { color: currentTheme.colors.text } : {}}>{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           {file.status === 'processing' && <span className="text-[10px] text-amber-500 flex items-center gap-1">Verwerken...</span>}
                           {file.status === 'completed' && <span className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Klaar</span>}
                           {file.status === 'error' && <span className="text-[10px] text-red-500">Fout</span>}
                        </div>
                      </div>
                      <button 
                         onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                         className="text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
             </div>
           </div>
        </aside>

        {/* Main Content Area */}
        <section className="col-span-12 md:col-span-9 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[600px]">
          {/* Tabs Header */}
          <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab(0)}
              className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 0 ? '' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              style={activeTab === 0 ? { borderColor: currentTheme.colors.primary, color: currentTheme.colors.primary, backgroundColor: `${currentTheme.colors.primary}05` } : {}}
            >
              <LayoutDashboard size={16} />
              Analyse & Totaal
            </button>
            {files.map((file, idx) => (
              <button
                key={file.id}
                onClick={() => setActiveTab(idx + 1)}
                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 max-w-[200px] ${activeTab === idx + 1 ? '' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                style={activeTab === idx + 1 ? { borderColor: currentTheme.colors.primary, color: currentTheme.colors.primary, backgroundColor: `${currentTheme.colors.primary}05` } : {}}
              >
                <FileText size={16} />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>

          {/* Content Body */}
          <div className="flex-1 bg-white relative">
            {activeTab === 0 ? (
              <AnalysisDashboard files={files} settings={settings} />
            ) : (
              <DataGrid 
                lines={files[activeTab - 1]?.lines || []}
                settings={settings}
                isProcessing={files[activeTab - 1]?.status === 'processing'}
                onUpdateLine={() => {}} // Placeholder for edit functionality
                onAddComment={handleAddComment}
              />
            )}
          </div>
        </section>

      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>Instellingen</h2>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* App Name Setting */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Applicatie Naam</label>
                <input 
                  type="text" 
                  value={settings.appName}
                  onChange={(e) => setSettings(s => ({...s, appName: e.target.value}))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 transition"
                  style={{ '--tw-ring-color': currentTheme.colors.primary } as React.CSSProperties}
                  placeholder="Voer naam in..."
                />
                <p className="text-xs text-gray-500 mt-1">Pas de naam aan in de header en tabbladen.</p>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Kleur Thema</label>
                <div className="grid grid-cols-2 gap-3">
                  {APP_THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSettings(s => ({...s, themeId: t.id}))}
                      className={`p-3 rounded-lg border flex items-center gap-3 transition hover:shadow-md ${settings.themeId === t.id ? 'ring-2 ring-offset-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.highRisk }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.mediumRisk }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2 rounded-lg text-white font-medium transition"
                style={{ backgroundColor: currentTheme.colors.primary }}
              >
                Klaar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoonstrookAnalyserPage;
