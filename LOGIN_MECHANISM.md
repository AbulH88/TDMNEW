# Technical Documentation: Authentication & Login Mechanism

This document outlines the authentication and login architecture implemented in the TDMNEW project.

## 1. Overview
The login mechanism uses **JSON Web Tokens (JWT)** and **HTTP-only Cookies** for secure, server-side authentication. It supports Role-Based Access Control (RBAC) and specific permission sets.

## 2. Implementation Details

### **A. Backend Entry Point (Controller)**
*   **File:** `server/src/index.ts`
*   **Lines:** 38–73
*   **Logic:** The `/api/auth/login` endpoint handles credential verification. It retrieves user data from the JSON "database," compares the provided password against a salted Bcrypt hash, and issues a JWT.

### **B. Security Middleware**
*   **File:** `server/src/middleware/auth.ts`
*   **Lines:** 17–45
*   **Logic:** The `authMiddleware` interceptor extracts the JWT from the incoming `token` cookie. It verifies the signature and confirms the user still exists in the system before populating `req.user`.

### **C. User Data Persistence**
*   **File:** `server/data/users.json`
*   **Format:**
    ```json
    {
      "id": "1",
      "username": "admin",
      "passwordHash": "$2b$10$...",
      "role": "admin",
      "permissions": ["read_only", "create", "delete", "admin"]
    }
    ```
*   **Storage:** Passwords are secured using **Bcrypt** (implemented in `server/src/index.ts` line 423).

---

## 3. Key Code References

| Feature | File Path | Line(s) |
| :--- | :--- | :--- |
| **Credential Verification** | `server/src/index.ts` | `47` |
| **JWT Generation** | `server/src/index.ts` | `52` |
| **Secure Cookie Storage** | `server/src/index.ts` | `54-59` |
| **Token Verification** | `server/src/middleware/auth.ts` | `26` |
| **Permission Check** | `server/src/middleware/auth.ts` | `56-58` |

---

## 4. Security Highlights
1.  **HTTP-Only Cookies:** The JWT is stored in an `httpOnly` cookie (`index.ts:55`), making it inaccessible to client-side JavaScript.
2.  **Stateless Validation:** While the server is stateless via JWT, the `authMiddleware` includes a "re-verify" step (`auth.ts:33`) to ensure revoked users are immediately barred.
3.  **Bcrypt Hashing:** Uses 10 rounds of salting for password hashes (`index.ts:89`).
4.  **Password Management:** Includes a `mustChangePassword` workflow for newly created accounts (`index.ts:426`).
