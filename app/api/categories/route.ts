import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: { orderBy: { order: "asc" } },
      _count: { select: { listings: { where: { status: "LIVE" } } } },
    },
  });

  return NextResponse.json(categories);
}
