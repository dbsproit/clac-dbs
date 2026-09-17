"use client";
import { useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Card, Stat } from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { computeEstimate, computeExtraServices } from "@/lib/pricing";
import { usd, num, pct } from "@/lib/format";
import { useHydrated } from "@/lib/useHydrated";

const MODULES = [
  {
    href: "/calculator",
    title: "Budget Calculator",
    desc: "Price recurring janitorial contracts from square footage, frequency, and real production rates.",
    icon: "▤",
  },
  {
    href: "/extra-services",
    title: "Extra Services",
    desc: "Quote add-on jobs — window cleaning, power washing, floor care — with a cost buildup and a market check.",
    icon: "✦",
  },
  {
    href: "/scope-of-work",
    title: "Scope of Work",
    desc: "Build a clean, itemized scope by area and frequency your client can sign off on.",
    icon: "☑",
  },
  {
    href: "/bid",
    title: "BID / Proposal",
    desc: "Turn the numbers and scope into a print-ready proposal for property managers.",
    icon: "◈",
  },
];

export default function Dashboard() {
  const hydrated = useHydrated();
  const { estimate, extraLines, settings, areaTypes, loadAreaTypes } = useApp();

  useEffect(() => {
    fetch("/api/area-types")
      .then((res) => res.json())
      .then(loadAreaTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const est = hydrated && areaTypes.length > 0 ? computeEstimate(estimate, settings, areaTypes) : null;
  const extra = hydrated ? computeExtraServices(extraLines, settings) : null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="DBS Building Services — pricing, proposals & scope in one place"
      />
      <div className="space-y-6 p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat
            label="Recurring monthly bid"
            value={est ? usd(est.monthlyPrice, 0) : "—"}
            sub={est ? `${usd(est.annualPrice, 0)} / year` : ""}
            accent
          />
          <Stat
            label="Cleanable area"
            value={est ? `${num(est.totalSqft)} sqft` : "—"}
            sub={est ? `${estimate.frequencyPerWeek}× per week` : ""}
          />
          <Stat
            label="Labor hours / visit"
            value={est ? num(est.laborHoursPerVisit, 1) : "—"}
            sub={est ? `${num(est.laborHoursPerMonth, 0)} hrs / month` : ""}
          />
          <Stat
            label="Extra services quoted"
            value={extra ? usd(extra.totalRecommendedPrice, 0) : "—"}
            sub={extra ? `${extraLines.length} line(s)` : ""}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href}>
              <div className="group flex h-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xl text-brand-600">
                  {m.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-brand-700">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{m.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {est && (
          <Card title="Current recurring estimate at a glance">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Price / sq ft / month" value={usd(est.pricePerSqFtMonth, 3)} />
              <Stat label="Price per visit" value={usd(est.pricePerVisit, 2)} />
              <Stat
                label="Target margin"
                value={pct(settings.targetMarginPct)}
                sub={`${usd(est.profit, 0)} monthly profit`}
              />
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
