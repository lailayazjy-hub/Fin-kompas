import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, Treemap
} from 'recharts';
import { BudgetLine, ThemePalette } from '../types';
import { LayoutGrid, BarChart2, TrendingUp, HelpCircle } from 'lucide-react';

interface ChartsProps {
  data: BudgetLine[];
  showInThousands: boolean;
  theme: ThemePalette;
  decimalPrecision: number;
  newInvestment?: number;
}

type ChartView = 'treemap' | 'stacked' | 'waterfall';

export const SimulationChart: React.FC<ChartsProps> = ({ data, showInThousands, theme, decimalPrecision, newInvestment = 0 }) => {
  const [activeView, setActiveView] = useState<ChartView>('treemap');

  // --- HELPER FUNCTIONS ---

  const round = (val: number) => {
    const factor = Math.pow(10, decimalPrecision);
    return Math.round(val * factor) / factor;
  };

  const formatValue = (val: number) => {
    if (val === 0) return '0';
    if (showInThousands) return `${(val / 1000).toFixed(1)}k`;
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const formatTooltipCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: decimalPrecision,
      maximumFractionDigits: decimalPrecision
    }).format(value);
  };

  // --- DATA PREPARATION ---

  // 1. Aggregate Data by Category (Common base)
  const aggregatedData = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    const lineFinal = round(curr.originalAmount + curr.adjustment);
    
    if (existing) {
      existing.original = round(existing.original + curr.originalAmount);
      existing.final = round(existing.final + lineFinal);
      existing.adjustment = round(existing.adjustment + curr.adjustment);
    } else {
      acc.push({
        name: curr.category,
        original: round(curr.originalAmount),
        final: lineFinal,
        adjustment: round(curr.adjustment)
      });
    }
    return acc;
  }, [] as { name: string, original: number, final: number, adjustment: number }[]);

  // 2. Inject "New Investment" if exists (handled as a synthetic item)
  if (newInvestment && newInvestment > 0) {
      aggregatedData.push({
          name: 'Nieuwe Investering',
          original: 0,
          final: round(newInvestment),
          adjustment: round(newInvestment)
      });
  }

  // Sort large to small for better visibility in most charts
  aggregatedData.sort((a, b) => b.final - a.final);

  // --- CHART SPECIFIC DATA BUILDERS ---

  // A. TREEMAP DATA
  // Filters out negative/zero finals to prevent render crashes
  const treemapData = aggregatedData
    .filter(d => d.final > 0)
    .map(d => ({ ...d, size: d.final })); // Recharts treemap uses 'size' or dataKey

  // B. STACKED BAR DATA (100% Normalized)
  // We need two objects: one for "Origineel", one for "Nieuw"
  // Keys are the category names.
  const getStackedData = () => {
    const originalBar: any = { name: 'Origineel Budget' };
    const finalBar: any = { name: 'Nieuw Budget' };
    
    aggregatedData.forEach(item => {
      if (item.original > 0) originalBar[item.name] = item.original;
      if (item.final > 0) finalBar[item.name] = item.final;
    });

    return [originalBar, finalBar];
  };

  // C. WATERFALL DATA
  // Start -> Steps (Deltas) -> End
  const getWaterfallData = () => {
    const points: any[] = [];
    
    // 1. Total Start (Sum of existing lines only, excluding synthetic investment which has 0 original)
    const totalOriginal = round(aggregatedData.reduce((acc, cur) => acc + cur.original, 0));
    points.push({
      name: 'Start (Origineel)',
      uv: totalOriginal, // 'uv' used for total column height
      type: 'total',
      fill: '#94a3b8' // Slate-400
    });

    let runningTotal = totalOriginal;

    // 2. Steps (Only non-zero adjustments)
    // Sort steps: positive first, then negative (conventional waterfall flow)
    const steps = aggregatedData.filter(d => d.adjustment !== 0)
        .sort((a, b) => b.adjustment - a.adjustment);

    steps.forEach(step => {
      const prevTotal = runningTotal;
      runningTotal = round(runningTotal + step.adjustment);
      
      // For a floating bar in Recharts, we provide [min, max] array as value
      // If adjustment is positive: [prev, current]
      // If adjustment is negative: [current, prev] (Recharts expects [min, max])
      const range = [Math.min(prevTotal, runningTotal), Math.max(prevTotal, runningTotal)];
      
      // Determine color
      let fillColor = step.adjustment > 0 ? theme.highRisk : theme.lowRisk;
      if (step.name === 'Nieuwe Investering') {
          fillColor = theme.text; // Distinct color for investment
      }

      points.push({
        name: step.name,
        range: range,
        adjustment: step.adjustment,
        type: 'step',
        fill: fillColor
      });
    });

    // 3. Total End
    points.push({
      name: 'Eind (Nieuw)',
      uv: runningTotal,
      type: 'total',
      fill: theme.primary
    });

    return points;
  };


  // --- RENDERERS ---

  // Custom Content for Treemap
  const TreemapContent = (props: any) => {
    const { x, y, width, height, name, value, depth } = props;
    const item = aggregatedData.find(d => d.name === name);
    
    // Color Logic: 
    // Neutral base. 
    // If adjusted up -> High Risk color mix
    // If adjusted down -> Low Risk color mix
    let fillColor = theme.primary; // Default
    
    if (name === 'Nieuwe Investering') {
        fillColor = theme.text; // Distinct
    } else if (item && item.adjustment > 0) {
        fillColor = theme.highRisk;
    } else if (item && item.adjustment < 0) {
        fillColor = theme.lowRisk;
    }

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: fillColor,
            stroke: '#fff',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1,
          }}
        />
        {width > 60 && height > 30 && (
          <foreignObject x={x} y={y} width={width} height={height}>
             <div className="flex flex-col items-center justify-center h-full p-1 text-center overflow-hidden">
                <span className="text-white font-bold text-xs truncate w-full px-1 drop-shadow-md">{name}</span>
                <span className="text-white/90 text-[10px] font-mono drop-shadow-md">{formatValue(value)}</span>
                {item && item.adjustment !== 0 && (
                   <span className="text-white/80 text-[9px] bg-black/20 px-1 rounded mt-0.5">
                      {item.adjustment > 0 ? '+' : ''}{formatValue(item.adjustment)}
                   </span>
                )}
             </div>
          </foreignObject>
        )}
      </g>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-700 flex items-center">
          <BarChart2 className="mr-2" size={18} />
          Budget Visualisatie
        </h3>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveView('treemap')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'treemap' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid size={14} className="inline mr-1" /> Treemap
          </button>
          <button 
            onClick={() => setActiveView('stacked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'stacked' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BarChart2 size={14} className="inline mr-1" /> Verdeling
          </button>
          <button 
            onClick={() => setActiveView('waterfall')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'waterfall' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <TrendingUp size={14} className="inline mr-1" /> Waterfall
          </button>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'treemap' ? (
             <Treemap
               data={treemapData}
               dataKey="size"
               aspectRatio={4 / 3}
               stroke="#fff"
               content={<TreemapContent />}
             >
               <Tooltip 
                 formatter={(value: number) => formatTooltipCurrency(value)}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
               />
             </Treemap>
          ) : activeView === 'stacked' ? (
             <BarChart data={getStackedData()} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatValue} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value: number) => formatTooltipCurrency(value)} />
                <Legend />
                {aggregatedData.map((entry, index) => (
                  <Bar 
                    key={entry.name} 
                    dataKey={entry.name} 
                    stackId="a" 
                    fill={entry.name === 'Nieuwe Investering' ? theme.text : (index % 2 === 0 ? theme.primary : theme.mediumRisk)} 
                  />
                ))}
             </BarChart>
          ) : (
             <BarChart data={getWaterfallData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                <YAxis tickFormatter={formatValue} />
                <Tooltip 
                   formatter={(value: any, name: string, props: any) => {
                      if (name === 'range') return [formatTooltipCurrency(value[0]), formatTooltipCurrency(value[1])];
                      return formatTooltipCurrency(value);
                   }}
                />
                <ReferenceLine y={0} stroke="#000" />
                <Bar dataKey={props => props.type === 'step' ? props.range : props.uv} fill="#8884d8">
                  {getWaterfallData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
             </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
         <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.primary }}></div>
            <span>Standaard / Besparing</span>
         </div>
         <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.highRisk }}></div>
            <span>Kostenstijging</span>
         </div>
         <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.text }}></div>
            <span>Nieuwe Investering</span>
         </div>
      </div>
    </div>
  );
};
