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
RUN npm install -g tsx
RUN npx vite build

FROM node:20-slim

WORKDIR /reservamos-runtime

COPY --from=builder /reservamos/ .
COPY --from=builder /usr/local/lib/node_modules/tsx /usr/local/lib/node_modules/tsx

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["tsx", "api/boot.ts"]