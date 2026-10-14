import React from "react";
import { prisma } from "@/lib/db";
import { GenerateLessonClient } from "./GenerateLessonClient";

export const dynamic = "force-dynamic";

export default async function GenerateLessonPage() {
  const chapters = await prisma.chapter.findMany({
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      title: true,
      levelId: true,
    },
  });

  return <GenerateLessonClient chapters={chapters} />;
}
