import { PrismaClient, Tender, TenderStatus, ReferenceCodeAction } from "@prisma/client";

const TENDERS_INFO = [
  { title: "Supply and Commissioning of LT Panels - Delhi Cantt", no: "MES-DEL-2026-T01", code: "REF-20260715-00001", cost: 4500000.00, loc: "Delhi Cantonment, New Delhi", status: TenderStatus.IN_PROGRESS },
  { title: "Manufacturing and Erection of APFC Panels - Lucknow Junction", no: "RLY-LKO-2026-T02", code: "REF-20260715-00002", cost: 7200000.00, loc: "Lucknow Junction, Uttar Pradesh", status: TenderStatus.DRAFT },
  { title: "Noida Sector 62 PCC Panels and Room Erection Works", no: "PWD-NOI-2026-T03", code: "REF-20260715-00003", cost: 45000000.00, loc: "Noida Sector 62, Uttar Pradesh", status: TenderStatus.IN_PROGRESS },
  { title: "PLC Panels and SCADA Automation System - DMRC Phase IV", no: "DMRC-TEL-2026-T04", code: "REF-20260715-00004", cost: 12000000.00, loc: "New Delhi Metro Lines", status: TenderStatus.COMPLETED },
  { title: "VFD Control Panels for Alwar Farms Micro Irrigation", no: "AGR-ALW-2026-T05", code: "REF-20260715-00005", cost: 2500000.00, loc: "Alwar Region, Rajasthan", status: TenderStatus.SUBMITTED },
  { title: "NTPC Plant MCC Panels and Switchgear Installation", no: "NTPC-SEC-2026-T06", code: "REF-20260715-00006", cost: 8500000.00, loc: "NTPC Dadri, Uttar Pradesh", status: TenderStatus.IN_PROGRESS },
  { title: "BHEL Corporate Office HVAC Control Panel Retrofitting", no: "BHEL-HVAC-2026-T07", code: "REF-20260715-00007", cost: 14000000.00, loc: "BHEL Noida, Uttar Pradesh", status: TenderStatus.DRAFT },
  { title: "ONGC Refinery Custom Distribution Panels and Cabling", no: "ONGC-FIRE-2026-T08", code: "REF-20260715-00008", cost: 19500000.00, loc: "ONGC Ankleshwar, Gujarat", status: TenderStatus.SUBMITTED },
  { title: "Industrial Automation and Control Desks - NHAI Works", no: "NHAI-RD-2026-T09", code: "REF-20260715-00009", cost: 38000000.00, loc: "Gurgaon-Jaipur Highway NH-8", status: TenderStatus.COMPLETED },
  { title: "Jaipur Solar Grid Substation PCC Panels Erection", no: "RE-JAI-2026-T10", code: "REF-20260715-00010", cost: 5500000.00, loc: "Jaipur Grid, Rajasthan", status: TenderStatus.IN_PROGRESS }
];

export async function seedTenders(
  prisma: PrismaClient,
  companyId: string,
  customerId: string,
  userId: string,
  tenderRequestIds: string[],
  deptId: string,
  sectionIds: string[],
  divisionIds: string[],
  subDivisionIds: string[],
  govDeptIds: string[]
): Promise<Tender[]> {
  console.log("🌱 Seeding 10 Tenders and linked audit files/remarks...");

  const tenders = await Promise.all(
    TENDERS_INFO.map(async (data, idx) => {
      let tender = await prisma.tender.findFirst({
        where: { companyId, title: data.title },
      });

      if (!tender) {
        tender = await prisma.tender.create({
          data: {
            companyId,
            tenderRequestId: tenderRequestIds[idx],
            customerId,
            departmentId: deptId,
            sectionId: sectionIds[idx],
            divisionId: divisionIds[idx],
            subDivisionId: subDivisionIds[idx],
            governmentDepartmentId: govDeptIds[idx % govDeptIds.length],
            tenderNo: data.no,
            tenderCode: data.code,
            title: data.title,
            description: `Official execution contract for customized electrical panels: LT Panels, PCC Panels, MCC Panels, APFC Panels, PLC Panels, VFD Panels, Railway Electrical Panels, or Industrial Automation Panels.`,
            projectLocation: data.loc,
            estimatedCost: data.cost,
            status: data.status,
            createdById: userId,
            assignedToId: userId,
          },
        });

        // Seed Tender File
        await prisma.tenderFile.create({
          data: {
            tenderId: tender.id,
            fileName: `Technical_Specifications_${idx + 1}.pdf`,
            fileUrl: `https://minio.dvepl.internal/tenders/Technical_Specifications_${idx + 1}.pdf`,
            fileType: "application/pdf",
            uploadedBy: "System Seeder",
          },
        });

        // Seed Tender Remark
        await prisma.tenderRemark.create({
          data: {
            tenderId: tender.id,
            userId,
            remark: `Bid parameters for panel works of ${data.no} verified against drawings. Setup complete.`,
          },
        });

        // Seed Tender Activity
        await prisma.tenderActivity.create({
          data: {
            tenderId: tender.id,
            action: "CREATE",
            newValue: JSON.parse(JSON.stringify(tender)),
            performedBy: userId,
          },
        });

        // Seed Reference Code Log
        await prisma.referenceCode.create({
          data: {
            tenderId: tender.id,
            newReferenceCode: data.code,
            actionType: ReferenceCodeAction.GENERATED,
            actionReason: "Initial seeder setup",
            actionBy: "System Seeder",
          },
        });
      }
      return tender;
    })
  );

  // Seed Reference Code Counter value
  let counter = await prisma.referenceCodeCounter.findFirst({
    where: { companyId, prefix: "REF" },
  });

  if (!counter) {
    await prisma.referenceCodeCounter.create({
      data: {
        companyId,
        prefix: "REF",
        lastSequence: 10,
      },
    });
  } else {
    await prisma.referenceCodeCounter.update({
      where: { id: counter.id },
      data: { lastSequence: 10 },
    });
  }

  return tenders;
}
