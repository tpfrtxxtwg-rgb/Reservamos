FROM node:20-slim AS builder

# Change workdir to bust cache from previous builds
WORKDIR /build

COPY package.json ./
RUN rm -f package-lock.json && npm install

ARG RAILWAY_GIT_COMMIT_SHA
RUN echo "Building commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

COPY . .

RUN node ./node_modules/.bin/vite build && \
    node ./node_modules/.bin/esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

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