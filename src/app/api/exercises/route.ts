import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/api-utils";
import { createExerciseSchema } from "@/lib/validations";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  // Students see exercises from their classes; teachers see own; admin sees all
  let whereClause = {};
  if (user.role === "STUDENT") {
    const memberOf = await prisma.classMember.findMany({
      where: { studentId: user.id },
      select: { classId: true },
    });
    const classIds = memberOf.map((m: any) => m.classId);
    whereClause = { classId: { in: classIds } };
  } else if (user.role === "TEACHER") {
    whereClause = { createdBy: user.id };
  }
  // ADMIN: no filter

  const exercises = await prisma.exercise.findMany({
    where: whereClause,
    include: {
      user: { select: { email: true } },
      class: { select: { id: true, name: true } },
      _count: { select: { submissions: true, exerciseTransactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exercises);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "TEACHER" && user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const parsed = createExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { title, description, difficulty, classId, expectedTransactions } = parsed.data;

    // Verify classId belongs to teacher
    if (classId) {
      const cls = await prisma.class.findUnique({ where: { id: classId } });
      if (!cls || (user.role === "TEACHER" && cls.teacherId !== user.id)) {
        return badRequest("Neplatná třída");
      }
    }

    const exercise = await prisma.$transaction(async (tx: any) => {
      const ex = await tx.exercise.create({
        data: {
          title,
          description,
          difficulty,
          createdBy: user.id,
          classId: classId || null,
        },
      });

      for (const txn of expectedTransactions) {
        await tx.exerciseTransaction.create({
          data: {
            exerciseId: ex.id,
            expectedData: txn,
          },
        });
      }

      return tx.exercise.findUnique({
        where: { id: ex.id },
        include: { exerciseTransactions: true, class: { select: { id: true, name: true } } },
      });
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
