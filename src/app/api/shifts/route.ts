import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const shifts = await prisma.shift.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { productionRecords: true, batchRecipes: true, delayLogs: true } },
    },
  });
  return NextResponse.json(shifts);
}
export async function POST(req: Request) {
  const body = await req.json();
  const existing = await prisma.shift.findFirst({ where: { status: "ACTIVE" } });
  if (existing) {
    return NextResponse.json({ error: "An active shift already exists. Close it before starting a new one.", shiftId: existing.id }, { status: 409 });
  }
  const shift = await prisma.shift.create({
    data: { date: body.date, shiftNumber: Number(body.shiftNumber), startTime: body.startTime, startedBy: body.startedBy, notes: body.notes },
  });
  return NextResponse.json(shift, { status: 201 });
}
