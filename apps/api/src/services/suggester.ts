import crypto from 'crypto';
import { z } from 'zod';
import { CONTROLLED_SKILLS, ControlledSkill } from '@verifolio/shared';

export interface SuggestedSkill {
  id: string;
  name: string;
  family: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  reason: string;
  summary: string;
  source: 'AI';
}

export interface SuggestionResult {
  suggestions: SuggestedSkill[];
  redactedText: string;
  provider: 'llm' | 'rule-fallback';
  cached: boolean;
}

// Zod schema for LLM response
const LlmSuggestionItemSchema = z.object({
  id: z.string(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  reason: z.string(),
  summary: z.string()
});

const LlmResponseSchema = z.object({
  skills: z.array(LlmSuggestionItemSchema).max(5)
});

/**
 * PII Redactor: Strictly strips names, emails, phones, IDs, marks, and attendance
 * before anything is sent to external LLM providers or logs.
 */
export function redactPii(text: string): { redacted: string; wasRedacted: boolean } {
  let redacted = text;
  let wasRedacted = false;

  // 1. Email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  if (emailRegex.test(redacted)) {
    redacted = redacted.replace(emailRegex, '[EMAIL]');
    wasRedacted = true;
  }

  // 2. Phone numbers (international and domestic formats)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  if (phoneRegex.test(redacted)) {
    redacted = redacted.replace(phoneRegex, '[PHONE]');
    wasRedacted = true;
  }

  // 3. Student & ERP IDs
  const idRegex = /\b(STU|ERP|FAC|ID)[-_:\s]?[A-Z0-9]{3,10}\b/gi;
  if (idRegex.test(redacted)) {
    redacted = redacted.replace(idRegex, '[ID]');
    wasRedacted = true;
  }

  // 4. Marks / Grades / Attendance mentions
  const sensitiveRegex = /\b(\d{1,3}%\s*(marks|attendance|score)|grade\s*[A-F][+-]?|gpa\s*[:=]?\s*\d\.\d+)\b/gi;
  if (sensitiveRegex.test(redacted)) {
    redacted = redacted.replace(sensitiveRegex, '[REDACTED_ACADEMIC_RECORD]');
    wasRedacted = true;
  }

  return { redacted, wasRedacted };
}

/**
 * Rule-Based Skill Suggester
 * Deterministic, offline-first fallback matcher based on controlled taxonomy.
 */
export class RuleSuggester {
  public suggest(text: string, category?: string): SuggestedSkill[] {
    const lower = text.toLowerCase();
    const scoredSkills: Array<{ skill: ControlledSkill; score: number; matchWord: string }> = [];

    for (const skill of CONTROLLED_SKILLS) {
      let score = 0;
      let matchedTerm = '';

      // Check skill name
      if (lower.includes(skill.name.toLowerCase())) {
        score += 10;
        matchedTerm = skill.name;
      }

      // Check synonyms
      for (const syn of skill.synonyms) {
        if (lower.includes(syn.toLowerCase())) {
          score += 6;
          if (!matchedTerm) matchedTerm = syn;
        }
      }

      // Check description keywords
      const words = skill.description.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
      for (const word of words) {
        if (lower.includes(word)) {
          score += 1;
        }
      }

      // Category affinity boost
      if (category && skill.family.toLowerCase().includes(category.toLowerCase())) {
        score += 2;
      }

      if (score > 0) {
        scoredSkills.push({ skill, score, matchWord: matchedTerm || skill.name });
      }
    }

    // Sort descending by match score and take top 5
    scoredSkills.sort((a, b) => b.score - a.score);
    const top = scoredSkills.slice(0, 5);

    // If nothing matched, pick 2 general relevant foundational skills
    if (top.length === 0) {
      const fallback = CONTROLLED_SKILLS.slice(0, 2);
      return fallback.map((s) => ({
        id: s.id,
        name: s.name,
        family: s.family,
        level: 'INTERMEDIATE',
        reason: 'Selected based on foundational skill taxonomy alignment.',
        summary: s.description,
        source: 'AI'
      }));
    }

    return top.map(({ skill, matchWord }) => {
      // Infer level based on action verbs in context
      let level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'INTERMEDIATE';
      if (lower.includes('led') || lower.includes('designed') || lower.includes('architected') || lower.includes('founded')) {
        level = 'ADVANCED';
      } else if (lower.includes('assisted') || lower.includes('learned') || lower.includes('introductory') || lower.includes('basic')) {
        level = 'BEGINNER';
      }

      return {
        id: skill.id,
        name: skill.name,
        family: skill.family,
        level,
        reason: `Demonstrated application of ${matchWord} within the project scope.`,
        summary: skill.description,
        source: 'AI'
      };
    });
  }
}

/**
 * Skill Suggester Engine with SHA-256 caching and fallback
 */
export class SkillSuggesterService {
  private cache = new Map<string, SuggestedSkill[]>();
  private ruleSuggester = new RuleSuggester();

  public async suggest(rawText: string, category?: string): Promise<SuggestionResult> {
    const { redacted } = redactPii(rawText);

    // Hash redacted text for deterministic cache lookup
    const hash = crypto.createHash('sha256').update(redacted + (category || '')).digest('hex');
    const cached = this.cache.get(hash);
    if (cached) {
      return {
        suggestions: cached,
        redactedText: redacted,
        provider: 'rule-fallback',
        cached: true
      };
    }

    // Attempt Gemini API if key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const llmSuggestions = await this.queryGeminiLlm(redacted, apiKey);
        if (llmSuggestions && llmSuggestions.length > 0) {
          this.cache.set(hash, llmSuggestions);
          return {
            suggestions: llmSuggestions,
            redactedText: redacted,
            provider: 'llm',
            cached: false
          };
        }
      } catch (err) {
        console.warn('Gemini LLM suggestion failed or timed out, falling back to RuleSuggester:', err);
      }
    }

    // Fallback to RuleSuggester
    const ruleSuggestions = this.ruleSuggester.suggest(redacted, category);
    this.cache.set(hash, ruleSuggestions);

    return {
      suggestions: ruleSuggestions,
      redactedText: redacted,
      provider: 'rule-fallback',
      cached: false
    };
  }

  private async queryGeminiLlm(redactedText: string, apiKey: string): Promise<SuggestedSkill[] | null> {
    const validSkillIds = new Set(CONTROLLED_SKILLS.map((s) => s.id));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const prompt = `You are a skill taxonomy evaluator. Match the following project description against our controlled skill list.
Return ONLY valid JSON matching this schema:
{
  "skills": [
    {
      "id": "valid skill id from controlled list",
      "level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      "reason": "one-line justification",
      "summary": "two-line technical summary"
    }
  ]
}
Project Description: "${redactedText}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: 'application/json'
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);
      if (!response.ok) return null;

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) return null;

      const parsed = LlmResponseSchema.safeParse(JSON.parse(rawJson));
      if (!parsed.success) return null;

      // Drop any unknown skill IDs that are not in our closed taxonomy
      const validResults: SuggestedSkill[] = [];
      for (const item of parsed.data.skills) {
        if (validSkillIds.has(item.id)) {
          const meta = CONTROLLED_SKILLS.find((s) => s.id === item.id)!;
          validResults.push({
            id: item.id,
            name: meta.name,
            family: meta.family,
            level: item.level,
            reason: item.reason,
            summary: item.summary,
            source: 'AI'
          });
        }
      }

      return validResults.length > 0 ? validResults : null;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }
}

export const skillSuggester = new SkillSuggesterService();

