import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getUserId() {
  const user = await prisma.user.findFirst();
  return user?.id ?? "default-student";
}

export async function GET() {
  try {
    const userId = await getUserId();
    const collections = await prisma.savedWordList.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        wordsJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const parsed = collections.map((c) => ({
      ...c,
      words: JSON.parse(c.wordsJson) as string[],
    }));

    return NextResponse.json({ collections: parsed });
  } catch (err) {
    console.error("GET custom-vocab collections error:", err);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
