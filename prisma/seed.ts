import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ConditionBadge, WikiPageType } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import pg from "pg";
import { createSlug } from "../src/lib/slug";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FAMILIES = [
  { name: "Vintage", slug: "vintage", sortOrder: 1 },
  { name: "Connection", slug: "connection", sortOrder: 2 },
  { name: "Modern", slug: "modern", sortOrder: 3 },
  { name: "Classic Remakes", slug: "classic-remakes", sortOrder: 4 },
];

const DEVICE_MODELS = [
  { name: "Tamagotchi P1", family: "vintage", year: 1996, generation: "P1" },
  { name: "Tamagotchi P2", family: "vintage", year: 1997, generation: "P2" },
  { name: "Tamagotchi Angel", family: "vintage", year: 1997, generation: "Angel" },
  { name: "Tamagotchi Connection Version 1", family: "connection", year: 2004, generation: "Connection" },
  { name: "Tamagotchi Connection v2", family: "connection", year: 2005, generation: "Connection" },
  { name: "Tamagotchi Connection v3", family: "connection", year: 2006, generation: "Connection" },
  { name: "Tamagotchi Connection v4", family: "connection", year: 2007, generation: "Connection" },
  { name: "Tamagotchi Connection v4.5", family: "connection", year: 2008, generation: "Connection" },
  { name: "Tamagotchi Connection v5", family: "connection", year: 2008, generation: "Connection" },
  { name: "Tamagotchi Connection v5.5", family: "connection", year: 2009, generation: "Connection" },
  { name: "Tamagotchi Connection v6", family: "connection", year: 2010, generation: "Connection" },
  { name: "Tamagotchi Plus Color", family: "modern", year: 2008, generation: "Plus Color" },
  { name: "Tamagotchi iD", family: "modern", year: 2009, generation: "iD" },
  { name: "Tamagotchi iD L", family: "modern", year: 2010, generation: "iD L" },
  { name: "Tamagotchi P's", family: "modern", year: 2012, generation: "P's" },
  { name: "Tamagotchi Friends", family: "modern", year: 2013, generation: "Friends" },
  { name: "Tamagotchi 4U", family: "modern", year: 2014, generation: "4U" },
  { name: "Tamagotchi 4U+", family: "modern", year: 2015, generation: "4U+" },
  { name: "Tamagotchi m!x", family: "modern", year: 2016, generation: "m!x" },
  { name: "Tamagotchi Meets / On", family: "modern", year: 2018, generation: "Meets/On" },
  { name: "Tamagotchi Pix", family: "modern", year: 2021, generation: "Pix" },
  { name: "Tamagotchi Smart", family: "modern", year: 2021, generation: "Smart" },
  { name: "Tamagotchi Uni", family: "modern", year: 2023, generation: "Uni" },
  { name: "Tamagotchi Paradise", family: "modern", year: 2025, generation: "Paradise" },
  { name: "Original Tamagotchi", family: "classic-remakes", year: 2017, generation: "Remake" },
  { name: "Tamagotchi Connection 20th Anniversary", family: "classic-remakes", year: 2024, generation: "Connection Remake" },
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
      {
        id: "toilet",
        title: "Toilet",
        content: `<p>When your Tamagotchi makes a mess, you must clean it up using the toilet icon. Neglecting this can lead to sickness.</p>`,
      },
      {
        id: "training",
        title: "Training",
        content: `<p>Discipline your Tamagotchi when it misbehaves by selecting the discipline icon. Proper training affects which adult character your Tamagotchi becomes.</p>`,
      },
      {
        id: "tamacom",
        title: "TamaCom",
        content: `<p>The infrared port allows connection with other Tamagotchi devices for multiplayer features, gift exchange, and breeding.</p>`,
      },
      {
        id: "lights",
        title: "Lights",
        content: `<p>Toggle the room lights on and off. Your Tamagotchi needs rest when the lights are off, and will wake when they turn back on.</p>`,
      },
      {
        id: "friends-list",
        title: "Friends List",
        content: `<p>Keep track of Tamagotchis you've connected with. The friends list stores information about connected characters.</p>`,
      },
      {
        id: "items",
        title: "Items",
        content: `<p>Special items can be obtained through connections and affect gameplay. Items are stored in your inventory for use.</p>`,
      },
      {
        id: "animations",
        title: "Animations",
        content: `<p>The Connection v1 features various character animations including eating, playing, sleeping, and special connection animations.</p>`,
      },
    ],
  },
  {
    id: "rom-versions",
    title: "ROM Versions",
    content: `<p>Several ROM versions exist for the Connection v1, with minor differences in gameplay and character sets between regions and production runs.</p>
<table><thead><tr><th>Version</th><th>Region</th><th>Notes</th></tr></thead><tbody><tr><td>v1.0</td><td>US</td><td>Initial release</td></tr><tr><td>v1.1</td><td>US/EU</td><td>Bug fixes</td></tr><tr><td>v1.0</td><td>JP</td><td>Keitai Kaitsuu variant</td></tr></tbody></table>`,
  },
  {
    id: "gallery",
    title: "Gallery",
    content: `<p>Official shell designs and packaging for the Tamagotchi Connection Version 1.</p>`,
  },
  {
    id: "trivia",
    title: "Trivia",
    content: `<ul><li>The Connection v1 was the first Tamagotchi to feature infrared connectivity in the international market.</li><li>Some shell designs are considered rare and command premium prices among collectors.</li><li>The device was marketed as "Tamagotchi Connection" in English-speaking regions.</li></ul>`,
  },
  {
    id: "references",
    title: "References",
    content: `<ol><li><a href="https://www.tamashell.com">TamaShell</a> — Shell catalog reference</li><li>Bandai product documentation</li></ol>`,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@tamadex.app" },
    update: {},
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
      update: {},
      create: family,
    });
  }

  const familyMap = Object.fromEntries(
    (await prisma.deviceFamily.findMany()).map((f) => [f.slug, f.id])
  );

  const modelMap: Record<string, string> = {};

  for (const model of DEVICE_MODELS) {
    const slug = createSlug(model.name);
    const created = await prisma.deviceModel.upsert({
      where: { slug },
      update: {},
      create: {
        name: model.name,
        slug,
        familyId: familyMap[model.family],
        releaseYear: model.year,
        generation: model.generation,
        manufacturer: "Bandai",
        regions: ["Japan", "North America", "Europe"],
        alternateNames: model.name.includes("Version 1")
          ? ["Tamagotchi Connection v1", "Connection V1", "Keitai Kaitsuu Tamagotchi Plus"]
          : [],
        description: `${model.name} — part of the ${model.generation} generation of Tamagotchi virtual pets.`,
      },
    });
    modelMap[model.name] = created.id;
  }

  const connV1Id = modelMap["Tamagotchi Connection Version 1"];

  await prisma.deviceProperty.createMany({
    data: [
      { deviceModelId: connV1Id, group: "Details", label: "Series", value: "Tamagotchi Connection", sortOrder: 1 },
      { deviceModelId: connV1Id, group: "Details", label: "Manufacturer", value: "Bandai", sortOrder: 2 },
      { deviceModelId: connV1Id, group: "Details", label: "Release", value: "2004", sortOrder: 3 },
      { deviceModelId: connV1Id, group: "Details", label: "Region", value: "Japan, North America, Europe", sortOrder: 4 },
      { deviceModelId: connV1Id, group: "Technical", label: "Screen", value: "32 × 16 pixels", sortOrder: 1 },
      { deviceModelId: connV1Id, group: "Technical", label: "Battery", value: "CR2032", sortOrder: 2 },
      { deviceModelId: connV1Id, group: "Technical", label: "Connectivity", value: "Infrared", sortOrder: 3 },
      { deviceModelId: connV1Id, group: "Related", label: "Successor", value: "Tamagotchi Connection v2", sortOrder: 1 },
    ],
    skipDuplicates: true,
  });

  const demoShells = [
    { name: "Pink with Ice Cream", region: "North America", year: 2004 },
    { name: "Translucent Blue", region: "Japan", year: 2004 },
    { name: "White with Stars", region: "Europe", year: 2004 },
  ];

  for (const shell of demoShells) {
    const slug = createSlug(shell.name);
    await prisma.shell.upsert({
      where: { deviceModelId_slug: { deviceModelId: connV1Id, slug } },
      update: {},
      create: {
        deviceModelId: connV1Id,
        name: shell.name,
        slug,
        region: shell.region,
        year: shell.year,
        sourceName: "Demo",
        notes: "Placeholder demo shell entry",
      },
    });
  }

  const connV3Id = modelMap["Tamagotchi Connection v3"];
  const blueWavesShell = await prisma.shell.upsert({
    where: { deviceModelId_slug: { deviceModelId: connV3Id, slug: "blue-waves" } },
    update: {},
    create: {
      deviceModelId: connV3Id,
      name: "Blue Waves",
      slug: "blue-waves",
      region: "North America",
      year: 2006,
      sourceName: "Demo",
    },
  });

  await prisma.ownedDevice.upsert({
    where: { slug: "blue-waves-connection-v3-demo" },
    update: {},
    create: {
      userId: user.id,
      deviceModelId: connV3Id,
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

  const wikiPage = await prisma.wikiPage.upsert({
    where: { slug: "tamagotchi-connection-v1" },
    update: {},
    create: {
      title: "Tamagotchi Connection Version 1",
      slug: "tamagotchi-connection-v1",
      deviceModelId: connV1Id,
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

  console.log("Seed completed. Demo user: demo@tamadex.app / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
