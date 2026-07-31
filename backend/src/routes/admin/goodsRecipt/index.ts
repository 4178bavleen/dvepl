import { FastifyInstance } from "fastify";

import adminGoodsReceiptCreateRoutes from "./create";
// import adminGoodsReceiptReadRoutes from "./read";
// import adminGoodsReceiptUpdateRoutes from "./update";
// import adminGoodsReceiptDeleteRoutes from "./delete";

async function goodsReceiptRoutes(fastify: FastifyInstance) {
  fastify.register(adminGoodsReceiptCreateRoutes, {
    prefix: "/create",
  });

  // fastify.register(adminGoodsReceiptReadRoutes, {
  //   prefix: "/read",
  // });

  // fastify.register(adminGoodsReceiptUpdateRoutes, {
  //   prefix: "/update",
  // });

  // fastify.register(adminGoodsReceiptDeleteRoutes, {
  //   prefix: "/delete",
  // });
}

export default goodsReceiptRoutes;