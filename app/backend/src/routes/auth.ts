import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { clearSession, getSessionUser, setSession, verifyPassword } from "../lib/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_input" });
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user || !user.isActive) return reply.code(401).send({ error: "invalid_credentials" });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "invalid_credentials" });

    setSession(reply, user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleKey: user.role.key,
      roleName: user.role.name,
      levelId: user.levelId,
      branchId: user.branchId,
    };
  });

  app.post("/api/auth/logout", async (_req, reply) => {
    clearSession(reply);
    return { ok: true };
  });

  app.get("/api/auth/me", async (req, reply) => {
    const user = await getSessionUser(req);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    return user;
  });
}
