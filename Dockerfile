# 1. Builder Stage: Install deps & build
FROM node:22-alpine AS builder
WORKDIR /app

# 빌드에 필요한 패키지 설치
RUN apk add --no-cache python3 g++ make

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

# 런타임 환경 변수는 docker run -e 로 주입 가능
# 예: docker run -d -p 3000:3000 -e API_BASE=http://49.50.130.15:8080 -e CLOVA_BASE=http://49.50.130.15:8000 my-app
EXPOSE 3000

# pnpm 없이 Next.js 직접 실행
CMD ["node_modules/.bin/next", "start"]
