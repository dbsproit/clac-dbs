// Standalone sanity test for the pricing engine.
// Mirrors src/lib/pricing.ts logic and checks numbers against hand calculations.

const clampPct = (n) => Math.min(Math.max(n, 0), 99.9) / 100;
const applyMargin = (cost, marginPct) => {
  const m = clampPct(marginPct);
  return m >= 1 ? cost : cost / (1 - m);
};

const S = {
  baseWage: 16,
  laborBurdenPct: 20,
  suppliesPctOfLabor: 5,
  overheadPct: 12,
  targetMarginPct: 20,
  weeksPerMonth: 4.33,
};

function computeEstimate(areas, freq, fixed, s) {
  const per = areas.map((a) => ({ ...a, hrs: a.sqft / a.rate }));
  const totalSqft = per.reduce((x, a) => x + a.sqft, 0);
  const hpv = per.reduce((x, a) => x + a.hrs, 0);
  const vpm = freq * s.weeksPerMonth;
  const hpm = hpv * vpm;
  const baseLabor = hpm * s.baseWage;
  const burden = baseLabor * clampPct(s.laborBurdenPct);
  const burdened = baseLabor + burden;
  const supplies = burdened * clampPct(s.suppliesPctOfLabor);
  const direct = burdened + supplies + fixed;
  const overhead = direct * clampPct(s.overheadPct);
  const totalCost = direct + overhead;
  const price = applyMargin(totalCost, s.targetMarginPct);
  return { totalSqft, hpv, vpm, hpm, baseLabor, burdened, supplies, direct, overhead, totalCost, price, profit: price - totalCost };
}

let pass = 0, fail = 0;
const approx = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
function check(name, got, exp) {
  if (approx(got, exp)) { pass++; console.log(`  PASS ${name}: ${got.toFixed(2)} ≈ ${exp}`); }
  else { fail++; console.log(`  FAIL ${name}: got ${got.toFixed(4)}, expected ${exp}`); }
}

console.log("Scenario 1 — default recurring estimate");
const r = computeEstimate(
  [
    { sqft: 6000, rate: 4200 },
    { sqft: 600, rate: 1000 },
    { sqft: 1200, rate: 5500 },
  ],
  5, 0, S
);
check("total sqft", r.totalSqft, 7800);
check("hours/visit", r.hpv, 2.2468);
check("visits/month", r.vpm, 21.65);
check("labor hours/month", r.hpm, 48.643);
check("base labor", r.baseLabor, 778.29);
check("burdened labor", r.burdened, 933.95);
check("supplies", r.supplies, 46.70);
check("direct cost", r.direct, 980.63);
check("overhead", r.overhead, 117.68);
check("total cost", r.totalCost, 1098.32);
check("sell price (20% margin)", r.price, 1372.88);
check("profit", r.profit, 274.58);

// margin realized should equal target
const realized = (r.profit / r.price) * 100;
check("realized margin %", realized, 20);

console.log("\nScenario 2 — margin math edge (50% margin doubles cost basis)");
check("applyMargin 1000 @ 50%", applyMargin(1000, 50), 2000);
check("applyMargin 1000 @ 0%", applyMargin(1000, 0), 1000);

console.log("\nScenario 3 — extra service (window by pane)");
// 200 panes @ 20 panes/hr = 10 labor hrs
const laborHrs = 200 / 20;
const baseLabor = laborHrs * S.baseWage; // 160
const burden = baseLabor * 0.2; // 32
const burdened = baseLabor + burden; // 192
const supplies = burdened * 0.05; // 9.6
const materials = 0, equip = 0, trip = 0;
const direct = burdened + supplies + materials + equip + trip; // 201.6
const overhead = direct * 0.12; // 24.192
const totalCost = direct + overhead; // 225.792
const costPrice = totalCost / 0.8; // 282.24
check("window labor hours", laborHrs, 10);
check("window total cost", totalCost, 225.79);
check("window cost-based price", costPrice, 282.24);
const recommended = Math.max(costPrice, 125); // min charge 125
check("window recommended (>= min)", recommended, 282.24);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
