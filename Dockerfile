FROM node:22-slim

WORKDIR /app

RUN echo "deploy-2025-06-19-22-00-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5

COPY . .

RUN node fix-json.cjs

# Declare build args right before the Vite build step
# to minimize exposure in Docker image layers
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_APP_ID

RUN echo "=== VITE BUILD ===" && \
    echo "Stripe PK present: $([ -n \"$VITE_STRIPE_PUBLISHABLE_KEY\" ] && echo YES || echo NO)" && \
    rm -rf dist .vite && \
    NODE_ENV=production npx vite build --mode production --emptyOutDir && \
    cp -r public/* dist/public/ 2>/dev/null || true && \
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