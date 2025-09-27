# 1. Builder Stage: Install deps & build
FROM node:22-alpine AS builder
WORKDIR /app

# 빌드에 필요한 패키지 설치
RUN apk add --no-cache python3 g++ make

# pnpm 설치
RUN npm install -g pnpm

# 빌드 시점 환경 변수 주입
ARG API_BASE
ARG CLOVA_BASE
ENV API_BASE=$API_BASE
ENV CLOVA_BASE=$CLOVA_BASE

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

# 필요한 파일만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

# pnpm 없이 Next.js 직접 실행
CMD ["node_modules/.bin/next", "start"]
