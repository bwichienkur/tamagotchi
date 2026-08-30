import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { z } from "zod";

const updateProfileSchema = z.object({
  collectionImage: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = updateProfileSchema.parse(body);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.collectionImage !== undefined && { collectionImage: data.collectionImage }),
    },
    select: { collectionImage: true },
  });

  return NextResponse.json(user);
}
