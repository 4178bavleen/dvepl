import { PrismaClient, TenderStatus, TenderRequestSource, TenderRequestStatus, ReferenceCodeAction } from "@prisma/client";

export async function seedTenderModule(prisma: PrismaClient, companyId: string) {
  console.log("🌱 Seeding Tender Module...");

  // 1. Resolve dependencies from previously seeded data
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error(`Company not found during tender seeding: ${companyId}`);
  }

  const customers = await prisma.customer.findMany({ where: { companyId } });
  const users = await prisma.user.findMany({ where: { companyId } });
  const departments = await prisma.department.findMany({
    where: { branch: { companyId } },
  });
  const employees = await prisma.employee.findMany({ where: { companyId } });

  if (customers.length === 0 || users.length === 0 || departments.length === 0) {
    console.log("⚠️ CRM, Auth, or Organization seeds are missing. Skipping Tender Seeding.");
    return;
  }

  const targetCustomer = customers[0];
  const targetUser = users[0];
  const targetDept = departments[0];
  const targetEmployee = employees[0] || null;

  // 2. Seed Government Departments
  const govDeptsData = [
    { name: "Military Engineer Services", code: "GOV-MES", shortName: "MES" },
    { name: "Central Public Works Department", code: "GOV-CPWD", shortName: "CPWD" },
    { name: "Public Works Department", code: "GOV-PWD", shortName: "PWD" },
  ];

  const govDepts = await Promise.all(
    govDeptsData.map(async (data) => {
      let dept = await prisma.governmentDepartment.findFirst({
        where: { name: data.name, companyId },
      });

      if (!dept) {
        dept = await prisma.governmentDepartment.create({
          data: {
            companyId,
            name: data.name,
            code: data.code,
            shortName: data.shortName,
            isActive: true,
          },
        });
      }
      return dept;
    })
  );

  // 3. Seed Section, Division, SubDivision
  let section = await prisma.section.findFirst({
    where: { departmentId: targetDept.id, name: "Electrical & Mechanical (E&M)" },
  });

  if (!section) {
    section = await prisma.section.create({
      data: {
        companyId,
        departmentId: targetDept.id,
        name: "Electrical & Mechanical (E&M)",
        code: "SEC-EM",
        isActive: true,
        governmentDepartmentId: govDepts[0].id,
      },
    });
  }

  let division = await prisma.division.findFirst({
    where: { sectionId: section.id, name: "Power Transmission" },
  });

  if (!division) {
    division = await prisma.division.create({
      data: {
        companyId,
        sectionId: section.id,
        name: "Power Transmission",
        code: "DIV-PT",
        isActive: true,
      },
    });
  }

  let subDivision = await prisma.subDivision.findFirst({
    where: { divisionId: division.id, name: "Substation Grid Design" },
  });

  if (!subDivision) {
    subDivision = await prisma.subDivision.create({
      data: {
        companyId,
        divisionId: division.id,
        name: "Substation Grid Design",
        code: "SUB-SGD",
        isActive: true,
      },
    });
  }

  // 4. Seed Tender Requests (Leads)
  const tenderRequestsData = [
    {
      title: "11KV Substation Equipment Installation Delhi Cantt",
      description: "Supply and erection of transformer and panel boards.",
      estimatedValue: 4500000.00,
      source: TenderRequestSource.WEBSITE,
      status: TenderRequestStatus.QUALIFIED,
    },
    {
      title: "LED High Mast Lighting System in Lucknow Junction",
      description: "Installation of modern high mast systems for platform lights.",
      estimatedValue: 7200000.00,
      source: TenderRequestSource.EMAIL,
      status: TenderRequestStatus.NEW,
    },
  ];

  const tenderRequests = await Promise.all(
    tenderRequestsData.map(async (data) => {
      let tr = await prisma.tenderRequest.findFirst({
        where: { companyId, title: data.title },
      });

      if (!tr) {
        tr = await prisma.tenderRequest.create({
          data: {
            companyId,
            customerId: targetCustomer.id,
            assignedToId: targetUser.id,
            createdById: targetEmployee ? targetEmployee.id : null,
            source: data.source,
            status: data.status,
            title: data.title,
            description: data.description,
            estimatedValue: data.estimatedValue,
          },
        });

        // Seed some activities (AuditLog) for TenderRequest
        await prisma.auditLog.create({
          data: {
            userId: targetUser.id,
            module: "TenderRequest",
            recordId: tr.id,
            action: "CREATE",
            newValue: JSON.parse(JSON.stringify(tr)),
            ipAddress: "127.0.0.1",
            userAgent: "Prisma Seeder",
          },
        });
      }
      return tr;
    })
  );

  // 5. Seed Tenders
  const tendersData = [
    {
      title: "Delhi Cantt 11KV Substation Erection Contract",
      description: "Turnkey substation engineering, procurement, and construction.",
      projectLocation: "Delhi Cantonment, New Delhi",
      estimatedCost: 4500000.00,
      tenderNo: "MES-DEL-2026-T01",
      tenderCode: "TENDER-20260715-00001",
      status: TenderStatus.IN_PROGRESS,
    },
    {
      title: "Lucknow Junction Platform LED lighting System",
      description: "Design and install high mast lights on platform 1, 2, and 3.",
      projectLocation: "Lucknow Junction, Uttar Pradesh",
      estimatedCost: 7200000.00,
      tenderNo: "RLY-LKO-2026-T15",
      tenderCode: "TENDER-20260715-00002",
      status: TenderStatus.DRAFT,
    },
  ];

  await Promise.all(
    tendersData.map(async (data, idx) => {
      let tender = await prisma.tender.findFirst({
        where: { companyId, title: data.title },
      });

      if (!tender) {
        tender = await prisma.tender.create({
          data: {
            companyId,
            tenderRequestId: tenderRequests[idx].id,
            customerId: targetCustomer.id,
            departmentId: targetDept.id,
            sectionId: section.id,
            divisionId: division.id,
            subDivisionId: subDivision.id,
            governmentDepartmentId: govDepts[idx % govDepts.length].id,
            tenderNo: data.tenderNo,
            tenderCode: data.tenderCode,
            title: data.title,
            description: data.description,
            projectLocation: data.projectLocation,
            estimatedCost: data.estimatedCost,
            status: data.status,
            createdById: targetUser.id,
            assignedToId: targetUser.id,
          },
        });

        // Seed Tender Files
        await prisma.tenderFile.create({
          data: {
            tenderId: tender.id,
            fileName: "Technical_Specifications.pdf",
            fileUrl: "https://minio.dvepl.internal/tenders/Technical_Specifications.pdf",
            fileType: "application/pdf",
            uploadedBy: targetUser.name,
          },
        });

        // Seed Tender Remarks
        await prisma.tenderRemark.create({
          data: {
            tenderId: tender.id,
            userId: targetUser.id,
            remark: "Initial bid documents reviewed. Sequence looks fine.",
          },
        });

        // Seed Tender Activity log
        await prisma.tenderActivity.create({
          data: {
            tenderId: tender.id,
            action: "CREATE",
            newValue: JSON.parse(JSON.stringify(tender)),
            performedBy: targetUser.id,
          },
        });

        // Seed Reference Code Log
        await prisma.referenceCode.create({
          data: {
            tenderId: tender.id,
            newReferenceCode: data.tenderCode,
            actionType: ReferenceCodeAction.GENERATED,
            actionReason: "Initial seeder setup",
            actionBy: "Prisma Seeder",
          },
        });
      }
    })
  );

  // 6. Seed Reference Code Counter
  let counter = await prisma.referenceCodeCounter.findFirst({
    where: { companyId, prefix: "TENDER" },
  });

  if (!counter) {
    await prisma.referenceCodeCounter.create({
      data: {
        companyId,
        prefix: "TENDER",
        lastSequence: 2,
      },
    });
  }

  console.log("✅ Tender Module Seeded Successfully.");
}
