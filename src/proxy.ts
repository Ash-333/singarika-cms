import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed the `middleware` convention to `proxy`; it runs on the
// Node.js runtime. NextAuth's `auth` wrapper applies the `authorized` callback
// in src/auth.config.ts to every matched request.
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    // Everything except static assets, the public API and the auth endpoints.
    "/((?!api/v1|api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
