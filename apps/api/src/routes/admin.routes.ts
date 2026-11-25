import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { memoryStore } from '../services/store';

export const adminRouter = Router();

adminRouter.use(authenticate, tenantMiddleware, requireRole('ADMIN'));

// 1. Approve Mentor Account
adminRouter.post('/mentors/:id/approve', (req, res) => {
  const schoolId = req.schoolId!;
  const mentorId = req.params.id;

  const user = memoryStore.users.get(mentorId);
  if (!user || user.school_id !== schoolId || user.role !== 'MENTOR') {
    return res.status(404).json({ error: 'Mentor not found in this school' });
  }

  user.is_approved = true;
  return res.json({ message: 'Mentor account approved.', mentor: user });
});

// 2. Create Group (Class, Club, Team)
adminRouter.post('/groups', (req, res) => {
  const schoolId = req.schoolId!;
  const { name, category } = req.body;

  if (!name || !['CLASS', 'CLUB', 'TEAM'].includes(category)) {
    return res.status(400).json({ error: 'Valid group name and category (CLASS, CLUB, TEAM) required' });
  }

  const groupId = `grp-${crypto.randomUUID()}`;
  const group = { id: groupId, school_id: schoolId, name, category };
  memoryStore.groups.set(groupId, group);

  return res.status(201).json({ group });
});

// 3. Map Members to Group (Add student or mentor)
adminRouter.put('/groups/:id/members', (req, res) => {
  const schoolId = req.schoolId!;
  const groupId = req.params.id;
  const { user_id, role_in_group } = req.body;

  const group = memoryStore.groups.get(groupId);
  if (!group || group.school_id !== schoolId) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const user = memoryStore.users.get(user_id);
  if (!user || user.school_id !== schoolId) {
    return res.status(404).json({ error: 'User not found in this school' });
  }

  const membershipId = `mem-${user_id}-${groupId}`;
  const membership = {
    id: membershipId,
    school_id: schoolId,
    user_id,
    group_id: groupId,
    role_in_group: role_in_group || (user.role === 'MENTOR' ? 'TEACHER' : 'STUDENT')
  };

  memoryStore.memberships.set(membershipId, membership);

  return res.json({ message: 'Membership linked successfully.', membership });
});

// 4. Import Roster CSV
// Strict requirement: matches ERP ID first, flags duplicates, never auto-merges
adminRouter.post('/import/csv', (req, res) => {
  const schoolId = req.schoolId!;
  const { csv_content } = req.body;

  if (!csv_content || typeof csv_content !== 'string') {
    return res.status(400).json({ error: 'csv_content string is required' });
  }

  const lines = csv_content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const imported = [];
  const flaggedDuplicates = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((c) => c.trim());
    if (row.length < 4) continue;

    const [erp_ref, email, full_name, role, group_name] = row;

    // Check duplicate ERP ref or email
    const existingByErp = Array.from(memoryStore.users.values()).find(
      (u) => u.school_id === schoolId && u.erp_ref && u.erp_ref === erp_ref
    );
    const existingByEmail = Array.from(memoryStore.users.values()).find(
      (u) => u.school_id === schoolId && u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingByErp || existingByEmail) {
      flaggedDuplicates.push({
        row: i + 1,
        erp_ref,
        email,
        reason: existingByErp ? 'ERP reference already registered' : 'Email address conflict'
      });
      // NEVER auto-merge records per AGENTS.md rule
      continue;
    }

    const userId = `usr-${crypto.randomUUID()}`;
    const userRole = role.toUpperCase() === 'MENTOR' || role.toUpperCase() === 'TEACHER' ? 'MENTOR' : 'STUDENT';
    const newUser = {
      id: userId,
      school_id: schoolId,
      role: userRole as any,
      email,
      full_name,
      first_name: full_name.split(' ')[0],
      is_minor: userRole === 'STUDENT',
      erp_ref: erp_ref || undefined,
      is_approved: true
    };
    memoryStore.users.set(userId, newUser);

    // Map group if provided
    if (group_name) {
      let group = Array.from(memoryStore.groups.values()).find(
        (g) => g.school_id === schoolId && g.name.toLowerCase() === group_name.toLowerCase()
      );
      if (!group) {
        const gid = `grp-${crypto.randomUUID()}`;
        group = { id: gid, school_id: schoolId, name: group_name, category: 'CLASS' };
        memoryStore.groups.set(gid, group);
      }
      const memId = `mem-${userId}-${group.id}`;
      memoryStore.memberships.set(memId, {
        id: memId,
        school_id: schoolId,
        user_id: userId,
        group_id: group.id,
        role_in_group: userRole === 'MENTOR' ? 'TEACHER' : 'STUDENT'
      });
    }

    imported.push(newUser);
  }

  return res.json({
    imported_count: imported.length,
    flagged_duplicates_count: flaggedDuplicates.length,
    flagged_duplicates: flaggedDuplicates,
    imported
  });
});

// 5. Audit Chain Integrity & School Statistics
adminRouter.get('/audit/integrity', (req, res) => {
  const schoolId = req.schoolId!;
  const schoolEvents = memoryStore.auditEvents.get(schoolId) || [];
  
  // Verify hash chain continuity
  let chainContinuous = true;
  let prev = '0000000000000000000000000000000000000000000000000000000000000000';
  for (let i = 0; i < schoolEvents.length; i++) {
    const ev = schoolEvents[i];
    if (ev.prev_hash !== prev || ev.sequence !== i + 1) {
      chainContinuous = false;
      break;
    }
    prev = ev.hash;
  }

  const users = Array.from(memoryStore.users.values()).filter((u) => u.school_id === schoolId);
  const studentsCount = users.filter((u) => u.role === 'STUDENT').length;
  const mentorsCount = users.filter((u) => u.role === 'MENTOR').length;
  const published = Array.from(memoryStore.publishedEntries.values()).filter((p) => p.school_id === schoolId);

  return res.json({
    school_id: schoolId,
    total_events: schoolEvents.length,
    chain_continuous: chainContinuous,
    head_hash: schoolEvents.length > 0 ? schoolEvents[schoolEvents.length - 1].hash : prev,
    active_key: 'ed25519-demo-2026-v1',
    students_count: studentsCount,
    mentors_count: mentorsCount,
    verified_count: published.length,
    checked_at: new Date().toISOString()
  });
});

// 6. View Raw Audit Events (Read-only view)
adminRouter.get('/audit/events', (req, res) => {
  const schoolId = req.schoolId!;
  const schoolEvents = memoryStore.auditEvents.get(schoolId) || [];
  return res.json({
    total: schoolEvents.length,
    events: schoolEvents
  });
});
