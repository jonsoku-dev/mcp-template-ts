import { beforeEach, describe, expect, it } from "@jest/globals";
import { ExampleService } from "./exampleService.js";

describe("ExampleService", () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService({ debug: true });
  });

  describe("processData", () => {
    it("성공적으로 데이터를 처리해야 합니다", async () => {
      const result = await service.processData("테스트 입력");

      expect(result.success).toBe(true);
      expect(result.data).toBe("Processed: 테스트 입력 (took 1 second)");
    });
  });

  describe("processWithRetry", () => {
    it("첫 시도에 성공하면 결과를 반환해야 합니다", async () => {
      const result = await service.processWithRetry("테스트 입력");

      expect(result.success).toBe(true);
      expect(result.data).toBe("Processed: 테스트 입력 (took 1 second)");
    });
  });
});
