import React from 'react';
import { AppSettings, ThemeName } from '../types';
import { THEMES } from '../constants';
import { X, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const themeColors = THEMES[settings.theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Instellingen / Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} color={themeColors.text} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* General */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Algemeen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium mb-1">App Naam</label>
                <input 
                  type="text" 
                  value={settings.appName} 
                  onChange={(e) => handleChange('appName', e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Taal / Language</label>
                <select 
                  value={settings.language} 
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="nl">Nederlands</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </section>

          {/* Visuals */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Thema & Weergave</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Kleurpalet</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(THEMES).map((t) => {
                  // Find key by value
                  const key = Object.keys(THEMES).find(k => THEMES[k as ThemeName] === t) as ThemeName;
                  return (
                    <button
                      key={t.name}
                      onClick={() => handleChange('theme', key)}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${settings.theme === key ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: '#F9FAFB' }}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ background: t.primary }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ background: t.highRisk }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ background: t.mediumRisk }}></div>
                      </div>
                      <span className="text-xs font-medium">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
             <div className="flex items-center justify-between">
              <span className="text-sm">Bedragen in duizenden (k)</span>
              <input 
                type="checkbox" 
                checked={settings.currencyInThousands} 
                onChange={(e) => handleChange('currencyInThousands', e.target.checked)}
                className="w-5 h-5"
              />
            </div>
          </section>

          {/* Features Toggle */}
          <section className="space-y-4">
             <h3 className="text-lg font-semibold border-b pb-2">Functionaliteiten</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { k: 'showDemo', l: 'Toon Demo Knop' },
                  { k: 'showUploadTemplate', l: 'Toon Upload Template' },
                  { k: 'showPeriodSelector', l: 'Toon Periode Selectie' },
                  { k: 'showAIAnalysis', l: 'Toon AI Analyse' },
                  { k: 'showMachineLearning', l: 'Toon Machine Learning Opties' },
                  { k: 'showComments', l: 'Toon Opmerkingen' },
                  { k: 'showUser', l: 'Toon Gebruiker' }
                ].map((item) => (
                  <div key={item.k} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.l}</span>
                    <input 
                      type="checkbox" 
                      checked={(settings as any)[item.k]} 
                      onChange={(e) => handleChange(item.k as keyof AppSettings, e.target.checked)}
                      className="w-5 h-5"
                    />
                  </div>
                ))}
             </div>
             
             <div>
                <label className="block text-sm font-medium mb-1">Filter bedrag (Klein grut)</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">€</span>
                  <input 
                    type="number" 
                    value={settings.smallAmountFilter}
                    onChange={(e) => handleChange('smallAmountFilter', Number(e.target.value))}
                    className="w-24 border rounded p-1"
                  />
                </div>
             </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Save size={18} />
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
