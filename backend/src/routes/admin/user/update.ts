import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fs from "fs";
import path from "path";
import { adminLogs } from "../../../services/logger/contextLogger";

async function updateUserRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["User"],
        summary: "Update User",
        description: "Update user details and assigned roles.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.update"]),
      ],
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const companyId = (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };
        const { name, email, phone, isActive, role, designation, pageAccess, fieldPermissions, actionPermissions } = request.body as any;

        // Check User Exists
        const existingUser = await fastify.prisma.user.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!existingUser) {
          return reply.status(404).send({
            success: false,
            message: "User not found.",
          });
        }

        // Duplicate Email Check
        if (email) {
          const duplicateEmail = await fastify.prisma.user.findFirst({
            where: {
              email,
              NOT: {
                id,
              },
              deletedAt: null,
            },
          });

          if (duplicateEmail) {
            return reply.status(409).send({
              success: false,
              message: "Email already exists.",
            });
          }
        }

        // Resolve role ID if passed as string name or ID
        let roleIds = (request.body as any).roleIds;
        if (role && !roleIds) {
          const foundRole = await fastify.prisma.role.findFirst({
            where: {
              OR: [
                { id: role },
                { name: { equals: role, mode: "insensitive" } }
              ],
              companyId,
              deletedAt: null
            }
          });
          if (foundRole) {
            roleIds = [foundRole.id];
          }
        }

        // Transaction for User Table
        await fastify.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: {
              id,
            },
            data: {
              name: name || undefined,
              email: email || undefined,
              phone: phone || undefined,
              isActive: isActive !== undefined ? !!isActive : undefined,
            },
          });

          if (roleIds && roleIds.length > 0) {
            await tx.userRole.deleteMany({
              where: {
                userId: id,
              },
            });

            await tx.userRole.createMany({
              data: roleIds.map((roleId: string) => ({
                userId: id,
                roleId,
              })),
            });
          }

          // Find employee record associated with this user
          const employee = await tx.employee.findFirst({
            where: { userId: id }
          });

          if (employee) {
            const updateData: any = {};
            if (name) {
              const nameParts = name.trim().split(/\s+/);
              updateData.firstName = nameParts[0] || "Employee";
              updateData.lastName = nameParts.slice(1).join(" ") || "Member";
            }
            if (designation !== undefined) {
              let designationId: string | null = null;
              if (designation) {
                const foundDes = await tx.designation.findFirst({
                  where: {
                    title: { equals: designation, mode: "insensitive" },
                    deletedAt: null
                  }
                });
                if (foundDes) {
                  designationId = foundDes.id;
                }
              }
              updateData.designationId = designationId;
            }

            await tx.employee.update({
              where: { id: employee.id },
              data: updateData
            });

            if (email) {
              await tx.employeeContact.updateMany({
                where: {
                  employeeId: employee.id,
                  type: "EMAIL",
                  isPrimary: true
                },
                data: {
                  value: email
                }
              });
            }

            if (phone) {
              await tx.employeeContact.updateMany({
                where: {
                  employeeId: employee.id,
                  type: "PHONE",
                  isPrimary: true
                },
                data: {
                  value: phone
                }
              });
            }
          }
        });

        // Save Custom Permissions if provided
        if (pageAccess || fieldPermissions || actionPermissions || designation !== undefined) {
          const permissionsFilePath = path.join(__dirname, "../../../../data/user_permissions.json");
          const dirPath = path.dirname(permissionsFilePath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          let permissionsData: Record<string, any> = {};
          if (fs.existsSync(permissionsFilePath)) {
            try {
              permissionsData = JSON.parse(fs.readFileSync(permissionsFilePath, "utf-8"));
            } catch (e) {
              permissionsData = {};
            }
          }
          if (!permissionsData[id]) permissionsData[id] = {};
          if (pageAccess !== undefined) permissionsData[id].pageAccess = pageAccess;
          if (fieldPermissions !== undefined) permissionsData[id].fieldPermissions = fieldPermissions;
          if (actionPermissions !== undefined) permissionsData[id].actionPermissions = actionPermissions;
          if (designation !== undefined) permissionsData[id].designation = designation;

          fs.writeFileSync(permissionsFilePath, JSON.stringify(permissionsData, null, 2), "utf-8");
        }

        return reply.status(200).send({
          success: true,
          message: "User updated successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Update User Failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default updateUserRoute;