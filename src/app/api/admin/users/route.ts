import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-utils";
import { adminUpdateUserSchema } from "@/lib/validations";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: {
        select: {
          workspaces: true,
          submissions: true,
          exercises: true,
          teacherClasses: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// PATCH — update user role or active status (admin only)
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) return badRequest("userId je povinný");

    const parsed = adminUpdateUserSchema.safeParse(updateData);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return notFound("Uživatel nenalezen");

    // Prevent admin from deactivating themselves
    if (userId === user.id && parsed.data.active === false) {
      return badRequest("Nemůžete deaktivovat sami sebe");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
