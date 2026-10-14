import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

async function getUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  return user?.id ?? "default-student";
}

export async function GET() {
  try {
    const userId = await getUserId();
    const lists = await prisma.savedWordList.findMany({
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
    const result = lists.map((l) => ({
      ...l,
      words: JSON.parse(l.wordsJson) as string[],
    }));
    return NextResponse.json({ lists: result });
  } catch (err) {
    console.error("GET saved-lists error:", err);
    return NextResponse.json({ error: "Failed to fetch saved lists" }, { status: 500 });
  }
}

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  words: z.array(z.string().min(1)).min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const userId = await getUserId();
    const list = await prisma.savedWordList.create({
      data: {
        userId,
        name: parsed.data.name,
        description: parsed.data.description,
        wordsJson: JSON.stringify(parsed.data.words),
      },
    });
    return NextResponse.json({
      list: { ...list, words: JSON.parse(list.wordsJson) as string[] },
    });
  } catch (err) {
    console.error("POST saved-lists error:", err);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}
