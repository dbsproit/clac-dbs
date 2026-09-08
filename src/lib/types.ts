// =============================================================================
// DBS Building Services — Pricing Suite: Shared domain types
// =============================================================================

/** Cost & margin assumptions shared by every calculator. Editable in Settings. */
export interface CostSettings {
  /** Company-wide base hourly wage paid to a cleaner (USD). */
  baseWage: number;
  /** Labor burden as a % of base wage (payroll taxes, workers' comp, benefits). */
  laborBurdenPct: number;
  /** Consumable supplies as a % of fully-burdened labor. */
  suppliesPctOfLabor: number;
  /** Company overhead as a % of direct cost (admin, insurance, vehicles). */
  overheadPct: number;
  /** Target NET profit margin as a % of the sell price. */
  targetMarginPct: number;
  /** Working weeks per month used to convert weekly frequency to monthly. */
  weeksPerMonth: number;
}

/** A category of interior space with its ISSA-style productivity range. */
export interface AreaType {
  id: string;
  label: string;
  /** Seeded production rate in sqft cleaned per labor hour (maintenance). */
  productionRate: number;
  /** Documented market range, shown as guidance. */
  rateRange: [number, number];
}

/** One measured area inside a recurring-cleaning estimate. */
export interface EstimateArea {
  id: string;
  name: string;
  areaTypeId: string;
  sqft: number;
  /** Overrides the AreaType production rate when > 0. */
  productionRateOverride?: number;
}

/** Pricing method used by an extra / specialty service line. */
export type PricingMethod = "area" | "unit" | "time";

/** How a worker/helper is paid for a job. */
export type PayType = "hourly" | "fixed";

/** One worker or helper assigned to an extra-service line. */
export interface CrewMember {
  id: string;
  name: string;
  payType: PayType;
  rate: number; // $/hr if hourly, flat $ if fixed
}

/** A member of the sales team who can be credited on a deal for commission. */
export interface Salesperson {
  id: string;
  name: string;
  commissionPct: number;
}

/** A login that can access the system, managed from /admin. */
export interface TeamUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  proposalCount: number;
}

/** A specialty service definition (window cleaning, pressure washing, ...). */
export interface SpecialtyService {
  id: string;
  label: string;
  method: PricingMethod;
  /** Rate meaning depends on method: $/sqft, $/unit, or $/hour. */
  defaultRate: number;
  rateRange: [number, number];
  unitLabel: string; // e.g. "sq ft", "window", "space", "hour"
  /** Typical minimum charge for this service (USD). */
  minCharge: number;
  /** Rough productivity used to estimate labor hours from quantity. */
  productionRate?: number; // units (or sqft) per labor hour
  /** Which row of the Master Pricing Reference Table this service is scored against. */
  benchmarkId?: string;
}

/**
 * A row of DBS's Master Pricing Reference Table (Policy 01 companion doc):
 * how a healthy job of this service type should divide its selling price.
 * Every field is a % of selling price, and a row should total 100.
 * Validated starting point — recalibrate only with Finance sign-off.
 */
export interface PricingBenchmark {
  id: string;
  label: string;
  laborPct: number;
  chemPct: number;
  machinePct: number;
  padsPct: number;
  waterPct: number;
  vehiclePct: number;
  maintPct: number;
  deprecPct: number;
  adminPct: number;
  commPct: number;
  profitPct: number;
}

/** A single extra-service line item as configured by the user. */
export interface ExtraServiceLine {
  id: string;
  serviceId: string;
  label: string;
  method: PricingMethod;
  quantity: number; // sqft, units, or hours
  rate: number; // market/target rate for the chosen method
  minCharge: number;
  productionRate: number; // units per hour, for labor estimate
  materialsCost: number; // job-specific materials (USD)
  equipmentCost: number; // rentals / consumables (USD)
  tripCharge: number; // mobilization / travel (USD)

  /** "calculated" derives the price from the cost buildup below (default);
   * "fixed" charges the client exactly `fixedSalePrice`, ignoring minCharge. */
  pricingMode: "calculated" | "fixed";
  fixedSalePrice: number;

  workers: CrewMember[];
  helpers: CrewMember[];
  salespersonId: string; // "" = none
  salespersonName: string; // snapshot at time of entry
  commissionPct: number; // snapshot, editable per line
}

/** Recurring-cleaning estimate (the Budget module core). */
export interface Estimate {
  clientName: string;
  propertyName: string;
  areas: EstimateArea[];
  /** Cleaning visits per week. */
  frequencyPerWeek: number;
  /** Extra fixed monthly costs (supervision, equipment lease...). */
  fixedMonthlyCost: number;
}

/** Frequency tokens used in the Scope of Work. */
export type TaskFrequency =
  | "Daily"
  | "3x / week"
  | "Weekly"
  | "Bi-weekly"
  | "Monthly"
  | "Quarterly"
  | "As needed";

export interface ScopeTask {
  id: string;
  description: string;
  frequency: TaskFrequency;
}

export interface ScopeArea {
  id: string;
  name: string;
  tasks: ScopeTask[];
}

export interface ScopeOfWork {
  areas: ScopeArea[];
  notes: string;
}

/** Company / client identity used across BID + SOW. */
export interface CompanyInfo {
  name: string;
  tagline: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  /** Data URL (small image) shown on the BID/proposal header. */
  logoUrl?: string;
}

/** Team-wide defaults applied whenever a new proposal's BID terms are created. */
export interface ProposalDefaults {
  proposalNumberPrefix: string; // e.g. "DBS" -> "DBS-2026-001"
  defaultValidForDays: number;
  defaultContractTermMonths: number;
  defaultPaymentTerms: string;
  defaultProposalNotes: string;
}

export interface ClientInfo {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  propertyAddress: string;
}

export interface BidTerms {
  proposalNumber: string;
  date: string;
  validForDays: number;
  contractTermMonths: number;
  paymentTerms: string;
  startDate: string;
  notes: string;
}

/** Result of the recurring pricing engine. */
export interface EstimateResult {
  totalSqft: number;
  laborHoursPerVisit: number;
  visitsPerMonth: number;
  laborHoursPerMonth: number;
  baseLaborCost: number;
  burdenCost: number;
  fullyBurdenedLabor: number;
  suppliesCost: number;
  fixedMonthlyCost: number;
  directCost: number;
  overheadCost: number;
  totalCost: number;
  profit: number;
  monthlyPrice: number;
  annualPrice: number;
  pricePerVisit: number;
  pricePerSqFtMonth: number;
  effectiveBillRate: number; // $/labor hour
  perArea: AreaBreakdown[];
}

export interface AreaBreakdown {
  id: string;
  name: string;
  sqft: number;
  productionRate: number;
  hoursPerVisit: number;
}

/** Result of a single extra-service line. */
export interface ExtraLineResult {
  id: string;
  label: string;
  laborHours: number;
  workerCost: number;
  helperCost: number;
  baseLaborCost: number; // workerCost + helperCost
  burdenCost: number;
  fullyBurdenedLabor: number;
  suppliesCost: number;
  materialsCost: number;
  equipmentCost: number;
  tripCharge: number;
  directCost: number;
  overheadCost: number;
  totalCost: number;
  commissionAmount: number;
  profit: number; // net of commission
  costBasedPrice: number; // price from cost buildup honoring target margin + commission
  marketPrice: number; // quantity * market rate
  recommendedPrice: number; // max(costBased, min charge), market shown as guide
  marginAtRecommended: number; // realized net margin %, after commission
}

export interface ExtraServicesResult {
  lines: ExtraLineResult[];
  totalCost: number;
  totalRecommendedPrice: number;
  totalProfit: number;
  blendedMarginPct: number;
}
