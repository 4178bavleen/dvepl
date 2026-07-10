import Fastify from "fastify";
import fastifyView from "@fastify/view";
import cors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import fastifyJwt from "@fastify/jwt";
import formbody from "@fastify/formbody";
import path from "path";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

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

  fastify.register(fastifyView, {
    engine: { pug: require("pug") },
    root: path.join(__dirname, "views"),
    includeViewExtension: true,
  });

  fastify.get("/", async (req, reply) => {
    return reply.view("index", {
      title: "DVEPL SERVER",
      message: "An ERP portal for DVEPL",
    });
  });

  fastify.addHook("onRequest", async (req, reply) => {
    if (req.url.startsWith("/")) {
      AdminLogger.info(`Api viewed from: ${req.ip}`);
    }
  });

  // Swagger
  fastify.register(swagger, {
    mode: "dynamic",
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Whatsapp Saas API Documentation",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.addHook("onRequest", async (req, reply) => {
    if (req.url.startsWith("/docs")) {
      AdminLogger.info(`Swagger docs viewed from: ${req.ip}`);
    }
  });

  fastify.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "none",
      deepLinking: true,
      persistAuthorization: true,
    },
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
