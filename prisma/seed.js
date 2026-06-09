const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vehicles = [
    { name: "FOAM TENDER 1 (SCANIA)", type: "TRUCK" },
    { name: "FOAM TENDER 2 (HINO/ZIEGLER)", type: "TRUCK" },
    { name: "R (ISUZU D-MAX)", type: "RIV" },
    { name: "AMBULANCE (ISUZU ELF)", type: "AMBULANCE" }
  ];

  for (const v of vehicles) {
    const existing = await prisma.vehicle.findFirst({
      where: { name: v.name }
    });
    if (!existing) {
      await prisma.vehicle.create({
        data: v
      });
      console.log(`Created vehicle: ${v.name}`);
    } else {
      console.log(`Vehicle already exists: ${v.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
