import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/authz";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Only the admin can edit pricing categories." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const benchmark = await prisma.pricingBenchmark.update({
    where: { id },
    data: {
      label: body.label,
      laborPct: body.laborPct,
      chemPct: body.chemPct,
      machinePct: body.machinePct,
      padsPct: body.padsPct,
      waterPct: body.waterPct,
      vehiclePct: body.vehiclePct,
      maintPct: body.maintPct,
      deprecPct: body.deprecPct,
      adminPct: body.adminPct,
      commPct: body.commPct,
      profitPct: body.profitPct,
    },
  });
  return NextResponse.json(benchmark);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Only the admin can delete pricing categories." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.pricingBenchmark.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
