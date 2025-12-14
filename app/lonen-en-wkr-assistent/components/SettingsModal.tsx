import React from 'react';
import { AppSettings, ThemeName } from '../types';
import { THEMES } from '../constants';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  primaryColor: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  primaryColor
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">Instellingen</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* General Settings */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Algemeen</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam van de tool</label>
                <input 
                  type="text" 
                  value={settings.appName}
                  onChange={(e) => handleChange('appName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                  style={{ focusRingColor: primaryColor }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Totale Loonsom (€)</label>
                <input 
                  type="number" 
                  value={settings.totalWageBill}
                  onChange={(e) => handleChange('totalWageBill', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
          </section>

          {/* Visual Theme */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thema & Weergave</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(THEMES).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => handleChange('theme', themeName as ThemeName)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    settings.theme === themeName ? 'border-current' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ borderColor: settings.theme === themeName ? THEMES[themeName as ThemeName].primary : undefined }}
                >
                  <div className="flex gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: THEMES[themeName as ThemeName].primary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ background: THEMES[themeName as ThemeName].highRisk }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ background: THEMES[themeName as ThemeName].mediumRisk }}></div>
                  </div>
                  <span className="font-medium text-gray-700">{themeName}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Toggles */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Functionaliteit</h3>
            <div className="space-y-3">
              {[
                { key: 'showDemo', label: 'Toon Demo Knop' },
                { key: 'showUploadTemplate', label: 'Toon Upload Template' },
                { key: 'showAIAnalysis', label: 'Toon AI Analyse' },
                { key: 'showMachineLearning', label: 'Toon Machine Learning (Beta)' },
                { key: 'showComments', label: 'Toon Opmerkingen' },
                { key: 'showUserNames', label: 'Toon Gebruikersnamen' },
                { key: 'currencyInThousands', label: "Bedragen in duizenden ('k')" },
                { key: 'showExportButtons', label: 'Toon Export Opties' },
                { key: 'showDatePeriod', label: 'Toon Analyseperiode Selectie' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{item.label}</span>
                  <button
                    onClick={() => handleChange(item.key as keyof AppSettings, !settings[item.key as keyof AppSettings])}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      settings[item.key as keyof AppSettings] ? 'bg-opacity-100' : 'bg-gray-200'
                    }`}
                    style={{ backgroundColor: settings[item.key as keyof AppSettings] ? primaryColor : undefined }}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings[item.key as keyof AppSettings] ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
