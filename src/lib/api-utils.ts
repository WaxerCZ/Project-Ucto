import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type AuthUser = {
  id: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  [key: string]: unknown;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user as AuthUser;
}

export function requireRole(user: AuthUser, ...roles: string[]) {
  return roles.includes(user.role);
}

export function unauthorized() {
  return NextResponse.json({ error: "Neautorizováno" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
}

export function notFound(message = "Nenalezeno") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
