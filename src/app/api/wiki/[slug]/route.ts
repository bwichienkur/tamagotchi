import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { z } from "zod";

const updateWikiSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  coverImage: z.string().nullable().optional(),
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
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
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

  revalidatePath("/wiki", "layout");
  revalidatePath(`/wiki/${slug}`);

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: { children: { select: { title: true } } },
  });

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (page.children.length > 0) {
    return NextResponse.json(
      {
        error: `This page has ${page.children.length} subpage(s). Delete or move them first.`,
      },
      { status: 400 }
    );
  }

  await prisma.wikiPage.delete({ where: { id: page.id } });

  return NextResponse.json({ ok: true });
}
