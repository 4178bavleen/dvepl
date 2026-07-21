import "dotenv/config";
import buildApp from "../app";

const start = async () => {
  try {
    const fastify = await buildApp();

    const port = Number(process.env.PORT || fastify.config.PORT || 3000);

    await fastify.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`🚀 Server running on port ${port}`);
  } catch (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
};

start();