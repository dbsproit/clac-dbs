import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the Auth.js config — no Prisma/bcrypt imports, since
 * this is loaded by middleware.ts which runs on the Edge runtime.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
