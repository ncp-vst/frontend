# 1. Builder Stage: Install deps & build
FROM node:22-alpine AS builder
WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 패키지 설치
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN pnpm run build

# 2. Runner Stage: Run the application
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 실행에 필요한 파일만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["pnpm", "start"]
