# 1. Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package trước để cache
COPY package*.json ./
RUN npm install

# Copy source code
COPY tsconfig*.json ./
COPY src ./src

# Build project
RUN npm run build

# 2. Runtime stage
FROM node:22-alpine
WORKDIR /app

# Copy node_modules và dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# copy src để ts-node chạy migration
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Env
ENV NODE_ENV=production

# Chạy migration trước khi start backend
CMD ["sh", "-c", "npx ts-node -r tsconfig-paths/register ./src/data-source.ts && node dist/main.js"]
