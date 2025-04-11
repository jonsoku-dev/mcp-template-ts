# 배포 가이드

이 문서는 MCP 서버의 배포 방법에 대해 설명합니다.

## 목차

- [Docker 배포](#docker-배포)
  - [지원하는 배포 방식](#지원하는-배포-방식)
  - [필요한 환경 변수](#필요한-환경-변수)
  - [배포 실행 방법](#배포-실행-방법)
- [Vercel 배포](#vercel-배포)
  - [환경 설정](#환경-설정)
  - [배포 환경](#배포-환경)
  - [자동 배포](#자동-배포)

## Docker 배포

### 지원하는 배포 방식

1. **Kubernetes**
   - 컨테이너 오케스트레이션
   - 자동 스케일링
   - 무중단 배포
   ```bash
   # 필요한 시크릿
   KUBE_CONFIG=<kubernetes-config>
   KUBE_NAMESPACE=mcp-sse
   ```

2. **AWS ECS**
   - AWS 관리형 컨테이너 서비스
   ```bash
   # 필요한 시크릿
   AWS_ACCESS_KEY_ID=<aws-access-key>
   AWS_SECRET_ACCESS_KEY=<aws-secret-key>
   AWS_REGION=<aws-region>
   ECS_CLUSTER=<cluster-name>
   ECS_SERVICE=<service-name>
   ```

3. **SSH (직접 배포)**
   - 단일 서버 배포
   - Docker 컨테이너 실행
   ```bash
   # 필요한 시크릿
   SSH_HOST=<server-host>
   SSH_USERNAME=<username>
   SSH_KEY=<private-key>
   ```

4. **Heroku**
   - PaaS 플랫폼 배포
   ```bash
   # 필요한 시크릿
   HEROKU_API_KEY=<api-key>
   HEROKU_APP_NAME=<app-name>
   HEROKU_EMAIL=<email>
   ```

### 필요한 환경 변수

모든 배포 방식에 공통적으로 필요한 환경 변수:
```bash
DOCKERHUB_USERNAME=<username>
DOCKERHUB_TOKEN=<token>
```

### 배포 실행 방법

1. **자동 배포**
   - main 브랜치 푸시
   - 태그 푸시 (v*.*.*)
   ```bash
   git push origin main
   # 또는
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **수동 배포**
   - GitHub Actions에서 "Docker Image and Deploy" 워크플로우 실행
   - 배포 타입 선택 (kubernetes/ecs/ssh/heroku)

## Vercel 배포

### 환경 설정

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **프로젝트 설정**
   ```bash
   vercel login
   vercel link  # 프로젝트 연결
   ```

3. **필요한 시크릿**
   ```bash
   VERCEL_TOKEN=<token>
   VERCEL_ORG_ID=<org-id>
   VERCEL_PROJECT_ID=<project-id>
   ```

### 배포 환경

- **Production**: 실 서비스 환경
- **Preview**: PR 검토용 환경
- **Development**: 개발 테스트 환경

### 자동 배포

1. **PR 생성 시**
   - Preview 환경에 자동 배포
   - PR 코멘트에 배포 URL 추가

2. **main 브랜치 푸시 시**
   - Production 환경에 자동 배포

3. **수동 배포**
   - GitHub Actions에서 "Deploy to Vercel" 워크플로우 실행
   - 배포 환경 선택 (production/preview/development)

## 배포 모니터링

모든 배포는 Slack을 통해 결과를 알림 받을 수 있습니다:
```bash
# Slack 웹훅 설정
SLACK_WEBHOOK_URL=<webhook-url>
``` 