import { PrismaClient } from "@prisma/client";

/**
 * Syncs Customer records from Quote Tender portal data.
 *
 * Customers are grouped by `firm_name` and upserted (matched by
 * `name + companyId`). A primary ContactPerson is upserted with the order's
 * contact details (name / mobile / email). Sales orders whose `partyName`
 * matches the firm are linked to the customer via `customerId`.
 */
export async function syncCustomersFromQuoteTender(
  prisma: PrismaClient,
  companyId: string,
  tenders: any[]
) {
  const customersByFirm = new Map<string, any[]>();

  for (const order of tenders) {
    const firm = String(order.firm_name || "").trim();
    if (!firm) continue;
    if (!customersByFirm.has(firm)) customersByFirm.set(firm, []);
    customersByFirm.get(firm)!.push(order);
  }

  const syncedCustomers: any[] = [];

  for (const [firm, orders] of customersByFirm.entries()) {
    const first = orders[0];
    const location = [first.state_name, first.city_name]
      .filter(Boolean)
      .join(", ") || null;

    let customer = await prisma.customer.findFirst({
      where: { companyId, name: firm, deletedAt: null },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId,
          name: firm,
          firmName: firm,
          billingAddress: location,
          shippingAddress: location,
          isActive: true,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firmName: firm,
          billingAddress: customer.billingAddress || location,
          shippingAddress: customer.shippingAddress || location,
        },
      });
    }

    const contactOrder =
      orders.find((o) => o.name || o.mobile || o.email_id) || first;
    const contactName = String(contactOrder.name || "").trim();
    const phone = String(contactOrder.mobile || "").trim();
    const email = String(contactOrder.email_id || "").trim();

    if (contactName || phone || email) {
      const existingContact = await prisma.contactPerson.findFirst({
        where: { customerId: customer.id, isPrimary: true, deletedAt: null },
      });

      if (existingContact) {
        await prisma.contactPerson.update({
          where: { id: existingContact.id },
          data: {
            name: contactName || existingContact.name,
            phone: phone || existingContact.phone,
            email: email || existingContact.email,
          },
        });
      } else {
        await prisma.contactPerson.create({
          data: {
            customerId: customer.id,
            name: contactName || "Primary Contact",
            phone: phone || null,
            email: email || null,
            isPrimary: true,
          },
        });
      }
    }

    syncedCustomers.push(customer);
  }

  for (const customer of syncedCustomers) {
    await prisma.salesOrder.updateMany({
      where: {
        companyId,
        partyName: customer.name,
        customerId: null,
        deletedAt: null,
      },
      data: { customerId: customer.id },
    });
  }

  return syncedCustomers;
}