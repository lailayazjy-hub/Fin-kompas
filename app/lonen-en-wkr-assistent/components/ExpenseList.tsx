import React, { useState } from 'react';
import { Expense, ThemeColors, WKRCategory } from '../types';
import { formatCurrency } from '../services/wkrService';
import { Search, Filter, MessageSquare, AlertTriangle, Wand2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  colors: ThemeColors;
  settings: any;
  onUpdateExpense: (id: string, updates: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  onRunAI: () => void;
  isAnalyzing: boolean;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, 
  colors, 
  settings, 
  onUpdateExpense,
  onDeleteExpense,
  onRunAI,
  isAnalyzing
}) => {
  const [hideSmallAmounts, setHideSmallAmounts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExpenses = expenses.filter(exp => {
    if (hideSmallAmounts && exp.amount < 50) return false;
    if (searchTerm && !exp.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getCategoryColor = (cat: WKRCategory) => {
    switch(cat) {
      case 'Vrije ruimte': return colors.primary; // Often the default focus
      case 'Gerichte vrijstelling': return colors.lowRisk;
      case 'Nihilwaardering': return colors.mediumRisk;
      case 'Intermediaire kosten': return '#9CA3AF'; // Grey
      default: return '#E5E7EB';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <h3 className="font-semibold text-lg" style={{ color: colors.text }}>Boekingen</h3>
        
        <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Zoeken..." 
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ '--tw-ring-color': colors.primary } as any}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Klein Grut Filter */}
            <button 
                onClick={() => setHideSmallAmounts(!hideSmallAmounts)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${hideSmallAmounts ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'}`}
            >
                <Filter size={16} />
                <span>Verberg &lt; €50</span>
            </button>

            {/* AI Action */}
            {settings.showAIAnalysis && (
                <button 
                    onClick={onRunAI}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: colors.primary }}
                >
                    <Wand2 size={16} className={isAnalyzing ? "animate-spin" : ""} />
                    {isAnalyzing ? "Analyseren..." : "AI Analyse Starten"}
                </button>
            )}
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                    <th className="p-4">Datum</th>
                    <th className="p-4">Omschrijving</th>
                    <th className="p-4 text-right">Bedrag</th>
                    <th className="p-4">Categorie</th>
                    {settings.showComments && <th className="p-4">Info</th>}
                    <th className="p-4 no-print"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {filteredExpenses.map((expense) => (
                    <React.Fragment key={expense.id}>
                        <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="p-4 text-gray-600 whitespace-nowrap">{expense.date}</td>
                            <td className="p-4 font-medium text-gray-800">{expense.description}</td>
                            <td className="p-4 text-right font-mono text-gray-700">
                                {formatCurrency(expense.amount, settings.currencyInThousands)}
                            </td>
                            <td className="p-4">
                                <span 
                                    className="px-2 py-1 rounded text-xs font-medium border"
                                    style={{ 
                                        borderColor: getCategoryColor(expense.category),
                                        color: getCategoryColor(expense.category),
                                        backgroundColor: getCategoryColor(expense.category) + '15' // 10% opacity hex
                                    }}
                                >
                                    {expense.category}
                                </span>
                            </td>
                            {settings.showComments && (
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        {expense.aiComment && (
                                            <div className="relative group/tooltip">
                                                <Wand2 size={16} className="text-purple-500 cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10">
                                                    AI: {expense.aiComment}
                                                </div>
                                            </div>
                                        )}
                                        {expense.isHighRisk && (
                                             <AlertTriangle size={16} style={{ color: colors.highRisk }} />
                                        )}
                                    </div>
                                </td>
                            )}
                            <td className="p-4 text-right no-print">
                                <button 
                                    onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                                    className="p-1 rounded hover:bg-gray-200 text-gray-500"
                                >
                                    {expandedId === expense.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </td>
                        </tr>
                        {/* Collapsible Detail Row */}
                        {expandedId === expense.id && (
                            <tr className="bg-gray-50 no-print">
                                <td colSpan={6} className="p-4">
                                    <div className="space-y-4">
                                        {/* Edit Details Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-3">
                                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Datum</label>
                                                 <input 
                                                    type="date" 
                                                    className="w-full p-2 border rounded bg-white text-sm"
                                                    value={expense.date}
                                                    onChange={(e) => onUpdateExpense(expense.id, { date: e.target.value })}
                                                 />
                                            </div>
                                            <div className="md:col-span-6">
                                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Omschrijving</label>
                                                 <input 
                                                    type="text" 
                                                    className="w-full p-2 border rounded bg-white text-sm"
                                                    value={expense.description}
                                                    onChange={(e) => onUpdateExpense(expense.id, { description: e.target.value })}
                                                 />
                                            </div>
                                            <div className="md:col-span-3">
                                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bedrag (€)</label>
                                                 <input 
                                                    type="number" 
                                                    className="w-full p-2 border rounded bg-white text-sm"
                                                    value={expense.amount}
                                                    onChange={(e) => onUpdateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                                                 />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categorie</label>
                                                <select 
                                                    className="w-full p-2 border rounded bg-white text-sm"
                                                    value={expense.category}
                                                    onChange={(e) => onUpdateExpense(expense.id, { category: e.target.value as WKRCategory })}
                                                >
                                                    <option value="Vrije ruimte">Vrije ruimte</option>
                                                    <option value="Gerichte vrijstelling">Gerichte vrijstelling</option>
                                                    <option value="Nihilwaardering">Nihilwaardering</option>
                                                    <option value="Intermediaire kosten">Intermediaire kosten</option>
                                                </select>
                                            </div>
                                            {settings.showComments && (
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manager Opmerking</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            className="flex-1 p-2 border rounded bg-white text-sm"
                                                            placeholder="Voeg opmerking toe..."
                                                            value={expense.userComment || ''}
                                                            onChange={(e) => onUpdateExpense(expense.id, { userComment: e.target.value })}
                                                        />
                                                        {settings.showUserNames && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                                                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">M</div>
                                                                <span>Jij</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {settings.showAIAnalysis && expense.aiComment && (
                                            <div className="p-2 bg-purple-50 border border-purple-100 rounded text-sm text-purple-800 flex items-start gap-2">
                                                <Wand2 size={16} className="mt-0.5 shrink-0" />
                                                <p>{expense.aiComment}</p>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={() => onDeleteExpense(expense.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                Verwijderen
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
        {filteredExpenses.length === 0 && (
            <div className="p-8 text-center text-gray-400">
                Geen boekingen gevonden.
            </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;