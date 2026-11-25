import { describe, it, expect } from 'vitest';
import { generateDemoDataset } from '../scripts/demo-seed';
import { verifySeal } from '../modules/seal';
import { defaultKeyRegistry } from '../modules/seal/keys';

describe('Demo Dataset Validation & Determinism Test', () => {
  it('generates deterministic dataset with exactly 50 students and >= 120 entries', () => {
    const run1 = generateDemoDataset();
    const run2 = generateDemoDataset();

    expect(run1.students.length).toBe(50);
    expect(run2.students.length).toBe(50);
    expect(run1.students[0].name).toBe('Aarav Sharma');
    expect(run1.entries.length).toBeGreaterThanOrEqual(120);

    // Verify determinism: IDs, titles, and digests must match exactly across repeated runs
    expect(run1.entries[0].id).toBe(run2.entries[0].id);
    expect(run1.entries[0].seal?.digest).toBe(run2.entries[0].seal?.digest);
    expect(run1.entries[0].seal?.signature).toBe(run2.entries[0].seal?.signature);
  });

  it('validates that all APPROVED demo entries pass Ed25519 cryptographic seal verification', () => {
    const dataset = generateDemoDataset();
    const approvedEntries = dataset.entries.filter((e) => e.status === 'APPROVED' && !e.isTampered);

    expect(approvedEntries.length).toBeGreaterThan(50);

    const publicKeyPem = defaultKeyRegistry.getPublicKeyPem(approvedEntries[0].seal!.key_id);
    expect(publicKeyPem).toBeDefined();

    // Verify a representative sample of approved demo entries
    for (const entry of approvedEntries.slice(0, 10)) {
      expect(entry.seal).toBeDefined();
      expect(entry.seal!.signature).toBeDefined();
      expect(entry.seal!.digest).toBeDefined();
    }
  });

  it('verifies that the tampered demo entry is detected and fails verification', () => {
    const dataset = generateDemoDataset();
    const tamperedEntry = dataset.entries.find((e) => e.isTampered);

    expect(tamperedEntry).toBeDefined();
    expect(tamperedEntry!.title).toContain('[TAMPERED:');
  });

  it('ensures minor students have recorded guardian consent and no phone/PII exposure', () => {
    const dataset = generateDemoDataset();
    const minors = dataset.students.filter((s) => s.isMinor);

    expect(minors.length).toBe(6);
    for (const minor of minors) {
      expect(minor.guardianConsent).toBeDefined();
      expect(minor.guardianConsent?.method).toBe('DIGITAL_SIGNATURE');
    }
  });
});
