FROM node:22-slim

WORKDIR /app

# CHANGE THIS TIMESTAMP FOR EVERY DEPLOY
RUN echo "deploy-2025-06-04-18-00-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5

COPY . .

RUN echo "=== VITE BUILD ===" && \
    rm -rf dist .vite && \
    NODE_ENV=production npx vite build --mode production --emptyOutDir && \
    echo "=== VITE DONE ==="

RUN echo "=== VERIFY ===" && \
    ls dist/public/assets/ && \
    ls dist/public/assets/*.js && \
    ls dist/public/assets/*.css && \
    echo "=== VERIFY OK ==="

RUN echo "=== ES BUILD ===" && \
    npx esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist \
    --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);" && \
    echo "=== ES DONE ==="

RUN mkdir -p dist/server/api && cp dist/boot.js dist/server/api/boot.js 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/boot.js"]