import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface TemplateStepInput {
  key?: string;
  name: string;
  color?: string | null;
  isFinal?: boolean;
  isActive?: boolean;
}

interface UpdateTemplateBody {
  name?: string;
  description?: string | null;
  steps: TemplateStepInput[];
}

const DEFAULT_TEMPLATE_ID = "00000000-0000-0000-0000-000000000001";

export async function getActiveWorkflowTemplate(
  prisma: any,
) {
  const template = await prisma.workflowTemplate.findFirst({
    where: { isActive: true },
    include: {
      steps: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!template) {
    return prisma.workflowTemplate.findUnique({
      where: { id: DEFAULT_TEMPLATE_ID },
      include: {
        steps: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  }

  return template;
}

function toKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default async function workflowTemplateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/template",
    {
      schema: {
        tags: ["Workflow Tracker"],
      },
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const template = await getActiveWorkflowTemplate(fastify.prisma);

      if (!template) {
        return reply.code(404).send({
          success: false,
          message: "No workflow template found",
        });
      }

      return reply.send({
        success: true,
        data: {
          id: template.id,
          name: template.name,
          description: template.description,
          steps: template.steps.map((step: any) => ({
            id: step.id,
            key: step.key,
            name: step.name,
            color: step.color,
            position: step.position,
            isFinal: step.isFinal,
            isActive: step.isActive,
          })),
        },
      });
    },
  );

  fastify.put(
    "/template",
    {
      schema: {
        tags: ["Workflow Tracker"],
      },
    },
    async (
      request: FastifyRequest<{ Body: UpdateTemplateBody }>,
      reply: FastifyReply,
    ) => {
      const { name, description, steps } = request.body;

      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return reply.code(400).send({
          success: false,
          message: "At least one workflow stage is required",
        });
      }

      const template = await getActiveWorkflowTemplate(fastify.prisma);
      if (!template) {
        return reply.code(404).send({
          success: false,
          message: "No workflow template found",
        });
      }

      const existingSteps = template.steps as any[];
      const existingByKey = new Map(
        existingSteps.map((s) => [s.key, s]),
      );
      const incomingKeys = new Set<string>();
      const normalizedSteps = steps.map((step, index) => {
        const key = step.key || toKey(step.name) || `STAGE_${index}`;
        incomingKeys.add(key);
        return {
          key,
          name: step.name.trim(),
          color: step.color || null,
          position: index,
          isFinal: step.isFinal ?? (index === steps.length - 1),
          isActive: step.isActive ?? true,
        };
      });

      const removedKeys = existingSteps
        .filter((s) => !incomingKeys.has(s.key))
        .map((s) => s.key);

      const result = await fastify.prisma.$transaction(
        async (tx) => {
          // 1. Upsert steps
          for (const step of normalizedSteps) {
            const existing = existingByKey.get(step.key);
            if (existing) {
              await tx.workflowStep.update({
                where: { id: existing.id },
                data: {
                  name: step.name,
                  color: step.color,
                  position: step.position,
                  isFinal: step.isFinal,
                  isActive: step.isActive,
                },
              });
            } else {
              await tx.workflowStep.create({
                data: {
                  templateId: template.id,
                  key: step.key,
                  name: step.name,
                  color: step.color,
                  position: step.position,
                  isFinal: step.isFinal,
                  isActive: step.isActive,
                },
              });
            }
          }

          // 2. Delete removed steps
          const removedSteps = existingSteps.filter((s) =>
            removedKeys.includes(s.key),
          );
          for (const removed of removedSteps) {
            await tx.workflowStep.delete({
              where: { id: removed.id },
            });
          }

          // 3. Re-map sales orders that were on removed steps to the nearest
          //    previous remaining stage (or the first active stage).
          if (removedSteps.length > 0) {
            const remaining = await tx.workflowStep.findMany({
              where: { templateId: template.id, isActive: true },
              orderBy: { position: "asc" },
            });

            const performedById = (request.user as any)?.id ?? null;
            const now = new Date();

            for (const removed of removedSteps) {
              const fallback =
                remaining.find((s: any) => s.position < removed.position) ||
                remaining[0];

              if (!fallback) continue;

              const affected = await tx.salesOrder.findMany({
                where: {
                  workflowStage: removed.key,
                  deletedAt: null,
                },
                select: { id: true },
              });

              if (affected.length === 0) continue;

              await tx.salesOrder.updateMany({
                where: { id: { in: affected.map((o: any) => o.id) } },
                data: {
                  workflowStage: fallback.key,
                  workflowUpdatedAt: new Date(),
                },
              });

              await tx.workflowEvent.createMany({
                data: affected.map((order: any) => ({
                  salesOrderId: order.id,
                  stage: fallback.key,
                  title: `Workflow template updated — "${removed.name}" removed`,
                  description: `Moved from "${removed.name}" to "${fallback.name}".`,
                  performedById,
                  createdAt: now,
                })),
              });
            }
          }

          // 4. Update template meta
          await tx.workflowTemplate.update({
            where: { id: template.id },
            data: {
              ...(name !== undefined ? { name } : {}),
              ...(description !== undefined
                ? { description }
                : {}),
            },
          });

          return tx.workflowTemplate.findUnique({
            where: { id: template.id },
            include: {
              steps: {
                orderBy: [{ position: "asc" }, { createdAt: "asc" }],
              },
            },
          });
        },
        { timeout: 20000 },
      );

      return reply.send({
        success: true,
        message: "Workflow template updated successfully",
        data: result
          ? {
              id: result.id,
              name: result.name,
              description: result.description,
              steps: result.steps.map((step: any) => ({
                id: step.id,
                key: step.key,
                name: step.name,
                color: step.color,
                position: step.position,
                isFinal: step.isFinal,
                isActive: step.isActive,
              })),
            }
          : null,
      });
    },
  );
}