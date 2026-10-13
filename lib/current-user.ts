import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

// Seeded-user switcher: no auth (DECISIONS #14). The selected user id lives in a cookie.
export const USER_COOKIE = "userId";

/** The selected user, falling back to the first seeded non-admin user. */
export async function getCurrentUser(): Promise<User | null> {
  const id = (await cookies()).get(USER_COOKIE)?.value;
  const selected = id ? await db.user.findUnique({ where: { id } }) : null;
  return selected ?? (await db.user.findFirst({ where: { role: "user" }, orderBy: { name: "asc" } }));
}

export async function setCurrentUser(userId: string): Promise<void> {
  (await cookies()).set(USER_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
}
