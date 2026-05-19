# Stage 1: Build React SPA
FROM node:20-alpine AS build-stage
WORKDIR /app

# Giới hạn RAM cho Node để tránh OOM trên server nhỏ (t2.micro = 1GB)
ENV NODE_OPTIONS="--max-old-space-size=512"

COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
