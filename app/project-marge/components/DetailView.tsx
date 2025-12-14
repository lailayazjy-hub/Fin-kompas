import React, { useState } from 'react';
import { ProjectRecord, AppSettings, ThemeColors } from '../types';
import { formatCurrency, formatPercent } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DetailViewProps {
  records: ProjectRecord[];
  settings: AppSettings;
  theme: ThemeColors;
}

const DetailView: React.FC<DetailViewProps> = ({ records, settings, theme }) => {
  const [filterProject, setFilterProject] = useState<string>('all');

  // Filter Logic
  const filteredRecords = records.filter(r => filterProject === 'all' || r.id === filterProject);
  
  // Aggregate if multiple records (or single view)
  const aggregated = filteredRecords.reduce((acc, curr) => ({
    labor: acc.labor + curr.laborCosts,
    material: acc.material + curr.materialCosts,
    overhead: acc.overhead + curr.overheadCosts,
    revenue: acc.revenue + curr.revenue
  }), { labor: 0, material: 0, overhead: 0, revenue: 0 });

  const costData = [
    { name: 'Arbeid', value: aggregated.labor, color: '#3b82f6' },
    { name: 'Materiaal', value: aggregated.material, color: '#f59e0b' },
    { name: 'Overhead', value: aggregated.overhead, color: '#64748b' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-slate-200 flex gap-4 items-center pdf-card">
        <label className="text-sm font-bold text-slate-600">Selecteer Project:</label>
        <select 
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 flex-1 max-w-md"
          style={{ borderColor: theme.primary }}
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option value="all">Alle Projecten (Portfolio Totaal)</option>
          {records.map(r => <option key={r.id} value={r.id}>{r.projectName} - {r.period}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost Structure Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 flex flex-col items-center pdf-card">
           <h3 className="text-lg font-bold mb-4 w-full text-left" style={{ color: theme.text }}>Kostenstructuur</h3>
           <div className="w-full h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                   data={costData} 
                   cx="50%" cy="50%" 
                   innerRadius={60} 
                   outerRadius={80} 
                   paddingAngle={5} 
                   dataKey="value"
                 >
                   {costData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(val: number) => formatCurrency(val, settings.currencyMode)} />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 pdf-card">
           <h3 className="text-lg font-bold mb-4" style={{ color: theme.text }}>Financiële Details</h3>
           <div className="space-y-4">
             <div className="flex justify-between p-3 bg-slate-50 rounded">
               <span className="text-slate-600">Omzet</span>
               <span className="font-bold text-slate-900">{formatCurrency(aggregated.revenue, settings.currencyMode)}</span>
             </div>
             
             <div className="pl-4 space-y-2 border-l-2 border-slate-200">
                <div className="flex justify-between text-sm">
                   <span>Arbeidskosten</span>
                   <span>{formatCurrency(aggregated.labor, settings.currencyMode)} ({formatPercent(aggregated.revenue ? aggregated.labor/aggregated.revenue : 0)})</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span>Materiaalkosten</span>
                   <span>{formatCurrency(aggregated.material, settings.currencyMode)} ({formatPercent(aggregated.revenue ? aggregated.material/aggregated.revenue : 0)})</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span>Overhead</span>
                   <span>{formatCurrency(aggregated.overhead, settings.currencyMode)}</span>
                </div>
             </div>

             <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-100 mt-4">
               <span className="font-bold text-blue-900">Netto Marge</span>
               <span className="font-bold text-blue-900">
                 {formatCurrency(aggregated.revenue - (aggregated.labor + aggregated.material + aggregated.overhead), settings.currencyMode)}
               </span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;
