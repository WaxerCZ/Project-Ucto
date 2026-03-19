import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { createWorkspaceSchema } from "@/lib/validations";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const workspaces = await prisma.workspace.findMany({
    where: { userId: user.id },
    include: {
      workspaceAccounts: {
        include: { account: true },
      },
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workspaces);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: parsed.data.name,
        userId: user.id,
        exerciseId: parsed.data.exerciseId || null,
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
