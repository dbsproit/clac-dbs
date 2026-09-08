"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, Field, NumberInput, TextInput, Select, Button, Stat } from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { usd, pct } from "@/lib/format";
import type { AreaType, SpecialtyService, PricingMethod } from "@/lib/types";

const BLANK_AREA_TYPE: Omit<AreaType, "id"> = {
  label: "New area type",
  productionRate: 4000,
  rateRange: [3000, 5000],
};

const BLANK_SPECIALTY_SERVICE: Omit<SpecialtyService, "id"> = {
  label: "New service",
  method: "area",
  defaultRate: 0,
  rateRange: [0, 0],
  unitLabel: "sq ft",
  minCharge: 0,
  productionRate: 1000,
};

export default function RatesPage() {
  const hydrated = useHydrated();
  const {
    settings,
    setSettings,
    resetSettings,
    loadSettings,
    saveSettings,
    areaTypes,
    loadAreaTypes,
    addAreaType,
    updateAreaType,
    removeAreaType,
    specialtyServices,
    loadSpecialtyServices,
    addSpecialtyService,
    updateSpecialtyService,
    removeSpecialtyService,
  } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => loadSettings(data.costSettings, data.company, data.proposalDefaults))
      .finally(() => setLoaded(true));
    fetch("/api/area-types")
      .then((res) => res.json())
      .then(loadAreaTypes);
    fetch("/api/specialty-services")
      .then((res) => res.json())
      .then(loadSpecialtyServices);
    // Runs once on mount to hydrate from the shared server settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings();
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated || !loaded) return <PageHeader title="Rates" />;

  const loadedWage = settings.baseWage * (1 + settings.laborBurdenPct / 100);

  return (
    <>
      <PageHeader
        title="Rates"
        subtitle="Every number behind the calculators — cost model, area production rates, and Extra Services defaults."
        actions={
          <>
            <Button variant="secondary" onClick={resetSettings}>
              Reset to market defaults
            </Button>
            <Button onClick={handleSave}>{saving ? "Saving…" : "Save rates"}</Button>
          </>
        }
      />
      <div className="space-y-6 p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Cost & margin model"
            subtitle="The buildup applied to labor across all modules"
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Base wage" hint="Average hourly wage paid to a cleaner">
                <NumberInput
                  value={settings.baseWage}
                  onChange={(n) => setSettings({ baseWage: n })}
                  prefix="$"
                  suffix="/hr"
                />
              </Field>
              <Field
                label="Labor burden"
                hint="Payroll taxes, workers' comp, benefits (12–20%)"
              >
                <NumberInput
                  value={settings.laborBurdenPct}
                  onChange={(n) => setSettings({ laborBurdenPct: n })}
                  suffix="%"
                />
              </Field>
              <Field
                label="Supplies"
                hint="Consumables as % of labor (~5%)"
              >
                <NumberInput
                  value={settings.suppliesPctOfLabor}
                  onChange={(n) => setSettings({ suppliesPctOfLabor: n })}
                  suffix="%"
                />
              </Field>
              <Field
                label="Overhead"
                hint="Admin, insurance, vehicles (8–15%)"
              >
                <NumberInput
                  value={settings.overheadPct}
                  onChange={(n) => setSettings({ overheadPct: n })}
                  suffix="%"
                />
              </Field>
              <Field
                label="Target profit margin"
                hint="Net margin on sell price (10–20%)"
              >
                <NumberInput
                  value={settings.targetMarginPct}
                  onChange={(n) => setSettings({ targetMarginPct: n })}
                  suffix="%"
                />
              </Field>
              <Field
                label="Weeks per month"
                hint="Converts weekly frequency to monthly (4.33)"
              >
                <NumberInput
                  value={settings.weeksPerMonth}
                  onChange={(n) => setSettings({ weeksPerMonth: n })}
                  suffix="wk"
                />
              </Field>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Stat
                label="Fully burdened labor"
                value={usd(loadedWage)}
                sub="cost per labor hour"
                accent
              />
              <Stat
                label="Markup to hit margin"
                value={pct(
                  settings.targetMarginPct < 100
                    ? (1 / (1 - settings.targetMarginPct / 100) - 1) * 100
                    : 0
                )}
                sub="applied over total cost"
              />
            </div>
          </Card>
        </div>

        <Card
          title="Area production rates"
          subtitle="Sqft cleaned per labor hour, by area type — drives the Budget Calculator"
          right={
            <Button variant="ghost" onClick={() => addAreaType(BLANK_AREA_TYPE)}>
              + Add area type
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="w-56 pb-2 pr-2">Area type</th>
                  <th className="w-40 pb-2 pr-2">Production rate</th>
                  <th className="w-32 pb-2 pr-2">Range low</th>
                  <th className="w-32 pb-2 pr-2">Range high</th>
                  <th className="w-10 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {areaTypes.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2">
                      <TextInput
                        value={a.label}
                        onChange={(e) => updateAreaType(a.id, { label: e.target.value })}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={a.productionRate}
                        onChange={(n) => updateAreaType(a.id, { productionRate: n })}
                        suffix="sqft/hr"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={a.rateRange[0]}
                        onChange={(n) => updateAreaType(a.id, { rateRange: [n, a.rateRange[1]] })}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={a.rateRange[1]}
                        onChange={(n) => updateAreaType(a.id, { rateRange: [a.rateRange[0], n] })}
                      />
                    </td>
                    <td className="py-1.5">
                      <button
                        onClick={() => removeAreaType(a.id)}
                        className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                        aria-label="Remove area type"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {areaTypes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                      No area types yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Extra Services defaults"
          subtitle="What a new Extra Services line starts with — per-line values can still be overridden"
          right={
            <Button variant="ghost" onClick={() => addSpecialtyService(BLANK_SPECIALTY_SERVICE)}>
              + Add service
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="w-52 pb-2 pr-2">Service</th>
                  <th className="w-28 pb-2 pr-2">Method</th>
                  <th className="w-28 pb-2 pr-2">Default rate</th>
                  <th className="w-24 pb-2 pr-2">Range low</th>
                  <th className="w-24 pb-2 pr-2">Range high</th>
                  <th className="w-28 pb-2 pr-2">Unit label</th>
                  <th className="w-24 pb-2 pr-2">Min charge</th>
                  <th className="w-28 pb-2 pr-2">Productivity</th>
                  <th className="w-10 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {specialtyServices.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2">
                      <TextInput
                        value={s.label}
                        onChange={(e) => updateSpecialtyService(s.id, { label: e.target.value })}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Select
                        value={s.method}
                        onChange={(v) => updateSpecialtyService(s.id, { method: v as PricingMethod })}
                      >
                        <option value="area">Area</option>
                        <option value="unit">Unit</option>
                        <option value="time">Time</option>
                      </Select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={s.defaultRate}
                        onChange={(n) => updateSpecialtyService(s.id, { defaultRate: n })}
                        prefix="$"
                        step="0.01"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={s.rateRange[0]}
                        onChange={(n) =>
                          updateSpecialtyService(s.id, { rateRange: [n, s.rateRange[1]] })
                        }
                        step="0.01"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={s.rateRange[1]}
                        onChange={(n) =>
                          updateSpecialtyService(s.id, { rateRange: [s.rateRange[0], n] })
                        }
                        step="0.01"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <TextInput
                        value={s.unitLabel}
                        onChange={(e) => updateSpecialtyService(s.id, { unitLabel: e.target.value })}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={s.minCharge}
                        onChange={(n) => updateSpecialtyService(s.id, { minCharge: n })}
                        prefix="$"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <NumberInput
                        value={s.productionRate ?? 0}
                        onChange={(n) => updateSpecialtyService(s.id, { productionRate: n })}
                      />
                    </td>
                    <td className="py-1.5">
                      <button
                        onClick={() => removeSpecialtyService(s.id)}
                        className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                        aria-label="Remove service"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {specialtyServices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-sm text-slate-400">
                      No services yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
