FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /build-reservamos

ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH=main

RUN git clone --depth 1 --branch ${RAILWAY_GIT_BRANCH} https://github.com/tpfrtxxtwg-rgb/Reservamos.git . && \
    echo "Cloned commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

RUN npm install && npm rebuild esbuild
RUN npx vite build

# Compile backend TypeScript to JavaScript
RUN npx tsc --project tsconfig.build.json

FROM node:22-slim

WORKDIR /app

# Copy compiled backend + frontend + node_modules
COPY --from=builder /build-reservamos/dist ./dist
COPY --from=builder /build-reservamos/node_modules ./node_modules
COPY --from=builder /build-reservamos/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server/api/boot.js"]
