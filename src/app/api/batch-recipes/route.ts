import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const shiftId = req.nextUrl.searchParams.get("shiftId");
  const where = shiftId ? { shiftId } : {};
  const data = await prisma.batchRecipe.findMany({
    where,
    include: {
      design: true,
      program: true,
      entries: { include: { machine: true } },
      _count: { select: { productionRecords: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  // Look up or create Design
  let designId: string | null = null;
  if (body.designName) {
    const existing = await prisma.design.findUnique({ where: { name: body.designName } });
    if (existing) {
      designId = existing.id;
    } else {
      const created = await prisma.design.create({ data: { name: body.designName } });
      designId = created.id;
    }
  }

  // Look up or create Program
  let programId: string | null = null;
  if (body.programName && designId) {
    const existing = await prisma.program.findUnique({ where: { name: body.programName } });
    if (existing) {
      programId = existing.id;
    } else {
      const created = await prisma.program.create({
        data: { name: body.programName, designId },
      });
      programId = created.id;
    }
  }

  const recipe = await prisma.batchRecipe.create({
    data: {
      shiftId:     body.shiftId,
      designId:    designId,
      programId:   programId,
      designName:  body.designName || "",
      programName: body.programName || "",
      targetSlabs: body.targetSlabs ? Number(body.targetSlabs) : null,
      notes:       body.notes || null,
      entries: {
        create: (body.entries || []).map((e: {
          machineId: string; toolName?: string; liquidName?: string;
          powderName?: string; rollerHeight?: string; targetCycleTime?: number | null;
        }) => ({
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
