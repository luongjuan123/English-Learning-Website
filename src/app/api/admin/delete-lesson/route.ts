import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const DeleteSchema = z.object({
  lessonId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lessonId } = DeleteSchema.parse(body);

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete lesson error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lesson" },
      { status: 400 }
    );
  }
}
