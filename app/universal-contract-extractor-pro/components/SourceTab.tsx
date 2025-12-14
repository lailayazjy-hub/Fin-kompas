import React, { useState } from 'react';
import { SourceDocument } from '../types';
import { FileText, Database, ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface SourceTabProps {
  source: SourceDocument;
}

const SourceTab: React.FC<SourceTabProps> = ({ source }) => {
  const [isRawOpen, setIsRawOpen] = useState(false);
  const data = source.data;

  // Use collapsible for long lists (more than 10 items)
  const [isListExpanded, setIsListExpanded] = useState(data.financials.items.length <= 10);

  const getValidationIcon = (status?: string) => {
    switch(status) {
      case 'Valid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Review': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'Invalid': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-300" />; // Default for AI items which might not have status
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* File Info */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-4 bg-gray-100 rounded-lg">
          <FileText className="w-8 h-8 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{source.name}</h3>
          <p className="text-sm text-gray-500">
            Type: {source.type} • ID: {source.id.substring(0,8)}...
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full border border-green-200">
                Data Geladen
            </span>
            {source.sheetName && (
               <span className="mt-2 text-xs text-gray-400 font-mono">Tabblad: {source.sheetName}</span>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: Data View with Validation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Geëxtraheerde Regels</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Realtime Validatie Actief</span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 w-8">St</th>
                      <th className="px-4 py-2">Omschrijving</th>
                      <th className="px-4 py-2 text-right">Bedrag</th>
                      {source.type === 'EXCEL_SHEET' && <th className="px-4 py-2 text-right text-[10px] w-12">Rij</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {(isListExpanded ? data.financials.items : data.financials.items.slice(0, 5)).map((item, idx) => (
                        <tr key={idx} className={item.validationStatus === 'Invalid' ? 'bg-red-50' : item.validationStatus === 'Review' ? 'bg-orange-50' : ''}>
                           <td className="px-4 py-2" title={item.validationStatus || 'Auto-Extracted'}>
                               {getValidationIcon(item.validationStatus)}
                           </td>
                           <td className="px-4 py-2 font-medium text-gray-700">
                               {item.description}
                               {item.rowId && <div className="text-[9px] text-gray-400 font-mono">{item.rowId}</div>}
                           </td>
                           <td className="px-4 py-2 text-right font-mono">
                               {item.amount.toLocaleString()}
                           </td>
                           {source.type === 'EXCEL_SHEET' && (
                               <td className="px-4 py-2 text-right text-xs text-gray-400 font-mono">
                                   #{item.sourceRowIndex}
                               </td>
                           )}
                        </tr>
                     ))}
                  </tbody>
               </table>
               {data.financials.items.length > 5 && (
                  <button 
                    onClick={() => setIsListExpanded(!isListExpanded)}
                    className="w-full text-center py-2 text-xs font-medium border-t hover:bg-gray-50 text-gray-500"
                  >
                     {isListExpanded ? "Inklappen" : `Toon alle ${data.financials.items.length} regels`}
                  </button>
               )}
             </div>
          </div>

          {/* Right: Technical Meta */}
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Technische Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                          <p className="text-gray-500 text-xs">Contracttaal</p>
                          <p className="font-medium">{data.language}</p>
                      </div>
                      <div>
                          <p className="text-gray-500 text-xs">Valuta Gedetecteerd</p>
                          <p className="font-medium">{data.currency}</p>
                      </div>
                      <div>
                          <p className="text-gray-500 text-xs">Startdatum</p>
                          <p className="font-mono text-xs bg-gray-50 p-1 rounded">{data.dates.startDate || 'N.v.t.'}</p>
                      </div>
                  </div>
              </div>

              {/* JSON Toggle */}
              <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-700">
                  <button 
                     onClick={() => setIsRawOpen(!isRawOpen)}
                     className="w-full bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center text-gray-300 font-mono text-sm hover:bg-gray-750"
                  >
                      <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Ruwe JSON Data</span>
                      {isRawOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {isRawOpen && (
                    <div className="p-4 overflow-auto max-h-[300px]">
                        <pre className="text-xs text-green-400 font-mono leading-relaxed">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default SourceTab;