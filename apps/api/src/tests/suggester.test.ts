import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';
import { redactPii, RuleSuggester } from '../services/suggester';

describe('Phase 7: AI Skill Suggester, PII Redaction & Fallback', () => {
  it('1. PII Redaction strips emails, phones, student IDs, and academic grades', () => {
    const raw = 'Student Rohan (email: rohan.sharma@school.edu, phone: +91-9876543210, ID: STU-101) scored 98% marks in AP Physics.';
    const { redacted, wasRedacted } = redactPii(raw);

    expect(wasRedacted).toBe(true);
    expect(redacted).not.toContain('rohan.sharma@school.edu');
    expect(redacted).not.toContain('9876543210');
    expect(redacted).not.toContain('STU-101');
    expect(redacted).not.toContain('98% marks');

    expect(redacted).toContain('[EMAIL]');
    expect(redacted).toContain('[PHONE]');
    expect(redacted).toContain('[ID]');
    expect(redacted).toContain('[REDACTED_ACADEMIC_RECORD]');
  });

  it('2. RuleSuggester identifies relevant skills from closed taxonomy', () => {
    const suggester = new RuleSuggester();
    const suggestions = suggester.suggest(
      'Led development of an autonomous rover with computer vision object detection and embedded motor control.'
    );

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(5);

    const skillIds = suggestions.map((s) => s.id);
    expect(
      skillIds.includes('tech-robotics') ||
      skillIds.includes('tech-computer-vision') ||
      skillIds.includes('tech-embedded-systems')
    ).toBe(true);

    expect(suggestions[0].source).toBe('AI');
    expect(suggestions[0].level).toBe('ADVANCED'); // 'Led' triggers ADVANCED
  });

  it('3. POST /skills/suggest - returns redacted and suggested skills with caching', async () => {
    const sampleText = 'Built a solar-powered irrigation system using Arduino and soil moisture sensors for the community garden.';

    // First call (uncached)
    const res1 = await request(app)
      .post('/skills/suggest')
      .send({ text: sampleText });

    expect(res1.status).toBe(200);
    expect(res1.body.suggestions).toBeDefined();
    expect(res1.body.suggestions.length).toBeGreaterThan(0);
    expect(res1.body.cached).toBe(false);

    // Second call (cached)
    const res2 = await request(app)
      .post('/skills/suggest')
      .send({ text: sampleText });

    expect(res2.status).toBe(200);
    expect(res2.body.cached).toBe(true);
    expect(res2.body.suggestions).toEqual(res1.body.suggestions);
  });
});
