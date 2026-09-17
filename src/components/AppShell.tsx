"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// Every page is a sibling under Dashboard except a couple of true sub-pages —
// those get an explicit parent so "Back" always lands somewhere sensible,
// regardless of how the user actually arrived (deep link, refresh, or nav).
const PARENT: Record<string, { href: string; label: string }> = {
  "/admin/market-pricing": { href: "/admin", label: "Admin" },
};

function getParent(pathname: string) {
  if (PARENT[pathname]) return PARENT[pathname];
  if (pathname !== "/") return { href: "/", label: "Dashboard" };
  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const parent = getParent(pathname);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <header className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        {parent ? (
          <Link
            href={parent.href}
            className="-ml-1.5 flex items-center gap-1 rounded-lg py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              DBS
            </div>
            <span className="text-sm font-bold text-slate-800">Pricing Suite</span>
          </div>
        )}
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
