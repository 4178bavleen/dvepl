import { SalesOrderStatus } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";

const REFERENCE_EMAIL = "bavleenmodi15@gmail.com";
const REFERENCE_PHONE = "9501519405";

const orders = [
  {
    caNo: "CWEAFJ-48/2025",
    partyName: "Vijay Kumar Gupta and Co",
    contactDetails: "Sh Puneet Gupta | 7889873300 | bavleenmodi15@gmail.com",
    workName:
      "SPECIAL REPAIR/REPLACEMENT OF BER TRANSFORMER AND DG SETS AT AF STATION UDHAMPUR UNDER GE (AF) UDHAMPUR",
    department: "MES",
    section: "CE (AF) Udhampur",
    division: "CWE (AF) Jammu",
    subDivision: "GE AF Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_751133_1",
    referenceCode: "REF-20260302-08197",
    status: "ACCEPTED",
    date: "2026-07-21T10:55:18",
    amount: 875000,
  },

  {
    caNo: "CEUZ/UDH/ /2024-25",
    partyName: "DV ELECTROMATIC PVT LTD",
    contactDetails: "INDERJIT SINGH | 8872969700 | bavleenmodi15@gmail.com",
    workName:
      "AUGMENTATION OF ELECTRIC SUPPLY SYSTEM UNDER GE (U) UDHAMPUR",
    department: "MES",
    section: "CE Udhampur",
    division: "CWE Udhampur",
    subDivision: "GE (U) Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2024_MES_646282_1",
    referenceCode: "6287",
    status: "ACCEPTED",
    date: "2026-05-27T07:26:41",
    amount: 1250000,
  },

  {
    caNo: "GEAF/UDH/2026-27/018",
    partyName: "Northern Power Systems Pvt Ltd",
    contactDetails: "Rahul Sharma | 9876543210 | bavleenmodi15@gmail.com",
    workName:
      "REPLACEMENT OF OLD ELECTRICAL PANELS AND POWER DISTRIBUTION SYSTEM AT AIR FORCE STATION",
    department: "MES",
    section: "CE (AF) Udhampur",
    division: "CWE (AF) Jammu",
    subDivision: "GE AF Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_781245_1",
    referenceCode: "REF-20260415-01982",
    status: "PENDING",
    date: "2026-06-15T09:30:00",
    amount: 640000,
  },

  {
    caNo: "CWEJ/UDH/2026/031",
    partyName: "Himalayan Electrical Works",
    contactDetails: "Amit Kumar | 9812345678 | bavleenmodi15@gmail.com",
    workName:
      "REPAIR AND MAINTENANCE OF ELECTRICAL INSTALLATIONS AT VARIOUS MES LOCATIONS",
    department: "MES",
    section: "CE Udhampur",
    division: "CWE Udhampur",
    subDivision: "GE Udhampur",
    location: "Jammu and Kashmir",
    tenderId: "2026_MES_782311_1",
    referenceCode: "REF-20260510-03451",
    status: "ORDER_CONFIRMED",
    date: "2026-06-25T11:20:00",
    amount: 920000,
  },

  {
    caNo: "GEU/UDH/2026-27/044",
    partyName: "Jammu Electrical Contractors",
    contactDetails: "Manoj Gupta | 9798765432 | bavleenmodi15@gmail.com",
    workName:
      "SUPPLY AND INSTALLATION OF DG SETS AND ASSOCIATED ELECTRICAL EQUIPMENT",
    department: "MES",
    section: "CE Udhampur",
    division: "CWE Udhampur",
    subDivision: "GE (U) Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_789431_1",
    referenceCode: "REF-20260601-04521",
    status: "ACCEPTED",
    date: "2026-07-02T14:15:00",
    amount: 1780000,
  },

  {
    caNo: "CWEAFJ-61/2026",
    partyName: "Shakti Engineering Solutions",
    contactDetails: "Rajesh Verma | 9988776655 | bavleenmodi15@gmail.com",
    workName:
      "SPECIAL REPAIR OF TRANSFORMERS AND ELECTRICAL DISTRIBUTION EQUIPMENT",
    department: "MES",
    section: "CE (AF) Udhampur",
    division: "CWE (AF) Jammu",
    subDivision: "GE AF Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_793241_1",
    referenceCode: "REF-20260617-05213",
    status: "IN_PROGRESS",
    date: "2026-07-08T10:45:00",
    amount: 1435000,
  },

  {
    caNo: "CEUZ/UDH/2026-27/052",
    partyName: "Evergreen Power Technologies",
    contactDetails: "Sandeep Singh | 9876123456 | bavleenmodi15@gmail.com",
    workName:
      "UPGRADATION OF ELECTRICAL SUPPLY SYSTEM AND INSTALLATION OF VCB PANELS",
    department: "MES",
    section: "CE Udhampur",
    division: "CWE Udhampur",
    subDivision: "GE (U) Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_796422_1",
    referenceCode: "REF-20260625-06118",
    status: "ACCEPTED",
    date: "2026-07-12T09:10:00",
    amount: 2150000,
  },

  {
    caNo: "GEAF/UDH/2026-27/067",
    partyName: "Trinity Electrical Industries",
    contactDetails: "Vikas Sharma | 9911223344 | bavleenmodi15@gmail.com",
    workName:
      "REPLACEMENT OF BER ELECTRICAL EQUIPMENT AND ASSOCIATED CABLING WORK",
    department: "MES",
    section: "CE (AF) Udhampur",
    division: "CWE (AF) Jammu",
    subDivision: "GE AF Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_799812_1",
    referenceCode: "REF-20260701-07124",
    status: "PENDING",
    date: "2026-07-18T12:30:00",
    amount: 760000,
  },

  {
    caNo: "CWEU/UDH/2026/078",
    partyName: "Horizon Infra Electricals",
    contactDetails: "Deepak Kumar | 9765432109 | bavleenmodi15@gmail.com",
    workName:
      "MAINTENANCE AND REPLACEMENT OF ELECTRICAL INFRASTRUCTURE AT MES STATIONS",
    department: "MES",
    section: "CE Udhampur",
    division: "CWE Udhampur",
    subDivision: "GE Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_801245_1",
    referenceCode: "REF-20260721-08152",
    status: "ACCEPTED",
    date: "2026-07-21T15:45:00",
    amount: 1125000,
  },

  {
    caNo: "CEAFJ/UDH/2026/089",
    partyName: "United Electrical Services",
    contactDetails: "Puneet Sharma | 8899001122 | bavleenmodi15@gmail.com",
    workName:
      "SPECIAL REPAIR AND REPLACEMENT OF ELECTRICAL DISTRIBUTION SYSTEM",
    department: "MES",
    section: "CE (AF) Udhampur",
    division: "CWE (AF) Jammu",
    subDivision: "GE AF Udhampur",
    location: "Udhampur, Jammu and Kashmir",
    tenderId: "2026_MES_805622_1",
    referenceCode: "REF-20260725-08941",
    status: "PENDING",
    date: "2026-07-25T11:00:00",
    amount: 985000,
  },
];

function getStatus(status: string): SalesOrderStatus {
  const statusMap: Record<string, SalesOrderStatus> = {
    ACCEPTED: "IN_PROGRESS" as SalesOrderStatus,
    PENDING: "PENDING" as SalesOrderStatus,
    ORDER_CONFIRMED: "IN_PROGRESS" as SalesOrderStatus,
    IN_PROGRESS: "IN_PROGRESS" as SalesOrderStatus,
  };

  return statusMap[status] ?? ("PENDING" as SalesOrderStatus);
}

export async function seedSalesOrders() {
  console.log("🌱 Starting SalesOrder seeder...\n");

  let user = await prisma.user.findUnique({
    where: {
      email: REFERENCE_EMAIL,
    },
  });

  if (!user) {
    const company = await prisma.company.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!company) {
      throw new Error(
        "No active company found. Create a company before running this seeder."
      );
    }

    user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: REFERENCE_EMAIL,
        phone: REFERENCE_PHONE,
        name: "Bavleen Modi",
        passwordHash:
          "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456",
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log(`👤 Created user: ${user.email}`);
  } else {
    console.log(`👤 Using existing user: ${user.email}`);

    if (user.phone !== REFERENCE_PHONE) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          phone: REFERENCE_PHONE,
        },
      });

      console.log(`📱 Updated phone: ${REFERENCE_PHONE}`);
    }
  }

  let created = 0;
  let skipped = 0;

  for (let index = 0; index < orders.length; index++) {
    const order = orders[index];

    const dveplCode = `SEED-ORDER-${String(index + 1).padStart(3, "0")}`;

    const existing = await prisma.salesOrder.findUnique({
      where: {
        dveplCode,
      },
    });

    if (existing) {
      skipped++;

      console.log(
        `⏭️  Skipped ${dveplCode} - already exists`
      );

      continue;
    }

    const subtotal = order.amount;
    const gstTotal = Math.round(subtotal * 0.18 * 100) / 100;
    const grandTotal = subtotal + gstTotal;

    await prisma.salesOrder.create({
      data: {
        companyId: user.companyId,

        createdById: user.id,
        orderTakenById: user.id,

        partyName: order.partyName,
        caNo: order.caNo,
        dveplCode,

        contactDetails: order.contactDetails,

        status: getStatus(order.status),

        subtotal,
        gstTotal,
        grandTotal,

        remarks: [
          `Work: ${order.workName}`,
          `Department: ${order.department}`,
          `Section: ${order.section}`,
          `Division: ${order.division}`,
          `Sub Division: ${order.subDivision}`,
          `Location: ${order.location}`,
          `Tender ID: ${order.tenderId}`,
          `Reference Code: ${order.referenceCode}`,
        ].join("\n"),

        assignedToIds: [user.id],

        createdAt: new Date(order.date),

        sendNotification: true,
      },
    });

    created++;

    console.log(
      `✅ Created ${dveplCode} | ${order.partyName}`
    );
  }

  console.log("\n----------------------------------------");
  console.log("🎉 SalesOrder seeding completed");
  console.log("----------------------------------------");
  console.log(`Created : ${created}`);
  console.log(`Skipped : ${skipped}`);
  console.log(`Total   : ${orders.length}`);
  console.log("----------------------------------------\n");
}

async function main() {
  await seedSalesOrders();
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("❌ Seeder failed:");
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
