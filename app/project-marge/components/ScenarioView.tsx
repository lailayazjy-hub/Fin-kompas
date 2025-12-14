import React, { useState, useEffect } from 'react';
import { ProjectRecord, AppSettings, ThemeColors } from '../types';
import { formatCurrency, formatPercent } from '../utils';
import { Sliders, RefreshCw, Save, Trash2, Plus } from 'lucide-react';

interface ScenarioViewProps {
  records: ProjectRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

interface SavedScenario {
  id: string;
  name: string;
  factors: {
    revenue: number;
    labor: number;
    material: number;
    overhead: number;
  };
}

const ScenarioView: React.FC<ScenarioViewProps> = ({ records, settings, theme }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Simulation factors (1.0 = 100%)
  const [revenueFactor, setRevenueFactor] = useState(1.0);
  const [laborFactor, setLaborFactor] = useState(1.0);
  const [materialFactor, setMaterialFactor] = useState(1.0);
  const [overheadFactor, setOverheadFactor] = useState(1.0);

  // Scenario Management
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState('');

  const selectedProject = records.find(r => r.id === selectedProjectId);

  useEffect(() => {
    if (records.length > 0 && !selectedProjectId) {
      setSelectedProjectId(records[0].id);
    }
  }, [records, selectedProjectId]);

  // Reset simulation when changing projects
  useEffect(() => {
    setSavedScenarios([]);
    resetSimulation();
  }, [selectedProjectId]);

  const resetSimulation = () => {
    setRevenueFactor(1.0);
    setLaborFactor(1.0);
    setMaterialFactor(1.0);
    setOverheadFactor(1.0);
  };

  const handleSaveScenario = () => {
    if (!newScenarioName.trim()) return;
    const scenario: SavedScenario = {
      id: Date.now().toString(),
      name: newScenarioName,
      factors: {
        revenue: revenueFactor,
        labor: laborFactor,
        material: materialFactor,
        overhead: overheadFactor
      }
    };
    setSavedScenarios([...savedScenarios, scenario]);
    setNewScenarioName('');
  };

  const deleteScenario = (id: string) => {
    setSavedScenarios(savedScenarios.filter(s => s.id !== id));
  };

  if (!selectedProject) return <div className="p-8 text-center text-slate-500">Geen projecten beschikbaar voor simulatie.</div>;

  // Helper to calculate results based on factors
  const calculateResults = (factors: { revenue: number, labor: number, material: number, overhead: number }) => {
    const rev = selectedProject.revenue * factors.revenue;
    const lab = selectedProject.laborCosts * factors.labor;
    const mat = selectedProject.materialCosts * factors.material;
    const ovh = selectedProject.overheadCosts * factors.overhead;
    const total = lab + mat + ovh;
    const margin = rev - total;
    const marginPct = rev > 0 ? margin / rev : 0;
    return { rev, lab, mat, ovh, total, margin, marginPct };
  };

  const currentSim = calculateResults({ 
    revenue: revenueFactor, 
    labor: laborFactor, 
    material: materialFactor, 
    overhead: overheadFactor 
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200 pdf-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
             <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
              <Sliders className="w-6 h-6" style={{ color: theme.primary }} />
              Scenario Simulator
            </h2>
            <p className="text-sm text-slate-500">Vergelijk scenario's en simuleer kostenstructuren.</p>
          </div>
          <select 
            className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 w-full md:w-auto min-w-[250px]"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {records.map(r => (
                <option key={r.id} value={r.id}>{r.projectName} ({r.period})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Controls Column */}
           <div className="lg:col-span-1 space-y-6 border-r border-slate-100 pr-0 lg:pr-6">
              <h3 className="font-bold text-sm uppercase text-slate-400">Variabelen</h3>
              
              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-slate-500">Omzet Correctie</label>
                <input 
                  type="range" min="0.5" max="1.5" step="0.05" 
                  value={revenueFactor}
                  onChange={(e) => setRevenueFactor(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs mt-1">
                   <span>-50%</span>
                   <span className="font-bold">{formatPercent(revenueFactor - 1 > 0 ? revenueFactor - 1 : revenueFactor - 1)}</span>
                   <span>+50%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-slate-500">Arbeidskosten</label>
                <input 
                  type="range" min="0.5" max="2.0" step="0.05" 
                  value={laborFactor}
                  onChange={(e) => setLaborFactor(parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="text-center text-xs font-bold mt-1">x {laborFactor.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-slate-500">Materiaalkosten</label>
                <input 
                  type="range" min="0.5" max="2.0" step="0.05" 
                  value={materialFactor}
                  onChange={(e) => setMaterialFactor(parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
                 <div className="text-center text-xs font-bold mt-1">x {materialFactor.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-slate-500">Overhead Kosten</label>
                <input 
                  type="range" min="0.5" max="2.0" step="0.05" 
                  value={overheadFactor}
                  onChange={(e) => setOverheadFactor(parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
                 <div className="text-center text-xs font-bold mt-1">x {overheadFactor.toFixed(2)}</div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Scenario naam..." 
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      className="flex-1 text-xs border rounded px-2 py-1"
                    />
                    <button 
                      onClick={handleSaveScenario}
                      disabled={!newScenarioName}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                      title="Scenario opslaan"
                    >
                      <Save className="w-4 h-4 text-slate-600" />
                    </button>
                 </div>
                 
                 <button 
                    onClick={resetSimulation}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm border rounded hover:bg-slate-50 text-slate-600"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset Filters
                  </button>
              </div>
           </div>

           {/* Results Column */}
           <div className="lg:col-span-3">
              <h3 className="font-bold text-lg mb-4">Vergelijkende Resultaten</h3>
              
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="p-3 bg-slate-50 min-w-[120px]">Metric</th>
                      <th className="p-3 bg-slate-50 min-w-[140px] border-l border-slate-200 text-right">
                        Basis (Werkelijk)
                      </th>
                      <th className="p-3 bg-blue-50 min-w-[140px] border-l border-slate-200 text-right font-bold text-blue-800">
                        Huidige Simulatie
                      </th>
                      {savedScenarios.map(s => (
                        <th key={s.id} className="p-3 bg-slate-50 min-w-[140px] border-l border-slate-200 text-right group relative">
                           <div className="flex justify-end items-center gap-2">
                             <span>{s.name}</span>
                             <button onClick={() => deleteScenario(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Omzet', key: 'rev', isTotal: false },
                      { label: 'Arbeidskosten', key: 'lab', isTotal: false },
                      { label: 'Materiaalkosten', key: 'mat', isTotal: false },
                      { label: 'Overhead', key: 'ovh', isTotal: false },
                      { label: 'Totale Kosten', key: 'total', isTotal: true, className: 'font-semibold bg-slate-50/50' },
                      { label: 'Marge (€)', key: 'margin', isTotal: true, className: 'font-bold' },
                      { label: 'Marge (%)', key: 'marginPct', isPercent: true, isTotal: true, className: 'font-bold' }
                    ].map((row, idx) => (
                      <tr key={idx} className={`border-b border-slate-50 hover:bg-slate-50/50 ${row.className || ''}`}>
                        <td className="p-3 text-slate-600">{row.label}</td>
                        
                        {/* Base Data */}
                        <td className="p-3 text-right font-mono border-l border-slate-100 text-slate-500">
                           {row.isPercent 
                              ? formatPercent(selectedProject.marginPercent)
                              : formatCurrency(
                                  row.key === 'rev' ? selectedProject.revenue :
                                  row.key === 'lab' ? selectedProject.laborCosts :
                                  row.key === 'mat' ? selectedProject.materialCosts :
                                  row.key === 'ovh' ? selectedProject.overheadCosts :
                                  row.key === 'total' ? selectedProject.totalCosts :
                                  selectedProject.margin, 
                                settings.currencyMode
                                )
                           }
                        </td>

                        {/* Active Simulation */}
                        <td className="p-3 text-right font-mono border-l border-slate-100 text-blue-700 bg-blue-50/10">
                           {row.isPercent 
                              ? <span style={{ color: currentSim.marginPct < 0.05 ? theme.highRisk : theme.lowRisk }}>{formatPercent(currentSim.marginPct)}</span>
                              : formatCurrency(currentSim[row.key as keyof typeof currentSim], settings.currencyMode)
                           }
                        </td>

                        {/* Saved Scenarios */}
                        {savedScenarios.map(s => {
                           const res = calculateResults(s.factors);
                           return (
                             <td key={s.id} className="p-3 text-right font-mono border-l border-slate-100 text-slate-600">
                                {row.isPercent 
                                  ? <span style={{ color: res.marginPct < 0.05 ? theme.highRisk : theme.lowRisk }}>{formatPercent(res.marginPct)}</span>
                                  : formatCurrency(res[row.key as keyof typeof res], settings.currencyMode)
                                }
                             </td>
                           );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-xs text-slate-400 italic">
                 * Basiswaarden zijn gebaseerd op de werkelijke projectdata uit de import.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioView;
