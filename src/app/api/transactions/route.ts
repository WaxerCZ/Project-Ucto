import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { createTransactionSchema } from "@/lib/validations";
import { Decimal } from "decimal.js";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { workspaceId, description, entries } = parsed.data;

    // Verify workspace ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace || workspace.userId !== user.id) {
      return badRequest("Neplatný pracovní prostor");
    }

    // Validate minimum entries
    if (entries.length < 2) {
      return badRequest("Transakce musí mít alespoň 2 položky");
    }

    // Calculate totals using Decimal for precision
    let totalMD = new Decimal(0);
    let totalDal = new Decimal(0);

    for (const entry of entries) {
      const amount = new Decimal(entry.amount);
      if (amount.lte(0)) {
        return badRequest("Částka musí být kladná");
      }
      if (entry.side === "MD") {
        totalMD = totalMD.plus(amount);
      } else {
        totalDal = totalDal.plus(amount);
      }
    }

    // Hard validation: MD must equal Dal
    if (!totalMD.equals(totalDal)) {
      return NextResponse.json(
        {
          error: "MD a Dal se musí rovnat",
          totalMD: totalMD.toString(),
          totalDal: totalDal.toString(),
        },
        { status: 400 }
      );
    }

    // Verify all accounts exist in workspace
    const workspaceAccounts = await prisma.workspaceAccount.findMany({
      where: { workspaceId },
      select: { accountId: true },
    });
    const validAccountIds = new Set(workspaceAccounts.map((wa: { accountId: string }) => wa.accountId));

    for (const entry of entries) {
      if (!validAccountIds.has(entry.accountId)) {
        return badRequest(`Účet ${entry.accountId} není v pracovním prostoru`);
      }
    }

    // Create transaction and entries atomically
    const transaction = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          workspaceId,
          createdBy: user.id,
          description,
          entries: {
            create: entries.map((entry) => ({
              accountId: entry.accountId,
              side: entry.side,
              amount: new Decimal(entry.amount),
              description: entry.description || null,
            })),
          },
        },
        include: {
          entries: {
            include: { account: true },
          },
        },
      });
      return txn;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
