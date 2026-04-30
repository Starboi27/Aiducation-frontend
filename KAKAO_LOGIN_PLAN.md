# Implementation Plan: Kakao Login & Signup Flow

**Topic:** End-to-end integration of Kakao OAuth2 for Aiducation.
**Goal:** Ensure seamless login/signup and automatic user profile creation.

## 1. Environment Alignment (Prerequisite)
Before implementation, we must ensure the "Redirection Bridge" is consistent across all layers.
- **Kakao Developers Console:** `Redirect URI` must include `http://localhost:3000/oauth/callback`.
- **Backend (`application.yml`):** `kakao.redirect-uri` set to `http://localhost:3000/oauth/callback`.
- **Frontend (`authService.js`):** `AUTH_CONFIG.baseUrl` points correctly to the running backend (e.g., `http://localhost:8080`).

## 2. Phase 1: Frontend Trigger (Login Page)
Update the Kakao button logic to initiate the redirect.
- **Action:** In `LoginPage.jsx`, the `handleSocialLogin('kakao')` function calls `authService.socialLogin('kakao')`.
- **Logic:** `window.location.href = "${baseUrl}/oauth/kakao_login"` (Redirects user to our backend).

## 3. Phase 2: Backend Processing (Social Handshake)
This is what happens when the user finishes login on Kakao's site.
- **Step A:** Kakao redirects user to Backend (`/oauth/kakao/callback`) with an auth `code`.
- **Step B:** Backend exchanges `code` for Kakao `AccessToken`.
- **Step C:** Backend fetches User Info from Kakao, creates/updates user in our DB.
- **Step D:** Backend generates our own **JWT (Access/Refresh Tokens)**.
- **Step E:** Backend redirects user back to **Frontend** (`http://localhost:3000/oauth/callback?accessToken=...&refreshToken=...`).

## 4. Phase 3: Frontend Callback Handling (OAuthCallbackPage)
Process the tokens received from the backend.
- **File:** `src/pages/OAuthCallbackPage/OAuthCallbackPage.jsx`
- **Logic:**
    - Parse `accessToken` and `refreshToken` from URL.
    - Save tokens to `localStorage`.
    - Call `authService.getMe(token)` to fetch full user details (name, level, exp).
    - Update `AppContext` user state.
    - Redirect to home (`/`).

## 5. Phase 4: User Experience & Error Handling
- **Loading State:** Show a clean "Logging in..." spinner during the callback process.
- **Error Scenarios:** 
    - Handle `error` param in URL (e.g., user cancelled login).
    - Handle `getMe` failure (e.g., token expired or invalid).
- **Redirection:** Ensure the user lands on the intended page (Dashboard) after login.

## 6. Verification Checklist
- [ ] Clicking Kakao button opens Kakao login window.
- [ ] After login, browser returns to `localhost:3000/oauth/callback`.
- [ ] Token is saved in browser Storage.
- [ ] User name and profile appear in the Sidebar/Header.
- [ ] New users are correctly initialized with Level 1 / 0 EXP.
