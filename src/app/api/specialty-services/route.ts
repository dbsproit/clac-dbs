import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SPECIALTY_SERVICES } from "@/lib/rates";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.specialtyService.count();
  if (count === 0) {
    await prisma.specialtyService.createMany({
      data: DEFAULT_SPECIALTY_SERVICES,
      skipDuplicates: true,
    });
  }

  const specialtyServices = await prisma.specialtyService.findMany({ orderBy: { label: "asc" } });
  return NextResponse.json(specialtyServices);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const specialtyService = await prisma.specialtyService.create({
    data: {
      label: body.label,
      method: body.method,
      defaultRate: body.defaultRate ?? 0,
      rateRange: body.rateRange ?? [0, 0],
      unitLabel: body.unitLabel ?? "",
      minCharge: body.minCharge ?? 0,
      productionRate: body.productionRate,
      benchmarkId: body.benchmarkId,
    },
  });
  return NextResponse.json(specialtyService, { status: 201 });
}
