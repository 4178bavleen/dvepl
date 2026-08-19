import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { fetchAwardTenders } from "../../../services/quoteTender.service";
import { syncCustomersFromQuoteTender } from "../../../services/quoteTenderCustomerSync.service";
import { adminLogs } from "../../../services/logger/contextLogger";

async function syncCustomerRoute(
  fastify: FastifyInstance
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Customer"],
        summary: "Sync Customers from Quote Tender Portal",
        description:
          "Imports and updates customers from the Quote Tender portal, linking them to matching sales orders.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const awardTenders = await fetchAwardTenders();

        let tendersArray: any[] = [];
        if (Array.isArray(awardTenders)) {
          tendersArray = awardTenders;
        } else if (awardTenders && Array.isArray((awardTenders as any).data)) {
          tendersArray = (awardTenders as any).data;
        } else if (awardTenders && (awardTenders as any).data && Array.isArray((awardTenders as any).data.data)) {
          tendersArray = (awardTenders as any).data.data;
        }

        fastify.log.info(`Customer sync found ${tendersArray.length} tenders to process.`);

        const customers = await syncCustomersFromQuoteTender(
          fastify.prisma,
          companyId,
          tendersArray
        );

        adminLogs.info("Customers synced from Quote Tender portal", {
          syncedCount: customers.length,
        });

        return reply.status(200).send({
          success: true,
          message: `Synced ${customers.length} customer(s) from Quote Tender portal.`,
          data: customers,
          syncedCount: customers.length,
        });
      } catch (error: any) {
        adminLogs.error("Customer sync failed", { error });

        return reply.status(502).send({
          success: false,
          message: "Failed to sync customers from Quote Tender portal.",
          error: error.message,
        });
      }
    }
  );
}

export default syncCustomerRoute;