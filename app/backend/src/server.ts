import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { authRoutes } from "./routes/auth.js";
import { catalogRoutes } from "./routes/catalog.js";
import { designerRoutes } from "./routes/designer.js";
import { practiceRoutes } from "./routes/practice.js";
import { evaluationRoutes } from "./routes/evaluation.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { adminRoutes } from "./routes/admin.js";

const PORT = Number(process.env.PORT ?? 4000);
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-insecure-change-me-please-32chars-min";
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim());

const app = Fastify({ logger: false });

// --- CORS (credentialed): reflect allowed origins, allow cookies. ---
app.addHook("onRequest", async (req, reply) => {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", origin);
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.header("Vary", "Origin");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") reply.code(204).send();
});

await app.register(cookie, { secret: SESSION_SECRET });

await app.register(authRoutes);
await app.register(catalogRoutes);
await app.register(designerRoutes);
await app.register(practiceRoutes);
await app.register(evaluationRoutes);
await app.register(feedbackRoutes);
await app.register(adminRoutes);

app.get("/api/health", async () => ({ ok: true }));

app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => console.log(`[backend] listening on http://localhost:${PORT}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
