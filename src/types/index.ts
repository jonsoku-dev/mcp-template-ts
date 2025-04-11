/**
 * MCP 서버의 기본 설정 옵션
 */
export interface MCPServerOptions {
  debug?: boolean;
  logLevel?: string;
}

/**
 * MCP 도구의 기본 응답 형식
 */
export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * MCP 도구의 기본 요청 형식
 */
export interface MCPRequest {
  toolName: string;
  parameters: Record<string, any>;
}

/**
 * 예제 서비스의 기본 옵션
 */
export interface ExampleServiceOptions {
  timeout?: number;
  retryCount?: number;
  debug?: boolean;
}

/**
 * 예제 서비스의 결과 형식
 */
export interface ExampleServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * MCP 도구의 컨텐츠 타입
 */
export interface MCPContent {
  type: "text" | "json" | "binary";
  text?: string;
  data?: any;
  mimeType?: string;
}

/**
 * MCP 도구의 응답 형식
 */
export interface MCPToolResponse {
  content: MCPContent[];
}

/**
 * MCP 미들웨어 함수 타입
 */
export type MCPMiddleware = (
  request: MCPRequest,
  next: () => Promise<any>,
) => Promise<any>;

/**
 * MCP 커스텀 핸들러 타입
 */
export type MCPCustomHandler = (
  request: MCPRequest,
) => Promise<MCPToolResponse>;

/**
 * MCP 서버 초기화 옵션
 */
export interface MCPInitializeOptions {
  /**
   * 커스텀 요청 핸들러
   */
  customHandlers?: Record<string, MCPCustomHandler>;

  /**
   * 미들웨어 함수 배열
   */
  middleware?: MCPMiddleware[];
}
