import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workspaces/:path*",
    "/exercises/:path*",
    "/submissions/:path*",
    "/admin/:path*",
    "/classes/:path*",
    "/api/accounts/:path*",
    "/api/workspaces/:path*",
    "/api/transactions/:path*",
    "/api/exercises/:path*",
    "/api/submissions/:path*",
    "/api/admin/:path*",
    "/api/classes/:path*",
  ],
};
