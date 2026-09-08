import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Self-service: every operation here targets the caller's own session id —
// there is no [id] param, so there is no way to act on anyone else's account.

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const current = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const emailChanging = body.email !== undefined && body.email !== current.email;
  const wantsSensitiveChange = Boolean(body.newPassword) || emailChanging;

  if (wantsSensitiveChange) {
    if (!body.currentPassword) {
      return NextResponse.json(
        { error: "Enter your current password to change your email or password." },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(body.currentPassword, current.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
  }

  const data: { name?: string | null; email?: string; passwordHash?: string } = {};
  if (body.name !== undefined) data.name = body.name || null;
  if (body.email !== undefined) data.email = body.email;
  if (body.newPassword) data.passwordHash = await bcrypt.hash(body.newPassword, 10);

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    throw err;
  }
}
