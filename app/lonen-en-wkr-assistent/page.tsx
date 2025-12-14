
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  Upload, 
  Calendar, 
  Download, 
  Plus, 
  Key,
  Menu,
  FileSpreadsheet,
  Printer,
  FileText,
  ChevronDown,
  Loader2,
  CircleHelp,
  Users,
  Wallet,
  TrendingUp,
  Scale,
  CloudLightning,
  BookText,
  ScrollText
} from 'lucide-react';
import { DEFAULT_SETTINGS, MOCK_EXPENSES, MOCK_EMPLOYEES, MOCK_SALARY_SCALES, MOCK_PAYSLIPS, MOCK_BANK_TRANSACTIONS, MOCK_JOURNAL_ENTRIES, MOCK_WAGE_STATEMENT_DATA, THEMES, WoodpeckerLogo } from './constants';
import { AppSettings, Expense, Employee, SalaryScaleRow, Payslip, BankTransaction, JournalEntry, WageStatementEntry, ThemeName } from './types';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import EmployeeList from './components/EmployeeList';
import SalaryScalesList from './components/SalaryScalesList';
import NetSalaryCheck from './components/NetSalaryCheck';
import JournalEntryList from './components/JournalEntryList';
import WageStatementList from './components/WageStatementList';
import PayslipViewer from './components/PayslipViewer';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import FileDropZone from './components/FileDropZone';
import GlobalSearch, { GlobalSearchResult } from './components/GlobalSearch';
import { calculateWKR } from './services/wkrService';
import { analyzeExpenses } from './services/geminiService';

const LonenEnWkrAssistentPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [expenses, setExpenses] = useState<Expense[]>([...MOCK_EXPENSES]);
  const [employees, setEmployees] = useState<Employee[]>([...MOCK_EMPLOYEES]);
  const [salaryScales, setSalaryScales] = useState<SalaryScaleRow[]>([...MOCK_SALARY_SCALES]);
  
  // New State for Audit
  const [payslips, setPayslips] = useState<Payslip[]>(MOCK_PAYSLIPS);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(MOCK_BANK_TRANSACTIONS);
  
  // New State for Journals
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(MOCK_JOURNAL_ENTRIES);

  // New State for Wage Statement
  const [wageStatementEntries, setWageStatementEntries] = useState<WageStatementEntry[]>([...MOCK_WAGE_STATEMENT_DATA]);

  // Set 'journal' as default active tab
  const [activeTab, setActiveTab] = useState<'wagestatement' | 'payslips' | 'wkr' | 'lonen' | 'scales' | 'audit' | 'journal'>('journal');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSmartUploadOpen, setIsSmartUploadOpen] = useState(false);

  // Global Search State
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const [dateRange, setDateRange] = useState('YTD');
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  
  // Create a separate state for user inputting API key if not in env
  const [showApiKeyInput, setShowApiKeyInput] = useState(!process.env.API_KEY);

  const currentTheme = THEMES[settings.theme];

  const stats = useMemo(() => calculateWKR(settings.totalWageBill, expenses), [settings.totalWageBill, expenses]);

  // Global Search Logic
  const globalSearchResults = useMemo<GlobalSearchResult[]>(() => {
    if (!globalSearchTerm || globalSearchTerm.length < 2) return [];

    const term = globalSearchTerm.toLowerCase();
    const results: GlobalSearchResult[] = [];

    // Search Expenses
    expenses.forEach(e => {
      if (e.description.toLowerCase().includes(term) || e.amount.toString().includes(term) || e.category.toLowerCase().includes(term)) {
        results.push({
          id: e.id,
          type: 'expense',
          title: e.description,
          subtitle: `${e.date} • ${e.category}`,
          amount: e.amount,
          sourceTab: 'wkr'
        });
      }
    });

    // Search Employees
    employees.forEach(e => {
      if (e.name.toLowerCase().includes(term) || e.ref.toLowerCase().includes(term) || e.jobDescription.toLowerCase().includes(term)) {
        results.push({
          id: e.id,
          type: 'employee',
          title: e.name,
          subtitle: `${e.ref} • ${e.jobDescription}`,
          sourceTab: 'lonen'
        });
      }
    });

    // Search Wage Statement
    wageStatementEntries.forEach(e => {
      if (e.employeeName.toLowerCase().includes(term) || e.employeeRef.toLowerCase().includes(term)) {
        results.push({
          id: e.id,
          type: 'wagestatement',
          title: e.employeeName,
          subtitle: `Ref: ${e.employeeRef}`,
          amount: e.col17_uitbetaald,
          sourceTab: 'wagestatement'
        });
      }
    });

    // Search Journals
    journalEntries.forEach(e => {
      if (e.accountName.toLowerCase().includes(term) || e.accountNumber.toString().includes(term)) {
        results.push({
          id: e.id,
          type: 'journal',
          title: `${e.accountNumber} - ${e.accountName}`,
          subtitle: `Periode: ${e.period}`,
          amount: e.periodDebet || e.periodCredit,
          sourceTab: 'journal'
        });
      }
    });
    
    // Search Payslips
    payslips.forEach(e => {
      if (e.employeeName.toLowerCase().includes(term) || e.employeeRef.toLowerCase().includes(term)) {
        results.push({
          id: e.id,
          type: 'payslip',
          title: `Loonstrook: ${e.employeeName}`,
          subtitle: `Periode: ${e.period}`,
          amount: e.netAmount,
          sourceTab: 'payslips'
        });
      }
    });

    return results;
  }, [globalSearchTerm, expenses, employees, wageStatementEntries, journalEntries, payslips]);

  const handleGlobalSearchSelect = (result: GlobalSearchResult) => {
    setActiveTab(result.sourceTab as any);
    setGlobalSearchTerm(''); // Clear search on selection? Or keep it? Clearing is usually cleaner.
  };

  const handleUpdateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Weet u zeker dat u deze boeking wilt verwijderen?")) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAddExpense = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: 'Nieuwe uitgave',
      amount: 0,
      category: 'Vrije ruimte',
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleRunAI = async () => {
    if (!apiKey) {
      alert("API Key is required via environment variable or input.");
      return;
    }
    setIsAnalyzing(true);
    const updated = await analyzeExpenses(expenses, apiKey);
    setExpenses(updated);
    setIsAnalyzing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newMock: Expense = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `Geïmporteerd bestand: ${e.target.files[0].name}`,
        amount: 1500,
        category: 'Onbekend',
      };
      setExpenses(prev => [newMock, ...prev]);
    }
  };

  const handleWageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        const newEmployee: Employee = {
            id: Date.now().toString(),
            ref: `EMP${Math.floor(Math.random() * 1000)}`,
            name: 'Nieuwe Medewerker (Import)',
            contractInfo: '40u / 100%',
            startDate: new Date().toISOString().split('T')[0],
            yearsService: 0,
            currentHourlyWage: 20.00,
            jobDescription: 'Onbekend',
            startHourlyWage: 20.00
        };
        setEmployees(prev => [newEmployee, ...prev]);
     }
  };

  const handleScaleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        alert("Bestand ontvangen. In een productie-omgeving zou dit Excel bestand nu worden verwerkt naar schalen.");
    }
  };

  const handleSmartDrop = (files: FileList) => {
    setIsSmartUploadOpen(false);
    let fileCount = files.length;
    setTimeout(() => {
        setExpenses(MOCK_EXPENSES as any);
        setEmployees(MOCK_EMPLOYEES);
        setSalaryScales(MOCK_SALARY_SCALES);
        setPayslips(MOCK_PAYSLIPS);
        setBankTransactions(MOCK_BANK_TRANSACTIONS);
        setJournalEntries(MOCK_JOURNAL_ENTRIES);
        setWageStatementEntries(MOCK_WAGE_STATEMENT_DATA);
        
        alert(`Batch Upload Voltooid: ${fileCount} bestanden verwerkt.\n\n- Loonstaat: Geladen\n- WKR Data: Geladen\n- Lonen: Geladen\n- Bank: Geladen\n- Schalen: Geladen\n- Journaalposten: Geladen`);
    }, 800);
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isSmartUploadOpen) {
      setIsSmartUploadOpen(true);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = ['Datum', 'Omschrijving', 'Bedrag', 'Categorie', 'AI Opmerking', 'Gebruiker Opmerking'];
    const rows = expenses.map(e => [
        e.date,
        `"${e.description.replace(/"/g, '""')}"`,
        e.amount.toString().replace('.', ','),
        `"${e.category}"`,
        `"${e.aiComment || ''}"`,
        `"${e.userComment || ''}"`
    ]);

    const csvContent = [
        headers.join(';'),
        ...rows.map(r => r.join(';'))
    ].join('\n');

    downloadCSV(csvContent, `wkr-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    setIsGeneratingPDF(true);
    
    // @ts-ignore
    if (window.html2pdf) {
        const element = document.getElementById('report-content');
        const opt = {
          margin: 10,
          filename: `wkr-analyse-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
            setIsGeneratingPDF(false);
        }).catch((err: any) => {
            console.error("PDF generation error:", err);
            setIsGeneratingPDF(false);
            window.print();
        });
    } else {
        window.print();
        setIsGeneratingPDF(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Datum', 'Omschrijving', 'Bedrag', 'Categorie'];
    const exampleRow = ['2024-01-01', 'Voorbeeld kosten', '100,00', 'Vrije ruimte'];
    
    const csvContent = [
        headers.join(';'),
        exampleRow.join(';')
    ].join('\n');

    downloadCSV(csvContent, 'wkr-upload-template.csv');
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300" 
      style={{ backgroundColor: '#F7F7F7' }}
      onDragOver={handleGlobalDragOver} // Global drag listener
    >
      
      {/* Top Navigation - Not included in PDF ID */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
             {/* Logo - Subtle placement */}
             <div className="w-8 h-8 opacity-80 hidden md:block">
                <WoodpeckerLogo />
             </div>
             <h1 className="text-xl font-semibold tracking-tight hidden sm:block" style={{ color: currentTheme.text }}>
                {settings.appName}
             </h1>
          </div>

          {/* Universal Search Bar - Centered */}
          <div className="flex-1 max-w-xl mx-auto">
             <GlobalSearch 
                searchTerm={globalSearchTerm}
                onSearchChange={setGlobalSearchTerm}
                results={globalSearchResults}
                onSelectResult={handleGlobalSearchSelect}
                colors={currentTheme}
             />
          </div>

          <div className="flex items-center gap-2 shrink-0">
             {/* Smart Upload Button (Compact) */}
             <button 
                onClick={() => setIsSmartUploadOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                title="Bestanden uploaden"
             >
                <CloudLightning size={14} />
                Upload
             </button>

            <button 
                onClick={() => setIsHelpOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Handleiding"
            >
                <CircleHelp size={20} />
            </button>

            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Instellingen"
            >
                <SettingsIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Wrap content to be printed/exported in ID */}
        <div id="report-content">
            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 no-print overflow-x-auto">
                 <button
                    onClick={() => setActiveTab('journal')}
                    className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'journal' 
                        ? 'text-gray-900 border-current' 
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                    style={{ borderColor: activeTab === 'journal' ? currentTheme.primary : undefined }}
                >
                    <BookText size={18} />
                    Journaalposten
                </button>
                 <button
                    onClick={() => setActiveTab('wagestatement')}
                    className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'wagestatement' 
                        ? 'text-gray-900 border-current' 
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                    style={{ borderColor: activeTab === 'wagestatement' ? currentTheme.primary : undefined }}
                >
                    <ScrollText size={18} />
                    Verzamelloonstaat
                </button>
                <button
                    onClick={() => setActiveTab('payslips')}
                    className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'payslips' 
                        ? 'text-gray-900 border-current' 
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                    style={{ borderColor: activeTab === 'payslips' ? currentTheme.primary : undefined }}
                >
                    <FileText size={18} />
                    Loonstroken
                </button>
                <button
                    onClick={() => setActiveTab('lonen')}
                    className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'lonen' 
                        ? 'text-gray-900 border-current' 
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                    style={{ borderColor: activeTab === 'lonen' ? currentTheme.primary : undefined }}
                >
                    <Users size={18} />
                    Lonen & Personeel
                </button>
                <button
                    onClick={() => setActiveTab('scales')}
                    className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'scales' 
                        ? 'text-gray-900 border-current' 
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                    style={{ borderColor: activeTab === 'scales' ? currentTheme.primary : undefined }}
                >
                    <TrendingUp size={18} />
                    Salarisschalen
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'audit' 
                        ? 'text-gray-900 border-current' 
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                    style={{ borderColor: activeTab === 'audit' ? currentTheme.primary : undefined }}
                >
                    <Scale size={18} />
                    Salarisvergelijking
                </button>
                <button
                    onClick={() => setActiveTab('wkr')}
                    className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'wkr' 
                        ? 'text-gray-900 border-current' 
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                    style={{ borderColor: activeTab === 'wkr' ? currentTheme.primary : undefined }}
                >
                    <Wallet size={18} />
                    WKR Analyse
                </button>
            </div>

            {activeTab === 'journal' && (
                <div className="animate-fade-in">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>Journaalposten</h2>
                        <p className="text-gray-500 text-sm">Upload PDF of Excel journaalposten en analyseer per periode.</p>
                    </div>

                    <JournalEntryList 
                        entries={journalEntries}
                        colors={currentTheme}
                    />
                </div>
            )}

             {activeTab === 'wagestatement' && (
                <div className="animate-fade-in">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>Verzamelloonstaat</h2>
                        <p className="text-gray-500 text-sm">Gedetailleerd overzicht per medewerker en controle op uitbetaalde bedragen.</p>
                    </div>

                    <WageStatementList 
                        entries={wageStatementEntries}
                        colors={currentTheme}
                    />
                </div>
            )}
            
            {activeTab === 'payslips' && (
                <div className="animate-fade-in">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>Loonstroken</h2>
                        <p className="text-gray-500 text-sm">Digitale weergave van de maandelijkse loonstroken per medewerker.</p>
                    </div>

                    <PayslipViewer 
                        payslips={payslips}
                        colors={currentTheme}
                    />
                </div>
            )}

            {activeTab === 'lonen' && (
                <div className="animate-fade-in">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>Lonen & Personeel</h2>
                        <p className="text-gray-500 text-sm">Beheer personeelsgegevens en loonstroken voor nauwkeurige loonsomberekeningen.</p>
                    </div>
                    
                    <EmployeeList 
                        employees={employees}
                        payslips={payslips}
                        colors={currentTheme}
                        onUpload={handleWageFileUpload}
                        currencyInThousands={settings.currencyInThousands}
                    />
                </div>
            )}

            {activeTab === 'scales' && (
                <div className="animate-fade-in">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>Salarisschalen</h2>
                        <p className="text-gray-500 text-sm">Overzicht van de actuele loonschalen en treden voor loonberekeningen.</p>
                    </div>
                    
                    <SalaryScalesList 
                        scales={salaryScales}
                        colors={currentTheme}
                        onUpload={handleScaleFileUpload}
                    />
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="animate-fade-in">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>Salarisvergelijking</h2>
                        <p className="text-gray-500 text-sm">Vergelijk automatisch netto loonstroken met daadwerkelijke bankbetalingen.</p>
                    </div>

                    <NetSalaryCheck 
                        payslips={payslips} 
                        transactions={bankTransactions}
                        colors={currentTheme}
                    />
                </div>
            )}
            
            {activeTab === 'wkr' && (
                <>
                    {/* Welcome / Controls */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>Analyse Overzicht</h2>
                            <p className="text-gray-500 text-sm">Beheer uw vrije ruimte en categoriseer uitgaven efficiënt.</p>
                        </div>
                        
                        {/* Add data-html2canvas-ignore to hide controls in PDF */}
                        <div className="flex flex-wrap gap-3 no-print" data-html2canvas-ignore="true">
                            {settings.showDemo && (
                                <button 
                                    onClick={() => { setExpenses(MOCK_EXPENSES); }}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all"
                                >
                                    Demo Laden
                                </button>
                            )}
                            
                            {settings.showUploadTemplate && (
                                <>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
                                    >
                                        <FileSpreadsheet size={16} />
                                        Template
                                    </button>
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2">
                                        <Upload size={16} />
                                        Importeer Data
                                        <input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileUpload} />
                                    </label>
                                </>
                            )}

                            <button 
                                onClick={handleAddExpense}
                                className="px-4 py-2 text-white rounded-lg text-sm font-medium shadow-md transition-all flex items-center gap-2 hover:opacity-90"
                                style={{ backgroundColor: currentTheme.primary }}
                            >
                                <Plus size={16} />
                                Nieuwe Boeking
                            </button>
                            
                            {settings.showExportButtons && (
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        Export
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isExportMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20">
                                                <button 
                                                    onClick={() => { handleExportCSV(); setIsExportMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <FileSpreadsheet size={16} />
                                                    Exporteer CSV
                                                </button>
                                                <button 
                                                    onClick={() => { handleExportPDF(); setIsExportMenuOpen(false); }}
                                                    disabled={isGeneratingPDF}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                                    {isGeneratingPDF ? 'Genereren...' : 'Download PDF Rapport'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dashboard Cards */}
                    <Dashboard stats={stats} colors={currentTheme} currencyInThousands={settings.currencyInThousands} />

                    {/* Expense Table */}
                    <ExpenseList 
                        expenses={expenses} 
                        colors={currentTheme} 
                        settings={settings}
                        onUpdateExpense={handleUpdateExpense}
                        onDeleteExpense={handleDeleteExpense}
                        onRunAI={handleRunAI}
                        isAnalyzing={isAnalyzing}
                    />
                </>
            )}

        </div>

        {/* Smart Upload Overlay */}
        {isSmartUploadOpen && (
            <FileDropZone 
                colors={currentTheme}
                onClose={() => setIsSmartUploadOpen(false)}
                onFilesDropped={handleSmartDrop}
            />
        )}

        {/* Temporary API Key Input (if not env) - Hidden in prod usually */}
        {showApiKeyInput && (
            <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-xl border border-yellow-200 z-50 max-w-sm no-print" data-html2canvas-ignore="true">
                <p className="text-xs font-bold text-gray-500 mb-2">DEV: API KEY NEEDED</p>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        placeholder="Paste Gemini API Key" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="flex-1 border p-1 rounded text-sm"
                    />
                    <button 
                        onClick={() => setShowApiKeyInput(false)}
                        className="bg-gray-800 text-white px-3 py-1 rounded text-xs"
                    >
                        Save
                    </button>
                </div>
            </div>
        )}

      </main>

      {/* Modals */}
      <div className="no-print" data-html2canvas-ignore="true">
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            settings={settings} 
            onUpdateSettings={setSettings}
            primaryColor={currentTheme.primary}
        />
        
        <HelpModal 
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
            appName={settings.appName}
        />
      </div>

    </div>
  );
};

export default LonenEnWkrAssistentPage;
