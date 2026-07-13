FROM node:22-slim AS builder

WORKDIR /app

# CHANGE THIS TIMESTAMP FOR EVERY DEPLOY to invalidate cache
RUN echo "deploy-2026-07-13-23-30-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5

COPY . .

# Step 1: Build frontend with Vite
RUN echo "=== STEP 1: VITE BUILD ===" && \
    rm -rf dist .vite && \
    NODE_ENV=production npx vite build --mode production --emptyOutDir && \
    echo "=== VITE DONE ===" && \
    ls -la dist/public/

# Step 2: Verify JS/CSS assets exist - FAILS if missing
RUN echo "=== STEP 2: VERIFY ASSETS ===" && \
    ls dist/public/assets/ && \
    JS_COUNT=$(ls dist/public/assets/*.js 2>/dev/null | wc -l) && \
    CSS_COUNT=$(ls dist/public/assets/*.css 2>/dev/null | wc -l) && \
    echo "JS files: $JS_COUNT" && \
    echo "CSS files: $CSS_COUNT" && \
    if [ "$JS_COUNT" -eq 0 ]; then echo "ERROR: No JS files!" && exit 1; fi && \
    if [ "$CSS_COUNT" -eq 0 ]; then echo "ERROR: No CSS files!" && exit 1; fi && \
    echo "=== VERIFY OK ==="

# Step 3: Build backend
RUN echo "=== STEP 3: ES BUILD ===" && \
    npx esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist \
    --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);" && \
    echo "=== ES BUILD DONE ==="

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