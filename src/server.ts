#!/usr/bin/env node

/**
 * Example MCP server
 * Provides example functionality for MCP server implementation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools, toolHandlers } from "./tools/index.js";
import { logger } from "./utils/logger.js";
import { fileURLToPath } from "url";
import path from "path";
import { MCPInitializeOptions, MCPMiddleware } from "./types/index.js";

/**
 * 현재 파일의 경로를 가져옵니다.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 서버 환경 설정 인터페이스
 */
interface ServerConfig {
  port?: number;
  host?: string;
  apiKey?: string;
  logLevel?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * 서버 옵션 인터페이스
 */
interface ServerOptions {
  debug?: boolean;
  config?: ServerConfig;
}

/**
 * MCP 서버 클래스
 * MCP 서버의 모든 기능을 관리하는 메인 클래스입니다.
 */
export class MCPServer {
  private server: Server;
  private transport: StdioServerTransport | null = null;
  private isDebugMode: boolean;
  private config: ServerConfig;
  private isInitialized: boolean = false;
  private middlewares: MCPMiddleware[] = [];

  constructor(options: ServerOptions = {}) {
    this.isDebugMode = options.debug || false;
    this.config = this.loadConfig(options.config);

    this.server = new Server(
      {
        name: "example-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * 환경 변수와 설정을 로드합니다.
   * 환경 변수가 우선순위가 가장 높고, 그 다음이 옵션으로 전달된 설정입니다.
   */
  private loadConfig(configOptions: ServerConfig = {}): ServerConfig {
    const config: ServerConfig = {
      port: parseInt(process.env.MCP_PORT || "3000", 10),
      host: process.env.MCP_HOST || "localhost",
      apiKey: process.env.MCP_API_KEY,
      logLevel: process.env.MCP_LOG_LEVEL || "info",
      maxRetries: parseInt(process.env.MCP_MAX_RETRIES || "3", 10),
      timeout: parseInt(process.env.MCP_TIMEOUT || "5000", 10),
      ...configOptions, // 옵션으로 전달된 설정이 환경 변수보다 우선순위가 낮음
    };

    // 필수 환경 변수 검증
    if (this.isDebugMode && !config.apiKey) {
      logger.warn("[Config] API 키가 설정되지 않았습니다");
    }

    // 설정 로그 출력 (민감한 정보는 마스킹)
    logger.info("[Config] 서버 설정 로드됨:", {
      ...config,
      apiKey: config.apiKey ? "****" : undefined,
    });

    return config;
  }

  /**
   * 현재 서버 설정을 반환합니다.
   */
  public getConfig(): Readonly<ServerConfig> {
    return { ...this.config }; // 설정 객체의 복사본을 반환하여 직접 수정 방지
  }

  /**
   * 특정 설정 값을 업데이트합니다.
   */
  public updateConfig(updates: Partial<ServerConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
    logger.info("[Config] 서버 설정이 업데이트되었습니다:", {
      ...updates,
      apiKey: updates.apiKey ? "****" : undefined,
    });
  }

  /**
   * 에러 핸들링 설정
   * 서버 에러와 프로세스 종료를 처리합니다.
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.shutdown();
      process.exit(0);
    });

    // 추가 프로세스 이벤트 핸들링
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("[Process] 처리되지 않은 Promise 거부:", reason);
    });

    process.on("uncaughtException", (error) => {
      logger.error("[Process] 처리되지 않은 예외:", error);
      this.shutdown().finally(() => process.exit(1));
    });
  }

  /**
   * 요청 핸들러 설정
   * 도구 목록 조회와 도구 호출 요청을 처리합니다.
   */
  private setupRequestHandlers(): void {
    // 사용 가능한 도구 목록 요청 처리
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info("[Tools] List available tools");
      return {
        tools,
      };
    });
    // 도구 호출 요청 처리
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, extra) => {
        const toolName = request.params.name;
        const handler = toolHandlers[toolName];

        if (!handler) {
          throw new Error(`Unknown tool: ${toolName}`);
        }

        // 요청 타임아웃 처리
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Tool execution timed out after ${this.config.timeout}ms`
              )
            );
          }, this.config.timeout);
        });

        try {
          const result = await Promise.race([
            handler(request.params.arguments),
            timeoutPromise,
          ]);
          return result;
        } catch (error) {
          logger.error(`[Tools] 도구 실행 실패 (${toolName}):`, error);
          throw error;
        }
      }
    );
  }

  /**
   * 미들웨어를 적용하는 함수
   */
  private applyMiddleware(handler: Function): Function {
    return async (request: any, ...args: any[]) => {
      let index = 0;
      
      const next = async (): Promise<any> => {
        if (index < this.middlewares.length) {
          const middleware = this.middlewares[index++];
          return await middleware(request, next);
        }
        return handler(request, ...args);
      };

      return next();
    };
  }

  /**
   * 서버를 초기화합니다.
   * 에러 핸들링과 요청 핸들러를 설정합니다.
   */
  public async initialize(initOptions: MCPInitializeOptions = {}): Promise<void> {
    if (this.isInitialized) {
      logger.warn("[Initialize] 서버가 이미 초기화되어 있습니다");
      return;
    }

    try {
      logger.info("[Initialize] 서버 초기화 중...");

      // 기본 에러 핸들링과 요청 핸들러 설정
      this.setupErrorHandling();
      this.setupRequestHandlers();

      // 커스텀 핸들러 등록
      if (initOptions.customHandlers) {
        Object.entries(initOptions.customHandlers).forEach(([name, handler]) => {
          logger.info(`[Initialize] 커스텀 핸들러 등록: ${name}`);
          const wrappedHandler = this.applyMiddleware(handler);
          this.server.setRequestHandler(name as any, wrappedHandler as any);
        });
      }

      // 미들웨어 등록
      if (initOptions.middleware) {
        this.middlewares.push(...initOptions.middleware);
        logger.info(`[Initialize] ${initOptions.middleware.length}개의 미들웨어가 등록되었습니다`);
      }

      this.isInitialized = true;
      logger.info("[Initialize] 서버 초기화가 완료되었습니다");
    } catch (error) {
      logger.error(`[Initialize] 서버 초기화 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 서버 초기화 및 시작
   * 서버를 초기화하고 transport에 연결합니다.
   */
  public async start(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info("[Setup] MCP 서버 시작 중...");

      if (this.isDebugMode) {
        logger.info("[Setup] 디버그 모드 활성화됨");
      }

      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      logger.info(
        `[Setup] 서버가 시작되었습니다 (${this.config.host}:${this.config.port})`
      );
    } catch (error) {
      logger.error(`[Error] 서버 시작 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 서버 종료
   * 열려있는 연결을 정리하고 서버를 종료합니다.
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.transport) {
        await this.server.close();
        this.transport = null;
        logger.info("[Shutdown] 서버가 종료되었습니다");
      }
    } catch (error) {
      logger.error(`[Error] 서버 종료 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 디버그 모드 상태 조회
   */
  public isDebug(): boolean {
    return this.isDebugMode;
  }
}

// 스크립트로 직접 실행된 경우에만 서버 시작
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MCPServer({
    debug: process.argv.includes("--debug"),
    config: {
      // 기본 설정을 환경 변수로 오버라이드 가능
      port: parseInt(process.env.PORT || "3000", 10),
      host: process.env.HOST || "localhost",
    },
  });

  server.start().catch((error) => {
    logger.error(`[Error] 서버 실행 실패: ${error}`);
    process.exit(1);
  });
}
