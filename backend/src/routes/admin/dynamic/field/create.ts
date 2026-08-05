import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Body {
  moduleId: string;
  fieldName: string;
  label: string;
  type: "TEXT" | "NUMBER" | "TEXTAREA" | "SELECT" | "DATE";

  required?: boolean;
  visible?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  table?: boolean;

  orderNo?: number;

  options?: any;
  defaultValue?: any;
  placeholder?: string;
}

export default async function createFieldRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/field",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{ Body: Body }>,
      reply: FastifyReply
    ) => {
      const {
  moduleId,
  fieldName,
  label,
  type,
  required = false,
  visible = true,
  searchable = false,
  filterable = false,
  table = true,
  orderNo,
  options = null,
  defaultValue = null,
  placeholder = null,
} = request.body;

      // Check module exists
      const module = await fastify.prisma.dynamicModule.findUnique({
        where: {
          id: moduleId,
        },
      });

      if (!module) {
        return reply.code(404).send({
          success: false,
          message: "Module not found",
        });
      }

      // Prevent duplicate field names
      const exists = await fastify.prisma.dynamicField.findFirst({
        where: {
          moduleId,
          fieldName,
        },
      });

      if (exists) {
        return reply.code(400).send({
          success: false,
          message: "Field already exists",
        });
      }

      // Get next order number
     const count = await fastify.prisma.dynamicField.count({
  where: {
    moduleId,
  },
});

const nextOrder = orderNo ?? count + 1;

      const field = await fastify.prisma.dynamicField.create({
        data: {
  moduleId,
  fieldName,
  label,
  type,

  required,
  visible,
  searchable,
  filterable,
  table,

  options,
  defaultValue,
  placeholder,

  orderNo: nextOrder,
},
      });

      return reply.send({
        success: true,
        data: field,
      });
    }
  );
}