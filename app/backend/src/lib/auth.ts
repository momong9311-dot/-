import bcrypt from "bcryptjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../prisma.js";

export const SESSION_COOKIE = "mm_session";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// The signed cookie stores the user id. Fastify's @fastify/cookie signs/verifies it.
export function setSession(reply: FastifyReply, userId: string) {
  reply.setCookie(SESSION_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    signed: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSession(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  branchId: string | null;
  levelId: string | null;
};

export async function getSessionUser(req: FastifyRequest): Promise<SessionUser | null> {
  const raw = req.cookies[SESSION_COOKIE];
  if (!raw) return null;
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return null;
  const user = await prisma.user.findUnique({
    where: { id: unsigned.value },
    include: { role: true },
  });
  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleKey: user.role.key,
    roleName: user.role.name,
    branchId: user.branchId,
    levelId: user.levelId,
  };
}
