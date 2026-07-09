# O-Agents 지침: TaskFlow 애플리케이션

이 문서는 AI 에이전트 또는 개발자가 TaskFlow 애플리케이션의 구조를 이해하고, 실행하며, 추가 개발을 할 수 있도록 돕는 지침입니다.

## 1. 프로젝트 개요

TaskFlow는 할 일(To-do) 관리를 위한 풀스택 웹 애플리케이션입니다. 주요 기술 스택은 다음과 같습니다.

-   **프론트엔드**: React, Vite, TypeScript, Tailwind CSS
-   **백엔드**: Node.js, Express
-   **데이터베이스**: PostgreSQL
-   **실행 환경**: Docker, Docker Compose

## 2. 실행 방법

이 프로젝트는 Docker Compose를 사용하여 모든 서비스를 한 번에 실행할 수 있도록 구성되어 있습니다.

**요구 사항:**
-   Docker
-   Docker Compose

**실행 명령어:**

프로젝트 루트 디렉토리에서 다음 명령어를 실행하면 모든 서비스(프론트엔드, 백엔드, 데이터베이스)가 빌드되고 백그라운드에서 실행됩니다.

```bash
docker-compose up -d --build
```

**접속 정보:**
-   **프론트엔드 URL**: [http://localhost:5174](http://localhost:5174)
-   **백엔드 API 서버**: `http://localhost:5001`
-   **PostgreSQL 데이터베이스**: `localhost:5432`

## 3. 프로젝트 구조

프로젝트는 두 개의 주요 디렉토리(`frontend`, `backend`)로 분리되어 있습니다.

### 3.1. `frontend`

-   Vite 기반의 React 애플리케이션입니다.
-   **주요 파일**:
    -   `Dockerfile`: 다단계 빌드(multi-stage build)를 사용하여 최종적으로는 정적 파일(`dist`)을 `serve`로 실행하는 경량 이미지를 생성합니다.
    -   `src/App.tsx`: 메인 애플리케이션 컴포넌트입니다.
    -   `src/i18n.ts`: 다국어 지원(i18next) 설정 파일입니다.
    -   `src/locales/`: 영어(en)와 한국어(ko) 번역 JSON 파일이 저장된 디렉토리입니다.

### 3.2. `backend`

-   Node.js와 Express 기반의 API 서버입니다.
-   **주요 파일**:
    -   `Dockerfile`: Node.js 런타임 환경을 구성하고 서버를 실행합니다.
    -   `src/server.js`: Express 서버의 메인 파일로, API 엔드포인트와 데이터베이스 초기화 로직을 포함합니다.

### 3.3. `docker-compose.yml`

-   `db`, `backend`, `frontend` 세 개의 서비스를 정의합니다.
-   각 서비스의 빌드, 포트 매핑, 환경 변수, 의존성 관계를 설정합니다.

## 4. 다국어 지원 (i18n)

-   `i18next`와 `react-i18next` 라이브러리를 사용하여 다국어(영어, 한국어)를 지원합니다.
-   **구현 방식**:
    1.  `frontend/src/i18n.ts`에서 i18next 인스턴스를 초기화하고, 브라우저 언어 감지 및 번역 리소스를 설정합니다.
    2.  `frontend/src/locales/` 디렉토리 내에 언어별(`en`, `ko`) `translation.json` 파일을 두어 UI 텍스트를 관리합니다.
    3.  `App.tsx` 컴포넌트에서 `useTranslation` 훅을 사용하여 텍스트를 렌더링하고, 언어 전환 버튼을 통해 사용자가 언어를 변경할 수 있도록 합니다.

## 5. 주요 작업 히스토리

1.  **초기 설정 및 Docker화**: 프로젝트 구조를 분석하고, `frontend`, `backend`, `db` 서비스를 위한 Docker 환경을 구축했습니다.
2.  **빌드 오류 해결**: 비표준적인 프로젝트 구조(루트 `index.html`, 잘못된 `tsconfig.json` 참조 등)로 인해 발생한 여러 빌드 오류를 해결했습니다. 이를 위해 `index.html`을 `frontend` 디렉토리로 이동하고 `tsconfig.json`을 표준 설정으로 수정하여 프로젝트 구조를 정상화했습니다.
3.  **다국어 지원 추가**: `i18next`를 도입하여 영어와 한국어를 지원하도록 애플리케이션을 리팩토링했습니다.
4.  **원격 저장소 설정**: GitHub에 원격 저장소를 생성하고 모든 코드를 푸시했습니다.
5.  **서브태스크(Sub-task) 기능 추가**:
    -   백엔드(`backend/src/server.js`): `sub_tasks` 테이블을 초기화 로직에 추가하고, 할 일 조회/생성/수정 응답에 `subTasks`를 포함하도록 확장했습니다.
    -   백엔드 API: `GET/POST/PUT/DELETE /api/todos/:todoId/subtasks` 엔드포인트를 추가해 서브태스크 CRUD를 지원합니다.
    -   초기/리셋 샘플 데이터: 서브태스크 샘플 레코드를 함께 삽입하도록 보강했습니다.
    -   프론트엔드(`frontend/src/App.tsx`): `Todo` 타입에 `subTasks`를 포함하고, 서브태스크 추가/완료 토글/삭제 UI 및 핸들러를 구현했습니다.
    -   다국어 리소스(`frontend/src/locales/en/translation.json`, `frontend/src/locales/ko/translation.json`): 서브태스크 UI 및 에러 메시지 번역 키를 추가했습니다.
