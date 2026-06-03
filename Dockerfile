FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Force cache invalidation - must change on every deploy
ARG CACHE_BUST=20250603-05
RUN echo "Cache bust: ${CACHE_BUST}"

# Build the application with production mode
RUN NODE_ENV=production npx vite build --mode production 2>&1 && npx esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);" 2>&1
# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json

# Create expected directory structure for Railway
RUN mkdir -p dist/server/api && cp dist/boot.js dist/server/api/boot.js 2>/dev/null || true

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/boot.js"]