CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_settings_companyId_key" ON "company_settings"("companyId");
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_access_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT 'Team Member',
    "pageAccess" JSONB NOT NULL DEFAULT '[]',
    "fieldPermissions" JSONB NOT NULL DEFAULT '{}',
    "actionPermissions" JSONB NOT NULL DEFAULT '{"create":true,"edit":true,"delete":false,"export":true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_access_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_access_profiles_userId_key" ON "user_access_profiles"("userId");
ALTER TABLE "user_access_profiles" ADD CONSTRAINT "user_access_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
