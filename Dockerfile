FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /build-reservamos

ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH=main

RUN git clone --depth 1 --branch ${RAILWAY_GIT_BRANCH} https://github.com/tpfrtxxtwg-rgb/Reservamos.git . && \
    echo "Cloned commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

RUN npm install && npm rebuild esbuild
RUN npx vite build

RUN node_modules/.bin/esbuild api/boot.ts \
    --platform=node \
    --bundle \
    --format=esm \
    --outdir=dist/server \
    --tsconfig=tsconfig.server.json \
    --resolve-extensions=.ts,.tsx,.js,.jsx,.mjs \
    --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

FROM node:20-slim

WORKDIR /app

COPY --from=builder /build-reservamos/dist ./dist
COPY --from=builder /build-reservamos/node_modules ./node_modules
COPY --from=builder /build-reservamos/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server/boot.js"]