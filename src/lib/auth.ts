import type { Role } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Adapter } from "next-auth/adapters";
import type { NextAuthOptions } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Enforce secret in production; fail fast at boot
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET is required. Set it in your environment variables."
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma) as Adapter,
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
          if (process.env.NODE_ENV !== "production") {
            console.log(`Login failed: User not found for ${credentials.email}`);
          }
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash || "");

        if (!isValid) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`Login failed: Invalid password for ${credentials.email}`);
          }
          return null;
        }

        if (!user.clinicId) {
          if (process.env.NODE_ENV !== "production") {
            console.error(`CRITICAL ERROR: User ${user.email} has NO clinicId assigned in the database.`);
          }
          // We allow login but the API will reject actions until clinicId is fixed
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          clinicId: user.clinicId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clinicId = user.clinicId;
        if (process.env.NODE_ENV !== "production") {
          console.log(`[JWT] Updated token for ${user.email} with id: ${user.id}`);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clinicId = token.clinicId;
      }
      return session;
    },
  },
};
