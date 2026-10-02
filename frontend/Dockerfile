# ==========================================
# 1. FRONTEND BUILD STAGE
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./

# Install frontend dependencies
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 300000 && \
    npm install --no-audit --no-fund

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ==========================================
# 2. NGINX RUNNER STAGE
# ==========================================
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80