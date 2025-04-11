# 기본 이미지로 Node.js v22.13.1 사용
FROM node:22.13.1-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY tsconfig*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY src ./src

# TypeScript 컴파일
RUN npm install -g typescript
RUN tsc

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE $PORT

# 헬스체크를 위한 curl 설치
RUN apk add --no-cache curl

# 헬스체크 스크립트 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# 실행 명령
CMD ["node", "--es-module-specifier-resolution=node", "dist/sse.js"] 