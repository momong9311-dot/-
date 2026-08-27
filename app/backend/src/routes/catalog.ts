import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { requireAuth } from "../lib/rbac.js";

// Reference data (Levels, Skills, Areas, Roles, Branches) — all DATA, editable.
export async function catalogRoutes(app: FastifyInstance) {
  app.get("/api/levels", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    return prisma.level.findMany({ orderBy: { order: "asc" } });
  });

  app.get("/api/education-areas", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    return prisma.educationArea.findMany({
      orderBy: { order: "asc" },
      include: { skills: { orderBy: { order: "asc" } } },
    });
  });

  app.get("/api/skills", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    return prisma.skill.findMany({
      orderBy: { order: "asc" },
      include: { educationArea: true },
    });
  });

  app.get("/api/roles", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    return prisma.role.findMany();
  });

  app.get("/api/branches", async (req, reply) => {
    if (!(await requireAuth(req, reply))) return;
    return prisma.branch.findMany({ where: { isActive: true } });
  });
}
