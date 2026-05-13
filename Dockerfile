FROM node:20-slim AS builder

# Aggressive cache bust - change this value to force fresh build
ARG CACHE_BUST=4

WORKDIR /reservamos-build

COPY package.json package-lock.json ./
RUN npm install && npm rebuild esbuild

ARG RAILWAY_GIT_COMMIT_SHA
RUN echo "Building commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY drizzle.config.ts ./
COPY components.json ./
COPY api ./api
COPY db ./db
COPY contracts ./contracts
COPY src ./src
COPY public ./public

# Verify src exists before building
RUN ls -la src/main.tsx

RUN ./node_modules/.bin/vite build && \
    ./node_modules/.bin/esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

FROM node:20-slim

WORKDIR /app

COPY --from=builder /reservamos-build/dist ./dist
COPY --from=builder /reservamos-build/node_modules ./node_modules
COPY --from=builder /reservamos-build/package.json ./package.json
COPY --from=builder /reservamos-build/api ./api
COPY --from=builder /reservamos-build/db ./db
COPY --from=builder /reservamos-build/contracts ./contracts
COPY --from=builder /reservamos-build/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /reservamos-build/tsconfig.server.json ./tsconfig.server.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]