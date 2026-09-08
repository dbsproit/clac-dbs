import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AREA_TYPES } from "@/lib/rates";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.areaType.count();
  if (count === 0) {
    await prisma.areaType.createMany({
      data: DEFAULT_AREA_TYPES,
      skipDuplicates: true,
    });
  }

  const areaTypes = await prisma.areaType.findMany({ orderBy: { label: "asc" } });
  return NextResponse.json(areaTypes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const areaType = await prisma.areaType.create({
    data: {
      label: body.label,
      productionRate: body.productionRate ?? 0,
      rateRange: body.rateRange ?? [0, 0],
    },
  });
  return NextResponse.json(areaType, { status: 201 });
}
