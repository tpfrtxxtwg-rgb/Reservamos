FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json .
RUN npm install && npm rebuild esbuild

# Copy source code
COPY . .

# Build frontend
RUN npx vite build

# Build backend: transpile TypeScript to JavaScript
RUN node build-backend.mjs

# Verify backend output
RUN ls -la dist/server/api/boot.js

FROM node:22-slim

WORKDIR /app

# Copy compiled backend + frontend + node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server/api/boot.js"]
