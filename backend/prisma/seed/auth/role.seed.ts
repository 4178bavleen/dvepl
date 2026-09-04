
const ADMIN_ROLE_PAGE_ACCESS = [
    "dashboard", "companies", "branches", "departments", "teams", "designations", "cost_centers",
    "employees", "attendance", "leaves", "holidays", "shift_management", "payroll", "documents", "tasks",
    "customers", "contacts", "communication", "orders", "delivery", "vendors", "inventory", "export_orders",
    "finance", "tender_requests", "tenders", "technical_clarifications", "government_departments", "sections",
    "divisions", "sub_divisions", "reference_codes", "users", "roles", "approval_requests", "reports",
    "audit_logs", "custom_fields", "recycle_bin", "settings",
];

export async function seedRole(prisma: any, companyId: string) {
return prisma.role.upsert({
    where:{
        companyId_name:{
            companyId,
            name:"Admin"
        }
    },
    update:{},
    create:{
        companyId,
        name:"Admin",
        isSystem:true,
        pageAccess: ADMIN_ROLE_PAGE_ACCESS,
    }
})
}