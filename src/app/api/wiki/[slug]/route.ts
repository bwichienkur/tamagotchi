import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { z } from "zod";

const updateWikiSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      level: z.number().optional(),
      children: z
        .array(z.object({ id: z.string(), title: z.string(), content: z.string() }))
        .optional(),
    })
  ),
  editSummary: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      deviceModel: { include: { family: true, properties: true, shells: true } },
      ownedDevice: { include: { deviceModel: true, shell: true } },
      parent: true,
      children: true,
      revisions: {
        include: { editedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      citations: true,
      createdBy: { select: { name: true } },
      updatedBy: { select: { name: true } },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await requireAuth();
  const { slug } = await params;
  const body = await request.json();
  const data = updateWikiSchema.parse(body);

  const existing = await prisma.wikiPage.findUnique({ where: { slug } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.wikiPage.update({
      where: { slug },
      data: {
        title: data.title,
        summary: data.summary,
        sections: data.sections,
        updatedById: session.user.id,
      },
    }),
    prisma.wikiRevision.create({
      data: {
        wikiPageId: existing.id,
        title: data.title,
        summary: data.summary,
        sections: data.sections,
        editedById: session.user.id,
        editSummary: data.editSummary ?? "Updated page",
      },
    }),
  ]);

  return NextResponse.json(updated);
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  const body = await request.json();
  const { title, parentPageId, deviceModelId } = body;

  const slug = createSlug(title);
  const existing = await prisma.wikiPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Page already exists" }, { status: 409 });
  }

  const page = await prisma.wikiPage.create({
    data: {
      title,
      slug,
      parentPageId,
      deviceModelId,
      createdById: session.user.id,
      updatedById: session.user.id,
      sections: [],
    },
  });

  await prisma.wikiRevision.create({
    data: {
      wikiPageId: page.id,
      title: page.title,
      sections: [],
      editedById: session.user.id,
      editSummary: "Initial page",
    },
  });

  return NextResponse.json(page, { status: 201 });
}
