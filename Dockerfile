
FROM node:20-slim AS builder

# Change this comment to force Railway to bust cache if needed
# cache-bust: v1

WORKDIR /build

COPY package.json ./

# Install deps globally to avoid .bin permission issues entirely
RUN npm install && \
    npm install -g vite esbuild && \
    npm rebuild esbuild

ARG RAILWAY_GIT_COMMIT_SHA
RUN echo "Building commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

COPY . .

# Use global binaries (never have permission issues)
RUN vite build && \
    esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

FROM node:20-slim

WORKDIR /app

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/api ./api
COPY --from=builder /build/db ./db
COPY --from=builder /build/contracts ./contracts
COPY --from=builder /build/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /build/tsconfig.server.json ./tsconfig.server.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/boot.js"]