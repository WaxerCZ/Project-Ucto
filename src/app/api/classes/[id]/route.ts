import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound } from "@/lib/api-utils";

// GET — class detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, email: true } },
      members: {
        include: {
          student: { select: { id: true, email: true } },
        },
        orderBy: { joinedAt: "desc" },
      },
      invitations: {
        orderBy: { createdAt: "desc" },
      },
      exercises: {
        select: { id: true, title: true, difficulty: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) return notFound("Třída nenalezena");

  // Access check: admin can see all, teacher must own, student must be member
  if (user.role === "ADMIN") {
    // OK
  } else if (user.role === "TEACHER") {
    if (cls.teacherId !== user.id) return forbidden();
  } else {
    const isMember = cls.members.some((m: any) => m.studentId === user.id);
    if (!isMember) return forbidden();
  }

  return NextResponse.json(cls);
}

// DELETE — delete class (teacher owner or admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return notFound("Třída nenalezena");

  if (user.role !== "ADMIN" && cls.teacherId !== user.id) return forbidden();

  await prisma.class.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
