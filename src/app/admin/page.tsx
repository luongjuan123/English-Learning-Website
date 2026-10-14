import React from "react";
import { prisma } from "@/lib/db";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const chapters = await prisma.chapter.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      lessons: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          isCustomGenerated: true,
        },
      },
    },
  });

  return <AdminClient chapters={chapters} />;
}
