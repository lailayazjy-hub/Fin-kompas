
import React, { useState } from 'react';
import { Payslip, ThemeColors } from '../types';
import { ChevronLeft, ChevronRight, Printer, Calendar } from 'lucide-react';
import { formatCurrency } from '../services/wkrService';

interface PayslipViewerProps {
  payslips: Payslip[];
  colors: ThemeColors;
}

const PayslipViewer: React.FC<PayslipViewerProps> = ({ payslips, colors }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPayslip = payslips[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : payslips.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < payslips.length - 1 ? prev + 1 : 0));
  };

  if (!currentPayslip) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        Geen loonstroken beschikbaar.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 no-print">
        <div className="flex items-center gap-4">
           <button onClick={handlePrev} className="p-2 hover:bg-white rounded-full shadow-sm transition-all text-gray-600">
             <ChevronLeft size={20} />
           </button>
           <div className="text-center">
             <h3 className="font-bold text-gray-800">{currentPayslip.employeeName}</h3>
             <p className="text-xs text-gray-500">Periode: {currentPayslip.period} {currentPayslip.year}</p>
           </div>
           <button onClick={handleNext} className="p-2 hover:bg-white rounded-full shadow-sm transition-all text-gray-600">
             <ChevronRight size={20} />
           </button>
        </div>
        
        <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 text-gray-700 transition-colors shadow-sm"
        >
            <Printer size={16} />
            Afdrukken
        </button>
      </div>

      {/* Payslip Digital Twin */}
      <div className="p-8 text-sm text-gray-800 bg-white" id="payslip-content">
        {/* Header */}
        <div className="flex justify-between mb-8 pb-4 border-b border-gray-100">
            <div>
                <h2 className="font-bold text-lg mb-1">Werkgever B.V.</h2>
                <p>Hoofdstraat 123</p>
                <p>1234 AB AMSTERDAM</p>
            </div>
            <div className="text-right">
                <h2 className="font-bold text-xl uppercase tracking-wide text-gray-400 mb-1">Loonstrook</h2>
                <div className="flex gap-4 text-xs text-gray-500 justify-end">
                    <div>
                        <span className="block font-bold">Periode:</span>
                        <span>{currentPayslip.period}</span>
                    </div>
                     <div>
                        <span className="block font-bold">Jaar:</span>
                        <span>{currentPayslip.year}</span>
                    </div>
                     <div>
                        <span className="block font-bold">Datum:</span>
                        <span>{currentPayslip.runDate}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Employee Info Box */}
        <div className="bg-blue-50/30 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border border-blue-100">
            <div>
                <span className="block text-gray-400 uppercase font-bold text-[10px]">Medewerker</span>
                <span className="font-bold text-sm">{currentPayslip.employeeName}</span>
                <span className="block text-gray-500">{currentPayslip.employeeRef}</span>
            </div>
             <div>
                <span className="block text-gray-400 uppercase font-bold text-[10px]">Tabel</span>
                <span className="font-medium">{currentPayslip.tableColor}</span>
            </div>
             <div>
                <span className="block text-gray-400 uppercase font-bold text-[10px]">Gewerkte Uren</span>
                <span className="font-medium">{currentPayslip.workedHours.toFixed(2)}</span>
            </div>
             <div>
                <span className="block text-gray-400 uppercase font-bold text-[10px]">Bijzonder Tarief</span>
                <span className="font-medium">{currentPayslip.specialRate.toFixed(2)}%</span>
            </div>
        </div>

        {/* Big Visual Indicators */}
        <div className="flex justify-around mb-8 py-4 border-y border-gray-50">
             <div className="text-center">
                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Brutoloon</div>
                <div className="text-2xl font-bold text-gray-700">{formatCurrency(currentPayslip.grossSalary, false)}</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Loonheffing</div>
                <div className="text-2xl font-bold text-red-400">-{formatCurrency(currentPayslip.tax, false).replace('€', '')}</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Netto Uit</div>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(currentPayslip.netAmount, false)}</div>
             </div>
        </div>

        {/* Calculation Table */}
        <table className="w-full mb-8">
            <thead className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200">
                <tr>
                    <th className="text-left py-2">Omschrijving</th>
                    <th className="text-right py-2">Basis</th>
                    <th className="text-right py-2">Bedrag</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {currentPayslip.salaryComponents.map((item, idx) => (
                    <tr key={idx}>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right text-gray-400">-</td>
                        <td className={`py-2 text-right font-mono ${item.type === 'deduction' ? 'text-red-500' : 'text-gray-800'}`}>
                            {formatCurrency(item.amount, false)}
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
                <tr>
                    <td className="py-4 font-bold text-lg">Netto Loon</td>
                    <td></td>
                    <td className="py-4 text-right font-bold text-lg font-mono text-gray-900">
                        {formatCurrency(currentPayslip.netAmount, false)}
                    </td>
                </tr>
            </tfoot>
        </table>

        {/* Footer Info */}
        <div className="text-xs text-gray-400 text-center mt-12">
            Gegenereerd door WKR Assistent • {currentPayslip.id} • Pagina 1/1
        </div>
      </div>
    </div>
  );
};

export default PayslipViewer;
