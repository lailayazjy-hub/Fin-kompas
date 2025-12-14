
import React from 'react';
import { SalaryScaleRow, ThemeColors } from '../types';
import { Upload } from 'lucide-react';
import { formatCurrency } from '../services/wkrService';

interface SalaryScalesListProps {
  scales: SalaryScaleRow[];
  colors: ThemeColors;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SalaryScalesList: React.FC<SalaryScalesListProps> = ({ scales, colors, onUpload }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <h3 className="font-semibold text-lg" style={{ color: colors.text }}>Salarisschalen Overzicht</h3>
        
        <div className="flex gap-2">
            <label className="cursor-pointer px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2">
                <Upload size={16} />
                Upload Schalen Excel
                <input type="file" className="hidden" accept=".csv,.xlsx" onChange={onUpload} />
            </label>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                    <th className="p-4 border-b sticky left-0 bg-gray-50 z-10">Schaal</th>
                    <th className="p-4 border-b text-right border-r border-gray-200">Startloon</th>
                    {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="p-4 border-b text-right min-w-[100px]">{i + 1}</th>
                    ))}
                    <th className="p-4 border-b text-right border-l border-gray-200">Eindloon</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {scales.map((row) => (
                    <tr key={row.scale} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-800 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-100">{row.scale}</td>
                        <td className="p-4 text-right font-mono text-gray-700 border-r border-gray-100">
                            {formatCurrency(row.startSalary, false)}
                        </td>
                        {row.steps.map((step, index) => (
                            <td key={index} className="p-4 text-right font-mono text-gray-600">
                                {step !== null ? formatCurrency(step, false) : '-'}
                            </td>
                        ))}
                        <td className="p-4 text-right font-mono font-semibold text-gray-800 border-l border-gray-100">
                            {formatCurrency(row.endSalary, false)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {scales.length === 0 && (
            <div className="p-8 text-center text-gray-400">
                Geen schaaltreden gevonden. Upload een Excel bestand.
            </div>
        )}
      </div>
    </div>
  );
};

export default SalaryScalesList;
