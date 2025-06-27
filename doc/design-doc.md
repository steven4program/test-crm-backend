# Simple CRM App Design Document

## Overview

This document outlines the design for a **simple CRM application** with a React/TypeScript front-end and a NestJS/Node.js back-end. The app’s purpose is to demonstrate best practices in unit, integration, and end-to-end (E2E) testing, using a minimal feature set so the code remains easy to follow. It will implement a basic Customer Relationship Management (CRM) system for an e-commerce context, including **customer management** and **user role-based access control (RBAC)**. Both frontend and backend will be containerized with Docker for consistency, with the frontend deployed on Vercel and the backend on Zeabur.

**Key Features and Requirements:**

* **Customer Management (CRUD):** Authorized users can **Create, Read, Update, Delete** customer records.
* **User Management & RBAC:** The system has **two roles** – **Admin** and **Viewer**. There will be a default Admin user account on first launch. Admins can manage users (create other users and assign roles) and have full CRUD access; Viewers can only read data (no modifications).
* **Authentication:** Users must **login** with username/password to obtain a JWT token. Subsequent requests use this token for authentication. **Logout** will invalidate the session on the client side.
* **RESTful API:** The backend exposes REST endpoints for all features. A clear API contract is defined so frontend and backend developers can work in parallel.
* **Testing Coverage:** The project includes **unit tests** (isolated logic tests), **integration tests** (testing modules/components together, including database or API interactions), and **E2E tests** (simulating user flows on the deployed app). This ensures reliability at all levels of the stack.

*Example Use Case:* Upon deployment, a default Admin logs in (using preset credentials) to register some customers and to create additional user accounts (Admin or Viewer). A Viewer-level user can then log in to see the customer list but will be **prevented from making any edits or deletions** (both via UI and API enforcement). If the Viewer attempts a forbidden action, the UI will hide or disable those controls, and the backend will return a **HTTP 403 Forbidden** response (due to role checks) to reinforce the restriction.

---

## Backend (NestJS) Design

### Tech Stack & Architecture

The backend is built with **NestJS** (Node.js/TypeScript framework) organized in a modular architecture. We will use **MySQL** as the database, and perform data access with **raw SQL queries** (using a Node MySQL client library) for simplicity and transparency. NestJS’s structure (controllers, services, modules) will be used to clearly separate concerns:

* **Controllers:** Define REST API endpoints for auth, users, and customers. Controllers handle HTTP requests and responses.
* **Services:** Contain business logic and interact with the database (executing SQL queries). For example, a `UserService` for user CRUD and a `CustomerService` for customer CRUD.
* **Modules:** Group related controllers and providers. We will have modules such as `AuthModule`, `UserModule`, and `CustomerModule`, all imported into the root `AppModule`.

**Database Connection:** The app will use a MySQL connection (configured via environment variables for host, port, credentials, etc.). Using raw SQL means we might utilize the official `mysql2` or `mysql` Node package to execute queries in service methods. Each service will prepare parameterized SQL statements to query or mutate the data. (Alternatively, a lightweight query builder or ORM could be used in raw SQL mode, but that’s optional.)

**Deployment Context:** The backend will run in a Docker container. It will listen on the port provided by the environment (e.g. `process.env.PORT`) so that hosting on Zeabur works seamlessly. Zeabur can deploy the service directly from the Git repository and **automatically detect** the NestJS project configuration, simplifying deployment. Basic configuration (like the database URL and JWT secret) will be provided via environment variables in Zeabur’s dashboard.

### Data Model

The system manages two core entities in the database: **User** and **Customer**. The schema can be kept minimal:

* **User Table:** Stores application user accounts. Fields might include:

  * `id` (INT, primary key)
  * `username` (VARCHAR, unique) – login identifier (could be email or a simple name).
  * `password` (VARCHAR) – hashed password (see note on security below).
  * `role` (ENUM or VARCHAR) – user role, e.g. `'admin'` or `'viewer'`.

  A **default Admin user** will be pre-created in this table when the app first runs. For example, a user with username **“admin”** (or a configured email) and a known default password. This seeding can be done via an SQL seed file or by a service on app startup. The default Admin ensures there is always at least one administrative account to manage the system. (In production, the default password should be changed immediately for security.)

* **Customer Table:** Stores customer records for the e-commerce CRM context. Fields could include:

  * `id` (INT, primary key)
  * `name` (VARCHAR) – Customer’s name or identifier.
  * `email` (VARCHAR) – Contact email of the customer.
  * `phone` (VARCHAR) – Contact phone number (optional).
  * (Additional fields like address, etc., are optional; we keep it minimal for simplicity.)

  Customers have no direct relationship to users in this simple app (i.e. any admin can manage any customer). We assume all customers are global records to be managed.

**Note on Password Storage:** In this design, user passwords will be stored securely by hashing them (e.g. using bcrypt) before storing in the database. *In a real application, plain-text passwords must never be stored.* Instead, one should store only hashed passwords and compare hash values on login. For simplicity in a demo, one might be tempted to store plain passwords or use a hardcoded list (as in many NestJS examples), but we will follow best practices by hashing passwords even in this simple app.

### Authentication & Authorization

**Authentication:** The app uses JWT (JSON Web Token) for authentication. Users will call a login API with their credentials, which the server verifies against the Users table. On successful login, the server responds with a signed JWT token. We will use Nest’s `@nestjs/jwt` package to generate this token. The JWT **payload** will include the user’s identifier and role (for example, `{ sub: user.id, username: user.username, role: user.role }`). NestJS will sign the token with a secret key and return it as a JSON response, e.g. `{ "access_token": "<JWT_TOKEN>" }`. (We may also return basic user info like username and role for convenience.) The client will store this token for subsequent requests.

All protected endpoints will require a valid JWT. We will implement an **Auth Guard** in NestJS that checks for the `Authorization` header on incoming requests. The header should be in the format **`Authorization: Bearer <token>`**. The guard will **verify** the token’s signature and extract the payload. If the token is missing or invalid, the request is rejected with 401 Unauthorized. If valid, the guard attaches the decoded token payload (user info) to the request object for use in controllers.

**Authorization (RBAC):** With the user’s role known (either from the token payload or by looking up the user), the backend enforces role-based access. Only **Admin** users can create, update, or delete resources, while **Viewer** users can only read. We will create a simple **Roles Guard** (or use metadata/decorators) to apply on endpoints that require admin rights. For example, the Customers **POST/PUT/DELETE** endpoints and all User management endpoints will check that `request.user.role === 'admin'` before proceeding. If a Viewer token is used on an admin-only endpoint, the server will respond with 403 Forbidden, similar to how NestJS’s RolesGuard denies access when roles don’t match. Conversely, admin tokens will be allowed to access all endpoints (Admins have universal access by design).

**Default Admin:** The first admin account (seeded in the DB) will be used to log in and bootstrap the system. Its credentials (e.g. username `"admin"`, password `"Admin@123"`) will be provided to the team. The login process for this account is the same as any user: call the login API, get a token, then use that token for subsequent calls. The default Admin can create additional users (either admins or viewers) via the user management API, which helps demonstrate the role management feature.

### REST API Endpoints

The backend exposes a RESTful API. Below is the API specification detailing each endpoint, request/response format, and access control. This acts as the contract between frontend and backend developers:

**Auth & Session:**

* **POST** `/auth/login` – **Login a user and retrieve JWT.**

  * *Request:* JSON body `{ "username": "<string>", "password": "<string>" }`.
  * *Response:* **200 OK** with JSON `{ "access_token": "<JWT>", "user": { "id": \<number>, "username": "<string>", "role": "<admin|viewer>" } }`. The `access_token` is a JWT to be used in subsequent requests. (Including the user object here helps the frontend know the role immediately after login.)
  * *Errors:* **401 Unauthorized** if credentials are invalid.
  * *Auth:* Public (no token required).

* **POST** `/auth/logout` – **Logout endpoint (optional):** Since the frontend can handle logout by discarding the token, this could be just a dummy endpoint or omitted. (If implemented, it might blacklist the token server-side or simply be a no-op that the client calls for logging purposes.)

  * *Auth:* Requires a valid JWT (though it will simply invalidate it client-side).
  * *Response:* 200 OK (no body).

**User Management:** (All **Admin-only** – these endpoints require an Admin JWT)

* **GET** `/users` – **List all users.**

  * *Auth:* Admin only.
  * *Response:* 200 OK with JSON array of users. Each user object might include `id, username, role`. (Password hashes are **not** returned.)
* **POST** `/users` – **Create a new user.**

  * *Auth:* Admin only.
  * *Request:* JSON `{ "username": "<string>", "password": "<string>", "role": "<admin|viewer>" }`.
  * *Response:* 201 Created with JSON of the created user `{ "id": ..., "username": "...", "role": "..." }`. The password is stored internally (hashed) but not returned.
  * *Errors:* 400 Bad Request if username already exists or data invalid.
* **PUT** `/users/{id}` – **Update an existing user.**

  * *Auth:* Admin only.
  * *Request:* JSON can include fields to update. Typically, admins might update a user’s role or reset a password. E.g. `{ "password": "<newPassword>", "role": "<admin|viewer>" }`. If updating password, it will be hashed before storing.
  * *Response:* 200 OK with updated user JSON (or 204 No Content).
  * *Errors:* 404 if user not found.
* **DELETE** `/users/{id}` – **Delete a user.**

  * *Auth:* Admin only (an admin cannot delete themselves via API as a safety measure, that can be handled separately).
  * *Response:* 204 No Content on success.
  * *Errors:* 404 if user not found.

**Customer Management:** (Admin can write; Viewer can only read)

* **GET** `/customers` – **List all customers.**

  * *Auth:* **Requires JWT** (Admin or Viewer). Both roles can fetch the list.
  * *Response:* 200 OK with JSON array of customer records. (E.g. `[ { "id": 1, "name": "...", "email": "...", "phone": "..." }, {...} ]`).
* **GET** `/customers/{id}` – **Get details of a specific customer.**

  * *Auth:* Requires JWT (any role).
  * *Response:* 200 OK with JSON of the customer record. 404 if not found.
* **POST** `/customers` – **Create a new customer.**

  * *Auth:* **Admin only.**
  * *Request:* JSON `{ "name": "<string>", "email": "<string>", "phone": "<string>" }` (all fields for the new customer).
  * *Response:* 201 Created with JSON of new customer (including generated `id`).
  * *Errors:* 400 if data invalid (e.g. missing required fields).
* **PUT** `/customers/{id}` – **Update an existing customer.**

  * *Auth:* **Admin only.**
  * *Request:* JSON with any customer fields to update (name, email, phone).
  * *Response:* 200 OK with updated customer JSON, or 204 No Content. 404 if not found.
* **DELETE** `/customers/{id}` – **Delete a customer.**

  * *Auth:* **Admin only.**
  * *Response:* 204 No Content on success. 404 if customer not found.

**General Notes:** All requests and responses use JSON format. The backend will enforce **CORS** to allow the Vercel frontend domain to call these APIs (NestJS can enable CORS globally, so the browser can make cross-origin requests to the API). The Authorization token (JWT) must be included on **every** protected request as a `Bearer` token header. If a user without proper role tries to perform an admin action, the response will be **403 Forbidden** – the frontend should handle this gracefully (e.g. by showing an error or redirecting if appropriate).