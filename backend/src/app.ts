import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import fastifyJwt from "@fastify/jwt";
import formbody from "@fastify/formbody";
import path from "path";


//Logger
import { adminLogs as AdminLogger } from "./services/logger/contextLogger";

//Route Groups
import adminRouteGroup from "./routes/admin/index";

//Plugins
import authPlugin from "./plugins/authPlugin";
import prismaPlugin from "./plugins/prismaPlugin";
import utilsPlugin from "./plugins/utilsPlugin";

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
  });

  // Plugins
  fastify.register(authPlugin);
  fastify.register(prismaPlugin);
  fastify.register(utilsPlugin);

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "SecretKey",
  });

  // Register plugins
  fastify.register(cors, {
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  });

  
  fastify.get("/", async () => {
    return {
      success: true,
      status: "healthy",
      message: "DVEPL Backend API is running",
      timestamp: new Date().toISOString(),
    };
  });

  fastify.addHook("onRequest", async (req, reply) => {
    if (req.url.startsWith("/")) {
      AdminLogger.info(`Api viewed from: ${req.ip}`);
    }
  });

  fastify.register(formbody);

  // ✅ Register environment variables
  const schema = {
    type: "object",
    required: ["PORT"],
    properties: {
      PORT: { type: "number", default: 8000 },
      NODE_ENV: { type: "string", default: "development" },
      APP_NAME: { type: "string", default: "FastifyApp" },
    },
  };

  await fastify.register(fastifyEnv, {
    dotenv: {
      path: path.join(__dirname, "../.env"),
      debug: true,
    },
    schema,
  });

  // Register routes
  fastify.register(adminRouteGroup, { prefix: "/admin" });

  // ✅ Wait until Fastify is fully ready (plugins loaded)
  await fastify.ready();

  return fastify;
}

export default buildApp;
