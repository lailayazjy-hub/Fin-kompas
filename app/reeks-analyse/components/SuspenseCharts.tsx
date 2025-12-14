import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { SuspenseItem, RiskLevel, ThemeColors } from '../types';

interface Props {
  items: SuspenseItem[];
  themeColors: ThemeColors;
  useKNotation: boolean;
}

export const SuspenseCharts: React.FC<Props> = ({ items, themeColors, useKNotation }) => {
  // Prepare data for Aging Bucket
  const buckets = [
    { name: '< 30 Dagen', count: 0, amount: 0 },
    { name: '30-60 Dagen', count: 0, amount: 0 },
    { name: '60-90 Dagen', count: 0, amount: 0 },
    { name: '> 90 Dagen', count: 0, amount: 0 },
  ];

  items.forEach(item => {
    if (item.daysOpen <= 30) { buckets[0].count++; buckets[0].amount += item.amount; }
    else if (item.daysOpen <= 60) { buckets[1].count++; buckets[1].amount += item.amount; }
    else if (item.daysOpen <= 90) { buckets[2].count++; buckets[2].amount += item.amount; }
    else { buckets[3].count++; buckets[3].amount += item.amount; }
  });

  const riskData = [
    { name: 'Laag', value: items.filter(i => i.risk === RiskLevel.LOW).length, color: themeColors.low },
    { name: 'Medium', value: items.filter(i => i.risk === RiskLevel.MEDIUM).length, color: themeColors.medium },
    { name: 'Hoog', value: items.filter(i => i.risk === RiskLevel.HIGH).length, color: themeColors.high },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Aging Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: themeColors.text }}>
            Ouderdomsanalyse ({useKNotation ? 'Bedrag in k' : 'Volledig Bedrag'})
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <XAxis dataKey="name" fontSize={12} stroke="#64748b" />
              <YAxis fontSize={12} stroke="#64748b" tickFormatter={(val) => useKNotation ? `€${val/1000}k` : `€${val}`} />
              <Tooltip 
                formatter={(value: number) => [useKNotation ? `€ ${(value/1000).toFixed(1)}k` : `€ ${value.toFixed(2)}`, 'Bedrag']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {buckets.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 3 ? themeColors.high : themeColors.primary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: themeColors.text }}>
            Risico Verdeling (Aantal Posten)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};