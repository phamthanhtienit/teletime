import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@teletime.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      fullName: "Quan tri vien",
      role: "ADMIN",
    },
  });

  console.log(`Da tao tai khoan Admin: ${adminEmail} / ${adminPassword}`);

  // Tao san 2 ca lam mau
  const shiftCount = await prisma.shift.count();
  if (shiftCount === 0) {
    await prisma.shift.createMany({
      data: [
        { name: "Ca sang", startTime: "08:00", endTime: "12:00" },
        { name: "Ca chieu", startTime: "13:00", endTime: "17:00" },
      ],
    });
    console.log("Da tao 2 ca lam mau: Ca sang, Ca chieu");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
