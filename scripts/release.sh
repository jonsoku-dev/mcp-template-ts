#!/bin/bash

# 스크립트 실패 시 즉시 종료
set -e

# 현재 브랜치가 main인지 확인
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Error: Must be on main branch to release"
  exit 1
fi

# 변경사항이 있는지 확인
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory is not clean"
  exit 1
fi

# package-lock.json 백업
if [ -f "package-lock.json" ]; then
  cp package-lock.json package-lock.json.backup
fi

# 현재 버전 가져오기
current_version=$(node -p "require('./package.json').version")

# 릴리즈 타입 선택
echo "Current version: $current_version"
echo "Select release type:"
echo "1) patch (버그 수정)"
echo "2) minor (새로운 기능)"
echo "3) major (주요 변경)"
echo "4) custom (직접 입력)"
read -p "Enter choice (1-4): " choice

case $choice in
  1) release_type="patch";;
  2) release_type="minor";;
  3) release_type="major";;
  4)
    read -p "Enter version (x.x.x): " custom_version
    release_type="custom"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

# 버전 업데이트
if [ "$release_type" = "custom" ]; then
  npm version "$custom_version" --no-git-tag-version
else
  npm version "$release_type" --no-git-tag-version
fi

# 새 버전 가져오기
new_version=$(node -p "require('./package.json').version")

# 변경사항 커밋
git add package.json
git commit -m "chore(release): v$new_version 🎉"

# 태그 생성
git tag -a "v$new_version" -m "Release v$new_version 🎉"

# 빌드
npm run build

# GitHub에 푸시
git push origin main
git push origin "v$new_version"

# npm 배포
npm publish

# 배포 후 정리
echo "Cleaning up after release..."

# package-lock.json 복원
if [ -f "package-lock.json.backup" ]; then
  mv package-lock.json.backup package-lock.json
fi

# OS 생성 파일 정리
find . -type f -name ".DS_Store" -delete
find . -type f -name ".DS_Store?" -delete
find . -type f -name "._*" -delete
find . -type f -name ".Spotlight-V100" -delete
find . -type f -name ".Trashes" -delete
find . -type f -name "ehthumbs.db" -delete
find . -type f -name "Thumbs.db" -delete

# git clean으로 불필요한 파일 정리
git clean -fd

echo "🎉 Successfully released version $new_version!" 