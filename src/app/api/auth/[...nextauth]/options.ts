import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
// You can add more providers (see https://next-auth.js.org/providers/)

import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // add more providers here as needed
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login", // Optional: custom login page
    // signOut: '/logout', // Optional
    // error: '/auth/error', // Optional
  },
  callbacks: {
    async session({ session, token }) {
      // Add user id and any extra info you want to session
      if (session?.user && token?.sub) {
        (session.user as any).id = token.sub;
      }
      // Optionally add email (redundant, usually present)
      // (session.user as any).email = token.email
      return session;
    },
    // Optionally, customize JWT callback if you want:
    // async jwt({ token, user, account }) { ... },
  },
  // Optionally, enable debug for local development
  // debug: process.env.NODE_ENV === "development",
  // theme: { colorScheme: 'light' }, // Or dark
};
