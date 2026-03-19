import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from "@/lib/api-utils";
import { addWorkspaceAccountSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return notFound("Pracovní prostor nenalezen");
  if (workspace.userId !== user.id) return forbidden();

  try {
    const body = await request.json();
    const parsed = addWorkspaceAccountSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const account = await prisma.account.findUnique({
      where: { id: parsed.data.accountId },
    });
    if (!account) return notFound("Účet nenalezen");

    const existing = await prisma.workspaceAccount.findUnique({
      where: {
        workspaceId_accountId: {
          workspaceId: id,
          accountId: parsed.data.accountId,
        },
      },
    });
    if (existing) {
      return badRequest("Účet je již v pracovním prostoru");
    }

    const wa = await prisma.workspaceAccount.create({
      data: {
        workspaceId: id,
        accountId: parsed.data.accountId,
      },
      include: { account: true },
    });

    return NextResponse.json(wa, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return notFound("Pracovní prostor nenalezen");
  if (workspace.userId !== user.id) return forbidden();

  const { accountId } = await request.json();
  if (!accountId) return badRequest("accountId je povinný");

  await prisma.workspaceAccount.deleteMany({
    where: { workspaceId: id, accountId },
  });

  return NextResponse.json({ success: true });
}
