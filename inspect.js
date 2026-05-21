const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.recurringDonationConfig.findFirst();
  console.log("recurringDonationConfig:", config);

  const posLogs = await prisma.posDonationLog.findMany({
    where: { orderNumber: "#1026" }
  });
  console.log("POS Logs for #1026:", posLogs);

  const presetLogs = await prisma.donation.findMany({
    where: { orderNumber: "#1026" }
  });
  console.log("Preset/Donation Logs for #1026:", presetLogs);

  const recurringLogs = await prisma.recurringDonationLog.findMany({
    where: { orderNumber: "#1026" }
  });
  console.log("Recurring Logs for #1026:", recurringLogs);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
