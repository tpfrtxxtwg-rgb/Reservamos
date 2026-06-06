FROM node:22-slim

WORKDIR /app

RUN echo "deploy-2025-06-05-04-00-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5

COPY . .

RUN echo "=== FIXING JSON ===" && \
    python3 -c "
import json, re
for lang in ['en', 'es', 'pt']:
    path = f'src/i18n/{lang}.json'
    with open(path, 'r') as f:
        content = f.read()
    content = re.sub(r'<<<<<<< HEAD\n', '', content)
    content = re.sub(r'=======\n', '', content)
    content = re.sub(r'>>>>>>> [0-9a-f]+\n', '', content)
    content = re.sub(r',,', ',', content)
    data = json.loads(content)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'{path}: FIXED')
print('All JSON files fixed')
" && \
    echo "=== JSON FIXED ==="

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
