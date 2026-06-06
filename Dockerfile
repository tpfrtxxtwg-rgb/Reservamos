FROM node:22-slim

WORKDIR /app

RUN echo "deploy-2025-06-05-07-00-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5

COPY . .

RUN node -e "
const fs = require('fs');
for (const lang of ['en', 'es', 'pt']) {
    const path = 'src/i18n/' + lang + '.json';
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/<<<<<<< HEAD\\n/g, '');
    content = content.replace(/=======\\n/g, '');
    content = content.replace(/>>>>>>> [0-9a-f]+\\n/g, '');
    content = content.replace(/',/g, ',');
    const data = JSON.parse(content);
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\\n');
    console.log(path + ': FIXED');
}
console.log('All JSON files fixed');
"

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
