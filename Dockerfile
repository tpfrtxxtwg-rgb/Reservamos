FROM node:22-slim

WORKDIR /app

RUN echo "deploy-2025-06-12-10-00-00" > /tmp/cache-bust

COPY package.json ./
RUN npm install 2>&1 | tail -5

COPY . .

RUN node fix-json.cjs

RUN echo "=== VITE BUILD ===" && \
    rm -rf dist .vite && \
    NODE_ENV=production npx vite build --mode production --emptyOutDir && \
    echo "=== COPY PUBLIC FILES ===" && \
    cp -r public/* dist/public/ 2>/dev/null || true && \
    echo "=== FIX UNICODE ===" && \
    node -e "const fs=require('fs'),p='./dist/public/assets';fs.readdirSync(p).filter(f=>f.endsWith('.js')).forEach(f=>{const fp=p+'/'+f;let c=fs.readFileSync(fp,'utf8'),o=c;c=c.replace(/\\\\u([0-9a-fA-F]{4})/g,(_,h)=>String.fromCharCode(parseInt(h,16)));if(c!==o){fs.writeFileSync(fp,c,'utf8');console.log('[fix-unicode] Fixed '+((o.match(/\\\\u[0-9a-fA-F]{4}/g)||[]).length)+' escapes in '+f)}})" && \
    echo "=== VITE DONE ===" && \
    ls -la dist/public/ && \
    ls dist/public/*.jpg 2>/dev/null && \
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
