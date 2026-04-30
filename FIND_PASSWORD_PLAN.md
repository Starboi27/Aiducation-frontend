# Implementation Plan: Find Password (Reset) Flow - Email Only

**Topic:** Implementation of the "Find Password" feature using a single-field email request.
**Goal:** Allow users to reset their password starting with just their email address.

## 1. API Strategy
- **Target API:** `POST /api/v1/auth/reset-password`
- **Payload:** `{ "email": string }`
- **Note:** Although the current `doc_api.json` lists `userId` as required, we will implement the frontend to send **only the email** as requested. If the backend later enforces `userId`, we will update the UI accordingly.

## 2. Phase 1: Service Layer Integration (`authService.js`)
Implement the full OTP (One-Time Password) flow with Mocking for missing steps.
- **Step 1: Request Reset** 
    - Function: `authService.requestReset(email)`
    - Action: Calls `POST /api/v1/auth/reset-password`.
- **Step 2: Verify Code (Mocked)**
    - Function: `authService.verifyCode(email, code)`
    - Logic: Simulates a server check for the 6-digit code.
- **Step 3: Complete Reset (Mocked)**
    - Function: `authService.completeReset(email, code, newPassword)`
    - Logic: Simulates updating the user's password in the DB.

## 3. Phase 2: UI Implementation (`LoginPage.jsx`)
A clean, 3-step wizard within the "Find Password" mode.
- **State:** `findPasswordStep` ('email' | 'code' | 'password').
- **UI Steps:**
    1.  **Email Step:** Single input for Email + "Send Code" button.
    2.  **Code Step:** 6-digit verification code input + "Verify" button.
    3.  **Password Step:** "New Password" & "Confirm Password" inputs + "Update Password" button.
- **Style:** Maintain Glassmorphism theme and `animate-fade-in` transitions.

## 4. Phase 3: Logic & Validation
- **Validation:**
    - Email: Standard email format regex.
    - Code: Must be exactly 6 numeric digits.
    - Password: Minimum 4-8 characters (based on project norms) and must match the confirm field.
- **Transitions:** Automatically move to the next step upon successful API/Mock response.

## 5. Phase 4: Testing & Completion
- **Test:** Verify that entering an email sends the request and opens the code input.
- **Test:** Verify that "Update Password" redirects back to the Login tab with a "Success" message.

---
*Status: Ready for implementation starting with authService.js updates.*
