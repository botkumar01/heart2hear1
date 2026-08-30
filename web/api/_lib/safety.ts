export type SafetyCategory =
  | "SELF_HARM"
  | "HARM_TO_OTHERS"
  | "MEDICATION_ADVICE"
  | "DIAGNOSIS_CLAIM"
  | "DANGEROUS_INSTRUCTIONS";

export type SafetySeverity = "NONE" | "LOW" | "MEDIUM" | "CRISIS";

export interface SafetyResult {
  severity: SafetySeverity;
  categories: SafetyCategory[];
  /** Which pattern matched, for admin review — never shown to the end user. */
  matchedTerms: string[];
}

/**
 * Layer 1 of the spec's layered safety approach: deterministic
 * keyword/pattern detection, language-aware (EN/TA/HI — the set this
 * project multilingual-supports). Errs toward escalation: any CRISIS-tier
 * match wins regardless of surrounding context, per the "safety must err
 * toward appropriate escalation when there is meaningful risk" rule.
 *
 * This list is a starting point, not a clinically-reviewed final list —
 * it should be expanded/reviewed by someone with domain expertise before
 * real-world use. It's deliberately kept in one place so that review can
 * happen once, here, rather than being scattered across call sites.
 *
 * Used by both the AI chatbot (this phase) and helper-chat moderation
 * (Phase 3) — the MEDICATION_ADVICE/DIAGNOSIS_CLAIM categories exist for
 * the latter and are inert until then.
 */
const PATTERNS: Array<{ category: SafetyCategory; severity: SafetySeverity; pattern: RegExp }> = [
  // --- Crisis / self-harm — English ---
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bkill(ing)?\s+myself\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\b(want|going|plan(ning)?)\s+to\s+die\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bend(ing)?\s+(my|it)\s+(all|life)\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bsuicid(e|al)\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bself[\s-]?harm(ing)?\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bcutting\s+myself\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\b(better off|no reason to)\s+(dead|alive|living)\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\boverdos(e|ing)\b/i },
  { category: "SELF_HARM", severity: "MEDIUM", pattern: /\bi\s+(feel|am)\s+hopeless\b/i },
  { category: "SELF_HARM", severity: "MEDIUM", pattern: /\bcan'?t\s+go\s+on\b/i },

  // --- Crisis / self-harm — Hindi (romanized + Devanagari) ---
  { category: "SELF_HARM", severity: "CRISIS", pattern: /आत्महत्या/ },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /खुदकुशी/ },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /मरना चाहता|मरना चाहती/ },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bmarna chahta\b|\bmarna chahti\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\baatmahatya\b|\bkhudkushi\b/i },

  // --- Crisis / self-harm — Tamil (romanized + script) ---
  { category: "SELF_HARM", severity: "CRISIS", pattern: /தற்கொலை/ },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /செத்துவிட/ },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bthatkolai\b/i },
  { category: "SELF_HARM", severity: "CRISIS", pattern: /\bsethuvida\b|\bsethuduven\b/i },

  // --- Harm to others ---
  { category: "HARM_TO_OTHERS", severity: "CRISIS", pattern: /\b(kill|hurt|attack)\s+(him|her|them|someone|somebody)\b/i },
  { category: "HARM_TO_OTHERS", severity: "CRISIS", pattern: /\bgoing to hurt\b/i },

  // --- Medication / dosage advice-seeking (relevant when a HELPER responds, Phase 3) ---
  { category: "MEDICATION_ADVICE", severity: "MEDIUM", pattern: /\bwhich (medicine|medication|drug|tablet)\b/i },
  { category: "MEDICATION_ADVICE", severity: "MEDIUM", pattern: /\bhow much (of (this|the) )?(medicine|medication|dosage|dose)\b/i },
  { category: "MEDICATION_ADVICE", severity: "MEDIUM", pattern: /\bstop (taking )?(your |my )?medication\b/i },
  { category: "MEDICATION_ADVICE", severity: "MEDIUM", pattern: /\byou should take\b.*\b(mg|tablet|dose|pill)\b/i },

  // --- Diagnostic claims (a helper or the AI itself must never state these) ---
  { category: "DIAGNOSIS_CLAIM", severity: "MEDIUM", pattern: /\byou (have|are suffering from)\s+(depression|anxiety disorder|bipolar|ptsd|schizophrenia)\b/i },

  // --- Dangerous instructions ---
  { category: "DANGEROUS_INSTRUCTIONS", severity: "CRISIS", pattern: /\bhow (do i|to)\s+(kill myself|end my life|overdose)\b/i },
];

export function classifySafety(text: string): SafetyResult {
  const categories = new Set<SafetyCategory>();
  const matchedTerms: string[] = [];
  let severity: SafetySeverity = "NONE";

  const rank: Record<SafetySeverity, number> = { NONE: 0, LOW: 1, MEDIUM: 2, CRISIS: 3 };

  for (const { category, severity: matchSeverity, pattern } of PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      categories.add(category);
      matchedTerms.push(match[0]);
      if (rank[matchSeverity] > rank[severity]) {
        severity = matchSeverity;
      }
    }
  }

  return { severity, categories: [...categories], matchedTerms };
}
