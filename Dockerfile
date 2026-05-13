FROM node:22-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json .
RUN npm install && npm rebuild esbuild

# Copy source and build
COPY . .
RUN npx vite build
RUN node build-backend.mjs
RUN ls -la dist/server/api/boot.js

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/server/api/boot.js"]
