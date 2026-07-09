import "dotenv/config";
import buildApp from "../app";
const start = async () => {
  try {
    const fastify = await buildApp();
    const port = fastify.config.PORT || 3000;

    await fastify.listen({ port });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

start();
