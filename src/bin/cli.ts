#!/usr/bin/env node

import { Command } from "commander";
import { MCPServer } from "../server.js";
import { logger } from "../utils/logger.js";
import {
  MCPInitializeOptions,
  MCPMiddleware,
  MCPRequest,
  MCPToolResponse,
} from "../types/index.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 커스텀 핸들러 예제
const customHandlers = {
  "custom/hello": async (): Promise<MCPToolResponse> => {
    return { content: [{ type: "text", text: "안녕하세요!" }] };
  },
};

program
  .command("init")
  .description("새로운 MCP 서버 프로젝트 생성")
  .argument("<project-name>", "프로젝트 이름")
  .option("-d, --debug", "디버그 모드로 생성")
  .action(async (projectName, options) => {
    try {
      const targetDir = path.resolve(process.cwd(), projectName);

      // 프로젝트 디렉토리 생성
      await fs.mkdir(targetDir, { recursive: true });

      // package.json 템플릿
      const packageJson = {
        name: projectName,
        version: "1.0.0",
        description: "MCP Server Project",
        type: "module",
        scripts: {
          build: "tsc",
          start: "node dist/bin/cli.js start",
          dev: "ts-node --esm src/bin/cli.ts start",
          debug: "ts-node --esm src/bin/cli.ts start -d",
          inspect: "ts-node --esm src/bin/cli.ts inspect",
        },
        dependencies: {
          "@modelcontextprotocol/sdk": "^0.1.0",
          commander: "^11.1.0",
          winston: "^3.11.0",
        },
        devDependencies: {
          "@types/node": "^20.11.0",
          "ts-node": "^10.9.2",
          typescript: "^5.3.3",
        },
      };

      // 소스 디렉토리 생성
      const srcDir = path.join(targetDir, "src");
      await fs.mkdir(srcDir, { recursive: true });

      // 템플릿 파일 복사
      const templateDir = path.resolve(__dirname, "../../src");
      await copyDir(templateDir, srcDir);

      // package.json 생성
      await fs.writeFile(
        path.join(targetDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );

      // tsconfig.json 복사
      const tsconfigPath = path.resolve(__dirname, "../../tsconfig.json");
      await fs.copyFile(tsconfigPath, path.join(targetDir, "tsconfig.json"));

      logger.info(`프로젝트가 생성되었습니다: ${targetDir}`);
      logger.info("다음 단계:");
      logger.info(`  cd ${projectName}`);
      logger.info("  npm install");
      logger.info("  npm run dev");
    } catch (error) {
      logger.error(`프로젝트 생성 실패: ${error}`);
      process.exit(1);
    }
  });

// 디렉토리 복사 유틸리티 함수
async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

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

      if (options.customHandlers) {
        initOptions.customHandlers = customHandlers;
      }

      // 서버 초기화
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
        "dist/src/bin/cli.js",
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
