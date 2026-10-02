# ==========================================
# 1. BUILD STAGE
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
# Wildcard copy prevents build failure if prisma is optional/missing
COPY prisma ./prisma/

# Set network retry flags & install dependencies
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 300000 && \
    npm install --no-audit --no-fund && \
    if [ -d "prisma" ]; then npx prisma generate; fi

COPY . .
RUN npm run build

# ==========================================
# 2. PRODUCTION RUNNER STAGE
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma* ./prisma/

# Copy installed dependencies and dist from build stage (no second npm install)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3333
CMD ["sh", "-c", "if [ -d 'prisma' ]; then npx prisma migrate deploy; fi && node dist/server.js"]