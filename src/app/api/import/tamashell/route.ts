import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { TamaShellImporter } from "@/lib/importers/tamashell";

export async function POST(request: NextRequest) {
  await requireAdmin();

  const { action } = await request.json();

  if (action === "scan") {
    const importer = new TamaShellImporter();
    const preview = await importer.scan();
    return NextResponse.json(preview);
  }

  if (action === "import") {
    const { selections } = await request.json();
    const importer = new TamaShellImporter();
    const result = await importer.importSelected(selections);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  await requireAdmin();

  const logs = await prisma.importLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(logs);
}
