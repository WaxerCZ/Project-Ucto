import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound, forbidden } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      exercise: { select: { id: true, title: true } },
      workspaceAccounts: {
        include: { account: true },
        orderBy: { account: { code: "asc" } },
      },
      openingBalances: {
        include: { account: true },
      },
      transactions: {
        include: {
          entries: {
            include: { account: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) return notFound("Pracovní prostor nenalezen");
  if (workspace.userId !== user.id) return forbidden();

  return NextResponse.json(workspace);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return notFound("Pracovní prostor nenalezen");
  if (workspace.userId !== user.id) return forbidden();

  await prisma.workspace.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
