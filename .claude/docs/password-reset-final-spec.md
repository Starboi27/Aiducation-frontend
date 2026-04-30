# Final Spec: Password Recovery Flow (ID & Email based OTP)

**Date:** 2026-04-29  
**Status:** Finalized (Updated)  
**Target:** Implementation of ID + Email Password Reset & Change

## 1. 개요 (Overview)
사용자의 **아이디(userId)**와 **이메일(email)** 정보를 동시에 확인하여 본인 인증(OTP)을 거친 후, 즉시 새 비밀번호를 설정하고 변경을 완료하는 보안 강화 프로세스입니다.

## 2. 상세 사용자 흐름 (User Flow)

1.  **[Step 1] 인증 요청 (Request):** 
    - 사용자가 **아이디**와 **이메일**을 모두 입력 후 '인증번호 발송' 클릭.
    - 서버는 두 정보가 일치하는 유저인지 확인 후 해당 이메일로 6자리 인증번호를 발송.
2.  **[Step 2] 인증 확인 (Verify):** 
    - 사용자가 이메일로 받은 6자리 코드 입력 후 '확인' 클릭.
    - 본인 확인 성공 시 비밀번호 입력 화면으로 전환.
3.  **[Step 3] 변경 완료 (Complete):** 
    - 사용자가 사용할 새 비밀번호를 입력 및 확인 후 '변경' 클릭.
    - 실제 비밀번호가 업데이트되며 로그인 화면으로 복귀.

## 3. API 통신 명세 (API Specification)

백엔드 명세(`api_docs_v2.json`)의 `ResetPassword` 모델을 엄격히 준수합니다.

| 단계 | 엔드포인트 (Endpoint) | 전달 파라미터 (Payload) | 설명 |
| :--- | :--- | :--- | :--- |
| **요청** | `POST /api/v1/auth/reset-password` | `{ "userId": string, "email": string }` | 아이디/이메일 대조 및 코드 발송 |
| **검증** | `POST /api/v1/auth/reset-password/verify` | `{ "email": string, "code": string }` | 코드 일치 여부 확인 |
| **완료** | `POST /api/v1/auth/reset-password/complete` | `{ "email": string, "code": string, "newPassword": string }` | 최종 비밀번호 업데이트 |

## 4. 프론트엔드 구현 설계 (Frontend Design)

### 4.1 서비스 레이어 (`src/services/authService.js`)
- `requestReset(userId, email)`: 아이디와 이메일을 함께 전송하도록 수정.
- `verifyCode(email, code)`: 검증 API 호출.
- `completeReset(email, code, newPassword)`: 완료 API 호출.

### 4.2 페이지 로직 (`src/pages/LoginPage/LoginPage.jsx`)
- **UI 구성:** 1단계에서 아이디 입력 필드와 이메일 입력 필드를 나란히 배치.
- **상태 관리:** `findPasswordStep` 상태 변수로 단계별 화면 전환 제어.

## 5. 보안 및 예외 처리 (Security & Error Handling)
- **정보 불일치:** 아이디와 이메일이 매칭되지 않을 경우 "입력하신 정보가 일치하지 않습니다" 메시지 노출.
- **OTP 보안:** 일회용 인증 코드를 통해 타인의 비밀번호 변경 시도 차단.

---
*이 문서는 Aiducation 프로젝트의 보안 정책(ID+Email 필수)을 반영한 최종 가이드라인입니다.*
