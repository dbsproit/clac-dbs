"use client";
import { Fragment, useEffect, useState } from "react";
import {
  Wrench,
  PackageSearch,
  Ruler,
  Hash,
  Clock,
  Trash2,
  Plus,
  HardHat,
  UserPlus,
  Percent,
  Calculator,
  Target,
  DollarSign,
  Receipt,
  TrendingUp,
  Gauge,
  type LucideIcon,
} from "lucide-react";
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
  Badge,
} from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import SaveProposalButton from "@/components/SaveProposalButton";
import type { PayType, CrewMember, SpecialtyService } from "@/lib/types";
import {
  computeExtraLine,
  computeExtraServices,
  fastFieldEstimate,
  computeBenchmarkScorecard,
  benchmarkMaterialsOpsPct,
} from "@/lib/pricing";
import { usd, num, pct } from "@/lib/format";

const methodUnit = (m: string) =>
  m === "area" ? "sq ft" : m === "time" ? "hours" : "units";

const METHOD_STYLE: Record<string, { icon: typeof Ruler; bg: string; text: string }> = {
  area: { icon: Ruler, bg: "bg-brand-50", text: "text-brand-600" },
  unit: { icon: Hash, bg: "bg-violet-50", text: "text-violet-600" },
  time: { icon: Clock, bg: "bg-amber-50", text: "text-amber-600" },
};

function CrewSection({
  icon: Icon,
  label,
  role,
  members,
  lineId,
}: {
  icon: LucideIcon;
  label: string;
  role: "workers" | "helpers";
  members: CrewMember[];
  lineId: string;
}) {
  const { addCrewMember, updateCrewMember, removeCrewMember } = useApp();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {members.map((m) => (
        <div key={m.id} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_120px_140px_auto]">
          <Field label="Name">
            <TextInput
              value={m.name}
              onChange={(e) =>
                updateCrewMember(lineId, role, m.id, { name: e.target.value })
              }
              placeholder="e.g. Carlos"
            />
          </Field>
          <Field label="Pay type">
            <Select
              value={m.payType}
              onChange={(v) => updateCrewMember(lineId, role, m.id, { payType: v as PayType })}
            >
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed</option>
            </Select>
          </Field>
          <Field label="Rate">
            <NumberInput
              value={m.rate}
              onChange={(n) => updateCrewMember(lineId, role, m.id, { rate: n })}
              prefix="$"
              suffix={m.payType === "hourly" ? "/hr" : "flat"}
            />
          </Field>
          <button
            onClick={() => removeCrewMember(lineId, role, m.id)}
            aria-label={`Remove ${label.toLowerCase().slice(0, -1)}`}
            className="mb-0.5 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button variant="ghost" onClick={() => addCrewMember(lineId, role)}>
        <Plus className="h-3.5 w-3.5" /> Add {label.toLowerCase().slice(0, -1)}
      </Button>
    </div>
  );
}

export default function ExtraServicesPage() {
  const hydrated = useHydrated();
  const {
    extraLines,
    settings,
    addExtraLine,
    updateExtraLine,
    removeExtraLine,
    salespeople,
    loadSalespeople,
    pricingBenchmarks,
    loadPricingBenchmarks,
    specialtyServices,
    loadSpecialtyServices,
  } = useApp();
  const [picker, setPicker] = useState("");

  useEffect(() => {
    fetch("/api/salespeople")
      .then((res) => res.json())
      .then(loadSalespeople);
    fetch("/api/pricing-benchmarks")
      .then((res) => res.json())
      .then(loadPricingBenchmarks);
    fetch("/api/specialty-services")
      .then((res) => res.json())
      .then((list: SpecialtyService[]) => {
        loadSpecialtyServices(list);
        setPicker((p) => p || list[0]?.id || "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) return <PageHeader title="Extra Services" />;

  const totals = computeExtraServices(extraLines, settings);

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Wrench className="h-[18px] w-[18px]" />
            </span>
            Extra Services Calculator
          </span>
        }
        subtitle="Price add-on jobs for existing clients — cost buildup vs. live market rates"
        actions={
          <div className="w-full sm:w-auto">
            {/* mobile: dropdown full-width on its own row, buttons side by side below */}
            <div className="flex flex-col gap-2 sm:hidden">
              <Select value={picker} onChange={setPicker} className="w-full">
                {specialtyServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <SaveProposalButton className="flex-1" />
                <Button
                  onClick={() => picker && addExtraLine(picker)}
                  className="flex-1"
                >
                  + Add service
                </Button>
              </div>
            </div>
            {/* desktop: original single row */}
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <SaveProposalButton />
              <Select value={picker} onChange={setPicker} className="w-56">
                {specialtyServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Button onClick={() => picker && addExtraLine(picker)}>+ Add service</Button>
            </div>
          </div>
        }
      />

      <div className="space-y-6 p-4 sm:p-8">
        {extraLines.length === 0 && (
          <Card>
            <div className="flex flex-col items-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <PackageSearch className="h-7 w-7" />
              </div>
              <p className="text-lg font-semibold text-slate-700">No extra services yet</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Pick a service above (window cleaning, power washing, floor care…)
                and click <span className="font-medium text-slate-600">Add service</span>.
              </p>
            </div>
          </Card>
        )}

        {extraLines.map((line) => {
          const svc: SpecialtyService = specialtyServices.find((s) => s.id === line.serviceId) ?? {
            id: line.serviceId,
            label: line.label,
            method: line.method,
            defaultRate: line.rate,
            rateRange: [line.rate, line.rate],
            unitLabel: "unit",
            minCharge: line.minCharge,
            productionRate: line.productionRate,
          };
          const res = computeExtraLine(line, settings);
          const benchmark = pricingBenchmarks.find((b) => b.id === svc.benchmarkId);
          const scorecard = benchmark ? computeBenchmarkScorecard(res) : null;
          const marketLow = line.quantity * svc.rateRange[0];
          const marketHigh = line.quantity * svc.rateRange[1];
          const belowMarket = res.recommendedPrice < marketLow;
          const aboveMarket = res.recommendedPrice > marketHigh;
          const methodStyle = METHOD_STYLE[line.method] ?? METHOD_STYLE.area;
          const MethodIcon = methodStyle.icon;

          const marginTone =
            res.marginAtRecommended >= settings.targetMarginPct
              ? "success"
              : res.marginAtRecommended >= settings.targetMarginPct - 5
                ? "warning"
                : "danger";

          return (
            <Card
              key={line.id}
              title={
                <span className="inline-flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${methodStyle.bg} ${methodStyle.text}`}
                  >
                    <MethodIcon className="h-[18px] w-[18px]" />
                  </span>
                  {line.label}
                </span>
              }
              right={
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">
                    ${svc.rateRange[0]}–${svc.rateRange[1]} / {svc.unitLabel}
                  </Badge>
                  <button
                    onClick={() => removeExtraLine(line.id)}
                    aria-label="Remove service"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              }
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* inputs */}
                <div className="space-y-5">
                  <div className="flex flex-wrap items-end gap-4">
                    <Field label="Pricing">
                      <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
                        <button
                          onClick={() => updateExtraLine(line.id, { pricingMode: "calculated" })}
                          className={`px-3 py-2 text-sm font-medium transition ${
                            line.pricingMode === "calculated"
                              ? "bg-brand-600 text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Calculated
                        </button>
                        <button
                          onClick={() => updateExtraLine(line.id, { pricingMode: "fixed" })}
                          className={`border-l border-slate-300 px-3 py-2 text-sm font-medium transition ${
                            line.pricingMode === "fixed"
                              ? "bg-brand-600 text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Fixed price
                        </button>
                      </div>
                    </Field>
                    {line.pricingMode === "fixed" && (
                      <Field label="Total sale price" hint="Charged to the client, as agreed">
                        <NumberInput
                          value={line.fixedSalePrice}
                          onChange={(n) => updateExtraLine(line.id, { fixedSalePrice: n })}
                          prefix="$"
                        />
                      </Field>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field
                      label={`Quantity (${methodUnit(line.method)})`}
                      hint={
                        line.method === "time"
                          ? "Estimated labor hours"
                          : `Total ${svc.unitLabel}`
                      }
                    >
                      <NumberInput
                        value={line.quantity}
                        onChange={(n) => updateExtraLine(line.id, { quantity: n })}
                      />
                    </Field>
                    <Field
                      label="Market rate"
                      hint={`$ per ${svc.unitLabel}`}
                    >
                      <NumberInput
                        value={line.rate}
                        onChange={(n) => updateExtraLine(line.id, { rate: n })}
                        prefix="$"
                        step="0.01"
                      />
                    </Field>
                    {line.method !== "time" && (
                      <Field
                        label="Productivity"
                        hint={`${methodUnit(line.method)} / labor hr`}
                      >
                        <NumberInput
                          value={line.productionRate}
                          onChange={(n) =>
                            updateExtraLine(line.id, { productionRate: n })
                          }
                        />
                      </Field>
                    )}
                    <Field label="Minimum charge">
                      <NumberInput
                        value={line.minCharge}
                        onChange={(n) =>
                          updateExtraLine(line.id, { minCharge: n })
                        }
                        prefix="$"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Materials">
                      <NumberInput
                        value={line.materialsCost}
                        onChange={(n) =>
                          updateExtraLine(line.id, { materialsCost: n })
                        }
                        prefix="$"
                      />
                    </Field>
                    <Field label="Equipment / rental">
                      <NumberInput
                        value={line.equipmentCost}
                        onChange={(n) =>
                          updateExtraLine(line.id, { equipmentCost: n })
                        }
                        prefix="$"
                      />
                    </Field>
                    <Field label="Trip / mobilization">
                      <NumberInput
                        value={line.tripCharge}
                        onChange={(n) =>
                          updateExtraLine(line.id, { tripCharge: n })
                        }
                        prefix="$"
                      />
                    </Field>
                  </div>

                  <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                    <CrewSection
                      icon={HardHat}
                      label="Workers"
                      role="workers"
                      members={line.workers}
                      lineId={line.id}
                    />
                    <div className="border-t border-slate-200/70 pt-4">
                      <CrewSection
                        icon={UserPlus}
                        label="Helpers"
                        role="helpers"
                        members={line.helpers}
                        lineId={line.id}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 border-t border-slate-200/70 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Percent className="h-3.5 w-3.5" /> Salesperson
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Sold by">
                        <Select
                          value={line.salespersonId}
                          onChange={(v) => {
                            const sp = salespeople.find((p) => p.id === v);
                            updateExtraLine(line.id, {
                              salespersonId: v,
                              salespersonName: sp?.name ?? "",
                              commissionPct: sp?.commissionPct ?? 0,
                            });
                          }}
                        >
                          <option value="">None</option>
                          {salespeople.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Commission">
                        <NumberInput
                          value={line.commissionPct}
                          onChange={(n) => updateExtraLine(line.id, { commissionPct: n })}
                          suffix="%"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Calculator className="h-3.5 w-3.5" /> Cost breakdown
                    </div>
                    <div className="grid gap-x-8 sm:grid-cols-2">
                      <div>
                        <Row label="Labor hours" value={num(res.laborHours, 2)} />
                        <Row label="Worker cost" value={usd(res.workerCost)} />
                        {line.helpers.length > 0 && (
                          <Row label="Helper cost" value={usd(res.helperCost)} />
                        )}
                        <Row label="Burden" value={usd(res.burdenCost)} />
                        <Row label="Supplies" value={usd(res.suppliesCost)} />
                      </div>
                      <div>
                        <Row label="Materials" value={usd(res.materialsCost)} />
                        <Row label="Equipment" value={usd(res.equipmentCost)} />
                        <Row label="Trip charge" value={usd(res.tripCharge)} />
                        <Row label="Overhead" value={usd(res.overheadCost)} />
                      </div>
                    </div>
                    <Row label="Total cost" value={usd(res.totalCost)} strong />
                  </div>
                </div>

                {/* result */}
                <div className="space-y-3">
                  <Stat
                    label="Recommended price"
                    value={usd(res.recommendedPrice, 2)}
                    accent
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={marginTone}>{pct(res.marginAtRecommended)} margin</Badge>
                    <Badge tone="neutral">{usd(res.profit)} profit</Badge>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <Row
                      label="Cost-based price"
                      value={usd(res.costBasedPrice)}
                    />
                    <Row
                      label="Market range"
                      value={`${usd(marketLow, 0)}–${usd(marketHigh, 0)}`}
                    />
                    <Row label="At your rate" value={usd(res.marketPrice)} />
                    {line.salespersonId && (
                      <Row
                        label={`Commission (${line.salespersonName})`}
                        value={usd(res.commissionAmount)}
                      />
                    )}
                    {(() => {
                      const minChargeApplied =
                        line.pricingMode === "calculated" &&
                        res.recommendedPrice === line.minCharge;
                      const showBelow = belowMarket && !minChargeApplied;
                      if (!minChargeApplied && !showBelow && !aboveMarket) return null;
                      return (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {minChargeApplied && (
                            <Badge tone="warning">Minimum charge applied</Badge>
                          )}
                          {showBelow && (
                            <Badge tone="success">Below market — room to raise</Badge>
                          )}
                          {aboveMarket && (
                            <Badge tone="warning">Above market — check competitiveness</Badge>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {benchmark && scorecard && (
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <Target className="h-3.5 w-3.5" /> Policy 01 — {benchmark.label}
                      </div>
                      <Row
                        label="Fast field estimate"
                        value={usd(fastFieldEstimate(res.baseLaborCost, benchmark))}
                      />
                      <p className="mb-3 text-xs text-slate-400">
                        Labor $ ÷ {pct(benchmark.laborPct, 0)} target — verify with the
                        full formula above.
                      </p>
                      <div className="space-y-2.5">
                        {(
                          [
                            ["Labor", scorecard.laborPct, benchmark.laborPct],
                            [
                              "Materials & ops",
                              scorecard.materialsOpsPct,
                              benchmarkMaterialsOpsPct(benchmark),
                            ],
                            ["Admin/overhead", scorecard.adminPct, benchmark.adminPct],
                            ["Commission", scorecard.commissionPct, benchmark.commPct],
                            ["Profit", scorecard.profitPct, benchmark.profitPct],
                          ] as [string, number, number][]
                        ).map(([label, actual, target]) => {
                          const offBenchmark = Math.abs(actual - target) > 5;
                          return (
                            <Fragment key={label}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">{label}</span>
                                <span
                                  className={
                                    offBenchmark
                                      ? "font-medium text-amber-600"
                                      : "text-slate-500"
                                  }
                                >
                                  {pct(actual, 0)}{" "}
                                  <span className="text-slate-300">/ {pct(target, 0)} target</span>
                                </span>
                              </div>
                              <div className="relative h-1.5 rounded-full bg-slate-100">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    offBenchmark ? "bg-amber-400" : "bg-brand-500"
                                  }`}
                                  style={{ width: `${Math.min(Math.max(actual, 0), 100)}%` }}
                                />
                                <div
                                  className="absolute top-0 h-1.5 w-0.5 bg-slate-500"
                                  style={{ left: `${Math.min(Math.max(target, 0), 100)}%` }}
                                />
                              </div>
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {extraLines.length > 0 && (
          <Card title="Job totals">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Total price"
                value={usd(totals.totalRecommendedPrice, 0)}
                icon={<DollarSign className="h-3.5 w-3.5" />}
                accent
              />
              <Stat
                label="Total cost"
                value={usd(totals.totalCost, 0)}
                icon={<Receipt className="h-3.5 w-3.5" />}
              />
              <Stat
                label="Total profit"
                value={usd(totals.totalProfit, 0)}
                icon={<TrendingUp className="h-3.5 w-3.5" />}
              />
              <Stat
                label="Blended margin"
                value={pct(totals.blendedMarginPct)}
                icon={<Gauge className="h-3.5 w-3.5" />}
              />
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
