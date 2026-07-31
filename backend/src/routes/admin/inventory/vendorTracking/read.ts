import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function adminInventoryVendorTrackingRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {

  fastify.get(
    "/",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Vendor Order Tracking",
        description:
          "Track ordered quantity, received quantity and pending quantity vendor wise",
      },
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {

      try {

        const companyId = request.user.companyId;


        const poItems =
          await fastify.prisma.purchaseOrderItem.findMany({

            where: {
              purchaseOrder: {
                companyId,
                deletedAt: null,
              },
            },


            include: {

              purchaseOrder: {

                include: {
                  vendor: true,
                }

              },


              material: true,


              goodsReceiptItems: true,

            }

          });



        const tracking = poItems.map((item) => {


          const orderedQty =
            Number(item.quantity);



          const receivedQty =
            item.goodsReceiptItems.reduce(
              (sum, grnItem) =>
                sum + Number(grnItem.acceptedQty || 0),
              0
            );



          const pendingQty =
            orderedQty - receivedQty;



          let status = "PENDING";


          if(receivedQty === 0){

            status = "PENDING";

          }
          else if(receivedQty < orderedQty){

            status = "PARTIAL";

          }
          else{

            status = "COMPLETED";

          }



          return {

            poId: item.purchaseOrder.id,

            poNo: item.purchaseOrder.poNo,


            vendor: {
              id: item.purchaseOrder.vendor?.id,
              name: item.purchaseOrder.vendor?.name,
            },


            material:{
              id:item.material.id,
              name:item.material.name,
              code:item.material.materialCode,
            },


            orderedQty,

            receivedQty,

            pendingQty,


            status,


          };


        });



        return reply.send({

          success:true,

          data:tracking,

        });



      } catch(error:any){


        console.error(error);


        return reply.status(500).send({

          success:false,

          message:
          "Failed to fetch vendor tracking",

          error:error.message,

        });


      }

    }
  );

}


export default adminInventoryVendorTrackingRoutes;