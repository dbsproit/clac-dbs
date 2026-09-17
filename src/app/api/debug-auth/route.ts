import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const steps: Record<string, unknown> = {};
  try {
    steps.env = {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
    };

    const user = await prisma.user.findUnique({
      where: { email: "it@dbspro.com" },
    });
    steps.userFound = !!user;
    steps.hasHash = !!user?.passwordHash;

    if (user) {
      const valid = await bcrypt.compare("Xpolt9898@@", user.passwordHash);
      steps.bcryptValid = valid;
    }

    return NextResponse.json({ ok: true, steps });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      steps,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
