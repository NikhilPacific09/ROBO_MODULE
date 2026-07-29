import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const shiftId = req.nextUrl.searchParams.get("shiftId");
  const where: Record<string, string> = {};
  if (shiftId) where.shiftId = shiftId;
  const data = await prisma.productionRecord.findMany({
    where,
    include: { batchRecipe: true, shift: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const record = await prisma.productionRecord.create({
    data: {
      slabNumber:      body.slabNumber,
      shiftId:         body.shiftId,
      batchRecipeId:   body.batchRecipeId || null,
      inTime:          body.inTime || null,
      outTime:         body.outTime || null,
      roymixCycleTime:  body.roymixCycleTime ? Number(body.roymixCycleTime) : null,
      roymixBodyWeight: body.roymixBodyWeight ? Number(body.roymixBodyWeight) : null,
      status:          body.status || "COMPLETED",
      remarks:         body.remarks || null,
    },
    include: { batchRecipe: true, shift: true },
  });

  // Create delay logs linked to this production record
  if (Array.isArray(body.delays) && body.delays.length > 0) {
    for (const d of body.delays) {
      await prisma.delayLog.create({
        data: {
          shiftId:            body.shiftId,
          productionRecordId: record.id,
          machineId:          d.machineId || null,
          machineName:        d.machineName || null,
          delayCodeId:        d.delayCodeId,
          durationMinutes:    Number(d.durationMinutes),
          startTime:          d.startTime || null,
          endTime:            d.endTime || null,
          remarks:            d.remarks || null,
        },
      });
    }
  }

  return NextResponse.json(record, { status: 201 });
}
