import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await prisma.batchRecipe.findUnique({
    where: { id },
    include: { design: true, program: true, entries: { include: { machine: true } }, productionRecords: { include: { machineEntries: true } } },
  });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await prisma.batchRecipe.update({ where: { id }, data: await req.json() });
  return NextResponse.json(data);
}
