import fs from 'fs';
import path from 'path';
import { 
  buildSealFields, 
  seal, 
  appendAuditEvent, 
  GENESIS_HASH 
} from '../modules/seal';
import { defaultSigner } from '../modules/seal/keys';
import { CONTROLLED_SKILLS, ControlledSkill } from '@verifolio/shared';

export interface DemoStudent {
  id: string;
  name: string;
  email: string;
  classLevel: string;
  isMinor: boolean;
  guardianConsent?: {
    guardianRef: string;
    consentDate: string;
    method: 'WRITTEN_FORM' | 'DIGITAL_SIGNATURE';
    noticeVersion: string;
  };
  groups: string[];
}

export interface DemoMentor {
  id: string;
  name: string;
  email: string;
  role: string;
  groups: string[];
  declineRate: number;
  anomalyFlag?: boolean;
}

export interface DemoEntry {
  id: string;
  studentId: string;
  studentName: string;
  classLevel: string;
  isMinor: boolean;
  title: string;
  description: string;
  category: string;
  role: string;
  startDate: string;
  endDate: string;
  status: 'APPROVED' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'DRAFT' | 'REJECTED' | 'REVOKED';
  skills: Array<{ id: string; name: string; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }>;
  mentorId: string;
  mentorName: string;
  mentorNote?: string;
  isPublished: boolean;
  isTampered?: boolean;
  seal?: {
    key_id: string;
    digest: string;
    signature: string;
    decided_at: string;
  };
  revocation?: {
    revoked_by: string;
    reason: string;
    revoked_at: string;
  };
}

export function generateDemoDataset() {
  const schoolId = 'school-demo-verifolio';

  // 1. Seed 12 Mentors (Teachers & Coaches)
  const mentors: DemoMentor[] = [
    { id: 'men-1', name: 'Dr. Anand Verma', email: 'anand.verma@example.com', role: 'Head of STEM & Robotics', groups: ['Robotics Club', 'Class 10A', 'Class 11A'], declineRate: 0.05 },
    { id: 'men-2', name: 'Ms. Sunita Kulkarni', email: 'sunita.kulkarni@example.com', role: 'Senior Computer Science Faculty', groups: ['Coding Club', 'Class 9A', 'Class 10A'], declineRate: 0.08 },
    { id: 'men-3', name: 'Coach Rajesh Nair', email: 'rajesh.nair@example.com', role: 'Athletics & Cricket Coach', groups: ['Cricket Team', 'Football Team'], declineRate: 0.04 },
    { id: 'men-4', name: 'Dr. Meera Iyer', email: 'meera.iyer@example.com', role: 'Biotechnology & Science Lead', groups: ['Science Club', 'Class 11A'], declineRate: 0.06 },
    { id: 'men-5', name: 'Mr. Vikram Sen', email: 'vikram.sen@example.com', role: 'Debate Society Advisor', groups: ['Debate Society', 'Class 10B'], declineRate: 0.07 },
    { id: 'men-6', name: 'Ms. Priya Deshmukh', email: 'priya.deshmukh@example.com', role: 'Drama & Literature Mentor', groups: ['Drama Club', 'Class 8A'], declineRate: 0.05 },
    { id: 'men-7', name: 'Mr. Arvind Joshi', email: 'arvind.joshi@example.com', role: 'Eco Club Coordinator', groups: ['Eco Club', 'Class 8B'], declineRate: 0.04 },
    { id: 'men-8', name: 'Ms. Kavita Rao', email: 'kavita.rao@example.com', role: 'Music & Arts Director', groups: ['Music Band', 'Class 9B'], declineRate: 0.05 },
    { id: 'men-9', name: 'Coach Suresh Pillai', email: 'suresh.pillai@example.com', role: 'Kabaddi Coach', groups: ['Kabaddi'], declineRate: 0.06 },
    // Mentor with higher change/decline rate (strict auditor)
    { id: 'men-10', name: 'Dr. Raghavan Swamy', email: 'raghavan.swamy@example.com', role: 'External Rigor Evaluator', groups: ['Science Club', 'Class 11A'], declineRate: 0.35 },
    // Mentor with anomaly signal (<20s approval time)
    { id: 'men-11', name: 'Mr. Alok Tandon', email: 'alok.tandon@example.com', role: 'Junior Assistant Coach', groups: ['Football Team'], declineRate: 0.02, anomalyFlag: true },
    // Mentor linked to NO groups (to demonstrate 403 authorization check)
    { id: 'men-12', name: 'Dr. Unlinked Educator', email: 'unlinked@example.com', role: 'Visiting Scholar', groups: [], declineRate: 0.0 }
  ];

  // 2. Seed 50 Students (realistic Indian names, 6 minors with recorded guardian consent)
  const studentNames = [
    'Aarav Sharma', 'Diya Patel', 'Aditya Iyer', 'Ananya Gupta', 'Rohan Verma',
    'Ishaan Reddy', 'Saanvi Joshi', 'Vihaan Nair', 'Myra Sen', 'Kabir Mukherjee',
    'Tara Pillai', 'Reyansh Kulkarni', 'Aditi Rao', 'Arjun Saxena', 'Rhea Banerjee',
    'Atharv Deshmukh', 'Pari Agarwal', 'Devansh Tiwari', 'Sneha Menon', 'Aaryan Das',
    'Meera Bhat', 'Tanmay Kapoor', 'Avani Jain', 'Shaurya Nambiar', 'Anika Ghosh',
    'Kunal Malani', 'Gauri Varma', 'Pranav Hegde', 'Shruti Chawla', 'Yash Singhania',
    'Pooja Dubey', 'Dhruv Rastogi', 'Kavya Soni', 'Siddharth Kaul', 'Bhavna Pandey',
    'Manav Mehta', 'Simran Bedi', 'Harsh Vardhan', 'Tanvi Mathur', 'Nikhil Goel',
    'Isha Sethi', 'Raghav Bajaj', 'Khushi Oberoi', 'Gautam Ahuja', 'Palak Grover',
    'Varun Dhawan', 'Radhika Mittal', 'Abhishek Sood', 'Trisha Bakshi', 'Karan Luthra'
  ];

  const classes = ['8A', '8B', '9A', '9B', '10A', '10B', '11A'];
  const clubPool = ['Robotics Club', 'Coding Club', 'Debate Society', 'Eco Club', 'Music Band', 'Cricket Team', 'Football Team', 'Kabaddi', 'Drama Club', 'Science Club'];

  const students: DemoStudent[] = studentNames.map((name, index) => {
    const classLevel = classes[index % classes.length];
    const isMinor = index < 6; // First 6 students are under-18 minors
    const primaryClub = clubPool[index % clubPool.length];
    const secondaryClub = clubPool[(index + 3) % clubPool.length];

    const student: DemoStudent = {
      id: `stu-${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      classLevel: `Class ${classLevel}`,
      isMinor,
      groups: [`Class ${classLevel}`, primaryClub, secondaryClub]
    };

    if (isMinor) {
      student.guardianConsent = {
        guardianRef: `guard-${index + 1}@example.com`,
        consentDate: '2026-08-15T09:00:00Z',
        method: 'DIGITAL_SIGNATURE',
        noticeVersion: 'v2.1-2026'
      };
    }

    return student;
  });

  // 3. Seed Entries (~140 entries across 50 students)
  const projectTemplates = [
    { title: 'Autonomous Campus Waste-Sorting Rover', desc: 'Engineered obstacle-avoidance lidar rover using Arduino and pathfinding algorithms.', cat: 'project', role: 'Hardware & Firmware Lead', skills: ['sk-embedded', 'sk-robotics', 'sk-python'] },
    { title: 'Microbial DNA Sequence Analysis Pipeline', desc: 'Constructed automated FASTA parsing and variant alignment tool for bioinformatics research.', cat: 'project', role: 'Bioinformatics Lead', skills: ['sk-python', 'sk-data-analysis', 'sk-research'] },
    { title: 'District Interschool Debate Tournament Championship', desc: 'Led affirmative team through 5 debate rounds arguing environmental economic policy.', cat: 'club', role: 'First Speaker & Team Captain', skills: ['sk-public-speaking', 'sk-critical-thinking', 'sk-leadership'] },
    { title: 'Solar Powered Weather Station Prototype', desc: 'Built IoT telemetry station measuring humidity, air quality index, and UV radiation.', cat: 'project', role: 'IoT Systems Developer', skills: ['sk-embedded', 'sk-sensor-integration', 'sk-c-programming'] },
    { title: 'State Level Under-17 Cricket Championship Finals', desc: 'Opened bowling spell conceding 22 runs in 6 overs; captained fielding strategy.', cat: 'sport', role: 'Opening Bowler & Vice Captain', skills: ['sk-teamwork', 'sk-strategic-planning', 'sk-endurance'] },
    { title: 'Open-Source Library for Accessible Screen Readers', desc: 'Contributed ARIA live region enhancements and keyboard focus utilities to GitHub repo.', cat: 'project', role: 'Open Source Contributor', skills: ['sk-web-accessibility', 'sk-javascript', 'sk-git-workflow'] },
    { title: 'Campus Rainwater Harvesting Capacity Audit', desc: 'Calculated rooftop runoff volumes and formulated blueprint for groundwater recharging cisterns.', cat: 'project', role: 'Environmental Analyst', skills: ['sk-environmental-modeling', 'sk-data-collection', 'sk-leadership'] },
    { title: 'Annual School Theatrical Drama Production', desc: 'Directed 24-student cast and crew in 90-minute stage performance; oversaw lighting design.', cat: 'club', role: 'Director & Stage Lead', skills: ['sk-creative-direction', 'sk-project-management', 'sk-communication'] }
  ];

  const entries: DemoEntry[] = [];
  let auditPrevHash = GENESIS_HASH;
  const auditEvents: any[] = [];

  students.forEach((student, sIdx) => {
    // Generate 2 to 3 entries per student
    const entryCount = (sIdx % 2) + 2;

    for (let eIdx = 0; eIdx < entryCount; eIdx++) {
      const template = projectTemplates[(sIdx * 3 + eIdx) % projectTemplates.length];
      const entryId = `ent-${student.id}-${eIdx + 1}`;
      
      let status: DemoEntry['status'] = 'APPROVED';
      let isTampered = false;
      let isRevoked = false;

      if (sIdx === 0 && eIdx === 0) {
        status = 'APPROVED';
      } else if (sIdx === 0 && eIdx === 1) {
        status = 'APPROVED';
        isTampered = true;
      } else if (sIdx === 1 && eIdx === 0) {
        status = 'REVOKED';
        isRevoked = true;
      } else if (sIdx === 2 && eIdx === 0) {
        status = 'SUBMITTED';
      } else if (sIdx === 3 && eIdx === 0) {
        status = 'CHANGES_REQUESTED';
      } else if (eIdx === 2) {
        status = 'DRAFT';
      } else {
        const mod = (sIdx + eIdx) % 10;
        if (mod < 6) status = 'APPROVED';
        else if (mod < 8) status = 'SUBMITTED';
        else if (mod === 8) status = 'CHANGES_REQUESTED';
        else status = 'REJECTED';
      }

      const eligible = mentors.filter((m) => m.groups.some((g) => student.groups.includes(g)));
      const mentor = eligible.length > 0 ? eligible[(sIdx + eIdx) % eligible.length] : mentors[0];

      const mappedSkills = template.skills.map((skId) => {
        const found = CONTROLLED_SKILLS.find((cs: ControlledSkill) => cs.id === skId);
        return {
          id: skId,
          name: found ? found.name : 'Core Applied Competency',
          level: (eIdx === 0 ? 'ADVANCED' : eIdx === 1 ? 'INTERMEDIATE' : 'BEGINNER') as any
        };
      });

      const entry: DemoEntry = {
        id: entryId,
        studentId: student.id,
        studentName: student.name,
        classLevel: student.classLevel,
        isMinor: student.isMinor,
        title: isTampered ? `${template.title} [TAMPERED: +100 bonus marks]` : template.title,
        description: template.desc,
        category: template.cat,
        role: template.role,
        startDate: '2026-08-01',
        endDate: '2026-11-15',
        status,
        skills: mappedSkills,
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorNote: `Evaluated student work independently during ${student.groups[1] || 'class'}. Demonstrated strong problem solving and conceptual depth.`,
        isPublished: status === 'APPROVED' || status === 'REVOKED',
        isTampered
      };

      if (status === 'APPROVED' || isRevoked || isTampered) {
        const decidedAt = '2026-11-20T10:30:00.000Z';
        
        const sealFields = buildSealFields({
          school_id: schoolId,
          entry_id: entryId,
          student_id: student.id,
          revision: 1,
          key_id: defaultSigner.keyId,
          title: template.title,
          description: template.desc,
          category: template.cat,
          role: template.role,
          start: '2026-08-01',
          end: '2026-11-15',
          skills: mappedSkills.map((s) => ({ id: s.id, name: s.name, level: s.level })),
          evidence: ['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
          mentor_id: mentor.id,
          mentor_note: entry.mentorNote!,
          decided_at: decidedAt
        });

        const signed = seal(sealFields, defaultSigner);
        entry.seal = {
          key_id: defaultSigner.keyId,
          digest: signed.digest,
          signature: signed.signature,
          decided_at: decidedAt
        };

        const auditEvent = appendAuditEvent({
          school_id: schoolId,
          sequence: auditEvents.length + 1,
          type: 'VERIFICATION_SEALED',
          actor: mentor.id,
          payload: {
            entry_id: entryId,
            revision: 1,
            digest: signed.digest,
            signature: signed.signature
          },
          prev_hash: auditPrevHash,
          created_at: decidedAt
        });
        auditPrevHash = auditEvent.hash;
        auditEvents.push(auditEvent);

        if (isRevoked) {
          entry.revocation = {
            revoked_by: mentor.id,
            reason: 'Formal withdrawal following review of duplicate institutional submission.',
            revoked_at: '2026-11-22T14:15:00.000Z'
          };
        }
      }

      entries.push(entry);
    }
  });

  return {
    school: {
      id: schoolId,
      name: 'VeriFolio Demo School',
      code: 'DEMO-SCHOOL-01'
    },
    students,
    mentors,
    entries,
    auditEvents,
    skills: CONTROLLED_SKILLS
  };
}

export function writeDemoSnapshot() {
  const dataset = generateDemoDataset();
  const outputDir = path.resolve(__dirname, '../../../../web/public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const snapshotPath = path.join(outputDir, 'demo-snapshot.json');
  fs.writeFileSync(snapshotPath, JSON.stringify(dataset, null, 2), 'utf-8');
  return { snapshotPath, count: dataset.entries.length };
}
