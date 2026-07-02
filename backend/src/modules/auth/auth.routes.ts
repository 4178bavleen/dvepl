import { FastifyInstance } from "fastify";

import { AuthController } from "./auth.controller";

const authController = new AuthController();

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/login",
    authController.login.bind(authController)
  );
}