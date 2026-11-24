import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { memoryStore } from '../services/store';
import { authenticate, requireRole } from '../middleware/auth';

export const viewerRouter = Router();

// Track viewer views for compliance and anti-scraping
export interface ViewLogRecord {
  viewer_id: string;
  entry_id: string;
  viewed_at: string;
}

const viewLogs: ViewLogRecord[] = [];

/**
 * GET /viewer/search
 * Search published verified skill entries.
 * Restricted to approved Viewer organizations.
 * Respects minor privacy: minors display first name and class level only; no contact details ever.
 */
viewerRouter.get('/search', authenticate, requireRole('VIEWER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { q, skill, family } = req.query;
    const user = req.user!;

    let entries = Array.from(memoryStore.publishedEntries.values());

    // Search query filter (title, description, or skill name)
    if (q && typeof q === 'string') {
      const query = q.toLowerCase();
      entries = entries.filter((e) => 
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.student_name.toLowerCase().includes(query) ||
        e.skills.some((s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query))
      );
    }

    // Skill filter
    if (skill && typeof skill === 'string') {
      const skillId = skill.toLowerCase();
      entries = entries.filter((e) =>
        e.skills.some((s) => s.id.toLowerCase() === skillId)
      );
    }

    // Transform results respecting minor privacy
    const results = entries.map((e) => {
      // Log view
      viewLogs.push({
        viewer_id: user.userId,
        entry_id: e.entry_id,
        viewed_at: new Date().toISOString()
      });

      let studentDisplayName = e.student_name;
      if (e.is_minor) {
        const parts = e.student_name.split(' ');
        studentDisplayName = `${parts[0]} (${e.student_class_level || 'Student'})`;
      }

      return {
        entry_id: e.entry_id,
        title: e.title,
        description: e.description,
        category: e.category,
        role: e.role,
        student_display_name: studentDisplayName,
        is_minor: e.is_minor,
        skills: e.skills,
        mentor_name: e.mentor_name,
        verified_at: e.verified_at,
        seal: {
          key_id: e.key_id,
          digest: e.digest
        }
      };
    });

    return res.json({
      total: results.length,
      results
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /viewer/stats
 * Anonymized aggregation stats for viewer portal.
 */
viewerRouter.get('/stats', authenticate, requireRole('VIEWER', 'ADMIN'), (req, res) => {
  const published = Array.from(memoryStore.publishedEntries.values());
  const skillCount = published.reduce((acc, curr) => acc + curr.skills.length, 0);

  res.json({
    total_verified_entries: published.length,
    total_skills_verified: skillCount,
    active_schools: 1
  });
});

