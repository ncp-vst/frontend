# 1. Installer Stage: Install dependencies
FROM node:22-alpine AS installer
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 2. Builder Stage: Build the application
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 3. Runner Stage: Run the application with next start
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 필요한 파일만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["pnpm", "start"]
