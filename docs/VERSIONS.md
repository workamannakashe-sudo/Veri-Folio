# VeriFolio Pinned Versions

All dependency and runtime versions pinned as required by VeriFolio Build Plan v2.

## Runtime & Engines
- **Node.js**: `22.x` (LTS) / `24.x` (Engine range: `>=20.18.0`)
- **Package Manager**: `pnpm` `9.x` (`>=9.14.0`)
- **Database**: PostgreSQL `16.4`
- **Queue / Cache**: Redis `7.2`
- **Object Storage**: MinIO `RELEASE.2024-11-07T00-52-28Z` (S3 compatible)

## Core Libraries
- **TypeScript**: `5.6.3`
- **Next.js**: `14.2.18` (or 15.0.3 stable)
- **React**: `18.3.1` (or 19)
- **Tailwind CSS**: `3.4.15`
- **Express**: `4.21.1`
- **Prisma**: `5.22.0`
- **Zod**: `3.23.8`
- **BullMQ**: `5.25.4`
- **Pino**: `9.5.0`
- **@aws-sdk/client-s3**: `3.693.0`
- **@aws-sdk/s3-request-presigner**: `3.693.0`

## Cryptography & Integrity
- **Node Crypto**: Built-in `crypto` (`crypto.generateKeyPairSync`, `crypto.sign`, `crypto.verify`, `crypto.createHash`)
- **Ed25519**: Node standard `ed25519` key pairs
- **Canonical JSON**: `json-canonicalize` `1.0.6` (RFC 8785 implementation)

## Testing & Quality
- **Vitest**: `2.1.5`
- **Playwright**: `1.49.0`
- **Supertest**: `7.0.0`
- **Axe Core**: `4.10.2`
- **k6**: `0.54.0`
