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

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      exercise: {
        include: {
          exerciseTransactions: isPrivileged ? true : false,
        },
      },
      student: { select: { email: true } },
      workspace: {
        include: {
          transactions: {
            include: {
              entries: { include: { account: true } },
            },
          },
        },
      },
    },
  });

  if (!submission) return notFound("Odevzdání nenalezeno");

  // Students can only see their own submissions
  if (!isPrivileged && submission.studentId !== user.id) {
    return forbidden();
  }

  // Teachers can only see submissions for their exercises
  if (user.role === "TEACHER" && submission.exercise.createdBy !== user.id) {
    return forbidden();
  }

  return NextResponse.json(submission);
}
