# Aiducation API 연결 설계서 (v1.0)

본 문서는 `.claude/docs/api.json` (OpenAPI 3.0.1) 명세를 기반으로 작성된 프론트엔드-백엔드 API 연결 설계서입니다.

> ⚠️ **중요:** 상세한 데이터 스키마(Components/Schemas) 및 전체 OpenAPI 명세는 동일 디렉토리의 **`api.json`** 파일을 반드시 참고하시기 바랍니다.

## 1. 기본 정보
- **Base URL:** `http://bbasung.iptime.org:8080`
- **Content-Type:** `application/json` (파일 업로드 시 `multipart/form-data`)
- **인증 방식:** HTTP Bearer Token (JWT)

---

## 2. 인증 및 계정 (Auth)

### 2.1 회원가입
- **Endpoint:** `POST /api/v1/auth/signup`
- **Request Body:**
  ```json
  {
    "userId": "string",
    "password": "string",
    "name": "string",
    "email": "string"
  }
  ```

### 2.2 로그인
- **Endpoint:** `POST /api/v1/auth/login`
- **Request Body:** `{ "userId": "string", "password": "string" }`
- **Response:** `{ "accessToken": "string", "refreshToken": "string" }` (Login 스키마 참조)

### 2.3 토큰 갱신
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Request Body:** `{ "refreshToken": "string" }`
- **Response:** `{ "accessToken": "string" }`

### 2.4 비밀번호 재설정
- **Endpoint:** `POST /api/v1/auth/reset-password`
- **Request Body:** `{ "userId": "string", "email": "string" }`

### 2.5 아이디 찾기
- **Endpoint:** `POST /api/v1/auth/find-id`
- **Request Body:** `{ "name": "string" }`

### 2.6 소셜 로그인 (카카오)
- **카카오 로그인 시작:** `GET /oauth/kakao_login` (리다이렉트)
- **콜백 처리:** `GET /oauth/kakao/callback?code={code}`

---

## 3. 사용자 및 대시보드 (User)

### 3.1 내 정보 조회
- **Endpoint:** `GET /api/v1/users/me`
- **Response:** `Me` 객체 (userId, email, level, exp, totalExp 등)

### 3.2 대시보드 통계
- **Endpoint:** `GET /api/v1/users/me/dashboard`
- **Response:** `Dashboard` 객체 (주간 통계, 정답률, 취약 유형, 최근 알림 등)

### 3.3 랭킹 조회
- **Endpoint:** `GET /api/v1/ranking?page={page}`
- **Response:** `RankingList` (전체 사용자 순위 리스트)

---

## 4. 콘텐츠 관리 (Subject / File / Concept)

### 4.1 과목(Subject) 관리
- **목록 조회:** `GET /api/v1/subjects`
- **생성:** `POST /api/v1/subjects` (Body: `{ "subjectName": "string" }`)
- **수정:** `PATCH /api/v1/subjects/{subjectId}` (Body: `{ "newName": "string" }`)
- **삭제:** `DELETE /api/v1/subjects/{subjectId}`

### 4.2 파일(File) 업로드 및 관리
- **과목별 파일 목록:** `GET /api/v1/subjects/{subjectId}/files`
- **파일 업로드:** `POST /api/v1/subjects/{subjectId}/files` (FormData: `file`)
- **파일 삭제:** `DELETE /api/v1/files/{fileId}`

### 4.3 개념(Concept) 조회
- **과목별 추출된 개념 목록:** `GET /api/v1/subjects/{subjectId}/concepts`
- **Response:** `List_` (추출된 핵심 개념 리스트)

---

## 5. 퀴즈 엔진 (Quiz)

### 5.1 퀴즈 생성
- **Endpoint:** `POST /api/v1/concepts/{conceptId}/generate-quiz`
- **Request Body:** `{ "count": number, "difficulty": number(1-5) }`

### 5.2 퀴즈 문제 조회
- **개념별 퀴즈 목록:** `GET /api/v1/concepts/{conceptId}/quizzes`
- **특정 문제 상세:** `GET /api/v1/quizzes/{quizId}`

### 5.3 문제 풀이 및 제출
- **정답 제출:** `POST /api/v1/quizzes/{quizId}/submit`
- **Request Body:** `{ "answer": number(1-5) }`

### 5.4 힌트 및 해설
- **힌트 보기:** `GET /api/v1/quizzes/{quizId}/hint`
- **해설 보기:** `GET /api/v1/quizzes/{quizId}/explanation`

### 5.5 오답 노트
- **내 오답 목록 조회:** `GET /api/v1/users/me/incorrects`

---

## 6. 알림 및 복습 (Notification)

### 6.1 푸시 알림 구독
- **구독:** `POST /api/v1/notifications/subscribe` (Body: `Subscribe` 객체)
- **해제:** `DELETE /api/v1/notifications/subscribe` (Body: `Unsubscribe` 객체)

### 6.2 오늘 복습할 목록
- **Endpoint:** `GET /api/v1/reviews/today`
- **복습 완료 처리:** `POST /api/v1/reviews/{scheduleId}/complete`

---

## 7. 관리자 기능 (Admin)

### 7.1 사용자 관리
- **전체 유저 목록:** `GET /api/v1/admin/users`
- **상태 변경:** `PATCH /api/v1/admin/users/{userId}/status` (Body: `UpdateUserStatus`)
- **삭제:** `DELETE /api/v1/admin/users/{userId}`

### 7.2 콘텐츠 및 AI 모니터링
- **전체 업로드 콘텐츠:** `GET /api/v1/admin/contents`
- **승인 대기 중인 개념:** `GET /api/v1/admin/concepts/pending`
- **개념 상태 업데이트:** `PATCH /api/v1/admin/concepts/{conceptId}/status`

---
**Note:** 모든 API 호출 시 에러 처리는 `resultCode` 및 `message` 필드를 확인하여 처리하시기 바랍니다.
