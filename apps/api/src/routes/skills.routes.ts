import { Router } from 'express';
import { z } from 'zod';
import { CONTROLLED_SKILLS } from '@verifolio/shared';
import { skillSuggester } from '../services/suggester';

export const skillsRouter = Router();

const SuggestSkillsSchema = z.object({
  text: z.string().min(5),
  category: z.string().optional()
});

skillsRouter.get('/', (req, res) => {
  const { family, query } = req.query;

  let results = [...CONTROLLED_SKILLS];

  if (family && typeof family === 'string') {
    results = results.filter((s) => s.family.toLowerCase() === family.toLowerCase());
  }

  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.synonyms.some((syn: string) => syn.toLowerCase().includes(q))
    );
  }

  res.json({
    total: results.length,
    skills: results
  });
});

/**
 * POST /skills/suggest
 * AI Skill Suggestion Engine with PII Redaction & RuleSuggester Fallback.
 */
skillsRouter.post('/suggest', async (req, res) => {
  try {
    const parsed = SuggestSkillsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Text input must be at least 5 characters long' });
    }

    const { text, category } = parsed.data;
    const result = await skillSuggester.suggest(text, category);

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
