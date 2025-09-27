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

# 2. Runner Stage: Run the application + debug용 curl 설치
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runner stage에서도 빌드 시점 ENV 전달 (디버깅용)
ARG API_BASE
ARG CLOVA_BASE
ENV API_BASE=$API_BASE
ENV CLOVA_BASE=$CLOVA_BASE

# curl 설치 (테스트용)
RUN apk add --no-cache curl

# 필요한 파일만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

# Next.js를 0.0.0.0에서 바인딩
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0"]
