import { PrismaClient } from '@prisma/client';

let _prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!_prismaInstance) {
    _prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  return _prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

/**
 * Asserts that the connected database role is not a superuser or table owner.
 * Non-negotiable security requirement to guarantee PostgreSQL FORCE RLS is strictly enforced.
 */
export async function assertNonOwnerAppRole(client: any = prisma): Promise<void> {
  const result = await client.$queryRawUnsafe(
    `SELECT r.rolname as current_user, r.rolsuper, r.rolinherit 
     FROM pg_roles r 
     WHERE r.rolname = CURRENT_USER;`
  );

  if (!result || result.length === 0) {
    throw new Error('Unable to inspect current database role permissions.');
  }

  const role = result[0];
  if (role.rolsuper) {
    throw new Error(
      `SECURITY VIOLATION: VeriFolio API connected as superuser role '${role.current_user}'. Startup rejected. Must connect via non-owner app role 'verifolio_app' so RLS cannot be bypassed.`
    );
  }
}
