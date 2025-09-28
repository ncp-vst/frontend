# 🍲 야무진 레시피: 식비 절약 플랫폼 - 프론트엔드

**NIPA-NCP AI·SaaS 개발 부트캠프 최종 프로젝트 (Frontend Repository)**

> 이 레포지토리는 "야무진 레시피" 서비스의 프론트엔드 코드입니다. Next.js와 TypeScript를 기반으로 사용자에게 직관적이고 반응성 높은 웹 경험을 제공하는 것을 목표로 합니다.

---

## 🌟 주요 기능 및 구현

이 프로젝트는 사용자의 식단 관리를 돕고 AI를 통해 요리 경험을 풍부하게 만드는 다양한 기능들을 UI로 구현했습니다.

- **AI 레시피 추천 인터페이스**
  - 보유 재료나 원하는 메뉴를 텍스트로 입력하면, AI가 추천해주는 레시피를 실시간으로 확인할 수 있는 UI를 제공합니다.

- **드래그 앤 드롭 기반 식단 플래너 (`/mealplan`)**
  - 캘린더 UI 위에서 추천받은 레시피나 직접 검색한 메뉴를 드래그 앤 드롭으로 손쉽게 배치하여 주간 식단을 구성할 수 있습니다.

- **컴포넌트 기반의 재사용 가능한 UI 설계**
  - 헤더, 푸터, 사이드바 메뉴 등 공통 UI를 모듈화하여 일관된 디자인을 유지하고 개발 효율성을 높였습니다. (`/src/components`)
  - `SectionCard`, `TodayMeal`, `LeftoverList` 등 기능별 컴포넌트를 분리하여 체계적으로 관리합니다.

- **전역 상태 관리를 통한 사용자 경험 최적화**
  - `Zustand`를 사용하여 사용자 로그인 정보(Token), 프로필 등 전역 상태를 관리함으로써 여러 페이지에 걸쳐 일관되고 끊김 없는 사용자 경험을 제공합니다. (`/src/stores`)

---

## 🛠️ 사용된 핵심 기술

- **Framework**: **Next.js 14** (App Router 기반)
- **Language**: **TypeScript**
- **State Management**: **Zustand**
- **Styling**: **Tailwind CSS**, PostCSS, CSS Modules (`globals.css`)
- **Package Manager**: **pnpm**
- **Linting/Formatting**: ESLint, Prettier (설정 파일 기반)

---

## 📂 프로젝트 구조

`src` 디렉토리는 기능 중심으로 체계적으로 구성되어 있습니다.

```
/src
├── app/          # Next.js App Router 기반의 페이지 및 라우팅
│   ├── auth/       # 로그인/회원가입 페이지
│   ├── mealplan/   # 식단 계획 페이지
│   ├── recipes/    # 레시피 검색 페이지
│   └── layout.tsx  # 공통 레이아웃
│
├── components/   # 재사용 가능한 UI 컴포넌트
│   ├── navigation/ # 사이드바 등 네비게이션 컴포넌트
│   ├── layouts/    # 그리드, 데스크탑 등 레이아웃 컴포넌트
│   └── *.tsx       # 원자 단위의 공용 컴포넌트
│
└── stores/       # Zustand를 사용한 전역 상태 관리
    ├── tokenStore.ts
    └── userStore.ts
```

---

## 🚀 로컬 환경에서 실행하기

### 1. 사전 준비

- [Node.js](https://nodejs.org/ko) (v18 이상 권장)
- [pnpm](https://pnpm.io/ko/installation) 설치

### 2. 프로젝트 클론 및 의존성 설치

```bash
# 이 레포지토리를 클론합니다.
git clone <repository-url>
cd frontend

# pnpm을 사용하여 의존성을 설치합니다.
pnpm install
```

### 3. 환경 변수 설정

프로젝트가 정상적으로 동작하려면 백엔드 API 서버의 주소를 알려주어야 합니다. 프로젝트 루트에 `.env.local` 파일을 생성하고 아래와 같이 내용을 작성하세요.

```.env.local
# 실행 중인 백엔드 API 서버의 주소를 입력합니다.
API_BASE=http://localhost:8080

# CLOVA AI API를 호출하기 위한 프록시 경로를 입력합니다.
# (백엔드를 통해 호출하는 경우 백엔드 서버 주소를 사용합니다.)
CLOVA_BASE=http://localhost:8080
```

**참고**: `next.config.ts`의 `rewrites` 설정은 개발 환경에서 발생하는 CORS 오류를 우회하기 위해 `/api/:path*` 요청을 `API_BASE`로, `/api/clova/:path*` 요청을 `CLOVA_BASE`로 전달하는 역할을 합니다.

### 4. 개발 서버 실행

```bash
pnpm dev
```

이제 웹 브라우저에서 `http://localhost:3000` 주소로 접속하여 프로젝트를 확인할 수 있습니다.
