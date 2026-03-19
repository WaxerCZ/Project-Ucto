import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest, notFound } from "@/lib/api-utils";
import { acceptInvitationSchema } from "@/lib/validations";

// POST — accept invitation by token
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = acceptInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token: parsed.data.token },
      include: { class: true },
    });

    if (!invitation) return notFound("Pozvánka nenalezena");

    if (invitation.status === "ACCEPTED") {
      return badRequest("Pozvánka již byla přijata");
    }

    // Check email matches
    if (invitation.email !== user.email) {
      return badRequest("Pozvánka je pro jiný e-mail");
    }

    // Check not already a member
    const existingMember = await prisma.classMember.findFirst({
      where: { classId: invitation.classId, studentId: user.id },
    });
    if (existingMember) {
      // Mark as accepted anyway
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });
      return NextResponse.json({ message: "Již jste členem třídy", class: invitation.class });
    }

    // Accept invitation: create membership and update invitation status
    await prisma.$transaction([
      prisma.classMember.create({
        data: {
          classId: invitation.classId,
          studentId: user.id,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
    ]);

    return NextResponse.json({
      message: "Pozvánka přijata",
      class: invitation.class,
    });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
