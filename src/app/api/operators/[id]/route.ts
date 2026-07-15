import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await prisma.operator.update({ where: { id }, data: await req.json() });
  return NextResponse.json(data);
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.operator.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
