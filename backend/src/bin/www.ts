import "dotenv/config";
import dns from "dns";

// Ensure Node.js resolves cloud hostnames (such as Neon PostgreSQL) even if the local Wi-Fi router DNS drops or refuses queries
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  console.warn("Could not set custom DNS servers:", e);
}

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