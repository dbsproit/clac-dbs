"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◧" },
  { href: "/proposals", label: "Proposals", icon: "▤" },
  { href: "/calculator", label: "Budget Calculator", icon: "▤" },
  { href: "/extra-services", label: "Extra Services", icon: "✦" },
  { href: "/scope-of-work", label: "Scope of Work", icon: "☑" },
  { href: "/bid", label: "BID / Proposal", icon: "◈" },
  { href: "/rates", label: "Rates", icon: "⚙" },
  { href: "/settings", label: "Settings", icon: "▣" },
  { href: "/admin", label: "Admin", icon: "⚒" },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { data: session } = useSession();
  return (
    <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
          DBS
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-800">
            Building Services
          </div>
          <div className="text-xs text-slate-400">Pricing Suite</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="w-4 text-center text-slate-400">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-4 text-xs text-slate-400">
        <div className="truncate font-medium text-slate-500">
          {session?.user?.name || session?.user?.email || "dbspro.com"}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <Link
            href="/account"
            onClick={onNavigate}
            className="text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            My Account
          </Link>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
