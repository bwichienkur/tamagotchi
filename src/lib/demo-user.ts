import "@/lib/bootstrap-env";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const DEMO_EMAIL = "demo@tamadex.app";
export const DEMO_PASSWORD = "demo1234";

export async function ensureDemoUser() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, role: "admin", name: "Bright" },
    create: {
      email: DEMO_EMAIL,
      name: "Bright",
      passwordHash,
      role: "admin",
    },
  });
}
