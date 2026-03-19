import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const accounts = await prisma.account.findMany({
    orderBy: { code: "asc" },
  });

  return NextResponse.json(accounts);
}
