import React from 'react';
import { AnalysisSettings, Theme } from '../types';
import { THEMES } from '../constants/themes';
import { Settings, Filter, Download, FileSpreadsheet, FileText, Eye, EyeOff, Palette, Edit3, File } from 'lucide-react';

interface SettingsBarProps {
  settings: AnalysisSettings;
  onUpdateSettings: (newSettings: Partial<AnalysisSettings>) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportWord: () => void;
  currentTheme: Theme;
}

const SettingsBar: React.FC<SettingsBarProps> = ({ settings, onUpdateSettings, onExportExcel, onExportPDF, onExportWord, currentTheme }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-6 transition-all duration-300">
        <div className="flex items-center gap-2 mr-2" style={{ color: currentTheme.colors.text }}>
            <Settings className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Instellingen</span>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

        {/* App Name Editor */}
        <div className="flex items-center gap-2 group relative">
            <Edit3 className="w-3 h-3 text-gray-400 absolute left-2" />
            <input 
                type="text" 
                value={settings.appName}
                onChange={(e) => onUpdateSettings({ appName: e.target.value })}
                className="pl-7 pr-3 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-300 w-40 transition-colors"
                placeholder="App Naam"
                style={{ color: currentTheme.colors.text }}
            />
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

        {/* Theme Selector */}
        <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-400" />
            <select 
                value={settings.themeId}
                onChange={(e) => onUpdateSettings({ themeId: e.target.value })}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer font-medium"
                style={{ color: currentTheme.colors.text }}
            >
                {THEMES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

        {/* Thousands Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
                <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={settings.showThousands}
                    onChange={(e) => onUpdateSettings({ showThousands: e.target.checked })}
                />
                <div 
                    className={`w-9 h-5 rounded-full shadow-inner transition-colors`}
                    style={{ backgroundColor: settings.showThousands ? currentTheme.colors.primary : '#e5e7eb' }}
                ></div>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.showThousands ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-xs font-medium" style={{ color: currentTheme.colors.text }}>EUR 'k'</span>
        </label>

        {/* Klein Grut Filter */}
        <label className="flex items-center gap-2 cursor-pointer select-none ml-2">
            <div className="relative">
                <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={settings.hideSmallAmounts}
                    onChange={(e) => onUpdateSettings({ hideSmallAmounts: e.target.checked })}
                />
                <div 
                    className={`w-9 h-5 rounded-full shadow-inner transition-colors`}
                    style={{ backgroundColor: settings.hideSmallAmounts ? currentTheme.colors.primary : '#e5e7eb' }}
                ></div>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.hideSmallAmounts ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium" style={{ color: currentTheme.colors.text }}>&lt; {settings.thresholdAmount}</span>
            </div>
        </label>

        {/* AI Comments Toggle */}
        <button 
           onClick={() => onUpdateSettings({ showAIComments: !settings.showAIComments })}
           className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ml-2 border`}
           style={{
               backgroundColor: settings.showAIComments ? `${currentTheme.colors.primary}15` : '#fff',
               borderColor: settings.showAIComments ? currentTheme.colors.primary : '#e5e7eb',
               color: settings.showAIComments ? currentTheme.colors.primary : '#6b7280'
           }}
        >
           {settings.showAIComments ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
           AI
        </button>

        {/* Export Buttons */}
        <div className="ml-auto flex items-center gap-2">
            <button 
                onClick={onExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-white text-xs font-medium rounded hover:opacity-90 transition-opacity bg-green-600"
                title="Download Excel (.xlsx)"
            >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
            </button>
            <button 
                onClick={onExportWord}
                className="flex items-center gap-2 px-3 py-1.5 text-white text-xs font-medium rounded hover:opacity-90 transition-opacity bg-blue-600"
                title="Download Word (.docx)"
            >
                <File className="w-3.5 h-3.5" />
                Word
            </button>
            <button 
                onClick={onExportPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-white text-xs font-medium rounded hover:opacity-90 transition-opacity"
                style={{ backgroundColor: currentTheme.colors.text }}
                title="Download PDF Rapport"
            >
                <FileText className="w-3.5 h-3.5" />
                PDF
            </button>
        </div>
    </div>
  );
};

export default SettingsBar;