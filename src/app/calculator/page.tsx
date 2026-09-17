"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  Card,
  Field,
  NumberInput,
  TextInput,
  Select,
  Button,
  Stat,
  Row,
} from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import SaveProposalButton from "@/components/SaveProposalButton";
import { computeEstimate } from "@/lib/pricing";
import { usd, num, pct } from "@/lib/format";

export default function CalculatorPage() {
  const hydrated = useHydrated();
  const {
    estimate,
    settings,
    setEstimate,
    addArea,
    updateArea,
    removeArea,
    areaTypes,
    loadAreaTypes,
  } = useApp();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/area-types")
      .then((res) => res.json())
      .then(loadAreaTypes)
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated || !loaded) return <PageHeader title="Budget Calculator" />;

  const r = computeEstimate(estimate, settings, areaTypes);
  const fallbackType = { id: "", label: "Area", productionRate: 4000, rateRange: [0, 0] as [number, number] };
  const getType = (id: string) => areaTypes.find((t) => t.id === id) ?? fallbackType;

  return (
    <>
      <PageHeader
        title="Budget Calculator"
        subtitle="Recurring janitorial contract pricing built from real ISSA production rates"
        actions={
          <>
            <SaveProposalButton />
            <Link href="/bid">
              <Button>Use in a BID →</Button>
            </Link>
          </>
        }
      />
      <div className="grid gap-6 p-4 sm:p-8 xl:grid-cols-[1fr_380px]">
        {/* -------------------------------------------------------- inputs */}
        <div className="space-y-6">
          <Card title="Client & property">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name">
                <TextInput
                  value={estimate.clientName}
                  onChange={(e) => setEstimate({ clientName: e.target.value })}
                  placeholder="e.g. Summit Property Group"
                />
              </Field>
              <Field label="Property / building">
                <TextInput
                  value={estimate.propertyName}
                  onChange={(e) => setEstimate({ propertyName: e.target.value })}
                  placeholder="e.g. 1200 Market Plaza"
                />
              </Field>
            </div>
          </Card>

          <Card
            title="Areas to clean"
            subtitle="Production rate is auto-filled from the area type — override it if you know better."
            right={
              <Button variant="ghost" onClick={addArea}>
                + Add area
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="hidden grid-cols-[1.4fr_1.2fr_0.9fr_1fr_auto] gap-3 px-1 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
                <span>Area name</span>
                <span>Type</span>
                <span>Sq ft</span>
                <span>Rate (sqft/hr)</span>
                <span></span>
              </div>
              {estimate.areas.map((a) => {
                const type = getType(a.areaTypeId);
                return (
                  <div
                    key={a.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1.4fr_1.2fr_0.9fr_1fr_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-1"
                  >
                    <TextInput
                      value={a.name}
                      onChange={(e) => updateArea(a.id, { name: e.target.value })}
                      placeholder={type.label}
                    />
                    <Select
                      value={a.areaTypeId}
                      onChange={(v) =>
                        updateArea(a.id, {
                          areaTypeId: v,
                          productionRateOverride: undefined,
                        })
                      }
                    >
                      {areaTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                    <NumberInput
                      value={a.sqft}
                      onChange={(n) => updateArea(a.id, { sqft: n })}
                      suffix="ft²"
                    />
                    <NumberInput
                      value={a.productionRateOverride ?? type.productionRate}
                      onChange={(n) =>
                        updateArea(a.id, { productionRateOverride: n })
                      }
                    />
                    <button
                      onClick={() => removeArea(a.id)}
                      className="justify-self-start rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50 sm:justify-self-center"
                      aria-label="Remove area"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {estimate.areas.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  No areas yet — add one to start pricing.
                </p>
              )}
            </div>
          </Card>

          <Card title="Schedule & fixed costs">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Cleaning frequency"
                hint="Visits per week"
              >
                <NumberInput
                  value={estimate.frequencyPerWeek}
                  onChange={(n) => setEstimate({ frequencyPerWeek: n })}
                  suffix="× / wk"
                  min={0}
                />
              </Field>
              <Field
                label="Extra fixed monthly cost"
                hint="Supervision, equipment lease, day porter, etc."
              >
                <NumberInput
                  value={estimate.fixedMonthlyCost}
                  onChange={(n) => setEstimate({ fixedMonthlyCost: n })}
                  prefix="$"
                  suffix="/mo"
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------- results */}
        <div className="space-y-6">
          <Card
            title="Recommended bid"
            className="xl:sticky xl:top-6"
            right={
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                {pct(settings.targetMarginPct)} margin
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Monthly price" value={usd(r.monthlyPrice, 0)} accent />
              <Stat label="Annual value" value={usd(r.annualPrice, 0)} />
            </div>
            <div className="mt-4 space-y-0.5">
              <Row label="Total cleanable area" value={`${num(r.totalSqft)} ft²`} />
              <Row
                label="Labor hours / visit"
                value={num(r.laborHoursPerVisit, 2)}
              />
              <Row
                label="Visits / month"
                value={num(r.visitsPerMonth, 1)}
              />
              <Row
                label="Labor hours / month"
                value={num(r.laborHoursPerMonth, 1)}
              />
              <Row label="Price per visit" value={usd(r.pricePerVisit)} />
              <Row
                label="Price / ft² / month"
                value={usd(r.pricePerSqFtMonth, 3)}
              />
              <Row
                label="Effective bill rate"
                value={`${usd(r.effectiveBillRate)} / hr`}
              />
            </div>
          </Card>

          <Card title="Cost breakdown" subtitle="Where the monthly price comes from">
            <div className="space-y-0.5">
              <Row label="Base labor" value={usd(r.baseLaborCost)} />
              <Row
                label={`Labor burden (${pct(settings.laborBurdenPct, 0)})`}
                value={usd(r.burdenCost)}
              />
              <Row
                label="Fully burdened labor"
                value={usd(r.fullyBurdenedLabor)}
                muted
              />
              <Row
                label={`Supplies (${pct(settings.suppliesPctOfLabor, 0)})`}
                value={usd(r.suppliesCost)}
              />
              {r.fixedMonthlyCost > 0 && (
                <Row label="Fixed monthly cost" value={usd(r.fixedMonthlyCost)} />
              )}
              <Row label="Direct cost" value={usd(r.directCost)} muted />
              <Row
                label={`Overhead (${pct(settings.overheadPct, 0)})`}
                value={usd(r.overheadCost)}
              />
              <Row label="Total cost" value={usd(r.totalCost)} />
              <Row label="Profit" value={usd(r.profit)} />
              <Row label="Monthly price" value={usd(r.monthlyPrice)} strong />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
