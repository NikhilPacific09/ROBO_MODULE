import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const shift = await prisma.shift.findFirst({
    where: { status: "ACTIVE" },
    include: {
      operatorAssignments: { include: { machine: true, operator: true } },
      _count: { select: { productionRecords: true, batchRecipes: true, delayLogs: true } },
    },
  });
  if (!shift) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(shift);
}
