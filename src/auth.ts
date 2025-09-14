// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const dashboardPath = "/faculty/dashboard";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret:
        process.env.Google_CLIENT_SECRET ||
        process.env.GOOGLE_CLIENT_SECRET ||
        "",
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account }) {
      return !!account && account.provider === "google";
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.name = profile.name ?? token.name;
        token.email = (profile as any).email ?? token.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name =
          (token.name as string) ?? session.user.name ?? "Faculty";
        session.user.email =
          (token.email as string) ?? session.user.email ?? "";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If NextAuth passes an absolute url under this origin, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // If it is a relative path, allow it
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Default to Faculty Dashboard
      return `${baseUrl}${dashboardPath}`;
    },
  },
});
