import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound, forbidden, badRequest } from "@/lib/api-utils";
import { setOpeningBalanceSchema } from "@/lib/validations";
import { Decimal } from "decimal.js";

// GET — get opening balances for a workspace
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return notFound("Pracovní prostor nenalezen");
  if (workspace.userId !== user.id) return forbidden();

  const balances = await prisma.openingBalance.findMany({
    where: { workspaceId: id },
    include: { account: true },
    orderBy: { account: { code: "asc" } },
  });

  return NextResponse.json(balances);
}

// POST — set/update opening balance (upsert)
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
    const parsed = setOpeningBalanceSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { accountId, side, amount } = parsed.data;

    // Verify account is in the workspace
    const wa = await prisma.workspaceAccount.findUnique({
      where: { workspaceId_accountId: { workspaceId: id, accountId } },
    });
    if (!wa) return badRequest("Účet není v tomto pracovním prostoru");

    const balance = await prisma.openingBalance.upsert({
      where: { workspaceId_accountId: { workspaceId: id, accountId } },
      update: {
        side,
        amount: new Decimal(amount),
      },
      create: {
        workspaceId: id,
        accountId,
        side,
        amount: new Decimal(amount),
      },
      include: { account: true },
    });

    return NextResponse.json(balance);
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

// DELETE — remove opening balance
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

  await prisma.openingBalance.deleteMany({
    where: { workspaceId: id, accountId },
  });

  return NextResponse.json({ success: true });
}
