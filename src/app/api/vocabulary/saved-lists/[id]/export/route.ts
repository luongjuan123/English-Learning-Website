import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  return user?.id ?? "default-student";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  const list = await prisma.savedWordList.findFirst({ where: { id: params.id, userId } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const words: string[] = JSON.parse(list.wordsJson);
  const fmt = req.nextUrl.searchParams.get("format") ?? "txt";

  if (fmt === "csv") {
    const csv = ["word", ...words].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${list.name.replace(/[^a-z0-9]/gi, "_")}.csv"`,
      },
    });
  }

  const txt = words.join("\n");
  return new NextResponse(txt, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${list.name.replace(/[^a-z0-9]/gi, "_")}.txt"`,
    },
  });
}
