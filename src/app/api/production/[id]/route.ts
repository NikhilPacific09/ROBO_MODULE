import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const record = await prisma.productionRecord.findUnique({
    where: { id: params.id },
    include: { batchRecipe: { include: { design: true, program: true, entries: { include: { machine: true } } } }, shift: true, delayLogs: { include: { delayCode: true } } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status !== undefined)          data.status = body.status;
  if (body.remarks !== undefined)         data.remarks = body.remarks;
  if (body.inTime !== undefined)          data.inTime = body.inTime;
  if (body.outTime !== undefined)         data.outTime = body.outTime;
  if (body.roymixCycleTime !== undefined) data.roymixCycleTime = body.roymixCycleTime ? Number(body.roymixCycleTime) : null;
  if (body.thickness !== undefined)       data.thickness = body.thickness ? Number(body.thickness) : null;
  const record = await prisma.productionRecord.update({ where: { id: params.id }, data });
  return NextResponse.json(record);
}
