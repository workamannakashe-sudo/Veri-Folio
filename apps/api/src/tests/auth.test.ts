import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Phase 1: Foundation, Auth & RBAC', () => {
  it('health check returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('exposes well-known public key endpoint', async () => {
    const res = await request(app).get('/.well-known/verifolio-keys.json');
    expect(res.status).toBe(200);
    expect(res.body.keys).toBeDefined();
    expect(res.body.keys[0].crv).toBe('Ed25519');
  });

  describe('Four Roles Authentication & Empty Dashboards', () => {
    const roles = [
      { role: 'STUDENT', email: 'alice.student@school1.edu', dashboard: '/dashboard/student' },
      { role: 'MENTOR', email: 'bob.mentor@school1.edu', dashboard: '/dashboard/mentor' },
      { role: 'ADMIN', email: 'clara.admin@school1.edu', dashboard: '/dashboard/admin' },
      { role: 'VIEWER', email: 'david.viewer@enterprise.org', dashboard: '/dashboard/viewer' }
    ];

    for (const item of roles) {
      it(`signs in as ${item.role} and accesses their dashboard`, async () => {
        // Step 1: Request OTP
        const otpReq = await request(app)
          .post('/auth/request-otp')
          .send({ email: item.email, schoolId: 'school-1' });
        expect(otpReq.status).toBe(200);

        // Step 2: Verify OTP
        const verifyReq = await request(app)
          .post('/auth/verify-otp')
          .send({ email: item.email, code: '123456' });
        expect(verifyReq.status).toBe(200);
        expect(verifyReq.body.accessToken).toBeDefined();
        expect(verifyReq.body.user.role).toBe(item.role);

        const token = verifyReq.body.accessToken;

        // Step 3: Access Own Dashboard
        const dashRes = await request(app)
          .get(item.dashboard)
          .set('Authorization', `Bearer ${token}`);
        expect(dashRes.status).toBe(200);
        expect(dashRes.body.role).toBe(item.role);
      });
    }

    it('rejects cross-role dashboard access with 403 Forbidden', async () => {
      // Sign in as student
      await request(app).post('/auth/request-otp').send({ email: 'student@school1.edu' });
      const verify = await request(app).post('/auth/verify-otp').send({ email: 'student@school1.edu', code: '123456' });
      const studentToken = verify.body.accessToken;

      // Attempt to access admin dashboard
      const res = await request(app)
        .get('/dashboard/admin')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated dashboard access with 401', async () => {
      const res = await request(app).get('/dashboard/student');
      expect(res.status).toBe(401);
    });
  });
});
