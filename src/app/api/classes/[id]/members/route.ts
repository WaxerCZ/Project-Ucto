import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-utils";

// DELETE — remove a member from class (teacher only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return notFound("Třída nenalezena");
  if (user.role !== "ADMIN" && cls.teacherId !== user.id) return forbidden();

  const { studentId } = await request.json();
  if (!studentId) return badRequest("studentId je povinný");

  await prisma.classMember.deleteMany({
    where: { classId: id, studentId },
  });

  return NextResponse.json({ success: true });
}
