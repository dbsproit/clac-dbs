import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/authz";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salespeople = await prisma.salesperson.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(salespeople);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Only the admin can add salespeople." }, { status: 403 });
  }

  const body = await req.json();
  const salesperson = await prisma.salesperson.create({
    data: { name: body.name, commissionPct: body.commissionPct },
  });
  return NextResponse.json(salesperson, { status: 201 });
}
