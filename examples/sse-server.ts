#!/usr/bin/env node

import { MCPSSEServer } from "../src/sse.js";
import { logger } from "../src/utils/logger.js";

async function main() {
  try {
    const server = new MCPSSEServer({
      debug: process.argv.includes("--debug"),
    });

    // 서버 초기화
    await server.initialize({
      middleware: [
        // 로깅 미들웨어 예제
        async (request, next) => {
          const startTime = Date.now();
          logger.info(`[Middleware] 요청 시작: ${request.method}`);
          const result = await next();
          logger.info(`[Middleware] 요청 완료: ${Date.now() - startTime}ms`);
          return result;
        },
      ],
    });

    // 서버 시작 (기본 포트: 3000)
    const port = parseInt(process.env.PORT || "3000", 10);
    await server.start(port);

    // 종료 시그널 처리
    process.on("SIGINT", async () => {
      await server.shutdown();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await server.shutdown();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`[Error] 서버 실행 실패: ${error}`);
    process.exit(1);
  }
}

main(); 