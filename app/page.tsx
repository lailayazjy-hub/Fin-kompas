import Link from "next/link";
import { BarChart3, ArrowRight, Plus, PieChart, TrendingUp, Wallet, ArrowRightLeft, Percent, ShieldAlert, Goal, Activity, ShieldCheck, CalendarRange, Sliders, Users, FileText } from "lucide-react";

const apps = [
  {
    title: "FinAnalysis Pro",
    description: "Advanced financial analysis and reporting tools powered by AI.",
    href: "/finanalysis-pro",
    icon: BarChart3,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "RevenuePulse AI",
    description: "Recurring revenue KPI tracker with automated Gemini AI insights.",
    href: "/revenue-pulse-ai",
    icon: TrendingUp,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    title: "Financiële Ratio Analyser",
    description: "Geautomatiseerde berekening en AI-interpretatie van financiële ratio's.",
    href: "/financiele-ratio-analyser",
    icon: PieChart,
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    title: "Reeks Analyse",
    description: "Intelligent transaction matching and reconciliation with AI-powered analysis.",
    href: "/reeks-analyse",
    icon: ArrowRightLeft,
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    title: "Budget Shifter",
    description: "Smart budgeting tools to help you manage expenses and savings goals.",
    href: "/budget-shifter",
    icon: Wallet,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "BTW Dashboard Pro",
    description: "Comprehensive VAT analysis, reporting, and tax form preparation.",
    href: "/btw-dashboard-pro",
    icon: Percent,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    title: "DebiteurenBeheer AI",
    description: "AI-driven debtor management, credit risk analysis, and automated advice.",
    href: "/debiteurenbeheer-ai",
    icon: ShieldAlert,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    title: "FinVisualisatie Doelen & KPIs",
    description: "Visualiseer financiële doelen en KPI's met interactieve rapportages en analyses.",
    href: "/finvisualisatie-doelen-and-kpis",
    icon: Goal,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "FinVisualisatie & Controle",
    description: "Comprehensive financial visualization, control checks, and AI analysis.",
    href: "/finvisualisatie-en-controle",
    icon: ShieldCheck,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Kosten Trendanalyse",
    description: "Analyze cost trends, detect anomalies, and get AI-powered insights.",
    href: "/kosten-trendanalyse",
    icon: TrendingUp,
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Transitoria Dashboard",
    description: "Manage prepaid costs, accrued revenue, and period allocations with AI.",
    href: "/transitoria-dashboard",
    icon: CalendarRange,
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    title: "Project Marge Dashboard",
    description: "Analyze project margins, simulate scenarios, and get AI insights.",
    href: "/project-marge",
    icon: Sliders,
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    title: "Business Macro Tracker",
    description: "Track daily business activities, macro balance, and time budget.",
    href: "/business-macro-tracker",
    icon: Activity,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Lonen & WKR Assistent",
    description: "Manage payroll, WKR analysis, and employee data with AI assistance.",
    href: "/lonen-en-wkr-assistent",
    icon: Users,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: "Loonstrook Analyser",
    description: "Analyze payslips, calculate full-time scenarios, and get AI insights.",
    href: "/loonstrook-analyser",
    icon: FileText,
    color: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
  },
  {
    title: "Universal Contract Extractor Pro",
    description: "Extract and analyze data from contracts and Excel files using AI.",
    href: "/universal-contract-extractor-pro",
    icon: FileText,
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  // Placeholders to show the grid layout
  {
    title: "New Application",
    description: "More financial tools are currently under development.",
    href: "#",
    icon: Plus,
    color: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-500",
    disabled: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-20 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Financial Compass
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Your central hub for financial intelligence and analysis tools. 
            Access all your applications from one unified dashboard.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apps.map((app, index) => (
            <Link
              key={index}
              href={app.href}
              className={`group relative flex flex-col p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300 ${
                app.disabled ? "opacity-60 cursor-not-allowed pointer-events-none grayscale-[0.5]" : "hover:-translate-y-1"
              }`}
            >
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 ${app.color} transition-transform group-hover:scale-110 duration-300`}>
                <app.icon className="h-7 w-7" />
              </div>
              
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                {app.title}
              </h2>
              
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 grow leading-relaxed">
                {app.description}
              </p>
              
              <div className="flex items-center text-sm font-semibold text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors mt-auto">
                {app.disabled ? "Coming Soon" : "Open Application"}
                {!app.disabled && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
