
export async function seedDesignation() {
  console.log(" Seeding Designations...");

  const designations = [
    { title: "Managing Director", level: 1 },
    { title: "CEO", level: 2 },
    { title: "General Manager", level: 3 },
    { title: "HR Manager", level: 4 },
    { title: "HR Executive", level: 5 },
    { title: "Sales Manager", level: 4 },
    { title: "Sales Executive", level: 5 },
    { title: "Production Manager", level: 4 },
    { title: "Production Engineer", level: 5 },
    { title: "Quality Manager", level: 4 },
    { title: "Quality Engineer", level: 5 },
    { title: "Purchase Manager", level: 4 },
    { title: "Purchase Executive", level: 5 },
    { title: "Accounts Manager", level: 4 },
    { title: "Accountant", level: 5 },
    { title: "Store Manager", level: 4 },
    { title: "Store Executive", level: 5 },
    { title: "Operator", level: 6 },
    { title: "Technician", level: 6 },
    { title: "Helper", level: 7 },
  ];

  return Promise.all(
    designations.map((designation) =>
      prisma.designation.upsert({
        where: {
          title: designation.title,
        },
        update: {
          level: designation.level,
        },
        create: designation,
      })
    )
  );
}