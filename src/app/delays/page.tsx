"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DelaysRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/production/new"); }, [router]);
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-gray-400">Redirecting to New Slab Entry...</p>
    </div>
  );
}
