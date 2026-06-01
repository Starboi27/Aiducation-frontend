# Auth Controller API 명세서

## 1. 일반 인증 (Standard Authentication)
기본적인 이메일/아이디 기반의 인증 서비스를 제공합니다.

| 기능 | 메서드 | 엔드포인트 | 요청 데이터 (Body) | 설명 |
| :--- | :---: | :--- | :--- | :--- |
| **로그인** | `POST` | `/api/v1/auth/login` | `userId`, `password` | 사용자 인증 및 JWT 토큰 발급 |
| **회원가입** | `POST` | `/api/v1/auth/signup` | `userId`, `password`, `name`, `email` | 새로운 사용자 계정 생성 |
| **로그아웃** | `POST` | `/api/v1/auth/logout` | - | 세션 종료 및 로그아웃 |
| **아이디 찾기** | `POST` | `/api/v1/auth/find-id` | `email` | 등록된 이메일로 아이디 정보 조회 |
| **비밀번호 재설정** | `POST` | `/api/v1/auth/reset-password` | `userId`, `email` | 비밀번호 재설정을 위한 요청 |
| **토큰 갱신** | `POST` | `/api/v1/auth/refresh` | `refreshToken` | Access Token 만료 시 갱신 |
| **이메일 중복 확인** | `POST` | `/oauth/mail_check` | `mail_addr` | 이메일 가입 여부 확인 |

## 2. 소셜 로그인 (OAuth)
카카오 계정을 이용한 외부 인증 서비스입니다.

| 기능 | 메서드 | 엔드포인트 | 파라미터 | 설명 |
| :--- | :---: | :--- | :--- | :--- |
| **카카오 로그인 시작** | `GET` | `/oauth/kakao_login` | - | 카카오 인증 페이지로 이동 |
| **카카오 콜백** | `GET` | `/oauth/kakao/callback` | `code` (Query) | 인가 코드를 전달받아 처리 |

---

## 3. 주요 데이터 모델 (Schemas)

### Login (로그인)
```json
{
  "userId": "사용자 아이디",
  "password": "비밀번호"
}
```

### Signup (회원가입)
```json
{
  "userId": "사용자 아이디",
  "password": "비밀번호",
  "name": "사용자 이름",
  "email": "이메일 주소"
}
```

### ResetPassword (비밀번호 재설정)
```json
{
  "userId": "사용자 아이디",
  "email": "이메일 주소"
}
```

### Refresh (토큰 갱신)
```json
{
  "refreshToken": "발급받은 Refresh Token"
}
```

### MailCheckRequest (이메일 확인)
```json
{
  "mail_addr": "확인할 이메일 주소"
}
```
