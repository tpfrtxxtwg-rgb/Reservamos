FROM node:22-slim AS builder

WORKDIR /app

# Aggressive cache invalidation - MUST change timestamp for every deploy
RUN echo "deploy-2025-06-04-14-45-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5 && \
    echo "=== VERSIONS ===" && \
    node -e "console.log('tRPC:', require('@trpc/react-query/package.json').version)" && \
    node -e "console.log('RQ:', require('@tanstack/react-query/package.json').version)" && \
    echo "================"

COPY . .

# Force clean build - no Vite cache
RUN rm -rf dist .vite && \
    NODE_ENV=production npx vite build --mode production --emptyOutDir 2>&1 && \
    echo "=== BUILD OUTPUT ===" && \
    ls -la dist/public/ && \
    echo "=== JS/CSS ASSETS ===" && \
    ls dist/public/assets/ | grep -E "\.(js|css)$" || echo "WARNING: No JS/CSS found" && \
    echo "=== INDEX HTML ===" && \
    cat dist/public/index.html && \
    echo "=== END ===" && \
    npx esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist \
    --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);" 2>&1

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json

RUN mkdir -p dist/server/api && cp dist/boot.js dist/server/api/boot.js 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/boot.js"]