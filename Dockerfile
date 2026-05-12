FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Remove old lock file and install fresh
RUN rm -f package-lock.json && npm install

# Fix binary permissions (Alpine strips exec bits)
RUN chmod +x node_modules/.bin/* 2>/dev/null || true

# Cache bust on every commit
ARG RAILWAY_GIT_COMMIT_SHA
RUN echo "Building commit: ${RAILWAY_GIT_COMMIT_SHA:-unknown}"

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Fix binary permissions
RUN chmod +x node_modules/.bin/* 2>/dev/null || true

COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
