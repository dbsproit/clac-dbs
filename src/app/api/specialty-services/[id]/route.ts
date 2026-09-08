import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const specialtyService = await prisma.specialtyService.update({
    where: { id },
    data: {
      label: body.label,
      method: body.method,
      defaultRate: body.defaultRate,
      rateRange: body.rateRange,
      unitLabel: body.unitLabel,
      minCharge: body.minCharge,
      productionRate: body.productionRate,
      benchmarkId: body.benchmarkId,
    },
  });
  return NextResponse.json(specialtyService);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.specialtyService.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
