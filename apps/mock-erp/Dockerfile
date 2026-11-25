# Production Dockerfile for VeriFolio Mock ERP
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/mock-erp/package.json ./apps/mock-erp/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY apps/mock-erp/ ./apps/mock-erp/

RUN pnpm --filter @verifolio/shared run build
RUN pnpm --filter @verifolio/mock-erp run build

FROM node:22-alpine AS runner

WORKDIR /app
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV MOCK_ERP_PORT=5000

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/mock-erp/dist ./apps/mock-erp/dist
COPY --from=builder /app/apps/mock-erp/package.json ./apps/mock-erp/package.json

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "apps/mock-erp/dist/index.js"]
