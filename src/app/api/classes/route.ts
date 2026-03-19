import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest } from "@/lib/api-utils";
import { createClassSchema } from "@/lib/validations";

// GET — list classes (teacher sees own, admin sees all, student sees joined)
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let classes;

  if (user.role === "ADMIN") {
    classes = await prisma.class.findMany({
      include: {
        teacher: { select: { email: true } },
        _count: { select: { members: true, exercises: true, invitations: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (user.role === "TEACHER") {
    classes = await prisma.class.findMany({
      where: { teacherId: user.id },
      include: {
        teacher: { select: { email: true } },
        _count: { select: { members: true, exercises: true, invitations: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Student — show classes they're a member of
    classes = await prisma.class.findMany({
      where: {
        members: { some: { studentId: user.id } },
      },
      include: {
        teacher: { select: { email: true } },
        _count: { select: { members: true, exercises: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(classes);
}

// POST — create class (teacher only)
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "TEACHER" && user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const cls = await prisma.class.create({
      data: {
        name: parsed.data.name,
        teacherId: user.id,
      },
      include: {
        teacher: { select: { email: true } },
      },
    });

    return NextResponse.json(cls, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
