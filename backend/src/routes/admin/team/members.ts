import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";

async function teamMemberRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  const findTeam = async (teamId: string, companyId: string) =>
    fastify.prisma.team.findFirst({
      where: {
        id: teamId,
        deletedAt: null,
        department: { branch: { companyId } },
      },
      select: { id: true, departmentId: true },
    });

  fastify.get(
    "/available/:teamId",
    { preHandler: [fastify.verifyToken, fastify.authorizePermissions(["employee.view"])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const companyId = (request.query as any)?.companyId || (request.admin as any)?.companyId;
      const { teamId } = request.params as { teamId: string };
      if (!companyId) return reply.status(401).send({ success: false, message: "Company information missing from token." });

      const team = await findTeam(teamId, companyId);
      if (!team) return reply.status(404).send({ success: false, message: "Team not found." });

      const employees = await fastify.prisma.employee.findMany({
        where: {
          companyId,
         
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          designation: { select: { title: true } },
          user: { select: { email: true } },
        },
        orderBy: { firstName: "asc" },
      });

      return reply.send({ success: true, data: employees });
    },
  );

  fastify.put(
    "/:teamId",
    { preHandler: [fastify.verifyToken, fastify.authorizePermissions(["employee.update"])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const companyId = (request.query as any)?.companyId || (request.admin as any)?.companyId;
      const { teamId } = request.params as { teamId: string };
      const { employeeIds } = request.body as { employeeIds?: unknown };
      if (!companyId) return reply.status(401).send({ success: false, message: "Company information missing from token." });
      if (!Array.isArray(employeeIds) || employeeIds.length === 0 || employeeIds.some((id) => typeof id !== "string")) {
        return reply.status(400).send({ success: false, message: "employeeIds must contain at least one employee ID." });
      }

      const team = await findTeam(teamId, companyId);
      if (!team) return reply.status(404).send({ success: false, message: "Team not found." });

      const employees = await fastify.prisma.employee.findMany({
        where: {
          id: { in: employeeIds },
          companyId,
          
          deletedAt: null,
        },
        select: { id: true },
      });
      if (employees.length !== new Set(employeeIds).size) {
        return reply.status(400).send({ success: false, message: "One or more employees cannot be assigned to this team." });
      }

      await fastify.prisma.employee.updateMany({
        where: { id: { in: employees.map((employee) => employee.id) } },
        data: { teamId },
      });
      return reply.send({ success: true, message: "Team members added successfully." });
    },
  );

  fastify.delete(
    "/:teamId/:employeeId",
    { preHandler: [fastify.verifyToken, fastify.authorizePermissions(["employee.update"])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const companyId = (request.query as any)?.companyId || (request.admin as any)?.companyId;
      const { teamId, employeeId } = request.params as { teamId: string; employeeId: string };
      if (!companyId) return reply.status(401).send({ success: false, message: "Company information missing from token." });

      const team = await findTeam(teamId, companyId);
      if (!team) return reply.status(404).send({ success: false, message: "Team not found." });

      const result = await fastify.prisma.employee.updateMany({
        where: { id: employeeId, companyId, teamId, deletedAt: null },
        data: { teamId: null },
      });
      if (result.count === 0) return reply.status(404).send({ success: false, message: "Team member not found." });

      return reply.send({ success: true, message: "Team member removed successfully." });
    },
  );
}

export default teamMemberRoutes;
