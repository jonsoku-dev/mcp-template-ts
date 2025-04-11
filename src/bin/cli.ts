#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import { fileURLToPath } from "url";
import { MCPServer } from "../server.js";
import {
  MCPInitializeOptions,
  MCPMiddleware,
  MCPRequest,
} from "../types/index.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
logger.info(`[CLI] __filename: ${__filename}`);
logger.info(`[CLI] __dirname: ${__dirname}`);

const program = new Command()
  .name("mcp-template-ts")
  .description("MCP(Model Context Protocol) TypeScript 템플릿 CLI")
  .version("1.0.3");

// 로깅 미들웨어 예제
const loggingMiddleware: MCPMiddleware = async (
  request: MCPRequest,
  next: () => Promise<any>,
) => {
  const startTime = Date.now();
  logger.info(`[Middleware] 요청 시작: ${request.toolName}`);
  const result = await next();
  logger.info(`[Middleware] 요청 완료: ${Date.now() - startTime}ms`);
  return result;
};

program
  .command("start")
  .description("MCP 서버 시작")
  .option("-d, --debug", "디버그 모드 활성화")
  .option("--no-middleware", "미들웨어 비활성화")
  .option("--no-custom-handlers", "커스텀 핸들러 비활성화")
  .action(async (options) => {
    try {
      const server = new MCPServer({
        debug: options.debug,
      });

      // 서버 초기화 옵션 설정
      const initOptions: MCPInitializeOptions = {};

      if (options.middleware) {
        initOptions.middleware = [loggingMiddleware];
      }

      await server.initialize(initOptions);

      // 서버 시작
      await server.start();
    } catch (error) {
      logger.error(`[Error] 서버 시작 실패: ${error}`);
      process.exit(1);
    }
  });

program
  .command("inspect")
  .description("MCP 서버 검사")
  .option("-d, --debug", "디버그 모드 활성화")
  .action(async (options) => {
    try {
      const args = [
        "npx",
        "@modelcontextprotocol/inspector",
        "npx",
        "@jonsoku2/mcp-template-ts@latest",
        "start",
      ];
      if (options.debug) {
        args.push("--debug");
      }

      const { spawn } = await import("child_process");
      const inspector = spawn(args[0], args.slice(1), {
        stdio: "inherit",
        shell: true,
      });

      inspector.on("error", (error) => {
        logger.error(`[Error] 검사기 실행 실패: ${error}`);
        process.exit(1);
      });

      inspector.on("exit", (code) => {
        if (code !== 0) {
          logger.error(`[Error] 검사기가 비정상 종료됨 (코드: ${code})`);
          process.exit(code ?? 1);
        }
      });
    } catch (error) {
      logger.error(`[Error] 검사기 실행 실패: ${error}`);
      process.exit(1);
    }
  });

program.parse();
