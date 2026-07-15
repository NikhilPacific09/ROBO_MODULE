import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await prisma.shiftOperatorAssignment.findMany({
    where: { shiftId: id },
    include: { machine: true, operator: true },
  });
  return NextResponse.json(data);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { machineId, operatorId } = await req.json();
  const data = await prisma.shiftOperatorAssignment.create({
    data: { shiftId: id, machineId, operatorId },
    include: { machine: true, operator: true },
  });
  return NextResponse.json(data, { status: 201 });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: _shiftId } = await params;
  const { assignmentId } = await req.json();
  await prisma.shiftOperatorAssignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ ok: true });
}
