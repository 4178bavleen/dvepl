
export async function seedHoliday() {
  console.log("Seeding Holidays...");

  const currentYear = new Date().getFullYear();

  const holidays = [
    {
      name: "Republic Day",
      date: new Date(`${currentYear}-01-26`),
      type: "NATIONAL",
    },
    {
      name: "Independence Day",
      date: new Date(`${currentYear}-08-15`),
      type: "NATIONAL",
    },
    {
      name: "Gandhi Jayanti",
      date: new Date(`${currentYear}-10-02`),
      type: "NATIONAL",
    },
    {
      name: "Christmas",
      date: new Date(`${currentYear}-12-25`),
      type: "NATIONAL",
    },
  ];

  return Promise.all(
    holidays.map((holiday) =>
      prisma.holiday.upsert({
        where: {
          name: holiday.name,
        },
        update: {
          date: holiday.date,
          type: holiday.type,
        },
        create: holiday,
      })
    )
  );
}