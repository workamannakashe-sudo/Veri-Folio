import { CONTROLLED_SKILLS } from '@verifolio/shared';
import { 
  buildSealFields, 
  seal, 
  appendAuditEvent, 
  GENESIS_HASH, 
  SignedSeal, 
  AuditEventItem 
} from '../modules/seal';
import { defaultSigner } from '../modules/seal/keys';

export interface UserRecord {
  id: string;
  school_id: string;
  role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER';
  email: string;
  full_name: string;
  first_name: string;
  class_level?: string;
  is_minor: boolean;
  erp_ref?: string;
  is_approved?: boolean;
}

export interface GroupRecord {
  id: string;
  school_id: string;
  name: string;
  category: 'CLASS' | 'CLUB' | 'TEAM';
}

export interface MembershipRecord {
  id: string;
  school_id: string;
  user_id: string;
  group_id: string;
  role_in_group: 'STUDENT' | 'TEACHER' | 'COACH' | 'ADVISOR';
}

export interface EntryRecord {
  id: string;
  school_id: string;
  student_id: string;
  category: string;
  current_revision: number;
  created_at: string;
  updated_at: string;
}

export interface EntryRevisionRecord {
  id: string;
  school_id: string;
  entry_id: string;
  revision: number;
  state: 'DRAFT' | 'REQUESTED' | 'CHANGES_REQUESTED' | 'APPROVED' | 'DECLINED' | 'REVOKED';
  title: string;
  description: string;
  category: string;
  role: string;
  start_date: string;
  end_date: string;
  skills: Array<{ id: string; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; source: 'STUDENT' | 'AI' | 'MENTOR'; reason?: string }>;
  evidence: Array<{ object_key: string; sha256: string; mime_type: string; file_size: number; scan_status: 'PENDING' | 'PASSED' | 'FAILED' }>;
  assigned_mentor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationRecord {
  id: string;
  school_id: string;
  entry_id: string;
  revision: number;
  mentor_id: string;
  decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'DECLINED';
  mentor_note: string;
  digest?: string;
  signature?: string;
  key_id?: string;
  decided_at: string;
  audit_event_hash?: string;
}

export interface PublishedEntryRecord {
  id: string;
  entry_id: string;
  revision: number;
  school_id: string;
  student_name: string;
  student_class_level?: string;
  is_minor: boolean;
  title: string;
  description: string;
  category: string;
  role: string;
  start_date: string;
  end_date: string;
  skills: Array<{ id: string; name: string; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }>;
  evidence: Array<{ sha256: string; mime_type: string }>;
  mentor_id: string;
  mentor_name: string;
  mentor_note: string;
  decided_at: string;
  digest: string;
  signature: string;
  key_id: string;
  audit_event_hash: string;
  verified_at: string;
}

// Rubber-stamping template patterns to reject
const REJECTED_TEMPLATE_PATTERNS = [
  'alex demonstrated deep problem-solving skills',
  'good job on completing this project',
  'i confirm this student performed the work as described',
  'great job on this project and well done',
  'student completed all required tasks successfully',
  'verified as accurate and approved',
  'satisfactory completion of all project requirements'
];

/**
 * High-performance, tenant-isolated memory store for VeriFolio.
 * Guarantees zero data leakage across school_id boundaries.
 */
class VeriFolioMemoryStore {
  public users = new Map<string, UserRecord>();
  public groups = new Map<string, GroupRecord>();
  public memberships = new Map<string, MembershipRecord>();
  public entries = new Map<string, EntryRecord>();
  public revisions = new Map<string, EntryRevisionRecord>();
  public verifications = new Map<string, VerificationRecord>();
  public auditEvents = new Map<string, AuditEventItem[]>(); // keyed by school_id
  public publishedEntries = new Map<string, PublishedEntryRecord>();

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    // School 1 (Delhi Public School Demo)
    const school1 = 'school-demo-1';
    
    // Admin
    this.users.set('usr-admin-1', {
      id: 'usr-admin-1',
      school_id: school1,
      role: 'ADMIN',
      email: 'clara.admin@school1.edu',
      full_name: 'Clara Oswald',
      first_name: 'Clara',
      is_minor: false,
      is_approved: true
    });

    // Mentors
    this.users.set('usr-mentor-1', {
      id: 'usr-mentor-1',
      school_id: school1,
      role: 'MENTOR',
      email: 'bob.mentor@school1.edu',
      full_name: 'Dr. Anand Verma',
      first_name: 'Anand',
      is_minor: false,
      is_approved: true
    });

    this.users.set('usr-mentor-unlinked', {
      id: 'usr-mentor-unlinked',
      school_id: school1,
      role: 'MENTOR',
      email: 'unlinked.mentor@school1.edu',
      full_name: 'Prof. Suresh Nair',
      first_name: 'Suresh',
      is_minor: false,
      is_approved: true
    });

    // Students
    this.users.set('usr-student-1', {
      id: 'usr-student-1',
      school_id: school1,
      role: 'STUDENT',
      email: 'alice.student@school1.edu',
      full_name: 'Rohan Sharma',
      first_name: 'Rohan',
      class_level: 'Grade 11-A',
      is_minor: true,
      erp_ref: 'ERP-STU-101'
    });

    this.users.set('usr-student-2', {
      id: 'usr-student-2',
      school_id: school1,
      role: 'STUDENT',
      email: 'priya.patel@school1.edu',
      full_name: 'Priya Patel',
      first_name: 'Priya',
      class_level: 'Grade 12-B',
      is_minor: false,
      erp_ref: 'ERP-STU-102'
    });

    // Groups
    this.groups.set('grp-robotics', {
      id: 'grp-robotics',
      school_id: school1,
      name: 'Robotics & Automation Club',
      category: 'CLUB'
    });

    this.groups.set('grp-cricket', {
      id: 'grp-cricket',
      school_id: school1,
      name: 'Varsity Cricket Team',
      category: 'TEAM'
    });

    // Memberships: Rohan Sharma and Dr. Anand Verma are BOTH in Robotics Club
    this.memberships.set('mem-1', {
      id: 'mem-1',
      school_id: school1,
      user_id: 'usr-student-1',
      group_id: 'grp-robotics',
      role_in_group: 'STUDENT'
    });

    this.memberships.set('mem-2', {
      id: 'mem-2',
      school_id: school1,
      user_id: 'usr-mentor-1',
      group_id: 'grp-robotics',
      role_in_group: 'TEACHER'
    });

    // Seed Sample Entry: Autonomous Campus Waste-Sorting Rover (Pending Verification)
    const entryId = 'ent-sample-rover';
    this.entries.set(entryId, {
      id: entryId,
      school_id: school1,
      student_id: 'usr-student-1',
      category: 'STEM & Robotics',
      current_revision: 1,
      created_at: '2026-11-18T10:00:00.000Z',
      updated_at: '2026-11-18T10:00:00.000Z'
    });

    const revId = 'rev-sample-rover-1';
    this.revisions.set(revId, {
      id: revId,
      school_id: school1,
      entry_id: entryId,
      revision: 1,
      state: 'REQUESTED',
      title: 'Autonomous Campus Waste-Sorting Rover',
      description: 'Designed and built a 4-wheel mobile robot using computer vision (YOLOv8-nano) to classify compostable vs recyclable campus waste in real-time.',
      category: 'STEM & Robotics',
      role: 'Lead Hardware & Firmware Developer',
      start_date: '2026-09-01',
      end_date: '2026-11-15',
      skills: [
        {
          id: 'sk-robotics-mechatronics',
          level: 'INTERMEDIATE',
          source: 'STUDENT',
          reason: 'Designed chassis, dual motor drive, and camera mast assembly.'
        },
        {
          id: 'sk-microcontroller-programming',
          level: 'BEGINNER',
          source: 'AI',
          reason: 'Programmed ESP32 motor drivers and UART camera stream.'
        }
      ],
      evidence: [
        {
          object_key: 'evidence/school-demo-1/ent-sample-rover/rover_demo_test.mp4',
          sha256: 'a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
          mime_type: 'video/mp4',
          file_size: 15400000,
          scan_status: 'PASSED'
        },
        {
          object_key: 'evidence/school-demo-1/ent-sample-rover/rover_schematics.pdf',
          sha256: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
          mime_type: 'application/pdf',
          file_size: 1204000,
          scan_status: 'PASSED'
        }
      ],
      assigned_mentor_id: 'usr-mentor-1',
      created_at: '2026-11-18T10:00:00.000Z',
      updated_at: '2026-11-18T10:00:00.000Z'
    });

    // School 2 (Tenant Isolation Validation School)
    const school2 = 'school-demo-2';
    this.users.set('usr-student-school2', {
      id: 'usr-student-school2',
      school_id: school2,
      role: 'STUDENT',
      email: 'student@school2.edu',
      full_name: 'School Two Student',
      first_name: 'School2',
      is_minor: false
    });
  }

  /**
   * Returns only mentors linked to the student via shared group membership in the same school.
   */
  public getEligibleMentorsForStudent(schoolId: string, studentId: string): UserRecord[] {
    const studentGroupIds = new Set<string>();
    for (const mem of this.memberships.values()) {
      if (mem.school_id === schoolId && mem.user_id === studentId) {
        studentGroupIds.add(mem.group_id);
      }
    }

    if (studentGroupIds.size === 0) {
      return [];
    }

    const eligibleMentorIds = new Set<string>();
    for (const mem of this.memberships.values()) {
      if (mem.school_id === schoolId && studentGroupIds.has(mem.group_id)) {
        const user = this.users.get(mem.user_id);
        if (user && user.role === 'MENTOR' && user.is_approved) {
          eligibleMentorIds.add(user.id);
        }
      }
    }

    return Array.from(eligibleMentorIds)
      .map((id) => this.users.get(id)!)
      .filter(Boolean);
  }

  /**
   * Retrieves pending verification requests for a mentor.
   * Enforces that the mentor shares a group with the student.
   */
  public getPendingRequestsForMentor(schoolId: string, mentorId: string) {
    const mentorGroupIds = new Set<string>();
    for (const mem of this.memberships.values()) {
      if (mem.school_id === schoolId && mem.user_id === mentorId) {
        mentorGroupIds.add(mem.group_id);
      }
    }

    const results: Array<{
      entry: EntryRecord;
      revision: EntryRevisionRecord;
      student: UserRecord;
      sharedGroup: GroupRecord;
    }> = [];

    for (const rev of this.revisions.values()) {
      if (rev.school_id !== schoolId || rev.state !== 'REQUESTED') {
        continue;
      }

      const entry = this.entries.get(rev.entry_id);
      if (!entry) continue;

      const student = this.users.get(entry.student_id);
      if (!student) continue;

      // Find shared group
      let sharedGroup: GroupRecord | undefined;
      for (const mem of this.memberships.values()) {
        if (mem.school_id === schoolId && mem.user_id === student.id && mentorGroupIds.has(mem.group_id)) {
          sharedGroup = this.groups.get(mem.group_id);
          break;
        }
      }

      if (!sharedGroup) continue;

      // Check mentor assignment
      if (rev.assigned_mentor_id && rev.assigned_mentor_id !== mentorId) {
        continue;
      }

      results.push({
        entry,
        revision: rev,
        student,
        sharedGroup
      });
    }

    return results;
  }

  /**
   * Retrieves full details of a specific verification request.
   */
  public getVerificationDetails(schoolId: string, mentorId: string, entryId: string) {
    const entry = this.entries.get(entryId);
    if (!entry || entry.school_id !== schoolId) return null;

    // Check eligible mentors for this student
    const eligible = this.getEligibleMentorsForStudent(schoolId, entry.student_id);
    const isMentorLinked = eligible.some((m) => m.id === mentorId);
    if (!isMentorLinked) return null;

    const revisionKey = Array.from(this.revisions.values()).find(
      (r) => r.school_id === schoolId && r.entry_id === entryId && r.revision === entry.current_revision
    );
    if (!revisionKey) return null;

    const student = this.users.get(entry.student_id);
    if (!student) return null;

    return {
      entry,
      revision: revisionKey,
      student
    };
  }

  /**
   * Executes atomic mentor decision transaction.
   * If APPROVED:
   * 1. Updates skill levels confirmed by mentor
   * 2. Canonicalizes fields per RFC 8785
   * 3. Computes SHA-256 digest
   * 4. Signs with Ed25519 signer
   * 5. Transitions revision state to APPROVED
   * 6. Appends to audit event chain
   * 7. Writes verification row
   */
  public executeVerificationDecision(params: {
    schoolId: string;
    mentorId: string;
    entryId: string;
    decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'DECLINED';
    mentorNote: string;
    skills: Array<{ id: string; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }>;
  }): {
    success: boolean;
    verification: VerificationRecord;
    seal?: SignedSeal;
    auditEvent?: AuditEventItem;
  } {
    const { schoolId, mentorId, entryId, decision, mentorNote, skills } = params;

    const entry = this.entries.get(entryId);
    if (!entry || entry.school_id !== schoolId) {
      throw new Error('Entry not found');
    }

    // 1. Strict anti-self-verification rule
    if (entry.student_id === mentorId) {
      throw new Error('Mentors cannot verify their own submissions');
    }

    // 2. Strict roster check
    const eligible = this.getEligibleMentorsForStudent(schoolId, entry.student_id);
    if (!eligible.some((m) => m.id === mentorId)) {
      throw new Error('Mentor is not roster-linked to student via any group');
    }

    // 3. Find current revision
    const revision = Array.from(this.revisions.values()).find(
      (r) => r.school_id === schoolId && r.entry_id === entryId && r.revision === entry.current_revision
    );
    if (!revision || revision.state !== 'REQUESTED') {
      throw new Error('Entry revision is not in REQUESTED state');
    }

    // 4. Anti-rubber-stamping validation
    const trimmedNote = mentorNote.trim();
    if (trimmedNote.length < 20) {
      throw new Error('Mentor note must be at least 20 characters in length');
    }

    const lowerNote = trimmedNote.toLowerCase();
    for (const pattern of REJECTED_TEMPLATE_PATTERNS) {
      if (lowerNote.includes(pattern)) {
        throw new Error('Rubber-stamping detected: generic template notes are not permitted. Please write a specific evaluation.');
      }
    }

    const decidedAt = new Date().toISOString();
    const verId = `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (decision === 'APPROVED') {
      // Map skills to updated levels
      const levelMap = new Map(skills.map((s) => [s.id, s.level]));
      const updatedSkills = revision.skills.map((s) => ({
        ...s,
        level: levelMap.get(s.id) || s.level,
        source: 'MENTOR' as const
      }));

      // Prepare fields for pure seal
      const sealInput = buildSealFields({
        school_id: schoolId,
        entry_id: entryId,
        student_id: entry.student_id,
        revision: revision.revision,
        key_id: defaultSigner.keyId,
        title: revision.title,
        description: revision.description,
        category: revision.category,
        role: revision.role,
        start: revision.start_date,
        end: revision.end_date,
        skills: updatedSkills.map((s) => ({ id: s.id, level: s.level })),
        evidence: revision.evidence.map((e) => e.sha256),
        mentor_id: mentorId,
        mentor_note: trimmedNote,
        decided_at: decidedAt
      });

      // Pure cryptographic seal
      const signedSeal = seal(sealInput, defaultSigner);

      // Audit chain continuity
      const schoolEvents = this.auditEvents.get(schoolId) || [];
      const prevHash = schoolEvents.length > 0 ? schoolEvents[schoolEvents.length - 1].hash : GENESIS_HASH;
      const sequence = schoolEvents.length + 1;

      const auditEvent = appendAuditEvent({
        school_id: schoolId,
        sequence,
        type: 'VERIFICATION_CREATED',
        actor: mentorId,
        payload: {
          entry_id: entryId,
          revision: revision.revision,
          digest: signedSeal.digest,
          signature: signedSeal.signature,
          key_id: signedSeal.key_id
        },
        prev_hash: prevHash,
        created_at: decidedAt
      });

      schoolEvents.push(auditEvent);
      this.auditEvents.set(schoolId, schoolEvents);

      // Freeze revision in APPROVED state
      revision.state = 'APPROVED';
      revision.skills = updatedSkills;
      revision.updated_at = decidedAt;

      const verificationRecord: VerificationRecord = {
        id: verId,
        school_id: schoolId,
        entry_id: entryId,
        revision: revision.revision,
        mentor_id: mentorId,
        decision: 'APPROVED',
        mentor_note: trimmedNote,
        digest: signedSeal.digest,
        signature: signedSeal.signature,
        key_id: signedSeal.key_id,
        decided_at: decidedAt,
        audit_event_hash: auditEvent.hash
      };
      this.verifications.set(verId, verificationRecord);

      // Update published read model
      const student = this.users.get(entry.student_id);
      const mentor = this.users.get(mentorId);

      this.publishedEntries.set(entryId, {
        id: `pub-${entryId}`,
        entry_id: entryId,
        revision: revision.revision,
        school_id: schoolId,
        student_name: student?.full_name || 'Student',
        student_class_level: student?.class_level,
        is_minor: student?.is_minor ?? true,
        title: revision.title,
        description: revision.description,
        category: revision.category,
        role: revision.role,
        start_date: revision.start_date,
        end_date: revision.end_date,
        skills: updatedSkills.map((s) => ({
          id: s.id,
          name: s.id,
          level: s.level
        })),
        evidence: revision.evidence.map((e) => ({
          sha256: e.sha256,
          mime_type: e.mime_type
        })),
        mentor_id: mentorId,
        mentor_name: mentor?.full_name || 'Mentor',
        mentor_note: trimmedNote,
        decided_at: decidedAt,
        digest: signedSeal.digest,
        signature: signedSeal.signature,
        key_id: signedSeal.key_id,
        audit_event_hash: auditEvent.hash,
        verified_at: decidedAt
      });

      return {
        success: true,
        verification: verificationRecord,
        seal: signedSeal,
        auditEvent
      };
    } else {
      // Rejection or Changes Requested
      revision.state = decision;
      revision.updated_at = decidedAt;

      const verificationRecord: VerificationRecord = {
        id: verId,
        school_id: schoolId,
        entry_id: entryId,
        revision: revision.revision,
        mentor_id: mentorId,
        decision,
        mentor_note: trimmedNote,
        decided_at: decidedAt
      };
      this.verifications.set(verId, verificationRecord);

      return {
        success: true,
        verification: verificationRecord
      };
    }
  }
}

export const memoryStore = new VeriFolioMemoryStore();
