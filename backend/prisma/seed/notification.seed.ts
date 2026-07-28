import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedNotifications() {
  const events = [
    {
      code: "SALES_ORDER_CREATED",
      name: "Sales Order Created",
    },
    {
      code: "SALES_ORDER_STATUS_CHANGED",
      name: "Sales Order Status Changed",
    },
    {
      code: "PURCHASE_ORDER_CREATED",
      name: "Purchase Order Created",
    },
    {
      code: "PURCHASE_ORDER_APPROVED",
      name: "Purchase Order Approved",
    },
    {
      code: "DRAWING_PENDING",
      name: "Drawing Pending",
    },
    {
      code: "DRAWING_APPROVED",
      name: "Drawing Approved",
    },
    {
      code: "PAYMENT_DUE",
      name: "Payment Due",
    },
    {
      code: "DELIVERY_DUE",
      name: "Delivery Due",
    },
    {
      code: "LOW_STOCK",
      name: "Low Stock",
    },
    {
      code: "VENDOR_CREATED",
      name: "Vendor Created",
    },
  ];

  for (const event of events) {
    await prisma.notificationEvent.upsert({
      where: {
        code: event.code,
      },
      update: {},
      create: event,
    });
  }

  console.log("Notification Events Seeded");
}

async function main() {
  await seedNotifications();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });