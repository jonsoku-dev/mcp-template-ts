import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { toolHandlers, tools } from "./tools/index.js";
import { MCPInitializeOptions } from "./types/index.js";
import { logger } from "./utils/logger.js";
import { MCPServerUtils } from "./utils/mcp-utils.js";

interface SSETransportMap {
  [sessionId: string]: SSEServerTransport;
}

/**
 * SSE 서버 옵션 인터페이스
 */
interface SSEServerOptions {
  name?: string;
  version?: string;
  port?: number;
  debug?: boolean;
}

export class MCPSSEServer {
  private app: express.Application;
  private transports: SSETransportMap = {};
  private httpServer: any;
  private mcpServer: MCPServerUtils;
  private isDebugMode: boolean;

  constructor(options: SSEServerOptions = {}) {
    this.app = express();
    this.isDebugMode = options.debug || false;
    this.mcpServer = new MCPServerUtils(
      options.name || "mcp-sse",
      options.version || "1.0.0",
    );
    this.setupRequestHandlers();
    this.setupRoutes();
  }

  /**
   * 요청 핸들러 설정
   * 도구 목록 조회와 도구 호출 요청을 처리합니다.
   */
  private setupRequestHandlers(): void {
    // 도구 목록 요청 처리
    this.mcpServer.setToolsListHandler(async () => {
      logger.info("[Tools] List available tools");
      return {
        tools,
      };
    });

    // 도구 호출 요청 처리
    this.mcpServer.setToolCallHandler(async (request) => {
      try {
        const toolName = request.params.name;
        const handler = toolHandlers[toolName];

        if (!handler) {
          throw new Error(`Unknown tool: ${toolName}`);
        }

        logger.info(`[Tools] Executing tool: ${toolName}`);
        const result = await handler(request.params.arguments);
        logger.info(`[Tools] Tool execution completed: ${toolName}`);

        return result;
      } catch (error) {
        logger.error(`[Tools] Tool execution failed:`, error);
        throw error;
      }
    });
  }

  private setupRoutes() {
    // 헬스체크 엔드포인트
    this.app.get("/health", (_: Request, res: Response) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // SSE 연결 엔드포인트
    this.app.get("/sse", async (req: Request, res: Response) => {
      try {
        // Bearer 토큰 확인
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7); // 'Bearer ' 이후의 문자열
          logger.info(`[SSE] 수신된 Bearer 토큰: ${token}`);
        } else {
          logger.warn("[SSE] Bearer 토큰이 없습니다");
        }

        // SSE transport 생성
        const transport = new SSEServerTransport("/messages", res);

        // transport 저장
        this.transports[transport.sessionId] = transport;

        // 연결 종료 시 정리
        res.on("close", () => {
          delete this.transports[transport.sessionId];
          transport.close();
          logger.info(`[SSE] 클라이언트 연결 종료: ${transport.sessionId}`);
        });

        // 서버에 transport 연결
        await this.mcpServer.getServer().connect(transport);
        logger.info(`[SSE] 클라이언트 연결됨: ${transport.sessionId}`);
      } catch (error) {
        logger.error(`[SSE] 연결 실패: ${error}`);
        res.status(500).json({ error: "SSE 연결 실패" });
      }
    });

    // 메시지 처리 엔드포인트
    this.app.post("/messages", async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        res.status(400).json({ error: "세션 ID가 필요합니다" });
      }

      const transport = this.transports[sessionId];
      if (!transport) {
        res.status(404).json({ error: "유효하지 않은 세션 ID" });
      }

      try {
        await transport.handlePostMessage(req, res);
      } catch (error) {
        logger.error(`[SSE] 메시지 처리 실패: ${error}`);
        res.status(500).json({ error: "메시지 처리 실패" });
      }
    });
  }

  public async initialize(
    initOptions: MCPInitializeOptions = {},
  ): Promise<void> {
    await this.mcpServer.initialize(initOptions);
    logger.info("[SSE] 서버 초기화됨");
  }

  public async start(port = 3000): Promise<void> {
    if (!this.mcpServer.isServerInitialized()) {
      await this.initialize();
    }

    if (this.isDebugMode) {
      logger.info("[SSE] 디버그 모드 활성화됨");
    }

    return new Promise((resolve) => {
      this.httpServer = this.app.listen(port, () => {
        logger.info(`[SSE] HTTP 서버가 시작되었습니다 (포트: ${port})`);
        resolve();
      });
    });
  }

  public async shutdown(): Promise<void> {
    // HTTP 서버 종료
    if (this.httpServer) {
      await new Promise((resolve) => this.httpServer.close(resolve));
    }

    // 모든 transport 연결 종료
    await Promise.all(
      Object.values(this.transports).map((transport) => transport.close()),
    );
    this.transports = {};

    logger.info("[SSE] 서버가 종료되었습니다");
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
  const server = new MCPSSEServer({
    debug: process.argv.includes("--debug"),
    port: parseInt(process.env.PORT || "3000", 10),
    name: process.env.SERVER_NAME || "mcp-sse",
    version: process.env.SERVER_VERSION || "1.0.0",
  });

  // 종료 시그널 처리
  process.on("SIGINT", async () => {
    await server.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.shutdown();
    process.exit(0);
  });

  // 서버 시작
  server.start().catch((error) => {
    logger.error(`[Error] 서버 실행 실패: ${error}`);
    process.exit(1);
  });
}
