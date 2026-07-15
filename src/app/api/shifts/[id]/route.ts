import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      operatorAssignments: { include: { machine: true, operator: true } },
      batchRecipes: { include: { design: true, program: true, _count: { select: { productionRecords: true } } } },
      productionRecords: { include: { batchRecipe: { include: { design: true } }, machineEntries: true }, orderBy: { createdAt: "desc" } },
      delayLogs: { include: { delayCode: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { productionRecords: true } },
    },
  });
  if (!shift) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(shift);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const shift = await prisma.shift.update({ where: { id }, data: body });
  return NextResponse.json(shift);
}
