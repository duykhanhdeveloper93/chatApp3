# 1. Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy file package trước để cache
COPY package*.json ./
RUN npm install

# Copy toàn bộ source và build
COPY . .
RUN npm run build

# 2. Run stage
FROM node:22-alpine
WORKDIR /app

# Copy dist và package.json từ stage build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Đặt biến môi trường (tuỳ)
ENV NODE_ENV=production

# ⚠️ Chạy migration đúng cách (chỉ khi có file data-source)
CMD ["sh", "-c", "npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts && node dist/main.js"]
CMD ["sh", "-c", "npx typeorm migration:run -d dist/src/data-source.js && node dist/main.js"]

