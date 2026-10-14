import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const StatusSchema = z.object({
  userVocabId: z.string(),
  status: z.enum(["new", "learning", "familiar", "mastered"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userVocabId, status } = StatusSchema.parse(body);

    const updated = await prisma.userVocabulary.update({
      where: { id: userVocabId },
      data: { status },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("Vocabulary status update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" },
      { status: 400 }
    );
  }
}
