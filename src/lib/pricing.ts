// =============================================================================
// Pricing engine — pure functions. No React, no side effects.
// This is the single source of truth for every dollar the app shows.
// =============================================================================

import type {
  CostSettings,
  Estimate,
  EstimateResult,
  AreaBreakdown,
  ExtraServiceLine,
  ExtraLineResult,
  ExtraServicesResult,
  PricingBenchmark,
  AreaType,
} from "./types";

const clampPct = (n: number) => Math.min(Math.max(n, 0), 99.9) / 100;

/**
 * Apply a target NET margin to a cost so that profit = margin% of the SELL price.
 *   price = cost / (1 - margin)
 * This is a true margin (not a markup), matching how contractors quote profit.
 */
export function applyMargin(cost: number, marginPct: number): number {
  const m = clampPct(marginPct);
  if (m >= 1) return cost;
  return cost / (1 - m);
}

// ------------------------------------------------------------------ recurring
export function computeEstimate(
  est: Estimate,
  s: CostSettings,
  areaTypes: AreaType[]
): EstimateResult {
  const weeksPerMonth = s.weeksPerMonth > 0 ? s.weeksPerMonth : 4.33;
  const fallbackType: AreaType = { id: "", label: "Area", productionRate: 4000, rateRange: [0, 0] };

  const perArea: AreaBreakdown[] = est.areas.map((a) => {
    const type =
      areaTypes.find((t) => t.id === a.areaTypeId) ??
      areaTypes[areaTypes.length - 1] ??
      fallbackType;
    const rate =
      a.productionRateOverride && a.productionRateOverride > 0
        ? a.productionRateOverride
        : type.productionRate;
    const hoursPerVisit = rate > 0 ? a.sqft / rate : 0;
    return {
      id: a.id,
      name: a.name || type.label,
      sqft: a.sqft,
      productionRate: rate,
      hoursPerVisit,
    };
  });

  const totalSqft = perArea.reduce((sum, a) => sum + a.sqft, 0);
  const laborHoursPerVisit = perArea.reduce((sum, a) => sum + a.hoursPerVisit, 0);
  const visitsPerMonth = est.frequencyPerWeek * weeksPerMonth;
  const laborHoursPerMonth = laborHoursPerVisit * visitsPerMonth;

  const baseLaborCost = laborHoursPerMonth * s.baseWage;
  const burdenCost = baseLaborCost * clampPct(s.laborBurdenPct);
  const fullyBurdenedLabor = baseLaborCost + burdenCost;
  const suppliesCost = fullyBurdenedLabor * clampPct(s.suppliesPctOfLabor);
  const fixedMonthlyCost = est.fixedMonthlyCost || 0;

  const directCost = fullyBurdenedLabor + suppliesCost + fixedMonthlyCost;
  const overheadCost = directCost * clampPct(s.overheadPct);
  const totalCost = directCost + overheadCost;

  const monthlyPrice = applyMargin(totalCost, s.targetMarginPct);
  const profit = monthlyPrice - totalCost;

  return {
    totalSqft,
    laborHoursPerVisit,
    visitsPerMonth,
    laborHoursPerMonth,
    baseLaborCost,
    burdenCost,
    fullyBurdenedLabor,
    suppliesCost,
    fixedMonthlyCost,
    directCost,
    overheadCost,
    totalCost,
    profit,
    monthlyPrice,
    annualPrice: monthlyPrice * 12,
    pricePerVisit: visitsPerMonth > 0 ? monthlyPrice / visitsPerMonth : 0,
    pricePerSqFtMonth: totalSqft > 0 ? monthlyPrice / totalSqft : 0,
    effectiveBillRate:
      laborHoursPerMonth > 0 ? monthlyPrice / laborHoursPerMonth : 0,
    perArea,
  };
}

// ------------------------------------------------------------- extra services
export function computeExtraLine(
  line: ExtraServiceLine,
  s: CostSettings
): ExtraLineResult {
  // Estimate labor hours from quantity & productivity, or directly for time method.
  let laborHours: number;
  if (line.method === "time") {
    laborHours = line.quantity; // quantity IS hours
  } else {
    const prod = line.productionRate > 0 ? line.productionRate : 1;
    laborHours = line.quantity / prod;
  }
  // A crew larger than 1 doesn't change total labor-hours cost, but we keep the
  // field so scheduling/duration can be shown; cost = labor-hours * wage.

  // Labor cost comes from the named workers/helpers actually assigned to the
  // job, not a generic company-wide wage. A crew can have any number of each.
  const crewCost = (crew: ExtraServiceLine["workers"]) =>
    crew.reduce(
      (sum, m) => sum + (m.payType === "fixed" ? m.rate || 0 : (m.rate || 0) * laborHours),
      0
    );
  const workerCost = crewCost(line.workers);
  const helperCost = crewCost(line.helpers);
  const baseLaborCost = workerCost + helperCost;

  const burdenCost = baseLaborCost * clampPct(s.laborBurdenPct);
  const fullyBurdenedLabor = baseLaborCost + burdenCost;
  const suppliesCost = fullyBurdenedLabor * clampPct(s.suppliesPctOfLabor);

  const directCost =
    fullyBurdenedLabor +
    suppliesCost +
    (line.materialsCost || 0) +
    (line.equipmentCost || 0) +
    (line.tripCharge || 0);
  const overheadCost = directCost * clampPct(s.overheadPct);
  const totalCost = directCost + overheadCost;

  // Price so the company still nets its target margin AFTER paying the
  // salesperson's commission: price = cost / (1 - margin% - commission%).
  const commissionPct = line.commissionPct || 0;
  const combinedPct = Math.min(s.targetMarginPct + commissionPct, 99.9) / 100;
  const costBasedPrice =
    combinedPct >= 1 ? totalCost : totalCost / (1 - combinedPct);

  // Market price = quantity * market/target rate. For time it's quantity (hours)
  // * the billable hourly rate the user set — same formula either way.
  const marketPrice = line.quantity * line.rate;

  // Recommend the cost-based price, but never below the service minimum
  // charge — unless the job is sold for a flat total, in which case that's
  // the price, full stop (the client agreed to a fixed number, not a formula).
  // Market price is surfaced separately as a competitiveness check either way.
  const recommendedPrice =
    line.pricingMode === "fixed"
      ? line.fixedSalePrice || 0
      : Math.max(costBasedPrice, line.minCharge || 0);
  const commissionAmount = recommendedPrice * (commissionPct / 100);
  const profit = recommendedPrice - totalCost - commissionAmount;
  const marginAtRecommended =
    recommendedPrice > 0 ? (profit / recommendedPrice) * 100 : 0;

  return {
    id: line.id,
    label: line.label,
    laborHours,
    workerCost,
    helperCost,
    baseLaborCost,
    burdenCost,
    fullyBurdenedLabor,
    suppliesCost,
    materialsCost: line.materialsCost || 0,
    equipmentCost: line.equipmentCost || 0,
    tripCharge: line.tripCharge || 0,
    directCost,
    overheadCost,
    totalCost,
    commissionAmount,
    profit,
    costBasedPrice,
    marketPrice,
    recommendedPrice,
    marginAtRecommended,
  };
}

// ---------------------------------------------------- Policy 01 benchmark
/**
 * Fast field estimate from the Master Pricing Reference Table: for a healthy
 * job of this type, Selling Price ≈ Labor $ ÷ Labor %. Meant as a quick
 * sanity check in the field — always verify against the full cost buildup.
 */
export function fastFieldEstimate(
  laborCost: number,
  benchmark: PricingBenchmark
): number {
  return benchmark.laborPct > 0 ? laborCost / (benchmark.laborPct / 100) : 0;
}

export interface BenchmarkScorecard {
  laborPct: number;
  materialsOpsPct: number; // chem+machine+pads+water+vehicle+maint+deprec, bundled
  adminPct: number;
  commissionPct: number;
  profitPct: number;
}

/**
 * How the actual line's cost buildup splits selling price, at the same
 * granularity the app tracks (it doesn't separate chem/machine/pads/water/
 * vehicle/maintenance/depreciation individually, so those benchmark columns
 * are compared in bulk against materials + equipment + trip + supplies).
 */
export function computeBenchmarkScorecard(res: ExtraLineResult): BenchmarkScorecard {
  const price = res.recommendedPrice;
  // A $0 recommended price has no meaningful split — divide-by-1 fallback would
  // otherwise inflate every column into a nonsensical percentage of $1.
  if (price <= 0) {
    return { laborPct: 0, materialsOpsPct: 0, adminPct: 0, commissionPct: 0, profitPct: 0 };
  }
  return {
    laborPct: (res.baseLaborCost / price) * 100,
    materialsOpsPct:
      ((res.materialsCost + res.equipmentCost + res.tripCharge + res.suppliesCost) /
        price) *
      100,
    adminPct: (res.overheadCost / price) * 100,
    commissionPct: (res.commissionAmount / price) * 100,
    profitPct: (res.profit / price) * 100,
  };
}

/** Sum of the benchmark's non-labor operating columns, for the bundled comparison above. */
export function benchmarkMaterialsOpsPct(b: PricingBenchmark): number {
  return b.chemPct + b.machinePct + b.padsPct + b.waterPct + b.vehiclePct + b.maintPct + b.deprecPct;
}

export function computeExtraServices(
  lines: ExtraServiceLine[],
  s: CostSettings
): ExtraServicesResult {
  const results = lines.map((l) => computeExtraLine(l, s));
  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
  const totalRecommendedPrice = results.reduce(
    (sum, r) => sum + r.recommendedPrice,
    0
  );
  const totalProfit = totalRecommendedPrice - totalCost;
  const blendedMarginPct =
    totalRecommendedPrice > 0 ? (totalProfit / totalRecommendedPrice) * 100 : 0;
  return {
    lines: results,
    totalCost,
    totalRecommendedPrice,
    totalProfit,
    blendedMarginPct,
  };
}
