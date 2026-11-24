import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

declare global {
  namespace Express {
    interface Request {
      schoolId?: string;
    }
  }
}

/**
 * Tenant context middleware.
 * Attaches the authenticated school_id to the request and prepares transaction-scoped RLS.
 */
export function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  // If user is authenticated, schoolId is populated from JWT
  if (req.user?.schoolId) {
    req.schoolId = req.user.schoolId;
  }
  next();
}

/**
 * Helper to run a tenant-isolated database query using SET LOCAL app.school_id.
 */
export async function withTenant<T>(schoolId: string, fn: (tx: any) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx: any) => {
    // Sanitize schoolId (UUID) and set transaction-local variable
    await tx.$executeRawUnsafe(`SET LOCAL app.school_id = '${schoolId.replace(/'/g, "''")}';`);
    return fn(tx);
  });
}
