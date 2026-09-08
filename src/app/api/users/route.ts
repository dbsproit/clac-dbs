import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/authz";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { proposals: true } },
    },
  });
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      proposalCount: u._count.proposals,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Only the admin can add team members." }, { status: 403 });
  }

  const body = await req.json();
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  try {
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name || null, passwordHash },
    });
    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, proposalCount: 0 },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
    }
    throw err;
  }
}
