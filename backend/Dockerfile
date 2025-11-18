# 1. Build stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# 2. Runtime stage
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

CMD ["sh", "-c", "npx ts-node -r tsconfig-paths/register ./src/generate-migration.ts && npx typeorm migration:run -d dist/data-source.js && node dist/main.js"]
