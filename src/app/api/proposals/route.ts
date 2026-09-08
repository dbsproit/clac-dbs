import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proposals = await prisma.proposal.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      client: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { name: true, email: true } },
    },
  });
  return NextResponse.json(proposals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const proposal = await prisma.proposal.create({
    data: {
      title: body.title,
      client: body.client,
      estimate: body.estimate,
      extraLines: body.extraLines,
      scope: body.scope,
      bid: body.bid,
      createdById: session.user.id,
    },
  });
  return NextResponse.json(proposal, { status: 201 });
}
