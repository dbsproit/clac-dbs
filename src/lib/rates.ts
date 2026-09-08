// =============================================================================
// Market default rates & catalogs (US 2025–2026).
// Every value here is a SEED — the user can override it in Settings.
// See project doc "market-rates-research.md" for sources.
// =============================================================================

import type {
  AreaType,
  CostSettings,
  SpecialtyService,
  CompanyInfo,
  PricingBenchmark,
  ProposalDefaults,
} from "./types";

export const DEFAULT_COST_SETTINGS: CostSettings = {
  baseWage: 16,
  laborBurdenPct: 20,
  suppliesPctOfLabor: 5,
  overheadPct: 12,
  targetMarginPct: 20,
  weeksPerMonth: 4.33,
};

// ISSA-style production rates (sqft cleaned per labor hour, maintenance level).
//
// This is the one-time seed for the AreaType table (see /api/area-types,
// which auto-seeds on first read) — ids match EstimateArea.areaTypeId
// values already saved in existing proposals. Once seeded, the database is
// authoritative; edit values from Rates, not here.
export const DEFAULT_AREA_TYPES: AreaType[] = [
  { id: "office", label: "Office space", productionRate: 4200, rateRange: [3500, 5000] },
  { id: "lobby", label: "Lobby & corridors", productionRate: 5500, rateRange: [5000, 6000] },
  { id: "conference", label: "Conference rooms", productionRate: 3500, rateRange: [3000, 4000] },
  { id: "restroom", label: "Restrooms", productionRate: 1000, rateRange: [800, 1200] },
  { id: "breakroom", label: "Break room / cafeteria", productionRate: 3100, rateRange: [2800, 3500] },
  { id: "medical", label: "Medical / clinical", productionRate: 2100, rateRange: [1800, 2500] },
  { id: "classroom", label: "Classroom", productionRate: 3800, rateRange: [3500, 4200] },
  { id: "gym", label: "Gymnasium", productionRate: 5700, rateRange: [5000, 6500] },
  { id: "warehouse", label: "Warehouse", productionRate: 6000, rateRange: [5000, 7000] },
  { id: "manufacturing", label: "Manufacturing floor", productionRate: 4700, rateRange: [4000, 5500] },
  { id: "elevator", label: "Elevators", productionRate: 600, rateRange: [500, 700] },
  { id: "general", label: "General / other", productionRate: 4000, rateRange: [3000, 5000] },
];

// Specialty / extra services. Rates are market midpoints; ranges shown as
// guidance.
//
// This is the one-time seed for the SpecialtyService table (see
// /api/specialty-services, which auto-seeds on first read) — ids match
// ExtraServiceLine.serviceId values already saved in existing proposals.
// Once seeded, the database is authoritative; edit values from Rates, not
// here.
export const DEFAULT_SPECIALTY_SERVICES: SpecialtyService[] = [
  {
    id: "window-sqft",
    label: "Window cleaning (by area)",
    method: "area",
    defaultRate: 0.75,
    rateRange: [0.5, 1.0],
    unitLabel: "sq ft of glass",
    minCharge: 125,
    productionRate: 300, // sqft of glass per hour
    benchmarkId: "window-cleaning",
  },
  {
    id: "window-pane",
    label: "Window cleaning (per pane)",
    method: "unit",
    defaultRate: 6,
    rateRange: [4, 8],
    unitLabel: "pane",
    minCharge: 125,
    productionRate: 20, // panes per hour
    benchmarkId: "window-cleaning",
  },
  {
    id: "window-storefront",
    label: "Storefront windows (flat/visit)",
    method: "unit",
    defaultRate: 55,
    rateRange: [40, 75],
    unitLabel: "storefront visit",
    minCharge: 55,
    productionRate: 1.5, // storefronts per hour
    benchmarkId: "window-cleaning",
  },
  {
    id: "pressure-basic",
    label: "Pressure washing (flat / light soil)",
    method: "area",
    defaultRate: 0.22,
    rateRange: [0.1, 0.35],
    unitLabel: "sq ft",
    minCharge: 250,
    productionRate: 1500, // sqft per hour
    benchmarkId: "pressure-washing",
  },
  {
    id: "pressure-intensive",
    label: "Pressure washing (heavy soil / degrease)",
    method: "area",
    defaultRate: 0.65,
    rateRange: [0.4, 1.0],
    unitLabel: "sq ft",
    minCharge: 350,
    productionRate: 800,
    benchmarkId: "pressure-washing",
  },
  {
    id: "pressure-lot",
    label: "Parking lot / garage (per space)",
    method: "unit",
    defaultRate: 12,
    rateRange: [8, 20],
    unitLabel: "space",
    minCharge: 300,
    productionRate: 12, // spaces per hour
    benchmarkId: "pressure-washing",
  },
  {
    id: "dumpster-pad",
    label: "Dumpster pad degrease",
    method: "area",
    defaultRate: 0.9,
    rateRange: [0.75, 1.0],
    unitLabel: "sq ft",
    minCharge: 150,
    productionRate: 500,
    benchmarkId: "specialty-other",
  },
  {
    id: "carpet",
    label: "Carpet cleaning (extraction)",
    method: "area",
    defaultRate: 0.35,
    rateRange: [0.25, 0.5],
    unitLabel: "sq ft",
    minCharge: 150,
    productionRate: 1000,
    benchmarkId: "carpet-cleaning",
  },
  {
    id: "floor-wax",
    label: "Floor strip & wax",
    method: "area",
    defaultRate: 0.4,
    rateRange: [0.3, 0.5],
    unitLabel: "sq ft",
    minCharge: 200,
    productionRate: 400,
    benchmarkId: "floor-stripping-waxing",
  },
  {
    id: "custom-time",
    label: "Custom job (by labor hours)",
    method: "time",
    defaultRate: 55,
    rateRange: [45, 100],
    unitLabel: "labor hour",
    minCharge: 150,
    productionRate: 1,
    benchmarkId: "specialty-other",
  },
];

// DBS Master Pricing Reference Table (Policy 01 companion) — how a healthy
// job of each service type should divide its selling price. Validated
// starting point; recalibrate only with 3–6 months of actuals + Finance
// sign-off (see doc header). Every row totals 100%.
//
// This is the one-time seed for the PricingBenchmark table (see
// /api/pricing-benchmarks, which auto-seeds on first read) — ids match the
// benchmarkId values on DEFAULT_SPECIALTY_SERVICES above. Once seeded, the database
// is authoritative; edit values from the /admin page, not here.
export const DEFAULT_PRICING_BENCHMARKS: PricingBenchmark[] = [
  { id: "grout-tile-steam", label: "Grout / Tile / Steam", laborPct: 38, chemPct: 4, machinePct: 4, padsPct: 2, waterPct: 1, vehiclePct: 3, maintPct: 2, deprecPct: 2, adminPct: 4, commPct: 10, profitPct: 30 },
  { id: "carpet-cleaning", label: "Carpet Cleaning", laborPct: 35, chemPct: 5, machinePct: 5, padsPct: 1, waterPct: 1, vehiclePct: 3, maintPct: 2, deprecPct: 3, adminPct: 5, commPct: 10, profitPct: 30 },
  { id: "floor-stripping-waxing", label: "Floor Stripping & Waxing", laborPct: 32, chemPct: 8, machinePct: 4, padsPct: 3, waterPct: 1, vehiclePct: 3, maintPct: 2, deprecPct: 3, adminPct: 4, commPct: 10, profitPct: 30 },
  { id: "floor-scrub-autoscrub", label: "Floor Scrub / Auto-Scrub", laborPct: 35, chemPct: 5, machinePct: 5, padsPct: 2, waterPct: 1, vehiclePct: 3, maintPct: 2, deprecPct: 2, adminPct: 5, commPct: 10, profitPct: 30 },
  { id: "window-cleaning", label: "Window Cleaning", laborPct: 40, chemPct: 3, machinePct: 2, padsPct: 1, waterPct: 1, vehiclePct: 4, maintPct: 2, deprecPct: 2, adminPct: 5, commPct: 10, profitPct: 30 },
  { id: "pressure-washing", label: "Pressure Washing", laborPct: 32, chemPct: 3, machinePct: 7, padsPct: 0, waterPct: 4, vehiclePct: 4, maintPct: 3, deprecPct: 4, adminPct: 3, commPct: 10, profitPct: 30 },
  { id: "deep-cleaning", label: "Deep Cleaning", laborPct: 40, chemPct: 6, machinePct: 2, padsPct: 1, waterPct: 1, vehiclePct: 3, maintPct: 1, deprecPct: 1, adminPct: 5, commPct: 10, profitPct: 30 },
  { id: "upholstery-chair", label: "Upholstery / Chair", laborPct: 38, chemPct: 5, machinePct: 4, padsPct: 1, waterPct: 1, vehiclePct: 3, maintPct: 2, deprecPct: 2, adminPct: 4, commPct: 10, profitPct: 30 },
  { id: "grout-restoration", label: "Grout Restoration", laborPct: 40, chemPct: 5, machinePct: 3, padsPct: 2, waterPct: 1, vehiclePct: 3, maintPct: 2, deprecPct: 2, adminPct: 2, commPct: 10, profitPct: 30 },
  { id: "specialty-other", label: "Specialty / Other", laborPct: 37, chemPct: 5, machinePct: 4, padsPct: 2, waterPct: 1, vehiclePct: 3, maintPct: 2, deprecPct: 2, adminPct: 4, commPct: 10, profitPct: 30 },
];

export const DEFAULT_COMPANY: CompanyInfo = {
  name: "DBS Building Services",
  tagline: "Professional Janitorial & Commercial Cleaning",
  contactName: "",
  email: "info@dbspro.com",
  phone: "",
  website: "dbspro.com",
  address: "",
  logoUrl: "",
};

// Team-wide defaults for new BID terms — editable under Rates & Settings ->
// Proposal defaults. See ProposalDefaults in types.ts.
export const DEFAULT_PROPOSAL_DEFAULTS: ProposalDefaults = {
  proposalNumberPrefix: "DBS",
  defaultValidForDays: 30,
  defaultContractTermMonths: 12,
  defaultPaymentTerms: "Net 30, invoiced monthly",
  defaultProposalNotes:
    "Pricing includes all labor, supervision, cleaning supplies, and equipment. Consumable restroom products (paper, soap) billed at cost unless otherwise agreed.",
};

// Ready-made task libraries for the Scope of Work builder, keyed by area type.
export const SCOPE_TASK_LIBRARY: Record<string, string[]> = {
  office: [
    "Empty all trash and replace liners",
    "Dust horizontal surfaces, desks, and partitions",
    "Vacuum all carpeted areas",
    "Sweep and damp mop hard floors",
    "Spot clean glass doors and interior partitions",
    "Sanitize high-touch points (door handles, light switches)",
    "Dust vents, sills, and blinds",
  ],
  restroom: [
    "Clean and disinfect toilets, urinals, and sinks",
    "Refill soap, paper towels, and toilet tissue",
    "Empty sanitary and trash receptacles",
    "Clean and polish mirrors and fixtures",
    "Sweep and disinfect-mop floors",
    "Spot clean walls, partitions, and doors",
    "Descale fixtures and detail grout",
  ],
  lobby: [
    "Clean entrance glass inside and out (reachable)",
    "Vacuum entry mats and carpets",
    "Sweep and mop hard floors",
    "Dust and wipe reception surfaces",
    "Sanitize high-touch points",
    "Spot clean walls and elevator interiors",
  ],
  breakroom: [
    "Wipe and sanitize tables, chairs, and counters",
    "Clean exterior of appliances (microwave, fridge)",
    "Clean and sanitize sink",
    "Empty trash and recycling, replace liners",
    "Sweep and mop floors",
    "Restock supplies (paper towels, soap)",
  ],
  floors: [
    "Machine scrub hard floors",
    "Buff / burnish resilient floors",
    "Strip and re-wax VCT",
    "Carpet extraction / deep clean",
    "Grout deep clean and seal",
  ],
  general: [
    "Empty all trash and replace liners",
    "Dust horizontal surfaces",
    "Vacuum carpeted areas",
    "Sweep and mop hard floors",
    "Sanitize high-touch points",
    "Clean interior glass (reachable)",
  ],
};
