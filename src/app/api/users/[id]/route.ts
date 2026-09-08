import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
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
    return NextResponse.json({ error: "Only the admin can edit team members." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: { name?: string | null; email?: string; passwordHash?: string } = {};
  if (body.name !== undefined) data.name = body.name || null;
  if (body.email !== undefined) data.email = body.email;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: { select: { proposals: true } },
      },
    });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      proposalCount: user._count.proposals,
    });
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Only the admin can delete team members." }, { status: 403 });
  }

  const { id } = await params;

  if (session.user.id === id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const totalUsers = await prisma.user.count();
  if (totalUsers <= 1) {
    return NextResponse.json({ error: "Can't delete the last remaining user." }, { status: 400 });
  }

  const proposalCount = await prisma.proposal.count({ where: { createdById: id } });
  if (proposalCount > 0) {
    return NextResponse.json(
      {
        error: `This user has ${proposalCount} saved proposal${proposalCount === 1 ? "" : "s"}. Remove or reassign them before deleting the user.`,
      },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
