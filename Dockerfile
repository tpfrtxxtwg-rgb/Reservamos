FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG GITHUB_TOKEN
ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH=main

RUN if [ -n "$GITHUB_TOKEN" ]; then \
      git clone --depth 1 --branch "$RAILWAY_GIT_BRANCH" "https://${GITHUB_TOKEN}@github.com/tpfrtxxtwg-rgb/Reservamos.git" . ; \
    else \
      git clone --depth 1 --branch "$RAILWAY_GIT_BRANCH" https://github.com/tpfrtxxtwg-rgb/Reservamos.git . ; \
    fi

RUN npm install && npm rebuild esbuild

RUN npm run build

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