
export async function seedShift() {
  console.log(" Seeding Shifts...");

  const shifts = [
    {
      name: "General Shift",
      startTime: "09:00",
      endTime: "18:00",
    },
    {
      name: "Morning Shift",
      startTime: "06:00",
      endTime: "14:00",
    },
    {
      name: "Evening Shift",
      startTime: "14:00",
      endTime: "22:00",
    },
    {
      name: "Night Shift",
      startTime: "22:00",
      endTime: "06:00",
    },
  ];

  return Promise.all(
    shifts.map((shift) =>
      prisma.shift.upsert({
        where: {
          name: shift.name,
        },
        update: {
          startTime: shift.startTime,
          endTime: shift.endTime,
        },
        create: shift,
      })
    )
  );
}