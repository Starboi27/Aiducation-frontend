# Design Spec: Aiducation Social Login Integration

**Date:** 2026-04-29  
**Status:** Draft  
**Topic:** OAuth2 Integration (Kakao, Google)

## 1. 개요 (Overview)
사용자가 별도의 회원가입 없이 카카오, 구글 계정을 통해 Aiducation 서비스에 즉시 로그인하고 서비스를 이용할 수 있도록 합니다. 백엔드에서 인증을 처리하고 프런트엔드로 JWT 토큰을 전달하는 방식을 사용합니다.

## 2. 인증 흐름 (Authentication Flow)

현재 프로젝트는 **"Backend-First Redirect"** 방식을 사용하도록 설계되어 있습니다.

1.  **시작:** 사용자가 로그인 페이지에서 "카카오로 시작하기" 버튼 클릭.
2.  **Redirect (FE -> BE):** 프런트엔드는 브라우저를 백엔드의 OAuth 시작 엔드포인트로 리다이렉트합니다.
    *   카카오: `GET ${BASE_URL}/oauth/kakao_login`
    *   구글: `GET ${BASE_URL}/oauth/google_login` (명세 확인 필요)
3.  **Auth (User -> Social):** 사용자가 소셜 서비스 로그인 창에서 로그인 및 권한 승인.
4.  **Callback (Social -> BE):** 소셜 서버가 백엔드 콜백 엔드포인트로 `code` 전달.
    *   카카오: `GET /oauth/kakao/callback`
5.  **Token Issuance (BE -> FE):** 백엔드가 사용자를 프런트엔드 콜백 페이지로 리다이렉트하며 URL 파라미터로 JWT를 전달합니다.
    *   `GET http://localhost:3000/oauth/callback?token=<JWT_TOKEN>`
6.  **Finalization (FE):** `OAuthCallbackPage`에서 토큰을 추출하여 `localStorage`에 저장하고 로그인을 완료합니다.

## 3. API 명세 (API Specification)

### 3.1 백엔드 엔드포인트 (From doc_api.json)
*   **카카오 로그인 시작:** `GET /oauth/kakao_login`
    *   설명: 카카오 인증 페이지로 리다이렉트하는 진입점.
*   **카카오 콜백:** `GET /oauth/kakao/callback`
    *   설명: 카카오로부터 인증 코드를 받아 JWT를 발급하고 프런트엔드로 복귀시키는 지점.
*   **공통 사용자 정보:** `GET /api/v1/auth/me` (기존 활용)
    *   설명: 발급받은 토큰으로 소셜 유저의 정보(이름, 이메일, 역할 등)를 가져옵니다.

### 3.2 프런트엔드 엔드포인트 (Routes)
*   **OAuth 콜백 처리:** `/oauth/callback`
    *   컴포넌트: `OAuthCallbackPage.jsx`
    *   역할: URL 파라미터 `token` 처리 및 자동 로그인.

## 4. 상세 구현 현황 및 계획

### 4.1 현재 구현 상태
- [x] `authService.js`: `socialLogin` 함수 및 리다이렉트 로직 존재.
- [x] `OAuthCallbackPage.jsx`: 토큰 추출 및 `getMe` 호출 로직 완성.
- [x] `doc_api.json`: 카카오 관련 엔드포인트 정의됨.
- [x] `application.yml`: 카카오 OAuth 설정값 존재.

### 4.2 향후 계획
1.  **구글 로그인 확장:** 카카오와 동일한 흐름으로 구글 로그인 엔드포인트가 백엔드에 준비되었는지 확인 후 UI 연결.
2.  **UI 정밀 조정:** 로그인 페이지의 소셜 버튼 디자인을 각 플랫폼의 가이드라인(색상, 로고 크기 등)에 맞게 최적화.
3.  **에러 핸들링 강화:** 로그인 취소 또는 서버 에러 시 사용자에게 명확한 안내를 제공하는 로직 보완.

---
*Note: 이 설계는 기존 백엔드 설계와 `OAuthCallbackPage`의 구현 방식을 기반으로 작성되었습니다.*
