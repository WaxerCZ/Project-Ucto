import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest, notFound, forbidden } from "@/lib/api-utils";
import { submitExerciseSchema } from "@/lib/validations";
import { Decimal } from "decimal.js";

interface ExpectedEntry {
  accountCode: string;
  side: "MD" | "DAL";
  amount: string;
}

interface ExpectedTransaction {
  description: string;
  entries: ExpectedEntry[];
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = submitExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { exerciseId, workspaceId } = parsed.data;

    // Verify exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: { exerciseTransactions: true },
    });
    if (!exercise) return notFound("Cvičení nenalezeno");

    // Verify workspace ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        transactions: {
          include: {
            entries: {
              include: { account: true },
            },
          },
        },
      },
    });
    if (!workspace) return notFound("Pracovní prostor nenalezen");
    if (workspace.userId !== user.id) return forbidden();

    // Evaluate submission
    const result = evaluateSubmission(
      workspace.transactions,
      exercise.exerciseTransactions
    );

    const submission = await prisma.submission.create({
      data: {
        exerciseId,
        studentId: user.id,
        workspaceId,
        score: new Decimal(result.score),
        isCorrect: result.isCorrect,
        feedback: result.feedback,
      },
    });

    return NextResponse.json({
      ...submission,
      feedback: result.feedback,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const submissions = await prisma.submission.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : user.role === "TEACHER"
          ? { exercise: { createdBy: user.id } }
          : { studentId: user.id },
    include: {
      exercise: { select: { title: true, difficulty: true } },
      student: { select: { email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(submissions);
}

function evaluateSubmission(
  studentTransactions: Array<{
    description: string;
    entries: Array<{
      account: { code: string };
      side: string;
      amount: unknown;
    }>;
  }>,
  exerciseTransactions: Array<{ expectedData: unknown }>
) {
  const feedback: Array<{
    expectedIndex: number;
    status: string;
    details: string;
  }> = [];

  let correctCount = 0;
  const totalExpected = exerciseTransactions.length;

  for (let i = 0; i < exerciseTransactions.length; i++) {
    const expected = exerciseTransactions[i].expectedData as ExpectedTransaction;
    const expectedEntries = expected.entries;

    // Try to find a matching student transaction
    let matched = false;

    for (const studentTxn of studentTransactions) {
      const studentEntries = studentTxn.entries.map((e) => ({
        accountCode: e.account.code,
        side: e.side,
        amount: new Decimal(String(e.amount)).toString(),
      }));

      // Check if all expected entries are present
      const allEntriesMatch = expectedEntries.every((expEntry) =>
        studentEntries.some(
          (sEntry) =>
            sEntry.accountCode === expEntry.accountCode &&
            sEntry.side === expEntry.side &&
            new Decimal(sEntry.amount).equals(new Decimal(expEntry.amount))
        )
      );

      if (allEntriesMatch && studentEntries.length === expectedEntries.length) {
        matched = true;
        break;
      }
    }

    if (matched) {
      correctCount++;
      feedback.push({
        expectedIndex: i,
        status: "correct",
        details: `Transakce ${i + 1}: Správně`,
      });
    } else {
      feedback.push({
        expectedIndex: i,
        status: "incorrect",
        details: `Transakce ${i + 1}: Nesprávně - zkontrolujte účty, strany a částky`,
      });
    }
  }

  const score = totalExpected > 0 ? (correctCount / totalExpected) * 100 : 0;

  return {
    score,
    isCorrect: correctCount === totalExpected,
    feedback,
  };
}
