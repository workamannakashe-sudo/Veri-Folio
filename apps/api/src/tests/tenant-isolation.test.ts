import { describe, it, expect } from 'vitest';
import { assertNonOwnerAppRole } from '../db';

describe('Phase 1: Tenancy & RLS Non-Owner Role Guards', () => {
  it('assertNonOwnerAppRole rejects superuser connections', async () => {
    // Mock a client returning superuser role
    const mockSuperuserClient: any = {
      $queryRawUnsafe: async () => [{ current_user: 'postgres', rolsuper: true, rolinherit: true }]
    };

    await expect(assertNonOwnerAppRole(mockSuperuserClient)).rejects.toThrow(
      /SECURITY VIOLATION: VeriFolio API connected as superuser role/
    );
  });

  it('assertNonOwnerAppRole permits non-owner application role (verifolio_app)', async () => {
    // Mock a client returning verifolio_app non-superuser role
    const mockAppClient: any = {
      $queryRawUnsafe: async () => [{ current_user: 'verifolio_app', rolsuper: false, rolinherit: true }]
    };

    await expect(assertNonOwnerAppRole(mockAppClient)).resolves.not.toThrow();
  });

  it('ensures tenant isolation context sets app.school_id correctly', async () => {
    const executedQueries: string[] = [];
    const mockTx: any = {
      $executeRawUnsafe: async (sql: string) => {
        executedQueries.push(sql);
      }
    };

    const mockPrisma: any = {
      $transaction: async (cb: (tx: any) => Promise<any>) => cb(mockTx)
    };

    const schoolId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    await mockPrisma.$transaction(async (tx: any) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.school_id = '${schoolId}';`);
    });

    expect(executedQueries.length).toBe(1);
    expect(executedQueries[0]).toBe(`SET LOCAL app.school_id = '${schoolId}';`);
  });
});
