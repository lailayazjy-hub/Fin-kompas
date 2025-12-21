"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export default function AuthButton() {
  const { data: session } = useSession();

  return (
    <button
      onClick={() => (session ? signOut() : signIn())}
      className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center group"
      aria-label={session ? "Sign Out" : "Sign In"}
    >
      {session ? <LogOut className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
        {session ? "Sign Out" : "Sign In"}
      </span>
    </button>
  );
}
