import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import privadoRoutes from "./routes/privado.js";

dotenv.config();

const server = Fastify({ logger: true });

await server.register(cors, {
  origin: true,
});

await server.register(privadoRoutes, { prefix: "/privado" });

server.get("/health", async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await server.listen({ port, host });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
