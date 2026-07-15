import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const shiftId = req.nextUrl.searchParams.get("shiftId");
  const where = shiftId ? { shiftId } : {};
  const data = await prisma.batchRecipe.findMany({
    where,
    include: { design: true, program: true, entries: { include: { machine: true } }, _count: { select: { productionRecords: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const body = await req.json();
  const recipe = await prisma.batchRecipe.create({
    data: {
      batchNumber: body.batchNumber,
      shiftId:     body.shiftId,
      designId:    body.designId,
      programId:   body.programId,
      targetSlabs: body.targetSlabs ? Number(body.targetSlabs) : null,
      notes:       body.notes,
      entries: {
        create: (body.entries || []).map((e: { machineId: string; toolName?: string; liquidName?: string; powderName?: string; rollerHeight?: string; targetCycleTime?: number }) => ({
          machineId:       e.machineId,
          toolName:        e.toolName || null,
          liquidName:      e.liquidName || null,
          powderName:      e.powderName || null,
          rollerHeight:    e.rollerHeight || null,
          targetCycleTime: e.targetCycleTime ? Number(e.targetCycleTime) : null,
        })),
      },
    },
    include: { design: true, program: true, entries: { include: { machine: true } } },
  });
  return NextResponse.json(recipe, { status: 201 });
}
