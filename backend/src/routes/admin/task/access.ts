import { FastifyInstance, FastifyRequest } from "fastify";

/**
 * Row-level access for the tasks module:
 * - Only admins may view or work on tasks assigned to other people.
 * - Regular users may only view/work on tasks they are assigned to.
 */

export const isAdminUser = (admin: any): boolean =>
  Boolean(
    Array.isArray(admin?.roles) &&
      admin.roles.some((roleName: string) =>
        String(roleName).toLowerCase().includes("admin"),
      ),
  );

export const getEmployeeForUser = async (
  fastify: FastifyInstance,
  userId: string,
) => {
  return fastify.prisma.employee.findFirst({
    where: { userId, deletedAt: null },
  });
};

export const isAssignedToTask = async (
  fastify: FastifyInstance,
  taskId: string,
  employeeId: string,
): Promise<boolean> => {
  const assignment = await fastify.prisma.taskAssignment.findFirst({
    where: { taskId, employeeId },
  });
  return !!assignment;
};

/**
 * Admin => always allowed. Otherwise the user must be assigned to the task.
 */
export const canManageTask = async (
  fastify: FastifyInstance,
  taskId: string,
  request: FastifyRequest,
): Promise<boolean> => {
  const admin = (request as any).admin as any;
  const userId = admin?.id;

  if (!userId) return false;

  if (isAdminUser(admin)) return true;

  const employee = await getEmployeeForUser(fastify, userId);
  if (!employee) return false;

  return isAssignedToTask(fastify, taskId, employee.id);
};