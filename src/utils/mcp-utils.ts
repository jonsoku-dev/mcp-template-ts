import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { MCPInitializeOptions } from "../types/index.js";
import { logger } from "./logger.js";

export class MCPServerUtils {
  private server: Server;
  private isInitialized = false;

  constructor(name: string, version: string) {
    this.server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
  }

  public async initialize(
    initOptions: MCPInitializeOptions = {},
  ): Promise<void> {
    if (this.isInitialized) {
      logger.warn("[Initialize] 서버가 이미 초기화되어 있습니다");
      return;
    }

    try {
      logger.info("[Initialize] 서버 초기화 중...");

      // 미들웨어 등록
      if (initOptions.middleware) {
        logger.info(
          `[Initialize] ${initOptions.middleware.length}개의 미들웨어가 등록되었습니다`,
        );
      }

      this.isInitialized = true;
      logger.info("[Initialize] 서버 초기화가 완료되었습니다");
    } catch (error) {
      logger.error(`[Initialize] 서버 초기화 실패: ${error}`);
      throw error;
    }
  }

  public getServer(): Server {
    return this.server;
  }

  public isServerInitialized(): boolean {
    return this.isInitialized;
  }

  public setToolsListHandler(
    handler: (
      request: ListToolsRequest,
      extra: RequestHandlerExtra,
    ) => Promise<any>,
  ): void {
    this.server.setRequestHandler(ListToolsRequestSchema, handler);
  }

  public setToolCallHandler(
    handler: (
      request: CallToolRequest,
      extra: RequestHandlerExtra,
    ) => Promise<any>,
  ): void {
    this.server.setRequestHandler(CallToolRequestSchema, handler);
  }
}
