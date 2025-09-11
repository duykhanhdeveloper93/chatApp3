# 1. Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# copy package.json + package-lock.json
COPY package*.json ./

# install dependencies
RUN npm install

# copy toàn bộ source code
COPY . .

# build Angular app, ép base href = /
RUN npm run build -- --configuration production --base-href=/

# 2. Serve with Nginx
FROM nginx:alpine

# copy build output từ stage builder sang nginx html folder
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# copy nginx config custom (xử lý SPA routes)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
