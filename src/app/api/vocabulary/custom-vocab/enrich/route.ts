import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const EnrichSchema = z.object({
  words: z.array(z.string().min(1)).min(1).max(200),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "auto"]).optional().default("auto"),
});

export interface EnrichedWord {
  word: string;
  ipa: string;
  pos: string;
  defEn: string;
  defVn: string;
  exampleEn: string;
  exampleVn: string;
  cefrEstimate: string;
  synonyms: string[];
  collocations: string[];
  usageNote: string;
}

function deterministicEnrich(word: string, cefrLevel: string): EnrichedWord {
  const levels = ["A1", "A2", "B1", "B2"];
  const level = cefrLevel === "auto" ? "A2" : cefrLevel;
  const clean = word.trim();
  return {
    word: clean,
    ipa: `/${clean.toLowerCase()}/`,
    pos: "word",
    defEn: `Target vocabulary term: "${clean}" used in practical communication.`,
    defVn: `Nghĩa của từ "${clean}" trong tiếng Việt.`,
    exampleEn: `We practiced using "${clean}" in our conversation today.`,
    exampleVn: `Chúng tôi đã thực hành sử dụng từ "${clean}" trong cuộc trò chuyện hôm nay.`,
    cefrEstimate: level,
    synonyms: [],
    collocations: [],
    usageNote: "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EnrichSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { words, cefrLevel } = parsed.data;
    const lowerWords = words.map((w) => w.toLowerCase().trim());

    // 1. Check local database for existing words
    const existing = await prisma.vocabularyWord.findMany({
      where: {
        word: { in: lowerWords },
      },
    });

    const existingMap = new Map<string, typeof existing[0]>();
    for (const item of existing) {
      existingMap.set(item.word.toLowerCase(), item);
    }

    const results: EnrichedWord[] = [];
    const missingWords: string[] = [];

    for (const originalWord of words) {
      const lower = originalWord.toLowerCase().trim();
      const rec = existingMap.get(lower);
      if (rec && rec.defVn) {
        results.push({
          word: originalWord,
          ipa: rec.phonetic || `/${lower}/`,
          pos: rec.pos || "word",
          defEn: rec.defEn || `Definition of ${originalWord}`,
          defVn: rec.defVn,
          exampleEn: rec.exampleEn || `Example sentence with "${originalWord}".`,
          exampleVn: rec.exampleVn || `Ví dụ với từ "${originalWord}".`,
          cefrEstimate: rec.cefrLevel || (cefrLevel === "auto" ? "A2" : cefrLevel),
          synonyms: rec.synonyms ? rec.synonyms.split(",").map((s) => s.trim()) : [],
          collocations: rec.collocations ? rec.collocations.split(",").map((s) => s.trim()) : [],
          usageNote: "",
        });
      } else {
        missingWords.push(originalWord);
      }
    }

    // 2. Fetch missing words via LLM (Gemini) if API key present
    if (missingWords.length > 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      let aiResolved = false;

      if (geminiKey && geminiKey.trim() !== "") {
        try {
          const prompt = `You are an expert bilingual English-Vietnamese lexicographer.
For each English word or phrase in this list, provide comprehensive vocabulary information:
${JSON.stringify(missingWords)}

Return a strict JSON array where each object has:
{
  "word": "original word or phrase",
  "ipa": "IPA pronunciation, e.g. /həˈloʊ/",
  "pos": "noun/verb/adjective/adverb/phrase",
  "defEn": "clear, concise English definition",
  "defVn": "natural, accurate Vietnamese meaning",
  "exampleEn": "natural example sentence using the word",
  "exampleVn": "Vietnamese translation of the example sentence",
  "cefrEstimate": "A1/A2/B1/B2/C1",
  "synonyms": ["up to 3 synonyms"],
  "collocations": ["up to 3 common collocations"],
  "usageNote": "brief usage note or empty string"
}`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.1,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            const parsedArray = JSON.parse(text);
            if (Array.isArray(parsedArray)) {
              for (const item of parsedArray) {
                results.push({
                  word: item.word || "",
                  ipa: item.ipa || "",
                  pos: item.pos || "word",
                  defEn: item.defEn || "",
                  defVn: item.defVn || "",
                  exampleEn: item.exampleEn || "",
                  exampleVn: item.exampleVn || "",
                  cefrEstimate: item.cefrEstimate || (cefrLevel === "auto" ? "A2" : cefrLevel),
                  synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
                  collocations: Array.isArray(item.collocations) ? item.collocations : [],
                  usageNote: item.usageNote || "",
                });
              }
              aiResolved = true;
            }
          }
        } catch (err) {
          console.warn("AI vocabulary enrichment failed, falling back to local synthesizer:", err);
        }
      }

      // If AI was not used or failed, synthesize fallback
      if (!aiResolved) {
        for (const w of missingWords) {
          results.push(deterministicEnrich(w, cefrLevel));
        }
      }
    }

    return NextResponse.json({ enriched: results });
  } catch (err) {
    console.error("Enrich custom vocab error:", err);
    return NextResponse.json({ error: "Failed to enrich words" }, { status: 500 });
  }
}
