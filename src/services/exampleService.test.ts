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

    it("실패 후 재시도를 수행해야 합니다", async () => {
      // 원본 processData 메소드를 저장
      const originalProcessData = service.processData;
      let attempts = 0;

      // processData를 모의 구현으로 대체
      service.processData = jest
        .fn()
        .mockImplementation(async (input: string) => {
          attempts++;
          if (attempts === 1) {
            return { success: false, error: "첫 시도 실패" };
          }
          return originalProcessData.call(service, input);
        });

      const result = await service.processWithRetry("테스트 입력");

      expect(result.success).toBe(true);
      expect(service.processData).toHaveBeenCalledTimes(2);
    });
  });
});
