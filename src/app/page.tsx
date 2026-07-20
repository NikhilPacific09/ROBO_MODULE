import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  const activeShift = await prisma.shift.findFirst({ where: { status: "ACTIVE" } });

  const todayRecords = await prisma.productionRecord.findMany({
    where: { shift: { date: today } },
    include: { shift: true, batchRecipe: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const todayDelays = await prisma.delayLog.findMany({
    where: { shift: { date: today } },
    include: { delayCode: true },
  });

  const totalDelayMins = todayDelays.reduce((s, d) => s + d.durationMinutes, 0);

  // Slabs/hour for active shift
  let slabsPerHour: number | null = null;
  if (activeShift) {
    const [h, m] = activeShift.startTime.split(":").map(Number);
    const startMins = h * 60 + m;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const elapsed = nowMins - startMins;
    if (elapsed > 0) {
      const shiftSlabs = todayRecords.filter(r => r.shiftId === activeShift.id).length;
      slabsPerHour = Math.round((shiftSlabs / elapsed) * 60 * 10) / 10;
    }
  }

  const recentShifts = await prisma.shift.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { productionRecords: true, delayLogs: true },
  });

  const delayCategoryMap: Record<string, number> = {};
  todayDelays.forEach(d => {
    const cat = d.delayCode.category;
    delayCategoryMap[cat] = (delayCategoryMap[cat] || 0) + d.durationMinutes;
  });
  const delayChartData = Object.entries(delayCategoryMap).map(([cat, mins]) => ({ cat, mins }));

  return (
    <DashboardClient
      activeShift={activeShift}
      totalSlabs={todayRecords.length}
      totalDelayMins={totalDelayMins}
      delayEvents={todayDelays.length}
      slabsPerHour={slabsPerHour}
      recentProduction={todayRecords.slice(0, 8)}
      recentShifts={recentShifts}
      delayChartData={delayChartData}
    />
  );
}
