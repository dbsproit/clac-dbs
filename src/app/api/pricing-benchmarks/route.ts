import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICING_BENCHMARKS } from "@/lib/rates";
import { isAdminEmail } from "@/lib/authz";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.pricingBenchmark.count();
  if (count === 0) {
    // skipDuplicates guards against two concurrent first-load requests both
    // seeing count === 0 and racing to insert the same seed rows.
    await prisma.pricingBenchmark.createMany({
      data: DEFAULT_PRICING_BENCHMARKS,
      skipDuplicates: true,
    });
  }

  const benchmarks = await prisma.pricingBenchmark.findMany({ orderBy: { label: "asc" } });
  return NextResponse.json(benchmarks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Only the admin can add pricing categories." }, { status: 403 });
  }

  const body = await req.json();
  const benchmark = await prisma.pricingBenchmark.create({
    data: {
      label: body.label,
      laborPct: body.laborPct ?? 0,
      chemPct: body.chemPct ?? 0,
      machinePct: body.machinePct ?? 0,
      padsPct: body.padsPct ?? 0,
      waterPct: body.waterPct ?? 0,
      vehiclePct: body.vehiclePct ?? 0,
      maintPct: body.maintPct ?? 0,
      deprecPct: body.deprecPct ?? 0,
      adminPct: body.adminPct ?? 0,
      commPct: body.commPct ?? 0,
      profitPct: body.profitPct ?? 0,
    },
  });
  return NextResponse.json(benchmark, { status: 201 });
}
