"use client";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { DEFAULT_COST_SETTINGS } from "@/lib/rates";
import { usd, pct } from "@/lib/format";

// Sourced from live web research (August 2026). Reference guide only — the
// numbers that actually drive pricing live in Settings/Admin, not here.
const SOURCES = [
  { n: 1, label: "HouseCall Pro — Commercial Cleaning Price Guide 2026", url: "https://www.housecallpro.com/resources/how-to-price-commercial-cleaning-jobs/" },
  { n: 2, label: "Quality Cleaning Solutions — How Much Do Most Cleaning Services Charge in Utah?", url: "https://utahcleaningsolutions.com/how-much-do-most-cleaning-services-charge/" },
  { n: 3, label: "HomeGuide — Window Cleaning Cost (2026)", url: "https://homeguide.com/costs/window-cleaning-prices" },
  { n: 4, label: "Pine Country Windows — Commercial Window Cleaning Cost", url: "https://www.pinecountrywindows.com/commercial-window-cleaning-cost/" },
  { n: 5, label: "HomeGuide — Commercial Pressure Washing Prices (2026)", url: "https://homeguide.com/costs/commercial-pressure-washing-prices" },
  { n: 6, label: "HouseCall Pro — Pressure Washing Pricing Guide (2026)", url: "https://www.housecallpro.com/resources/how-to-price-pressure-washing-jobs/" },
  { n: 7, label: "HouseCall Pro — Carpet Cleaning Price Guide (2026)", url: "https://www.housecallpro.com/resources/carpet-cleaning-prices/" },
  { n: 8, label: "Newpoint Services — Average Commercial Carpet Cleaning Prices", url: "https://www.newpointservices.com/blog/what-are-average-commercial-carpet-cleaning-prices" },
  { n: 9, label: "HomeGuide — Cost to Strip and Wax Floor (2026)", url: "https://homeguide.com/costs/cost-to-strip-and-wax-floor" },
  { n: 10, label: "Foreman Pro — Cost to Strip and Wax Commercial Floors", url: "https://www.foremanpro.com/cost-to-strip-and-wax-commercial-floors/" },
  { n: 11, label: "ZipRecruiter — Janitorial Services Jobs in Utah (wage data)", url: "https://www.ziprecruiter.com/Jobs/Janitorial-Services/--in-Utah" },
  { n: 12, label: "RemoteLaws — Utah Minimum Wage 2026", url: "https://remotelaws.com/minimum-wage/utah/" },
  { n: 13, label: "LevelCFO — Cleaning Business Labor Cost as % of Revenue (2026 Benchmark)", url: "https://levelcfo.com/blog/cleaning-business-labor-cost-percentage-of-revenue/" },
  { n: 14, label: "Janister Pro — Cleaning Company Profit Margins: Typical Benchmarks", url: "https://janisterpro.com/blog/cleaning-company-profit-margins-typical-benchmarks" },
];

function Cite({ n }: { n: number | number[] }) {
  const nums = Array.isArray(n) ? n : [n];
  return (
    <sup className="ml-0.5 text-brand-600">
      [{nums.join(", ")}]
    </sup>
  );
}

interface MarketGroup {
  serviceIds: string[];
  title: string;
  marketRange: string;
  citations: number[];
  verdict: string;
  verdictTone: "success" | "warning" | "neutral";
}

const MARKET_GROUPS: MarketGroup[] = [
  {
    serviceIds: ["window-sqft", "window-pane", "window-storefront"],
    title: "Window Cleaning",
    marketRange:
      "By area: $0.50–$2.50 / sq ft of glass. By pane: $2–$8 / pane. By window: $5.50–$15, ~$10 is the reported industry standard.",
    citations: [3, 4],
    verdict: "Your defaults sit at or below the low end of the researched range — competitive, with room to raise if you're winning every bid.",
    verdictTone: "success",
  },
  {
    serviceIds: ["pressure-basic", "pressure-intensive"],
    title: "Pressure Washing (by area)",
    marketRange:
      "General commercial range: $0.10–$1.00 / sq ft. By surface: sidewalks $0.10–$0.30, building exteriors $0.15–$0.90, garages $0.10–$0.25.",
    citations: [5, 6],
    verdict: "Your light-soil and heavy-soil defaults both land inside the researched surface-specific ranges.",
    verdictTone: "success",
  },
  {
    serviceIds: ["pressure-lot"],
    title: "Pressure Washing — Parking Lot / Garage (per space)",
    marketRange: "$8–$20 per parking space.",
    citations: [5],
    verdict: "Your default and range match this almost exactly.",
    verdictTone: "success",
  },
  {
    serviceIds: ["dumpster-pad"],
    title: "Dumpster Pad Degrease",
    marketRange: "$0.75–$1.00 / sq ft.",
    citations: [5],
    verdict: "Your default and range match this almost exactly.",
    verdictTone: "success",
  },
  {
    serviceIds: ["carpet"],
    title: "Carpet Cleaning (extraction)",
    marketRange: "$0.10–$0.35 / sq ft, with most commercial quotes clustering around $0.15–$0.30.",
    citations: [7, 8],
    verdict: "Your default is at the upper end of the researched range — reasonable for full-service extraction, but worth a competitor check in price-sensitive bids.",
    verdictTone: "warning",
  },
  {
    serviceIds: ["floor-wax"],
    title: "Floor Stripping & Waxing",
    marketRange:
      "Sources vary widely: general commercial estimates run $0.25–$0.85 / sq ft, while some 2026 residential-leaning guides quote $1.72–$2.15 / sq ft. Labor is typically 70–80% of the total job cost.",
    citations: [9, 10],
    verdict: "Your default falls in the middle of the commercial-focused estimates — the higher figures found elsewhere look more like small/residential jobs, not bulk commercial work.",
    verdictTone: "neutral",
  },
  {
    serviceIds: ["custom-time"],
    title: "Custom Job (by labor hour)",
    marketRange:
      "General commercial cleaning bill rates run $30–$75 / hour; specialized or industrial work can run $150–$500+ / hour.",
    citations: [1, 2],
    verdict: "Your default sits above the general janitorial hourly range — appropriate for a custom/specialty job, which commands a premium over routine cleaning.",
    verdictTone: "neutral",
  },
];

function fmtRange(range: [number, number], unitLabel: string, isFlat: boolean) {
  return isFlat
    ? `${usd(range[0], 0)}–${usd(range[1], 0)} per ${unitLabel}`
    : `${usd(range[0], 2)}–${usd(range[1], 2)} / ${unitLabel}`;
}

export default function MarketPricingGuidePage() {
  const { specialtyServices, loadSpecialtyServices } = useApp();

  useEffect(() => {
    fetch("/api/specialty-services")
      .then((res) => res.json())
      .then(loadSpecialtyServices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <MapPin className="h-[18px] w-[18px]" />
            </span>
            Market Pricing Guide — Utah, USA
          </span>
        }
        subtitle="How your registered services compare to real researched market rates"
        actions={
          <Link href="/admin">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back to Admin
            </span>
          </Link>
        }
      />
      <div className="space-y-6 p-4 sm:p-8">
        <Card title="Utah labor market context">
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Utah's minimum wage matches the federal rate of <strong>$7.25/hr</strong> — it has no
              state-specific minimum above that floor <Cite n={12} />. Real-world janitorial pay runs
              well above that: the average hourly wage for janitorial work in Utah is{" "}
              <strong>$16.14/hr</strong>, with most workers earning between $13.37 and $17.50/hr{" "}
              <Cite n={11} />. Your current <strong>Base wage</strong> setting (
              <strong>{usd(DEFAULT_COST_SETTINGS.baseWage)}/hr</strong>) lines up almost exactly with
              that real Utah wage data.
            </p>
            <p>
              Separately, Utah cleaning companies' <em>billing</em> rates (what's charged to the
              client, not paid to the worker) average around <strong>$29/hr</strong>, close to the
              national average <Cite n={2} />.
            </p>
            <p>
              On the financial side: direct labor typically runs <strong>45–55% of revenue</strong>{" "}
              for janitorial/commercial cleaning businesses <Cite n={13} />, and net profit margins
              typically land in the <strong>10–28%</strong> range, with 8–15% common specifically for
              janitorial and 12–20% for broader commercial cleaning <Cite n={14} />. Your current{" "}
              <strong>Target profit margin</strong> setting (
              <strong>{pct(DEFAULT_COST_SETTINGS.targetMarginPct)}</strong>) sits comfortably inside
              that healthy range.
            </p>
          </div>
        </Card>

        {MARKET_GROUPS.map((group) => (
          <Card key={group.title} title={group.title}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Your defaults today
                </div>
                <div className="space-y-1.5">
                  {group.serviceIds.map((id) => {
                    const svc = specialtyServices.find((s) => s.id === id);
                    if (!svc) return null;
                    const isFlat = svc.method === "unit" && svc.unitLabel.includes("visit");
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{svc.label}</span>
                        <span className="font-medium text-slate-800">
                          {fmtRange(svc.rateRange, svc.unitLabel, isFlat)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Researched market range
                </div>
                <p className="text-sm text-slate-700">
                  {group.marketRange}
                  <Cite n={group.citations} />
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <Badge tone={group.verdictTone}>{group.verdict}</Badge>
            </div>
          </Card>
        ))}

        <Card title="Sources" subtitle="Live web research, August 2026 — recheck periodically, market rates drift">
          <ol className="space-y-1.5 text-sm">
            {SOURCES.map((s) => (
              <li key={s.n} className="text-slate-600">
                [{s.n}]{" "}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
