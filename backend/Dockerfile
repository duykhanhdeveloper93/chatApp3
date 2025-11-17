# 1. Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package trước để cache
COPY package*.json ./
RUN npm install

# Copy toàn bộ source
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
# ⚠️ copy src để ts-node migration chạy được
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

# CMD chạy migration từng bảng → migration chung → start backend
CMD ["sh", "-c", "npx ts-node -r tsconfig-paths/register ./src/generate-migration-if-new.ts && npx typeorm migration:run -d dist/data-source.js && node dist/main.js"]
