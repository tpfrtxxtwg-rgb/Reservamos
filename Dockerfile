FROM node:22-slim

WORKDIR /app

COPY package.json .
RUN npm install && npm rebuild esbuild

COPY . .
RUN npx vite build && node build-backend.mjs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server/api/boot.js"]
