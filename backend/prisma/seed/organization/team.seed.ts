export async function seedTeam(prisma: any, departments: any[]) {
  console.log("Seeding Teams...");

  const departmentTeams: Record<string, string[]> = {
    SALES: ["Domestic Sales", "International Sales"],
    HR: ["Talent Acquisition", "HR Operations"],
    ACC: ["Accounts Payable", "Accounts Receivable"],
    PROD: ["Manufacturing Assembly", "Quality Control"],
  };

  const createdTeams: any[] = [];

  for (const dept of departments) {
    const teamsToCreate = departmentTeams[dept.code] || [];

    for (const name of teamsToCreate) {
      // Since Team doesn't have a unique constraint on departmentId + name in the schema,
      // we check for existence manually to prevent duplicates.
      let team = await prisma.team.findFirst({
        where: {
          departmentId: dept.id,
          name,
        },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            departmentId: dept.id,
            name,
            isActive: true,
          },
        });
      }

      createdTeams.push(team);
    }
  }

  return createdTeams;
}
