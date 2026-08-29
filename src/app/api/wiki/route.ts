import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { z } from "zod";

const createWikiSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  parentPageId: z.string().optional().nullable(),
  deviceModelId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = createWikiSchema.parse(body);
  const slug = createSlug(data.title);

  const existing = await prisma.wikiPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A page with this title already exists" }, { status: 409 });
  }

  const page = await prisma.wikiPage.create({
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      parentPageId: data.parentPageId ?? undefined,
      deviceModelId: data.deviceModelId ?? undefined,
      createdById: session.user.id,
      updatedById: session.user.id,
      sections: [],
    },
  });

  await prisma.wikiRevision.create({
    data: {
      wikiPageId: page.id,
      title: page.title,
      summary: page.summary,
      sections: [],
      editedById: session.user.id,
      editSummary: "Created page",
    },
  });

  return NextResponse.json(page, { status: 201 });
}
