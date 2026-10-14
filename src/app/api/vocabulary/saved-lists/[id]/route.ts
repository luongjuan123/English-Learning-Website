import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

async function getUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  return user?.id ?? "default-student";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const list = await prisma.savedWordList.findFirst({
      where: { id: params.id, userId },
    });
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ list: { ...list, words: JSON.parse(list.wordsJson) as string[] } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  words: z.array(z.string().min(1)).min(1).max(500).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const existing = await prisma.savedWordList.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const updated = await prisma.savedWordList.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.words && { wordsJson: JSON.stringify(parsed.data.words) }),
      },
    });
    return NextResponse.json({ list: { ...updated, words: JSON.parse(updated.wordsJson) as string[] } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const existing = await prisma.savedWordList.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.savedWordList.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
