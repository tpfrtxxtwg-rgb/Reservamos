FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install && npm rebuild esbuild

ARG RAILWAY_GIT_COMMIT_SHA
RUN echo "Building commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

COPY . .

RUN ./node_modules/.bin/vite build && \
    ./node_modules/.bin/esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"

FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]