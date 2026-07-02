
export async function seedCompany() {
  return prisma.company.upsert({
    where: {
      gst: "07ABCDE1234F1Z5",
    },
    update: {},
    create: {
      name: "Demo Manufacturing Pvt Ltd",
      gst: "07ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      email: "info@demo.com",
      phone: "9999999999",
      address: "Delhi",
    },
  });
}