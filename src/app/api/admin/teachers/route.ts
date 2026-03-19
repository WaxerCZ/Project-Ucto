import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/api-utils";
import { adminCreateTeacherSchema } from "@/lib/validations";

// POST — create a teacher account (admin only)
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const parsed = adminCreateTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "E-mail je již registrován" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const teacher = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "TEACHER",
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
