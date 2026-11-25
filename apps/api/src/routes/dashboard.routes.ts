import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { memoryStore } from '../services/store';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, tenantMiddleware);

// Student Dashboard (Dynamic data from store)
dashboardRouter.get('/student', requireRole('STUDENT'), (req, res) => {
  const schoolId = req.schoolId!;
  const studentId = req.user!.userId;

  const userEntries = Array.from(memoryStore.entries.values())
    .filter((e) => e.school_id === schoolId && e.student_id === studentId)
    .map((e) => {
      const rev = Array.from(memoryStore.revisions.values()).find(
        (r) => r.entry_id === e.id && r.revision === e.current_revision
      );
      return {
        ...e,
        revision: rev
      };
    });

  const pendingDecisions = userEntries.filter(
    (e) => e.revision?.state === 'REQUESTED'
  ).length;

  const published = Array.from(memoryStore.publishedEntries.values()).filter(
    (p) => p.school_id === schoolId && userEntries.some((e) => e.id === p.entry_id)
  );

  res.json({
    role: 'STUDENT',
    user: req.user,
    entries: userEntries,
    pendingDecisions,
    publishedCount: published.length,
    message: userEntries.length > 0 
      ? `You have ${userEntries.length} portfolio entries (${published.length} published).`
      : 'Welcome to your VeriFolio Student Dashboard. Create an entry to begin.'
  });
});

// Mentor Inbox Dashboard (Dynamic requests from store)
dashboardRouter.get('/mentor', requireRole('MENTOR'), (req, res) => {
  const schoolId = req.schoolId!;
  const mentorId = req.user!.userId;

  const requests = memoryStore.getPendingRequestsForMentor(schoolId, mentorId);
  const confirmedCount = Array.from(memoryStore.verifications.values()).filter(
    (v) => v.school_id === schoolId && v.mentor_id === mentorId && v.decision === 'APPROVED'
  ).length;

  res.json({
    role: 'MENTOR',
    user: req.user,
    requests,
    confirmedCount,
    message: requests.length > 0 
      ? `You have ${requests.length} pending verification request(s) awaiting review.`
      : 'Mentor Inbox: All student verification requests are up to date.'
  });
});

// School Admin Dashboard (Dynamic metrics from store)
dashboardRouter.get('/admin', requireRole('ADMIN'), (req, res) => {
  const schoolId = req.schoolId!;

  const users = Array.from(memoryStore.users.values()).filter((u) => u.school_id === schoolId);
  const studentsCount = users.filter((u) => u.role === 'STUDENT').length;
  const mentorsCount = users.filter((u) => u.role === 'MENTOR').length;
  const published = Array.from(memoryStore.publishedEntries.values()).filter((p) => p.school_id === schoolId);
  const verifiedSkillsCount = published.reduce((acc, curr) => acc + curr.skills.length, 0);
  const auditEvents = memoryStore.auditEvents.get(schoolId) || [];

  res.json({
    role: 'ADMIN',
    user: req.user,
    schoolId,
    stats: {
      studentsCount,
      mentorsCount,
      verifiedRecordsCount: published.length,
      verifiedSkillsCount,
      auditChainBlocks: auditEvents.length,
      flaggedCount: 0
    },
    message: `School Admin: ${studentsCount} students, ${mentorsCount} mentors enrolled.`
  });
});

// Viewer Organization Dashboard (Dynamic search results from store)
dashboardRouter.get('/viewer', requireRole('VIEWER', 'ADMIN'), (req, res) => {
  const published = Array.from(memoryStore.publishedEntries.values());
  const skillCount = published.reduce((acc, curr) => acc + curr.skills.length, 0);

  res.json({
    role: 'VIEWER',
    user: req.user,
    totalVerifiedEntries: published.length,
    totalSkillsVerified: skillCount,
    activeSchools: 1,
    message: `Viewer Portal: ${published.length} published student portfolio records available for verification.`
  });
});
