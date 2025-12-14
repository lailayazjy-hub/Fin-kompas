import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { AnalysisStats, ThemeColors } from '../types';
import { formatCurrency } from '../services/wkrService';

interface DashboardProps {
  stats: AnalysisStats;
  colors: ThemeColors;
  currencyInThousands: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, colors, currencyInThousands }) => {
  const donutData = [
    { name: 'Benut', value: stats.usedSpace },
    { name: 'Beschikbaar', value: stats.remainingSpace },
  ];

  const donutColors = [colors.primary, '#E5E7EB']; // Primary vs Grey for empty

  // Calculate High/Med/Low risk based on percentage used for the visual gauge effect
  let riskColor = colors.lowRisk;
  let riskLabel = "Laag Risico";
  if (stats.percentageUsed > 90) {
    riskColor = colors.highRisk;
    riskLabel = "Hoog Risico";
  } else if (stats.percentageUsed > 75) {
    riskColor = colors.mediumRisk;
    riskLabel = "Medium Risico";
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Summary Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-500 mb-1">Vrije Ruimte Status</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: colors.text }}>
              {Math.round(stats.percentageUsed)}%
            </span>
            <span className="text-sm text-gray-400">benut</span>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Totaal budget</span>
                <span className="font-semibold" style={{ color: colors.text }}>{formatCurrency(stats.totalSpace, currencyInThousands)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Reeds gebruikt</span>
                <span className="font-semibold" style={{ color: colors.primary }}>{formatCurrency(stats.usedSpace, currencyInThousands)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Resterend</span>
                <span className="font-semibold" style={{ color: stats.remainingSpace > 0 ? colors.lowRisk : colors.highRisk }}>
                    {formatCurrency(stats.remainingSpace, currencyInThousands)}
                </span>
            </div>
        </div>

        {stats.exceededAmount > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs font-bold text-red-800 uppercase mb-1">Waarschuwing: Overschrijding</p>
            <div className="flex justify-between text-sm text-red-700">
                <span>Te veel:</span>
                <span>{formatCurrency(stats.exceededAmount, currencyInThousands)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-700 font-semibold mt-1">
                <span>Est. Eindheffing (80%):</span>
                <span>{formatCurrency(stats.estimatedTax, currencyInThousands)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Donut Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
        <h3 className="absolute top-6 left-6 text-lg font-medium text-gray-500">Benutting</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={donutData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                >
                {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? (stats.remainingSpace < 0 ? colors.highRisk : colors.primary) : '#f3f4f6'} />
                ))}
                </Pie>
                <text x="50%" y="50%" dy={-10} textAnchor="middle" fill={colors.text} className="text-2xl font-bold">
                    {Math.round(stats.percentageUsed)}%
                </text>
                <text x="50%" y="50%" dy={15} textAnchor="middle" fill="#9CA3AF" className="text-sm">
                    Gebruikt
                </text>
            </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="flex gap-2 items-center mt-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: riskColor + '30', color: riskColor }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor }}></div>
            {riskLabel}
        </div>
      </div>

      {/* Bar Chart (Categories) placeholder logic - simpler for this demo */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-500 mb-4">Verdeling Categorieën</h3>
        <div className="h-56 w-full flex items-end justify-around space-x-2">
           {/* Mock bars using HTML/Tailwind for simplicity/speed vs heavy Recharts config */}
           {/* In a real app, I'd aggregate the data properly for Recharts */}
           <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Vrije ruimte', val: stats.usedSpace },
                        { name: 'Gericht', val: stats.totalSpace * 0.4 }, // Mock for visual
                        { name: 'Nihil', val: stats.totalSpace * 0.1 }, // Mock
                    ]}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                             cursor={{ fill: 'transparent' }}
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                            {
                                [0,1,2].map((i) => (
                                    <Cell key={i} fill={i === 0 ? colors.highRisk : colors.primary} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
