import { ExampleService } from "../services/exampleService.js";
import { logger } from "../utils/logger.js";

/**
 * Tool definition for process_with_retry
 */
export const processWithRetryTool = {
  name: "process_with_retry",
  description: "Process data with retry mechanism",
  inputSchema: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "Input data to process",
      },
      retryCount: {
        type: "number",
        description: "Number of retry attempts (default: 3)",
      },
      debug: {
        type: "boolean",
        description: "Whether to enable debug mode",
      },
    },
    required: ["input"],
  },
};

/**
 * Implementation of the process_with_retry tool
 *
 * MCP 도구 구현시 주의사항:
 * 1. args는 any 타입으로 받아서 안전하게 처리해야 함
 * 2. 모든 args 접근은 옵셔널 체이닝(?.)을 사용
 * 3. 모든 파라미터는 적절한 기본값을 가져야 함
 * 4. 타입 변환이 필요한 경우 명시적으로 처리 (String, Number, Boolean 등)
 * 5. 필수 파라미터는 반드시 유효성 검사를 수행
 *
 * @param args - Tool arguments (any type)
 * @returns Tool execution result with content array
 */
export async function processWithRetry(args: any) {
  try {
    // 필수 파라미터 검증
    const input = args?.input;
    if (!input || typeof input !== "string") {
      throw new Error("Input parameter is required and must be a string");
    }

    // 선택적 파라미터는 기본값과 함께 안전하게 처리
    const debug = args?.debug === true || process.argv.includes("--debug");
    const retryCount =
      typeof args?.retryCount === "number" ? args.retryCount : 3;

    logger.info(
      `[ProcessWithRetry] Processing data with args: ${JSON.stringify(args)}`,
    );

    // 서비스 인스턴스 생성 - 검증된 파라미터 전달
    const service = new ExampleService({
      debug: debug,
      retryCount: retryCount,
    });

    // 재시도 로직으로 데이터 처리 실행
    const result = await service.processWithRetry(input);

    // 결과 반환 - MCP 표준 형식
    return {
      content: [
        {
          type: "text",
          text: result.success ? result.data : result.error,
        },
      ],
    };
  } catch (error) {
    // 에러 로깅 및 표준 에러 응답
    logger.error(`[ProcessWithRetry] Error: ${error}`);
    return {
      content: [
        {
          type: "text",
          text: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}
