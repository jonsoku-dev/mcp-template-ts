import { ExampleServiceOptions, ExampleServiceResult } from "../types/index.js";
import { logger } from "../utils/logger.js";

/**
 * 예제 서비스 클래스
 */
export class ExampleService {
  private options: ExampleServiceOptions;
  private isDebugMode: boolean;

  constructor(options: ExampleServiceOptions = {}) {
    this.options = {
      timeout: options.timeout || 5000,
      retryCount: options.retryCount || 3,
      debug: options.debug || false,
    };
    this.isDebugMode = this.options.debug || false;
  }

  /**
   * 예제 작업 실행
   */
  public async processData(input: string): Promise<ExampleServiceResult> {
    try {
      logger.info(`Processing data: ${input}`);

      // 디버그 모드일 때 추가 로깅
      if (this.isDebugMode) {
        logger.debug(`Debug info - Options: ${JSON.stringify(this.options)}`);
      }

      // 예제 비동기 처리
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        data: `Processed: ${input} (took 1 second)`,
      };
    } catch (error) {
      logger.error(`Error processing data: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 재시도 로직이 포함된 작업 실행
   */
  public async processWithRetry(input: string): Promise<ExampleServiceResult> {
    let attempts = 0;

    while (attempts < this.options.retryCount!) {
      try {
        const result = await this.processData(input);
        if (result.success) {
          return result;
        }
        attempts++;
        logger.warn(`Attempt ${attempts} failed, retrying...`);
      } catch (error) {
        attempts++;
        logger.error(`Attempt ${attempts} error: ${error}`);
      }

      // 재시도 전 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      success: false,
      error: `Failed after ${attempts} attempts`,
    };
  }
}
