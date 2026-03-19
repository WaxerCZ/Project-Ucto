import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-utils";
import { createInvitationSchema } from "@/lib/validations";

// GET — list invitations for a class
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return notFound("Třída nenalezena");
  if (user.role !== "ADMIN" && cls.teacherId !== user.id) return forbidden();

  const invitations = await prisma.invitation.findMany({
    where: { classId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

// POST — create invitation (teacher owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return notFound("Třída nenalezena");
  if (user.role !== "ADMIN" && cls.teacherId !== user.id) return forbidden();

  try {
    const body = await request.json();
    const parsed = createInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    // Check if student is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existingUser) {
      const existingMember = await prisma.classMember.findFirst({
        where: { classId: id, studentId: existingUser.id },
      });
      if (existingMember) {
        return badRequest("Student je již členem třídy");
      }
    }

    // Check if pending invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: { classId: id, email: parsed.data.email, status: "PENDING" },
    });
    if (existingInvitation) {
      return badRequest("Pozvánka pro tento e-mail již existuje");
    }

    const invitation = await prisma.invitation.create({
      data: {
        classId: id,
        email: parsed.data.email,
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
