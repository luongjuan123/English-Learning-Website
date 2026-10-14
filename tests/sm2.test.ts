import { describe, it, expect } from "vitest";
import { calculateSM2 } from "@/lib/sm2";

describe("SM-2 Spaced Repetition Algorithm", () => {
  it("should set interval to 1 day on the first successful review (repetition 0)", () => {
    const result = calculateSM2({
      quality: 4,
      repetitions: 0,
      easeFactor: 2.5,
      intervalDays: 0,
    });

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.status).toBe("learning");
  });

  it("should set interval to 6 days on the second successful review (repetition 1)", () => {
    const result = calculateSM2({
      quality: 4,
      repetitions: 1,
      easeFactor: 2.5,
      intervalDays: 1,
    });

    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(6);
    expect(result.status).toBe("learning");
  });

  it("should multiply previous interval by ease factor on subsequent successful reviews", () => {
    const result = calculateSM2({
      quality: 4,
      repetitions: 2,
      easeFactor: 2.5,
      intervalDays: 6,
    });

    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(15); // 6 * 2.5 = 15
    expect(result.status).toBe("familiar");
  });

  it("should reset repetitions and interval to 1 upon failed recall (quality < 3)", () => {
    const result = calculateSM2({
      quality: 1, // Again
      repetitions: 4,
      easeFactor: 2.5,
      intervalDays: 25,
    });

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.status).toBe("new");
  });

  it("should never let ease factor drop below 1.3 even after multiple failures", () => {
    let ef = 1.4;
    for (let i = 0; i < 5; i++) {
      const res = calculateSM2({
        quality: 0,
        repetitions: 0,
        easeFactor: ef,
        intervalDays: 1,
      });
      ef = res.easeFactor;
    }

    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it("should mark word as mastered after 5+ successful repetitions with high recall", () => {
    const result = calculateSM2({
      quality: 5,
      repetitions: 4,
      easeFactor: 2.6,
      intervalDays: 30,
    });

    expect(result.repetitions).toBe(5);
    expect(result.status).toBe("mastered");
  });
});
