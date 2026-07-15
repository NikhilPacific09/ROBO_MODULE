import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const shiftId = req.nextUrl.searchParams.get("shiftId");
  const batchRecipeId = req.nextUrl.searchParams.get("batchRecipeId");
  const where: Record<string, string> = {};
  if (shiftId) where.shiftId = shiftId;
  if (batchRecipeId) where.batchRecipeId = batchRecipeId;
  const data = await prisma.productionRecord.findMany({
    where,
    include: { batchRecipe: { include: { design: true, program: true } }, machineEntries: true, shift: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const body = await req.json();
  const record = await prisma.productionRecord.create({
    data: {
      slabNumber:    body.slabNumber,
      shiftId:       body.shiftId,
      batchRecipeId: body.batchRecipeId,
      status:        body.status || "COMPLETED",
      bodyWeight:    body.bodyWeight ? Number(body.bodyWeight) : null,
      thickness:     body.thickness ? Number(body.thickness) : null,
      remarks:       body.remarks || null,
      machineEntries: {
        create: (body.machineEntries || []).map((e: { machineName: string; inTime?: string; outTime?: string; actualCycleTime?: number }) => ({
          machineName:     e.machineName,
          inTime:          e.inTime || null,
          outTime:         e.outTime || null,
          actualCycleTime: e.actualCycleTime ? Number(e.actualCycleTime) : null,
        })),
      },
    },
    include: { batchRecipe: { include: { design: true } }, machineEntries: true },
  });
  return NextResponse.json(record, { status: 201 });
}
