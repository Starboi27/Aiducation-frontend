# Final Spec: Password Recovery Flow (Email-based OTP)

**Date:** 2026-04-29  
**Status:** Finalized  
**Target:** Implementation of Email-only Password Reset & Change

## 1. 개요 (Overview)
사용자가 아이디를 기억하지 못하더라도 **이메일 주소 하나만으로** 본인 인증(OTP)을 거쳐 즉시 새 비밀번호를 설정하고 변경을 완료할 수 있는 통합 프로세스입니다.

## 2. 상세 사용자 흐름 (User Flow)

1.  **[Step 1] 인증 요청 (Request):** 
    - 사용자가 이메일 입력 후 '인증번호 발송' 클릭.
    - 서버는 해당 이메일로 6자리 인증번호를 발송.
2.  **[Step 2] 인증 확인 (Verify):** 
    - 사용자가 이메일로 받은 6자리 코드 입력 후 '확인' 클릭.
    - 본인 확인 성공 시 비밀번호 입력 화면으로 전환.
3.  **[Step 3] 변경 완료 (Complete):** 
    - 사용자가 사용할 새 비밀번호를 입력 및 확인 후 '변경' 클릭.
    - 실제 비밀번호가 업데이트되며 로그인 화면으로 복귀.

## 3. API 통신 명세 (API Specification)

사용자 요청에 따라 `userId`를 배제하고 `email`을 식별자로 사용합니다.

| 단계 | 엔드포인트 (Endpoint) | 전달 파라미터 (Payload) | 설명 |
| :--- | :--- | :--- | :--- |
| **요청** | `POST /api/v1/auth/reset-password` | `{ "email": string }` | 인증 코드 메일 발송 |
| **검증** | `POST /api/v1/auth/reset-password/verify` | `{ "email": string, "code": string }` | 코드 일치 여부 확인 |
| **완료** | `POST /api/v1/auth/reset-password/complete` | `{ "email": string, "code": string, "newPassword": string }` | 최종 비밀번호 업데이트 |

## 4. 프론트엔드 구현 설계 (Frontend Design)

### 4.1 서비스 레이어 (`src/services/authService.js`)
- `requestReset(email)`: 요청 API 호출
- `verifyCode(email, code)`: 검증 API 호출
- `completeReset(email, code, newPassword)`: 완료 API 호출

### 4.2 페이지 로직 (`src/pages/LoginPage/LoginPage.jsx`)
- **상태 관리:** `findPasswordStep` 상태 변수를 통해 3단계 UI 전환 제어.
    - `EMAIL`: 초기 이메일 입력 화면
    - `CODE`: 인증번호 입력 화면
    - `PASSWORD`: 새 비밀번호 설정 화면
- **UX 요소:**
    - `animate-fade-in` 적용으로 매끄러운 단계 전환.
    - 각 단계 성공 시 적절한 성공/에러 메시지 토스트 노출.

## 5. 보안 및 예외 처리 (Security & Error Handling)
- **OTP 만료:** 인증번호는 일정 시간(예: 5~10분) 내에만 유효하도록 설계.
- **코드 재사용 방지:** 비밀번호 변경 완료 시 해당 인증 코드는 즉시 폐기.
- **유효성 검사:** 
    - 인증번호 6자리 숫자 고정.
    - 새 비밀번호 확인 필드 일치 여부 체크.

---
*이 문서는 Aiducation 프로젝트의 비밀번호 찾기 기능 구현을 위한 최종 가이드라인입니다.*
