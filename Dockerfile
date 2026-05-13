FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /build-reservamos

ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH=main

RUN git clone --depth 1 --branch ${RAILWAY_GIT_BRANCH} https://github.com/tpfrtxxtwg-rgb/Reservamos.git . && \
    echo "Cloned commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

RUN npm install && npm rebuild esbuild
RUN npx vite build

FROM node:20-slim

WORKDIR /app

COPY --from=builder /build-reservamos/api ./api
COPY --from=builder /build-reservamos/db ./db
COPY --from=builder /build-reservamos/contracts ./contracts
COPY --from=builder /build-reservamos/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /build-reservamos/tsconfig.server.json ./tsconfig.server.json
COPY --from=builder /build-reservamos/tsconfig.json ./tsconfig.json
COPY --from=builder /build-reservamos/package.json ./package.json
COPY --from=builder /build-reservamos/node_modules ./node_modules
COPY --from=builder /build-reservamos/dist ./dist
COPY --from=builder /build-reservamos/index.html ./index.html
COPY --from=builder /build-reservamos/vite.config.ts ./vite.config.ts
COPY --from=builder /build-reservamos/src ./src
COPY --from=builder /build-reservamos/components.json ./components.json

RUN npm install tsx --save-dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--import", "tsx/esm", "api/boot.ts"]
