# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY public/ ./public/
COPY src/ ./src/
COPY .env ./

RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=builder /build/build /usr/share/nginx/html

# Copy nginx config
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri /index.html; \
    } \
    location /api/ { \
        proxy_pass http://node-a:5000; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
