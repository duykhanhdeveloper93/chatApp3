# Stage 1: Build NestJS (compile TS → JS, tạo dist/)
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci  # sạch hơn npm install, dùng lockfile

# Copy source và build
COPY . .
RUN npm run build  # Tạo dist/ ở đây (giả sử script "build": "nest build" trong package.json)

# Stage 2: Production runtime (chạy từ dist/)
FROM node:22-alpine

WORKDIR /app

# Copy chỉ package + production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy dist từ builder
COPY --from=builder /app/dist ./dist

# Optional: copy các file cần khác nếu có (ví dụ config, migrations)
COPY --from=builder /app/node_modules ./node_modules  

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]  # hoặc ["npm", "run", "start:prod"] nếu script có