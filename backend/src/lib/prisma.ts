

import dns from "dns";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 0. Transparently route DNS lookups for Neon through public DNS if local router refuses
const origLookup = dns.lookup;
const resolver = new dns.Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

(dns as any).lookup = function (
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: any, family?: number) => void
) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  if (hostname && (hostname.includes("neon.tech") || hostname.includes("aws"))) {
    resolver.resolve4(hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        const ip = addresses[0];
        if (options && options.all) {
          return callback(null, [{ address: ip, family: 4 }]);
        }
        return callback(null, ip, 4);
      }
      return origLookup(hostname, options, callback);
    });
    return;
  }

  return origLookup(hostname, options, callback);
};

// 1. Extend the globalThis object so TypeScript recognizes our prisma variable
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return new PrismaClient();
  }

  try {
    const requiresSsl = /(?:^|[?&])sslmode=(?:require|verify-ca|verify-full)(?:&|$)/i.test(connectionString);
    const pool = new Pool({
      connectionString,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("PrismaPg adapter initialization failed, falling back:", err);
    return new PrismaClient();
  }
}

// 2. Instantiate PrismaClient if it doesn't already exist on the global object
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 3. In development, save the instance to the global object to prevent
//    re-instantiation during hot reloads.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}