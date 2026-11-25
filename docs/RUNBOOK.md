# VeriFolio Operations & Incident Runbook

## 1. Service Management
VeriFolio runs as a micro-services composition:
- `api` (Express Node.js on port 4000)
- `web` (Next.js 14 on port 3000)
- `mock-erp` (Port 4001)
- `worker` (BullMQ background processor)
- `postgres` (PostgreSQL 16 on port 5432)
- `redis` (Redis 7 on port 6379)
- `minio` (S3 Evidence storage on port 9000/9001)

### Quick Commands
```bash
# Start all production services
docker compose -f docker-compose.prod.yml up -d

# Check health of all services
docker compose -f docker-compose.prod.yml ps

# View live API logs
docker compose -f docker-compose.prod.yml logs -f api

# Stop all services safely
docker compose -f docker-compose.prod.yml down
```

## 2. Health & Monitoring Endpoints
- **Liveness probe**: `GET /health` -> `{"status":"ok","timestamp":"..."}`
- **Readiness probe**: `GET /ready` -> Validates active key registry and database connectivity.
- **Metrics endpoint**: `GET /metrics` -> Provides process uptime, memory RSS, total users, and total portfolio entries.
- **Audit Integrity probe**: `GET /api/v1/admin/audit/integrity` -> Recomputes and validates SHA-256 hash chain continuity.

## 3. Database Backup & Restore Procedures

### Automated Backup
```bash
# Generate timestamped backup
docker exec -t verifolio-prod-postgres pg_dump -U verifolio -d verifolio -F c -b -v -f /var/lib/postgresql/data/backup_$(date +%Y%m%d_%H%M%S).dump
```

### Point-In-Time Restore
```bash
# Restore from dump file
docker exec -t verifolio-prod-postgres pg_restore -U verifolio -d verifolio -v /var/lib/postgresql/data/backup_YYYYMMDD_HHMMSS.dump
```

## 4. Disaster Recovery & Hash-Chain Breach Remediation
If `GET /api/v1/admin/audit/integrity` reports `valid: false`:
1. Isolate the affected tenant (`school_id`).
2. Run audit event diff against the cold backup ledger.
3. Identify the breaking block sequence number (`seq`).
4. Trace access logs using the unique `requestId` associated with the breaking block.
5. Re-anchor the signed state using the institutional offline cold key.
