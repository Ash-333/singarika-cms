import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the config (no Prisma / bcrypt imports) so it can be used
 * from middleware. Providers are added in src/auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "EDITOR";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EDITOR";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      // Admin API routes answer with 401 JSON from their own guard rather than
      // being redirected to the login page.
      if (
        pathname.startsWith("/api/v1") ||
        pathname.startsWith("/api/admin") ||
        pathname.startsWith("/api/auth") ||
        pathname === "/login"
      ) {
        return true;
      }
      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
