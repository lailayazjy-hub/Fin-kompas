'use client';

import './styles.css';
import React, { useState, useEffect } from 'react';
import { 
  Settings, User, X, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';

import { AppConfig, THEMES, Language } from './types';
import { MatchingModule } from './components/MatchingModule';

// Placeholder URL voor de specht foto. 
// TIP: Vervang deze URL door een lokaal pad (bijv. "/logo.png") als je de specifieke foto hebt.
const WOODPECKER_URL = "https://images.unsplash.com/photo-1543539748-a4bf17a68a8c?q=80&w=400&auto=format&fit=crop";

// Woodpecker Logo Component
// Uses grayscale and contrast filters to ensure it remains neutral and subtle across themes.
const CompanyLogo = ({ className = "", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden rounded-full bg-slate-50`} style={style}>
    <img 
        src={WOODPECKER_URL} 
        alt="Specht Logo" 
        className="w-full h-full object-cover grayscale contrast-[0.8] opacity-90"
    />
  </div>
);

export default function ReeksAnalysePage() {
  // --- Config State ---
  const [config, setConfig] = useState<AppConfig>({
    appName: "2 reeks Analyse",
    language: 'nl',
    theme: 'TERRA_COTTA',
    showDemo: true,
    showAI: true,
    showExport: true,
    showUsername: true,
    currencyKNotation: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentTheme = THEMES[config.theme];
  const dateLocale = config.language === 'nl' ? nl : enUS;

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen pb-0 font-sans text-slate-800 bg-[#F7F7F7] flex flex-col relative overflow-hidden">
      
      {/* Background Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        {/* Max 5% opacity for background watermark */}
        <CompanyLogo className="opacity-[0.05] w-[600px] h-[600px] grayscale" />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
            <div className="h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                    {/* Small logo in header */}
                    <CompanyLogo className="w-8 h-8 border border-slate-100 shadow-sm" />
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div className="p-2 rounded-lg text-white shadow-md transition-colors duration-300" style={{ backgroundColor: currentTheme.colors.primary }}>
                        <TrendingUp size={20} strokeWidth={2.5} />
                    </div>
                    </div>
                    
                    <div>
                        <h1 className="text-xl font-bold tracking-tight leading-none" style={{ color: currentTheme.colors.text }}>{config.appName}</h1>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Matching & Control</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
                        <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: currentTheme.colors.text }}>
                            {format(currentDate, "d MMMM yyyy", { locale: dateLocale })}
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Settings size={20} />
                    </button>
                    {config.showUsername && (
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: currentTheme.colors.primary }}>
                            <User size={16} />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
                    <h2 className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>Instellingen</h2>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Applicatie Naam</label>
                        <input 
                            type="text" 
                            value={config.appName}
                            onChange={(e) => setConfig({...config, appName: e.target.value})}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-opacity-50 outline-none font-medium"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Thema</label>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.values(THEMES).map(theme => (
                                <button key={theme.id} onClick={() => setConfig({...config, theme: theme.id})}
                                    className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${config.theme === theme.id ? 'ring-2 ring-offset-1' : 'hover:bg-slate-50'}`}
                                    style={{ borderColor: config.theme === theme.id ? theme.colors.primary : '#e2e8f0' }}
                                >
                                    <div className="flex gap-1">
                                        <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.primary }}></div>
                                        <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.high }}></div>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                         <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Features</label>
                         <label className="flex items-center justify-between cursor-pointer mb-2">
                            <span className="text-sm text-slate-700">AI Analyse</span>
                            <input type="checkbox" checked={config.showAI} onChange={e => setConfig({...config, showAI: e.target.checked})} />
                         </label>
                         <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-slate-700">Valuta in Duizendtallen (k)</span>
                            <input type="checkbox" checked={config.currencyKNotation} onChange={e => setConfig({...config, currencyKNotation: e.target.checked})} />
                         </label>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
           <MatchingModule 
                themeColors={currentTheme.colors} 
                language={config.language} 
                useKNotation={config.currencyKNotation} 
                showAI={config.showAI}
           />
      </main>
      
      {/* Footer */}
      <footer className="py-6 mt-12 border-t border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 relative z-10">
          <CompanyLogo className="w-6 h-6 opacity-30 grayscale" />
          <span className="text-xs font-medium tracking-wide opacity-60">Secure Data Environment</span>
      </footer>
    </div>
  );
}
