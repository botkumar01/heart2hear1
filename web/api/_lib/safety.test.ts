import { describe, it, expect } from "vitest";
import { classifySafety } from "./safety.js";

describe("classifySafety", () => {
  it("returns NONE for an ordinary supportive message", () => {
    const result = classifySafety("I've been feeling a bit stressed about exams lately.");
    expect(result.severity).toBe("NONE");
    expect(result.categories).toHaveLength(0);
  });

  it("flags English self-harm phrases as CRISIS", () => {
    expect(classifySafety("I want to kill myself").severity).toBe("CRISIS");
    expect(classifySafety("sometimes I think about suicide").severity).toBe("CRISIS");
    expect(classifySafety("I've been cutting myself").severity).toBe("CRISIS");
  });

  it("flags Hindi and Tamil crisis phrases as CRISIS", () => {
    expect(classifySafety("मुझे आत्महत्या के विचार आते हैं").severity).toBe("CRISIS");
    expect(classifySafety("எனக்கு தற்கொலை எண்ணங்கள் வருகின்றன").severity).toBe("CRISIS");
  });

  it("flags harm-to-others threats as CRISIS", () => {
    expect(classifySafety("I am going to hurt him").severity).toBe("CRISIS");
  });

  it("flags medication-advice-seeking as MEDIUM, in the MEDICATION_ADVICE category", () => {
    const result = classifySafety("Which medicine should I take for my anxiety?");
    expect(result.severity).toBe("MEDIUM");
    expect(result.categories).toContain("MEDICATION_ADVICE");
  });

  it("flags diagnostic claims as MEDIUM, in the DIAGNOSIS_CLAIM category", () => {
    const result = classifySafety("You have depression and need help.");
    expect(result.severity).toBe("MEDIUM");
    expect(result.categories).toContain("DIAGNOSIS_CLAIM");
  });

  it("a CRISIS match always outranks a MEDIUM match in the same message", () => {
    const result = classifySafety("You have depression and honestly I want to end my life.");
    expect(result.severity).toBe("CRISIS");
  });

  it("is case-insensitive for English patterns", () => {
    expect(classifySafety("I WANT TO KILL MYSELF").severity).toBe("CRISIS");
  });
});
