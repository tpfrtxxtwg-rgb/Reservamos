FROM node:22-slim

WORKDIR /app

RUN echo "deploy-2025-06-05-06-00-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5

COPY . .

RUN echo "=== FIXING JSON ===" && \
    for f in src/i18n/en.json src/i18n/es.json src/i18n/pt.json; do \
        sed -i '/<<<<<<< HEAD/d' "$f" && \
        sed -i '/=======/d' "$f" && \
        sed -i '/>>>>>>>/d' "$f" && \
        sed -i 's/\",,/\",/g' "$f" && \
        echo "$f: cleaned"; \
    done && \
    echo "=== JSON CLEANED ==="

RUN echo "=== VITE BUILD ===" && \
    rm -rf dist .vite && \
    NODE_ENV=production npx vite build --mode production --emptyOutDir && \
    echo "=== VITE DONE ===" && \
    ls -la dist/public/ && \
    ls dist/public/assets/*.js && \
    ls dist/public/assets/*.css

RUN echo "=== ES BUILD ===" && \
    npx esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist \
    --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);" && \
    echo "=== ES DONE ==="

RUN mkdir -p dist/server/api && cp dist/boot.js dist/server/api/boot.js 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/boot.js"]
