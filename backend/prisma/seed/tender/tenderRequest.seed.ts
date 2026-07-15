import { PrismaClient, TenderRequest, TenderRequestSource, TenderRequestStatus } from "@prisma/client";

const TENDER_REQUESTS = [
  { title: "11KV Substation Equipment Installation Delhi Cantt", value: 4500000.00, source: TenderRequestSource.WEBSITE, status: TenderRequestStatus.QUALIFIED },
  { title: "LED High Mast Lighting System in Lucknow Junction", value: 7200000.00, source: TenderRequestSource.EMAIL, status: TenderRequestStatus.NEW },
  { title: "Construction of Elevated Flyover Noida Sector 62", value: 45000000.00, source: TenderRequestSource.WEBSITE, status: TenderRequestStatus.QUALIFIED },
  { title: "Fiber Optic Cabling and WAN Deployment for DMRC", value: 12000000.00, source: TenderRequestSource.REFERRAL, status: TenderRequestStatus.QUALIFIED },
  { title: "Micro Irrigation Piping System for Alwar Farms", value: 2500000.00, source: TenderRequestSource.MANUAL, status: TenderRequestStatus.NEW },
  { title: "Thermal CCTV Security Grid Installation at NTPC Plant", value: 8500000.00, source: TenderRequestSource.EMAIL, status: TenderRequestStatus.CONTACTED },
  { title: "Centralized HVAC Retrofitting for BHEL Office", value: 14000000.00, source: TenderRequestSource.WEBSITE, status: TenderRequestStatus.QUALIFIED },
  { title: "Automated Fire Sprinkler Network in ONGC Refinery", value: 19500000.00, source: TenderRequestSource.WHATSAPP, status: TenderRequestStatus.QUALIFIED },
  { title: "Highways Asphalt Laying and Drainage Work on NH-8", value: 38000000.00, source: TenderRequestSource.REFERRAL, status: TenderRequestStatus.QUALIFIED },
  { title: "Supply and Commissioning of Solar Grid Station Jaipur", value: 5500000.00, source: TenderRequestSource.WEBSITE, status: TenderRequestStatus.NEW }
];

export async function seedTenderRequests(
  prisma: PrismaClient,
  companyId: string,
  customerId: string,
  userId: string,
  employeeId: string | null
): Promise<TenderRequest[]> {
  console.log("🌱 Seeding 10 Tender Requests (Leads)...");

  return Promise.all(
    TENDER_REQUESTS.map(async (data) => {
      let tr = await prisma.tenderRequest.findFirst({
        where: { companyId, title: data.title },
      });

      if (!tr) {
        tr = await prisma.tenderRequest.create({
          data: {
            companyId,
            customerId,
            assignedToId: userId,
            createdById: employeeId,
            source: data.source,
            status: data.status,
            title: data.title,
            description: `Requirements definition phase for ${data.title}. Mandatory checklist review required.`,
            estimatedValue: data.value,
          },
        });

        // Log creation in AuditLog
        await prisma.auditLog.create({
          data: {
            userId,
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
}
