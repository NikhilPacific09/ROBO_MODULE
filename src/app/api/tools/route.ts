import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  return NextResponse.json(await (prisma as any).tool.findMany({ orderBy: { name: "asc" } }));
}
export async function POST(req: Request) {
  const { name } = await req.json();
  const data = await (prisma as any).tool.create({ data: { name } });
  return NextResponse.json(data, { status: 201 });
}
