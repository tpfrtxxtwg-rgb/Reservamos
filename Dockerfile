FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /reservamos

ARG GITHUB_TOKEN
ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH=main

RUN if [ -n "$GITHUB_TOKEN" ]; then \
      git clone --depth 1 --branch "$RAILWAY_GIT_BRANCH" "https://${GITHUB_TOKEN}@github.com/tpfrtxxtwg-rgb/Reservamos.git" . ; \
    else \
      git clone --depth 1 --branch "$RAILWAY_GIT_BRANCH" https://github.com/tpfrtxxtwg-rgb/Reservamos.git . ; \
    fi

RUN npm install && npm rebuild esbuild
RUN npx vite build

# Compile backend to plain JavaScript
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

COPY --from=builder /reservamos/dist ./dist
COPY --from=builder /reservamos/node_modules ./node_modules
COPY --from=builder /reservamos/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server/boot.js"]