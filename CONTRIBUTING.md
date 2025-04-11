# MCP 프로젝트 기여 가이드

MCP 프로젝트에 기여해 주셔서 감사합니다. 이 문서는 프로젝트 기여자를 위한 가이드라인을 제공합니다.

## 기여 프로세스

1. **개발 환경 설정**

   - Node.js 18.x 이상 설치
   - TypeScript 5.x 이상 설치
   - `npm install` 실행하여 의존성 설치
   - `npm run build` 실행하여 프로젝트 빌드
   - `npm test` 실행하여 테스트 수행

2. **코드 작성 규칙**

   - TypeScript strict 모드 사용 필수
   - ESLint 규칙 준수
   - 모든 함수에 JSDoc 주석 작성
   - 단위 테스트 코드 필수 작성
   - 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 형식 준수

3. **Pull Request 프로세스**
   - 기능 브랜치 생성 (feature/기능명 또는 fix/버그명)
   - 작업 완료 후 main 브랜치로 PR 생성
   - PR 템플릿 작성
   - 코드 리뷰 진행
   - CI/CD 파이프라인 통과 확인
   - 승인 후 머지

## 코드 품질 요구사항

### 타입 안전성

```typescript
// 잘못된 예
function process(data: any) {
  return data.value;
}

// 올바른 예
interface DataType {
  value: string;
}

function process(data: DataType): string {
  return data.value;
}
```

### 오류 처리

```typescript
// 잘못된 예
async function fetchData() {
  const response = await api.get("/data");
  return response.data;
}

// 올바른 예
async function fetchData(): Promise<Result<Data, Error>> {
  try {
    const response = await api.get("/data");
    return { success: true, data: response.data };
  } catch (error) {
    logger.error("Data fetch failed:", error);
    return { success: false, error: new Error("Failed to fetch data") };
  }
}
```

### 테스트 작성

```typescript
describe("processData", () => {
  it("should handle valid input correctly", async () => {
    const result = await processData({ input: "test" });
    expect(result.success).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const result = await processData({ input: "" });
    expect(result.success).toBe(false);
  });
});
```

## 보안 고려사항

- 모든 의존성은 보안 감사를 통과해야 함
- 환경 변수를 통한 설정 관리
- 민감한 정보는 절대 코드에 포함하지 않음
- 모든 입력값 검증 필수

## 성능 최적화

- 대용량 데이터 처리 시 스트림 사용
- 메모리 누수 방지
- 비동기 작업의 적절한 관리
- 캐싱 전략 구현

## 문서화

- API 문서 자동 생성 (TypeDoc 사용)
- README 업데이트
- 변경사항 CHANGELOG 관리
- 아키텍처 결정 기록 (ADR) 작성

## 도움이 필요하신가요?

- 이슈 트래커 확인
- 개발자 포럼 방문
- 프로젝트 관리자에게 연락 (mcp-dev@example.com)

이 가이드라인을 준수하면서 프로젝트의 품질과 일관성을 유지할 수 있습니다. 기여해 주셔서 감사합니다!
