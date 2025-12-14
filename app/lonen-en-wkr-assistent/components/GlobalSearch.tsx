
import React, { useRef, useEffect } from 'react';
import { Search, ChevronRight, CreditCard, Users, BookText, ScrollText, TrendingUp, Scale } from 'lucide-react';
import { ThemeColors } from '../types';
import { formatCurrency } from '../services/wkrService';

export interface GlobalSearchResult {
  id: string;
  type: 'expense' | 'employee' | 'journal' | 'wagestatement' | 'payslip';
  title: string;
  subtitle: string;
  amount?: number;
  sourceTab: string;
}

interface GlobalSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  results: GlobalSearchResult[];
  onSelectResult: (result: GlobalSearchResult) => void;
  colors: ThemeColors;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  searchTerm, 
  onSearchChange, 
  results, 
  onSelectResult,
  colors 
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'expense': return <CreditCard size={16} className="text-blue-500" />;
      case 'employee': return <Users size={16} className="text-green-500" />;
      case 'journal': return <BookText size={16} className="text-purple-500" />;
      case 'wagestatement': return <ScrollText size={16} className="text-orange-500" />;
      case 'payslip': return <Scale size={16} className="text-teal-500" />;
      default: return <Search size={16} />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'expense': return 'WKR Boeking';
      case 'employee': return 'Medewerker';
      case 'journal': return 'Journaalpost';
      case 'wagestatement': return 'Loonstaat';
      case 'payslip': return 'Loonstrook';
      default: return 'Resultaat';
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, GlobalSearchResult[]>);

  return (
    <div className="relative w-full max-w-xl mx-auto z-50" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:border-transparent sm:text-sm transition-all shadow-sm"
          style={{ '--tw-ring-color': colors.primary } as any}
          placeholder="Zoek in alles (boekingen, medewerkers, journaal...)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => searchTerm.length > 0 && setIsOpen(true)}
        />
        {searchTerm && (
            <button 
                onClick={() => { onSearchChange(''); setIsOpen(false); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
                <span className="text-xs font-bold">ESC</span>
            </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto animate-fade-in">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Geen resultaten gevonden voor "{searchTerm}"
            </div>
          ) : (
            <div className="py-2">
              {Object.keys(groupedResults).map((type) => (
                <div key={type} className="mb-2 last:mb-0">
                  <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 flex items-center gap-2">
                    {getIcon(type)}
                    {getLabel(type)}
                  </div>
                  {groupedResults[type].map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        onSelectResult(result);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group border-b border-gray-50 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                            {result.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                            {result.subtitle}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.amount !== undefined && (
                             <span className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded group-hover:bg-white">
                                {formatCurrency(result.amount, false)}
                             </span>
                        )}
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 border-t border-gray-100 flex justify-between">
            <span>{results.length} resultaten</span>
            <span>Selecteer om naar tabblad te gaan</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
