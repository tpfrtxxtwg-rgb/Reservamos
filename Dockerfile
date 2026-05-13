FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /build-reservamos

ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH=main

RUN git clone --depth 1 --branch ${RAILWAY_GIT_BRANCH} https://github.com/tpfrtxxtwg-rgb/Reservamos.git . && \
    echo "Cloned commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

RUN npm install && npm rebuild esbuild
RUN npx vite build

# Compile backend with tsup (bundle to single file with correct .js extensions)
RUN npx tsup api/boot.ts \
    --format esm \
    --outDir dist/server \
    --bundle \
    --platform node \
    --clean \
    --tsconfig tsconfig.server.json

FROM node:22-slim

WORKDIR /app

COPY --from=builder /build-reservamos/dist ./dist
COPY --from=builder /build-reservamos/node_modules ./node_modules
COPY --from=builder /build-reservamos/package.json ./package.json
COPY --from=builder /build-reservamos/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
