import { describe, it, expect } from "vitest";
import { parseWordList } from "../src/lib/custom-test/parser";
import { normalizeAnswer, evaluateAnswer } from "../src/lib/custom-test/evaluator";

describe("Custom Test Parser", () => {
  it("splits words by newline and comma, trims whitespace, and deduplicates case-insensitively", () => {
    const raw = "hello, World\nHELLO\n  dog  \ncat,cat\n\nworld";
    const res = parseWordList(raw);
    expect(res.words).toEqual(["hello", "World", "dog", "cat"]);
    expect(res.duplicatesRemoved).toBe(3);
    expect(res.count).toBe(4);
    expect(res.originalCount).toBe(7);
  });

  it("handles empty and whitespace-only strings gracefully", () => {
    const res = parseWordList("   \n\n  \t  ");
    expect(res.words).toEqual([]);
    expect(res.count).toBe(0);
    expect(res.originalCount).toBe(0);
  });
});

describe("Custom Test Evaluator", () => {
  it("normalizes answers by trimming punctuation and lowercasing", () => {
    expect(normalizeAnswer(" Hello! ")).toBe("hello");
    expect(normalizeAnswer('"Cat."')).toBe("cat");
  });

  it("evaluates answers matching correct or accepted answers", () => {
    expect(evaluateAnswer("en_to_vn", "con mèo", "con mèo")).toBe(true);
    expect(evaluateAnswer("type_answer", "dog", "dog", ["hound"])).toBe(true);
    expect(evaluateAnswer("type_answer", "hound", "dog", ["hound"])).toBe(true);
    expect(evaluateAnswer("type_answer", "caterpillar", "cat")).toBe(false); // No substring false positives
    expect(evaluateAnswer("type_answer", "", "cat")).toBe(false); // Empty answer is wrong
  });
});
