import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ConditionBadge, WikiPageType } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import pg from "pg";
import { createSlug } from "../src/lib/slug";
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

const CONNECTION_V1_SECTIONS = [
  {
    id: "design",
    title: "Design",
    content: `<p>The Tamagotchi Connection Version 1 features the classic egg-shaped shell design with a keychain attachment. The device has three buttons (A, B, C) and a monochrome LCD screen displaying your Tamagotchi character and various menus.</p>
<p>The shell comes in numerous colorways, each with unique patterns and designs that have become highly collectible among enthusiasts.</p>`,
  },
  {
    id: "features",
    title: "Features",
    content: `<p>The Connection v1 introduced infrared connectivity, allowing two devices to connect, play games together, exchange gifts, and even marry their Tamagotchis.</p>`,
    children: [
      {
        id: "meter",
        title: "Meter",
        content: `<p>The hunger and happy meters must be kept filled by feeding and playing with your Tamagotchi. If either meter empties completely, your Tamagotchi may become sick or pass away.</p>`,
      },
      {
        id: "food",
        title: "Food",
        content: `<p>Meals fill the hunger meter while snacks increase happiness. Different foods have varying effects on your Tamagotchi's weight and mood.</p>`,
      },
      {
        id: "games",
        title: "Games",
        content: `<p>Three built-in games help increase happiness and can earn points. Playing games is essential for keeping your Tamagotchi healthy and happy.</p>`,
      },
    ],
  },
  {
    id: "gallery",
    title: "Gallery",
    content: `<p>Official shell designs and packaging for the Tamagotchi Connection Version 1.</p>`,
  },
  {
    id: "references",
    title: "References",
    content: `<ol><li><a href="https://www.tamashell.com/connectionv1">TamaShell</a> — Shell catalog reference</li></ol>`,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
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

  if (process.env.SKIP_TAMASHELL_IMPORT !== "true") {
    console.log("Importing devices and shells from TamaShell...");
    const importer = new TamaShellImporter();
    const result = await importer.importAll();
    console.log(
      `TamaShell import: ${result.devices} devices processed, ${result.shells} shells added, ${result.skipped} skipped`
    );
  } else {
    console.log("Skipping TamaShell import (SKIP_TAMASHELL_IMPORT=true)");
  }

  const connV1 = await prisma.deviceModel.findFirst({
    where: {
      OR: [
        { slug: "tamagotchi-connection-v1" },
        { name: { equals: "Tamagotchi Connection v1", mode: "insensitive" } },
        { name: { contains: "Connection Version 1", mode: "insensitive" } },
      ],
    },
  });

  if (connV1) {
    await prisma.deviceModel.update({
      where: { id: connV1.id },
      data: {
        alternateNames: [
          "Tamagotchi Connection Version 1",
          "Connection V1",
          "Keitai Kaitsuu Tamagotchi Plus",
        ],
        releaseYear: connV1.releaseYear ?? 2004,
        generation: connV1.generation ?? "Connection",
        description:
          connV1.description ??
          "The Tamagotchi Connection Version 1 is a virtual pet device released by Bandai in 2004.",
      },
    });

    await prisma.deviceProperty.createMany({
      data: [
        { deviceModelId: connV1.id, group: "Details", label: "Series", value: "Tamagotchi Connection", sortOrder: 1 },
        { deviceModelId: connV1.id, group: "Details", label: "Manufacturer", value: "Bandai", sortOrder: 2 },
        { deviceModelId: connV1.id, group: "Details", label: "Release", value: "2004", sortOrder: 3 },
      ],
      skipDuplicates: true,
    });

    const wikiPage = await prisma.wikiPage.upsert({
      where: { slug: "tamagotchi-connection-v1" },
      update: {},
      create: {
        title: "Tamagotchi Connection Version 1",
        slug: "tamagotchi-connection-v1",
        deviceModelId: connV1.id,
        pageType: WikiPageType.DEVICE,
        summary:
          "The Tamagotchi Connection Version 1 is a virtual pet device released by Bandai in 2004. It was the first Tamagotchi in the Connection series to feature infrared connectivity for multiplayer features.",
        sections: CONNECTION_V1_SECTIONS,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await prisma.wikiRevision.create({
      data: {
        wikiPageId: wikiPage.id,
        title: wikiPage.title,
        summary: wikiPage.summary,
        sections: CONNECTION_V1_SECTIONS,
        editedById: user.id,
        editSummary: "Initial page",
      },
    });
  }

  const connV3 = await prisma.deviceModel.findFirst({
    where: { name: { equals: "Tamagotchi Connection v3", mode: "insensitive" } },
  });

  if (connV3) {
    const blueWavesShell = await prisma.shell.findFirst({
      where: {
        deviceModelId: connV3.id,
        name: { contains: "Blue", mode: "insensitive" },
      },
    });

    if (blueWavesShell) {
      await prisma.ownedDevice.upsert({
        where: { slug: "blue-waves-connection-v3-demo" },
        update: {},
        create: {
          userId: user.id,
          deviceModelId: connV3.id,
          shellId: blueWavesShell.id,
          slug: "blue-waves-connection-v3-demo",
          nickname: "My Blue Waves",
          conditionBadge: ConditionBadge.NIB,
          showMoreInfo:
            "I bought this at a convention in Orlando. It has the original packaging and was a great find!",
          favorite: true,
          currentlyRunning: true,
          workingStatus: "WORKING",
          purchaseDate: new Date("2026-06-05"),
          purchasePrice: 45.0,
          purchasedFrom: "Tamagotchi Convention Orlando",
        },
      });
    }
  }

  console.log("Seed completed. Demo user: demo@tamadex.app / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
