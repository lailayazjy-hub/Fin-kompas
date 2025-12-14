import React, { useState, useMemo } from 'react';
import { Employee, Payslip, ThemeColors } from '../types';
import { Search, Upload, Columns, Check, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../services/wkrService';

interface EmployeeListProps {
  employees: Employee[];
  payslips: Payslip[];
  colors: ThemeColors;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currencyInThousands: boolean;
}

interface ColumnDef {
  key: string;
  label: string;
  isNumeric?: boolean;
  fromPayslip?: boolean;
}

const AVAILABLE_COLUMNS: ColumnDef[] = [
  // Employee Fields (Basic)
  { key: 'ref', label: 'Ref' },
  { key: 'name', label: 'Naam' },
  { key: 'contractInfo', label: 'Arbeidsverband' },
  { key: 'startDate', label: 'Datum in dienst' },
  { key: 'yearsService', label: 'Jaren in dienst', isNumeric: true },
  { key: 'currentHourlyWage', label: 'Huidige uurloon', isNumeric: true },
  { key: 'jobDescription', label: 'Functie' },
  { key: 'startHourlyWage', label: 'Instap uurloon', isNumeric: true },
  
  // Payslip Fields (Financial)
  { key: 'grossSalary', label: 'Brutoloon (Loonstrook)', isNumeric: true, fromPayslip: true },
  { key: 'workedHours', label: 'Gewerkte Uren', isNumeric: true, fromPayslip: true },
  { key: 'tax', label: 'Loonheffing', isNumeric: true, fromPayslip: true },
  { key: 'netAmount', label: 'Netto Loon', isNumeric: true, fromPayslip: true },
  { key: 'specialRate', label: 'Bijzonder Tarief %', isNumeric: true, fromPayslip: true },
  { key: 'tableColor', label: 'Tabelkleur', fromPayslip: true },
];

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, payslips, colors, onUpload, currencyInThousands }) => {
  // Default visible columns
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'ref', 'name', 'contractInfo', 'startDate', 'currentHourlyWage', 'grossSalary', 'netAmount'
  ]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Merge employee data with their latest payslip data
  const mergedData = useMemo(() => {
    return employees.map(emp => {
      // Find latest payslip (assuming array might have history, for now just matching ref)
      const slip = payslips.find(p => p.employeeRef === emp.ref);
      return {
        ...emp,
        grossSalary: slip?.grossSalary,
        workedHours: slip?.workedHours,
        tax: slip?.tax,
        netAmount: slip?.netAmount,
        specialRate: slip?.specialRate,
        tableColor: slip?.tableColor,
      };
    });
  }, [employees, payslips]);

  const renderCell = (row: any, colKey: string) => {
    const value = row[colKey];
    
    if (value === undefined || value === null) return <span className="text-gray-300">-</span>;

    const def = AVAILABLE_COLUMNS.find(c => c.key === colKey);
    
    if (def?.isNumeric) {
      // Check if it's currency or just a number
      if (colKey.includes('Wage') || colKey.includes('Salary') || colKey.includes('Amount') || colKey.includes('tax')) {
         return formatCurrency(value, currencyInThousands);
      }
      if (colKey === 'specialRate') return `${value.toFixed(2)}%`;
      return value.toString();
    }

    return value;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <h3 className="font-semibold text-lg" style={{ color: colors.text }}>Personeelsbestand</h3>
        
        <div className="flex gap-2 relative">
            {/* Column Picker */}
            <div className="relative">
                <button 
                    onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
                >
                    <Columns size={16} />
                    Kolommen
                    <ChevronDown size={14} />
                </button>
                
                {isColumnMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsColumnMenuOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20 max-h-[300px] overflow-y-auto">
                            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Toon kolommen</div>
                            {AVAILABLE_COLUMNS.map((col) => (
                                <button 
                                    key={col.key}
                                    onClick={() => toggleColumn(col.key)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                >
                                    <span>{col.label}</span>
                                    {visibleColumns.includes(col.key) && <Check size={14} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <label className="cursor-pointer px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2">
                <Upload size={16} />
                Upload Lonen Excel
                <input type="file" className="hidden" accept=".csv,.xlsx" onChange={onUpload} />
            </label>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                    {AVAILABLE_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                        <th key={col.key} className={`p-4 border-b ${col.isNumeric ? 'text-right' : ''} ${col.key === 'ref' || col.key === 'name' ? 'sticky left-0 bg-gray-50 z-10' : ''}`}>
                            {col.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {mergedData.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        {AVAILABLE_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                            <td 
                                key={col.key} 
                                className={`p-4 ${col.isNumeric ? 'text-right font-mono' : 'text-gray-600'} ${col.key === 'ref' || col.key === 'name' ? 'sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-50 font-medium text-gray-800' : ''}`}
                            >
                                {renderCell(emp, col.key)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
        {employees.length === 0 && (
            <div className="p-8 text-center text-gray-400">
                Geen personeelsgegevens gevonden. Upload een Excel bestand.
            </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;