import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
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

    // Public registration always creates STUDENT accounts.
    // Only admin can create TEACHER/ADMIN accounts.
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Chyba serveru" },
      { status: 500 }
    );
  }
}
