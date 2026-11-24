import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const port = Number(process.env.MOCK_ERP_PORT) || 5000;
const WEBHOOK_SECRET = process.env.ERP_WEBHOOK_SECRET || 'erp-webhook-secret-demo-2026';

app.use(cors());
app.use(express.json());

// In-memory ERP database
const students = [
  { erp_id: 'ERP-STU-101', name: 'Rohan Sharma', grade: '11-A', email: 'alice.student@school1.edu' },
  { erp_id: 'ERP-STU-102', name: 'Priya Patel', grade: '12-B', email: 'priya.patel@school1.edu' }
];

const staff = [
  { erp_id: 'ERP-FAC-201', name: 'Dr. Anand Verma', department: 'Computer Science & Robotics', email: 'bob.mentor@school1.edu' },
  { erp_id: 'ERP-FAC-202', name: 'Prof. Suresh Nair', department: 'Mathematics', email: 'unlinked.mentor@school1.edu' }
];

const groups = [
  { group_id: 'GRP-101', name: 'Robotics & Automation Club', type: 'CLUB', members: ['ERP-STU-101', 'ERP-FAC-201'] },
  { group_id: 'GRP-102', name: 'Varsity Cricket Team', type: 'TEAM', members: ['ERP-STU-101', 'ERP-STU-102'] }
];

interface ReceivedWebhook {
  event_id: string;
  type: string;
  payload: any;
  received_at: string;
}

const receivedWebhooks: ReceivedWebhook[] = [];
const verifiedSkillsByStudent: Record<string, any[]> = {
  'ERP-STU-101': [
    {
      entry_id: 'ent-sample-rover',
      title: 'Autonomous Campus Waste-Sorting Rover',
      skills: ['Robotics Engineering (ADVANCED)', 'Embedded Systems (INTERMEDIATE)'],
      verified_by: 'Dr. Anand Verma',
      verified_at: '2026-11-19T10:00:00.000Z',
      digest: '3f7a1c8b2d9e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a'
    }
  ]
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mock-erp' });
});

// 1. Roster endpoints
app.get('/api/roster/students', (_req, res) => {
  res.json({ total: students.length, students });
});

app.get('/api/roster/staff', (_req, res) => {
  res.json({ total: staff.length, staff });
});

app.get('/api/roster/groups', (_req, res) => {
  res.json({ total: groups.length, groups });
});

// 2. Incoming VeriFolio Webhook Receiver with HMAC-SHA256 signature and replay defense
app.post('/api/webhooks/verifolio', (req: Request, res: Response) => {
  const signature = req.headers['x-verifolio-signature'] as string;
  const timestampHeader = req.headers['x-verifolio-timestamp'] as string;

  if (!signature || !timestampHeader) {
    return res.status(401).json({ error: 'Missing webhook signature or timestamp header' });
  }

  // 5-minute replay window check
  const now = Date.now();
  const eventTime = parseInt(timestampHeader, 10);
  if (isNaN(eventTime) || Math.abs(now - eventTime) > 300_000) {
    return res.status(403).json({ error: 'Webhook rejected: timestamp outside 5-minute replay window' });
  }

  // Validate HMAC-SHA256 signature
  const rawBody = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(`${timestampHeader}.${rawBody}`);
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid HMAC signature' });
  }

  const { type, payload } = req.body;
  const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  receivedWebhooks.push({
    event_id: eventId,
    type,
    payload,
    received_at: new Date().toISOString()
  });

  // If verified, record in student skills
  if (type === 'entry.verified' && payload?.student_erp_id) {
    const list = verifiedSkillsByStudent[payload.student_erp_id] || [];
    list.push(payload);
    verifiedSkillsByStudent[payload.student_erp_id] = list;
  }

  return res.status(200).json({ received: true, event_id: eventId });
});

app.get('/api/webhooks', (_req, res) => {
  res.json({ total: receivedWebhooks.length, webhooks: receivedWebhooks });
});

// 3. Embedded SIS Student View with "Verified Skills" tab
app.get('/student/:id', (req, res) => {
  const student = students.find((s) => s.erp_id === req.params.id) || students[0];
  const skills = verifiedSkillsByStudent[student.erp_id] || [];

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>School ERP - ${student.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1021; color: #e2e8f0; margin: 0; padding: 24px; }
    .card { background: #151e36; border: 1px solid #2d3748; border-radius: 12px; padding: 24px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d3748; padding-bottom: 16px; margin-bottom: 20px; }
    .badge { background: #00f2fe22; color: #00f2fe; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; border: 1px solid #00f2fe44; }
    .tab-bar { display: flex; gap: 8px; margin-bottom: 20px; }
    .tab { padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; text-decoration: none; }
    .tab.active { background: #00f2fe; color: #0b1021; font-weight: bold; }
    .tab.inactive { background: #1e293b; color: #94a3b8; }
    .skill-card { background: #1e293b; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .skill-title { font-weight: bold; font-size: 16px; color: #f8fafc; }
    .meta { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .check-btn { display: inline-block; margin-top: 10px; background: #00f2fe22; color: #00f2fe; border: 1px solid #00f2fe55; padding: 6px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1 style="margin: 0; font-size: 22px;">Delhi Public School - SIS Portal</h1>
        <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Academic Records & Verified Portfolio Integration</p>
      </div>
      <span class="badge">ERP Connected</span>
    </div>

    <div class="tab-bar">
      <span class="tab inactive">Profile & Demographics</span>
      <span class="tab inactive">Attendance</span>
      <span class="tab inactive">Coursework</span>
      <span class="tab active">Verified Skills (VeriFolio)</span>
    </div>

    <div>
      <h2 style="font-size: 18px; margin-bottom: 8px;">${student.name} (${student.grade})</h2>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 0;">ERP ID: ${student.erp_id} | ${student.email}</p>

      <div style="margin-top: 20px;">
        ${
          skills.length > 0
            ? skills
                .map(
                  (sk) => `
          <div class="skill-card">
            <div class="skill-title">${sk.title}</div>
            <div class="meta">Confirmed by <strong>${sk.verified_by}</strong> on ${new Date(sk.verified_at).toLocaleDateString()}</div>
            <div class="meta">SHA-256 Seal Digest: <code>${sk.digest.substring(0, 24)}...</code></div>
            <a href="http://localhost:3000/check/${sk.entry_id}" target="_blank" class="check-btn">Open Public Check Page ↗</a>
          </div>
        `
                )
                .join('')
            : '<p style="color: #94a3b8;">No mentor-verified entries recorded yet.</p>'
        }
      </div>
    </div>
  </div>
</body>
</html>
  `);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Mock ERP listening on port ${port}`);
  });
}

export default app;
