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
    return NextResponse.json({ error: "Only the admin can edit salespeople." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const salesperson = await prisma.salesperson.update({
    where: { id },
    data: { name: body.name, commissionPct: body.commissionPct },
  });
  return NextResponse.json(salesperson);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Only the admin can delete salespeople." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.salesperson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
