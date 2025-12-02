"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

export default function HomeButton() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <Link
      href="/"
      className="fixed bottom-4 right-4 z-50 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center group"
      aria-label="Go to Home"
    >
      <Home className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
        Home
      </span>
    </Link>
  );
}
