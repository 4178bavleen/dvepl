import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";


async function adminVendorReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {


  fastify.get(
    "/",
    {
      schema: {
        tags: ["Vendor"],
        summary: "Read Vendors",
        description: "Get all vendors",
      },
    },


    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {


      try {


        // ==========================
        // Fetch Vendors
        // ==========================


        const vendors =
          await fastify.prisma.vendor.findMany({

            where: {

              deletedAt: null,

            },


            include: {


              company: {

                select: {

                  id: true,

                  name: true,

                },

              },


              createdBy: {

                select: {

                  id: true,

                  name: true,

                  email: true,

                },

              },


              revisions: {

                select: {

                  id: true,

                  action: true,

                  createdAt: true,

                },


                orderBy: {

                  createdAt: "desc",

                },

              },


            },


            orderBy: {

              createdAt: "desc",

            },


          });



        // ==========================
        // Attach Custom Field Values
        // ==========================
        const { CustomFieldService } = await import("../../../services/customFieldService");
        const cfService = new CustomFieldService(fastify.prisma);
        const entityIds = vendors.map(v => v.id);
        const cfValuesMap = await cfService.getValuesForEntities("vendor", entityIds);

        const vendorsWithCF = vendors.map(v => ({
          ...v,
          customFields: cfValuesMap[v.id] || {}
        }));

        // ==========================
        // Response
        // ==========================

        return reply.status(200).send({
          success: true,
          message: "Vendors fetched successfully.",
          count: vendors.length,
          data: vendorsWithCF,
        });



      } catch(error:any){


        console.error(error);



        adminLogs.error(
          "Vendor fetch failed",
          {
            error,
          }
        );



        return reply.status(500).send({

          success:false,

          message:
            "Server error while fetching vendors.",


          error:
            process.env.NODE_ENV === "development"
            ? error.message
            : undefined,


        });


      }


    }

  );


}


export default adminVendorReadRoutes;