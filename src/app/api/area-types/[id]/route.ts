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
  const areaType = await prisma.areaType.update({
    where: { id },
    data: {
      label: body.label,
      productionRate: body.productionRate,
      rateRange: body.rateRange,
    },
  });
  return NextResponse.json(areaType);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.areaType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
