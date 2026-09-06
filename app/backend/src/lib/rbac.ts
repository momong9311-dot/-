import type { FastifyReply, FastifyRequest } from "fastify";
import { getSessionUser, type SessionUser } from "./auth.js";

// Role keys used across the app. Roles themselves live in the DB (Role table);
// these are the built-in keys the MVP reasons about.
export type RoleKey = "designer" | "leader" | "educator" | "admin" | "owner";

declare module "fastify" {
  interface FastifyRequest {
    sessionUser?: SessionUser;
  }
}

// Attaches the session user to the request, or 401s.
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<SessionUser | undefined> {
  const user = await getSessionUser(req);
  if (!user) {
    reply.code(401).send({ error: "unauthenticated" });
    return undefined;
  }
  req.sessionUser = user;
  return user;
}

// Guard factory: only the given roles may pass.
export function requireRole(...roles: RoleKey[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(req, reply);
    if (!user) return;
    if (!roles.includes(user.roleKey as RoleKey)) {
      reply.code(403).send({ error: "forbidden", need: roles, have: user.roleKey });
    }
  };
}

// Common role groups (single source of truth for who can do what).
export const canManageContent: RoleKey[] = ["admin", "educator"];
export const canEvaluate: RoleKey[] = ["admin", "educator", "leader"];
export const canViewAdmin: RoleKey[] = ["admin", "educator", "leader"];
