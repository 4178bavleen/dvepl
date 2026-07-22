import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";


interface Params {
  id: string;
}


async function adminVendorReadByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {


  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Vendor"],
        summary: "Get Vendor By ID",
        description: "Fetch vendor details by id",
      },
    },


    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply
    ) => {


      try {


        const { id } = request.params;



        // ==========================
        // Fetch Vendor
        // ==========================


        const vendor =
          await fastify.prisma.vendor.findFirst({

            where: {

              id,

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

                include: {

                  createdBy: {

                    select: {

                      id: true,

                      name: true,

                      email: true,

                    },

                  },

                },


                orderBy: {

                  createdAt: "desc",

                },

              },


            },


          });



        // ==========================
        // Not Found
        // ==========================


        if(!vendor){


          return reply.status(404).send({

            success:false,

            message:
              "Vendor not found.",

          });


        }



        // ==========================
        // Response
        // ==========================


        return reply.status(200).send({

          success:true,

          message:
            "Vendor fetched successfully.",

          data:vendor,

        });



      } catch(error:any){


        console.error(error);



        adminLogs.error(
          "Vendor fetch by id failed",
          {
            error,
          }
        );



        return reply.status(500).send({

          success:false,

          message:
            "Server error while fetching vendor.",


          error:
            process.env.NODE_ENV === "development"
            ? error.message
            : undefined,


        });


      }


    }

  );


}


export default adminVendorReadByIdRoutes;