import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await prisma.productionRecord.findUnique({
    where: { id },
    include: { batchRecipe: { include: { design: true, program: true, entries: true } }, machineEntries: true, delayLogs: { include: { delayCode: true } }, shift: true },
  });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { machineEntries, ...rest } = body;
  const data = await prisma.productionRecord.update({ where: { id }, data: rest });
  return NextResponse.json(data);
}
