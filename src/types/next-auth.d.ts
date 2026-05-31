import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      clinicId: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    clinicId: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    clinicId: string;
    role: Role;
  }
}
