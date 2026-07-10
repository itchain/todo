# TaskFlow 개선 계획 문서

작성일: 2026-07-09  
대상 저장소: `todo`

## 목적

현재 코드베이스 분석 결과를 바탕으로, 유지보수성/일관성/운영 안정성을 단계적으로 개선하기 위한 실행 계획을 기록한다.

## 개선 항목

### 1) 문서-실제 동작 정합성 맞추기 (우선순위: 높음)
- `README.md`를 API + PostgreSQL 기반 실제 구조에 맞게 수정
- 실행/접속 포트/환경변수를 `docker-compose.yml`, `frontend/src/App.tsx` 기준으로 정렬
- 완료 기준: 신규 사용자가 README만 보고 `docker-compose up -d --build`로 정상 실행 가능

### 2) i18n 누락/하드코딩 제거 (우선순위: 높음)
- `frontend/src/App.tsx` 내 하드코딩 문자열(예: "취소")을 번역 키로 이동
- `frontend/src/locales/en/translation.json`, `frontend/src/locales/ko/translation.json` 동기화
- 완료 기준: UI 하드코딩 텍스트 0건, 언어 전환 시 전 화면 일관 동작

### 3) 프론트엔드 컴포넌트 분리 (우선순위: 높음)
- `frontend/src/App.tsx`를 `components`, `hooks`, `types` 구조로 분리
- 후보 분리 단위: Dashboard, FilterBar, TodoItem, CategoryPanel, EditModal
- 완료 기준: `App.tsx`를 상태 오케스트레이션 중심으로 축소(목표 200~300라인)

### 4) API 레이어 분리 및 에러 처리 통일 (우선순위: 중간)
- 프론트의 직접 `fetch` 호출을 `frontend/src/api/*`로 분리
- 공통 에러 핸들러/응답 파서/알림 규칙 통일
- 완료 기준: 중복 API 호출 로직 제거, 실패 메시지 처리 일관화

### 5) 백엔드 구조화 (우선순위: 높음)
- `backend/src/server.js`를 `routes`, `controllers`, `db`, `middleware`로 분리
- 주요 엔드포인트에 입력 유효성 검증(필수값/타입) 추가
- 완료 기준: 단일 대형 파일 의존 해소, 검증 누락 케이스 감소

### 6) 운영 안전성 보강 (우선순위: 중간)
- CORS 허용 도메인 제한, 기본 보안 헤더, rate limiting 적용
- 개발/운영 환경별 로깅 분리 (`i18n debug`는 개발 전용)
- 완료 기준: 기본 보안 설정 반영 및 운영 로그 노이즈 감소

### 7) 테스트/검증 루틴 추가 (우선순위: 중간)
- 백엔드 API 스모크 테스트 + 프론트 최소 컴포넌트 테스트 추가
- CI에서 `build + lint + test` 자동 실행
- 완료 기준: PR 단위 자동 품질 게이트 구성

### 8) 도커/배포 점검 (우선순위: 낮음)
- 이미지 빌드 캐시 최적화
- 필요 시 헬스체크 추가
- `.env.example` 제공
- 완료 기준: 재빌드 시간 단축 및 환경 변수 설정 재현성 확보

## 권장 실행 순서

`1 -> 2 -> 3 -> 5 -> 4 -> 6 -> 7 -> 8`

## 비고

- 본 문서는 초기 분석 기준의 개선 로드맵이다.
- 실제 실행 시 각 단계 완료 후 리스크/우선순위를 재평가해 다음 단계를 조정한다.
