import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shifts = await prisma.shift.findMany({
    include: {
      batchRecipes: { include: { design: true, program: true } },
      productionRecords: true,
      delayLogs: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(shifts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const active = await prisma.shift.findFirst({ where: { status: "ACTIVE" } });
  if (active) return NextResponse.json({ error: "A shift is already active." }, { status: 409 });

  const shift = await prisma.shift.create({
    data: {
      date:             body.date,
      shiftNumber:      Number(body.shiftNumber),
      startTime:        body.startTime,
      operatorName:     body.operatorName || "",
      notes:            body.notes || null,
      roycut1CycleTime: body.roycut1CycleTime ? Number(body.roycut1CycleTime) : null,
      roycut2CycleTime: body.roycut2CycleTime ? Number(body.roycut2CycleTime) : null,
      roycut3CycleTime: body.roycut3CycleTime ? Number(body.roycut3CycleTime) : null,
    },
  });
  return NextResponse.json(shift, { status: 201 });
}
