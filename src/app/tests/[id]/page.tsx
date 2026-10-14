import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TestRunnerClient } from "./TestRunnerClient";

export const dynamic = "force-dynamic";

interface TestPageProps {
  params: { id: string };
}

export default async function TestRunnerPage({ params }: TestPageProps) {
  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!test || test.questions.length === 0) {
    notFound();
  }

  return <TestRunnerClient test={test} />;
}
