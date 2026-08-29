import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import pg from "pg";
import { getDatabaseUrl, getMigrationDatabaseUrl } from "../src/lib/db";
import { TamaShellImporter } from "../src/lib/importers/tamashell";

const pool = new pg.Pool({ connectionString: getMigrationDatabaseUrl() ?? getDatabaseUrl() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FAMILIES = [
  { name: "Vintage", slug: "vintage", sortOrder: 1 },
  { name: "Connection", slug: "connection", sortOrder: 2 },
  { name: "Modern", slug: "modern", sortOrder: 3 },
  { name: "Classic Remakes", slug: "classic-remakes", sortOrder: 4 },
  { name: "Others", slug: "others", sortOrder: 5 },
];

async function removeDemoContent() {
  await prisma.ownedDevice.deleteMany({
    where: { slug: "blue-waves-connection-v3-demo" },
  });

  const demoWiki = await prisma.wikiPage.findUnique({
    where: { slug: "tamagotchi-connection-v1" },
  });

  if (demoWiki) {
    await prisma.wikiRevision.deleteMany({ where: { wikiPageId: demoWiki.id } });
    await prisma.wikiPage.delete({ where: { id: demoWiki.id } });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  await prisma.user.upsert({
    where: { email: "demo@tamadex.app" },
    update: { passwordHash, role: "admin", name: "Bright" },
    create: {
      email: "demo@tamadex.app",
      name: "Bright",
      passwordHash,
      role: "admin",
    },
  });

  for (const family of FAMILIES) {
    await prisma.deviceFamily.upsert({
      where: { slug: family.slug },
      update: { name: family.name, sortOrder: family.sortOrder },
      create: family,
    });
  }

  await removeDemoContent();

  if (process.env.SKIP_TAMASHELL_IMPORT !== "true") {
    try {
      console.log("Importing devices and shells from TamaShell...");
      const importer = new TamaShellImporter();
      const result = await importer.importAll();
      console.log(
        `TamaShell import: ${result.devices} devices processed, ${result.shells} shells added, ${result.skipped} skipped`
      );
    } catch (error) {
      console.error("TamaShell import failed (continuing seed):", error);
    }
  } else {
    console.log("Skipping TamaShell import (SKIP_TAMASHELL_IMPORT=true)");
  }

  console.log("Seed completed. Demo user: demo@tamadex.app / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
