FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Use a completely new directory to avoid Railway cache
WORKDIR /reservamos

ARG GITHUB_TOKEN
ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH=main

RUN if [ -n "$GITHUB_TOKEN" ]; then \
      git clone --depth 1 --branch "$RAILWAY_GIT_BRANCH" "https://${GITHUB_TOKEN}@github.com/tpfrtxxtwg-rgb/Reservamos.git" . ; \
    else \
      git clone --depth 1 --branch "$RAILWAY_GIT_BRANCH" https://github.com/tpfrtxxtwg-rgb/Reservamos.git . ; \
    fi

# Verify src/ exists
RUN ls -la src/main.tsx src/

RUN npm install && npm rebuild esbuild

RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY --from=builder /reservamos/dist ./dist
COPY --from=builder /reservamos/node_modules ./node_modules
COPY --from=builder /reservamos/package.json ./package.json
COPY --from=builder /reservamos/api ./api
COPY --from=builder /reservamos/db ./db
COPY --from=builder /reservamos/contracts ./contracts
COPY --from=builder /reservamos/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /reservamos/tsconfig.server.json ./tsconfig.server.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]