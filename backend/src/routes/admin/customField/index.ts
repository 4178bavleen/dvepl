import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { CustomFieldService } from "../../../services/customFieldService";
import { adminLogs } from "../../../services/logger/contextLogger";

export default async function customFieldRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const service = new CustomFieldService(fastify.prisma);

  // GET /api/admin/custom-fields - List custom fields by module (or all if query module missing)
  fastify.get("/", async (req: FastifyRequest<{ Querystring: { module?: string; activeOnly?: string } }>, reply: FastifyReply) => {
    try {
      const module = req.query.module || "order";
      const activeOnly = req.query.activeOnly === "true";
      const fields = await service.getFieldsByModule(module, activeOnly);
      
      // Map label for backward compatibility with frontend template if needed
      const mapped = fields.map(f => ({
        ...f,
        label: f.name,
        options: f.options.map(o => o.label).join(", ")
      }));

      return reply.send(mapped);
    } catch (err: any) {
      adminLogs.error("Failed to fetch custom fields", { error: err.message });
      return reply.status(500).send({ error: err.message });
    }
  });

  // GET /api/admin/custom-fields/:id - Get single custom field
  fastify.get("/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const field = await service.getFieldById(req.params.id);
      if (!field) return reply.status(404).send({ error: "Custom field not found" });
      return reply.send(field);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST /api/admin/custom-fields - Create custom field
  fastify.post("/", async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const body = req.body as any;
      const name = body.name || body.label;
      if (!name) return reply.status(400).send({ error: "Field Label/Name is required" });
      
      const moduleName = body.module || "order";
      let key = body.key;
      if (!key) {
        key = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      }

      let optionsList = body.options;
      if (typeof optionsList === "string") {
        optionsList = optionsList.split(",").map((s: string) => s.trim()).filter(Boolean);
      }

      const created = await service.createField({
        module: moduleName,
        name,
        key,
        type: body.type || "text",
        required: Boolean(body.required),
        defaultValue: body.defaultValue || null,
        placeholder: body.placeholder || null,
        helpText: body.helpText || null,
        displayOrder: Number(body.displayOrder) || 0,
        showInForm: body.showInForm !== undefined ? Boolean(body.showInForm) : true,
        showInTable: body.showInTable !== undefined ? Boolean(body.showInTable) : true,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        afterField: body.afterField || null,
        options: optionsList
      });

      return reply.status(201).send(created);
    } catch (err: any) {
      adminLogs.error("Failed to create custom field", { error: err.message });
      return reply.status(400).send({ error: err.message });
    }
  });

  // PUT /api/admin/custom-fields/:id - Update custom field
  fastify.put("/:id", async (req: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    try {
      const body = req.body as any;
      let optionsList = body.options;
      if (typeof optionsList === "string") {
        optionsList = optionsList.split(",").map((s: string) => s.trim()).filter(Boolean);
      }

      const updated = await service.updateField(req.params.id, {
        name: body.name || body.label,
        key: body.key,
        type: body.type,
        required: body.required,
        defaultValue: body.defaultValue,
        placeholder: body.placeholder,
        helpText: body.helpText,
        displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
        showInForm: body.showInForm,
        showInTable: body.showInTable,
        isActive: body.isActive,
        afterField: body.afterField,
        module: body.module,
        options: optionsList
      });

      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // PATCH /api/admin/custom-fields/:id/toggle - Toggle active status
  fastify.patch("/:id/toggle", async (req: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>, reply: FastifyReply) => {
    try {
      const updated = await service.toggleActive(req.params.id, req.body.isActive);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // DELETE /api/admin/custom-fields/:id - Delete field
  fastify.delete("/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await service.deleteField(req.params.id);
      return reply.send({ success: true, message: "Custom field deleted successfully" });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // GET /api/admin/custom-fields/values/:module/:entityId - Retrieve values for entity
  fastify.get("/values/:module/:entityId", async (req: FastifyRequest<{ Params: { module: string; entityId: string } }>, reply: FastifyReply) => {
    try {
      const values = await service.getValuesForEntity(req.params.module, req.params.entityId);
      return reply.send({ success: true, data: values });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST /api/admin/custom-fields/values/:module/:entityId - Save values for entity
  fastify.post("/values/:module/:entityId", async (req: FastifyRequest<{ Params: { module: string; entityId: string }; Body: { values: Record<string, any> } }>, reply: FastifyReply) => {
    try {
      await service.saveValues(req.params.module, req.params.entityId, req.body.values || {});
      return reply.send({ success: true, message: "Custom field values saved successfully" });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
