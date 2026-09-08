import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_COST_SETTINGS, DEFAULT_COMPANY, DEFAULT_PROPOSAL_DEFAULTS } from "@/lib/rates";

const SETTINGS_ID = "singleton";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) {
    return NextResponse.json({
      costSettings: DEFAULT_COST_SETTINGS,
      company: DEFAULT_COMPANY,
      proposalDefaults: DEFAULT_PROPOSAL_DEFAULTS,
    });
  }
  return NextResponse.json({
    costSettings: settings.costSettings,
    company: settings.company,
    proposalDefaults: settings.proposalDefaults ?? DEFAULT_PROPOSAL_DEFAULTS,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      costSettings: body.costSettings,
      company: body.company,
      proposalDefaults: body.proposalDefaults,
    },
    update: {
      costSettings: body.costSettings,
      company: body.company,
      proposalDefaults: body.proposalDefaults,
    },
  });
  return NextResponse.json({
    costSettings: settings.costSettings,
    company: settings.company,
    proposalDefaults: settings.proposalDefaults ?? DEFAULT_PROPOSAL_DEFAULTS,
  });
}
