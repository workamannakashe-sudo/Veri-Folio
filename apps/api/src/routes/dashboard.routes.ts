import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, tenantMiddleware);

// Student Dashboard (empty state initially)
dashboardRouter.get('/student', requireRole('STUDENT'), (req, res) => {
  res.json({
    role: 'STUDENT',
    user: req.user,
    entries: [],
    pendingDecisions: 0,
    publishedCount: 0,
    message: 'Welcome to your VeriFolio Student Dashboard. No entries created yet.'
  });
});

// Mentor Inbox Dashboard
dashboardRouter.get('/mentor', requireRole('MENTOR'), (req, res) => {
  res.json({
    role: 'MENTOR',
    user: req.user,
    requests: [],
    confirmedCount: 0,
    message: 'Mentor Inbox: No verification requests pending.'
  });
});

// School Admin Dashboard
dashboardRouter.get('/admin', requireRole('ADMIN'), (req, res) => {
  res.json({
    role: 'ADMIN',
    user: req.user,
    schoolId: req.schoolId,
    stats: {
      studentsCount: 0,
      mentorsCount: 0,
      verifiedSkillsCount: 0,
      flaggedCount: 0
    },
    message: 'School Admin Dashboard: Roster ready for import.'
  });
});

// Viewer Organization Dashboard
dashboardRouter.get('/viewer', requireRole('VIEWER'), (req, res) => {
  res.json({
    role: 'VIEWER',
    user: req.user,
    verifiedEntries: [],
    message: 'Viewer Portal: Search published mentor-verified student records.'
  });
});
