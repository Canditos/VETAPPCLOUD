import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Enforce secret in production
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("WARNING: NEXTAUTH_SECRET is missing. Please add it to your environment variables.");
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "temp-fallback-secret-do-not-use-in-prod",
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log(`Login failed: User not found for ${credentials.email}`);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash || "");

        if (!isValid) {
          console.log(`Login failed: Invalid password for ${credentials.email}`);
          return null;
        }

        if (!user.clinicId) {
          console.error(`CRITICAL ERROR: User ${user.email} has NO clinicId assigned in the database.`);
          // We allow login but the API will reject actions until clinicId is fixed
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.clinicId = (user as any).clinicId;
        console.log(`[JWT] Updated token for ${user.email} with clinicId: ${(user as any).clinicId}`);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).clinicId = token.clinicId;
      }
      return session;
    },
  },
};
