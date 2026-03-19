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

  const isPrivileged = user.role === "TEACHER" || user.role === "ADMIN";

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      class: { select: { id: true, name: true } },
      exerciseTransactions: isPrivileged ? true : false,
      submissions: isPrivileged
        ? {
            include: {
              student: { select: { email: true } },
            },
          }
        : {
            where: { studentId: user.id },
          },
    },
  });

  if (!exercise) return notFound("Cvičení nenalezeno");

  // Access check for students: must be member of exercise's class
  if (user.role === "STUDENT" && exercise.classId) {
    const isMember = await prisma.classMember.findFirst({
      where: { classId: exercise.classId, studentId: user.id },
    });
    if (!isMember) return forbidden();
  }

  return NextResponse.json(exercise);
}
