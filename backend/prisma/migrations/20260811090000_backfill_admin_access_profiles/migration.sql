-- Restore access for existing Admin users created before user access profiles
-- became mandatory in the authorization middleware.
INSERT INTO "user_access_profiles" (
  "id", "userId", "designation", "pageAccess", "fieldPermissions", "actionPermissions", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || u."id"),
  u."id",
  'Administrator',
  '["dashboard","companies","branches","departments","teams","designations","cost_centers","employees","attendance","leaves","holidays","shift_management","payroll","documents","tasks","customers","contacts","communication","orders","delivery","vendors","inventory","export_orders","finance","tender_requests","tenders","technical_clarifications","government_departments","sections","divisions","sub_divisions","reference_codes","users","roles","approval_requests","reports","audit_logs","custom_fields","recycle_bin","settings"]'::jsonb,
  '{}'::jsonb,
  '{"create":true,"edit":true,"delete":true,"export":true}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users" u
JOIN "user_roles" ur ON ur."userId" = u."id"
JOIN "roles" r ON r."id" = ur."roleId"
WHERE r."name" = 'Admin'
  AND r."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "user_access_profiles" uap WHERE uap."userId" = u."id"
  );
